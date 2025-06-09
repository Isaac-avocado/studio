import type { Article, TrafficInfraction, Category } from '@/types';
import { db, storage } from '@/lib/firebase/config';
import { collection, getDocs, query, where, getDoc, doc, updateDoc, arrayUnion, arrayRemove, DocumentData, runTransaction, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Lista inicial de categorías. Idealmente, esto vendría de Firestore.
export const initialCategories: Category[] = [
  { id: 'reglamentos-infracciones', name: 'Reglamentos e Infracciones' },
  { id: 'seguridad-vial', name: 'Seguridad Vial' },
  { id: 'obligaciones', name: 'Obligaciones' },
  { id: 'infracciones-graves', name: 'Infracciones Graves' },
  { id: 'consejos-generales', name: 'Consejos Generales' },
];

const articlesCollection = collection(db, 'articles');
const usersCollection = collection(db, 'users');

const convertFirestoreDocToArticle = (doc: DocumentData): Article => {
  const data = doc.data();
  return {
    id: doc.id,
    slug: data.slug,
    title: data.title,
    shortDescription: data.shortDescription,
    category: data.category,
    imageUrl: data.imageUrl,
    imageHint: data.imageHint,
    content: data.content,
    readMoreLink: data.readMoreLink,
    favoriteCount: data.favoriteCount || 0,
    status: data.status,
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
  };
};

export const getAllArticles = async (): Promise<Article[]> => {
  const snapshot = await getDocs(articlesCollection);
  return snapshot.docs.map(convertFirestoreDocToArticle);
};

export const getPublishedArticles = async (): Promise<Article[]> => {
  const q = query(articlesCollection, where('status', '==', 'published'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertFirestoreDocToArticle);
};

export const getDraftArticles = async (): Promise<Article[]> => {
  const q = query(articlesCollection, where('status', '==', 'draft'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertFirestoreDocToArticle);
};

export const getArticleBySlug = async (slug: string): Promise<Article | undefined> => {
  const q = query(articlesCollection, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  return convertFirestoreDocToArticle(snapshot.docs[0]);
};

export const getArticleById = async (articleId: string): Promise<Article | undefined> => {
  const articleRef = doc(db, 'articles', articleId);
  const articleDoc = await getDoc(articleRef);
  if (!articleDoc.exists()) {
    return undefined;
  }
  return convertFirestoreDocToArticle(articleDoc);
};


export const saveArticleToFirestore = async (articleData: any, status: 'draft' | 'published', existingArticleId?: string): Promise<Article> => {
  const { title, shortDescription, category, imageFile, imageUrl, introduction, points, conclusion } = articleData;
  const slug = title.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

  let articleImageUrl = imageUrl;
  if (imageFile) {
    // Upload image to Firebase Storage
    const storageRef = ref(storage, `article_images/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    articleImageUrl = await getDownloadURL(snapshot.ref);
  } else if (imageUrl === null && existingArticleId) {
    // If imageUrl is explicitly set to null and it's an update, delete the old image
    const existingArticle = await getArticleById(existingArticleId);
    if (existingArticle?.imageUrl) {
      const imageRef = ref(storage, existingArticle.imageUrl);
      try {
        await deleteObject(imageRef);
        articleImageUrl = null; // Set to null after deletion
      } catch (error) {
        console.error("Error deleting old image:", error);
        // Optionally handle error, maybe keep the old URL or show a warning
      }
    }
  }


  const articleContent = {
    introduction: introduction || '',
    points: points ? points.split('\n').filter((p: string) => p.trim() !== '') : [],
    conclusion: conclusion || '',
  };

  const articleDataToSave = {
    slug,
    title,
    shortDescription: shortDescription || '',
    category: category || '',
    imageUrl: articleImageUrl,
    imageHint: 'custom article', // You might want to make this dynamic
    content: articleContent,
    favoriteCount: 0, // New articles start with 0 favorites
    status,
    // authorId: auth.currentUser?.uid, // Get authorId from auth context if available
    ...(existingArticleId ? {} : { createdAt: new Date() }), // Set createdAt only for new articles
    updatedAt: new Date(),
  };

  let articleRef;
  let savedArticleId = existingArticleId;

  if (existingArticleId) {
    articleRef = doc(db, 'articles', existingArticleId);
    await updateDoc(articleRef, articleDataToSave);
  } else {
    const newDocRef = await addDoc(articlesCollection, articleDataToSave);
    articleRef = newDocRef;
    savedArticleId = newDocRef.id;
  }

  // Fetch the saved article to return a complete Article object
  const savedDoc = await getDoc(articleRef);
  if (!savedDoc.exists()) {
      throw new Error("Saved article not found!");
  }

  return convertFirestoreDocToArticle(savedDoc);
};

export const deleteArticleFromFirestore = async (articleId: string): Promise<void> => {
  const articleRef = doc(db, 'articles', articleId);

  // Optional: Delete image from storage before deleting the document
  try {
    const articleDoc = await getDoc(articleRef);
    if (articleDoc.exists()) {
      const articleData = articleDoc.data();
      if (articleData?.imageUrl) {
        // Extract path from the full image URL if necessary
        // Depending on how you store imageUrl, you might need to parse it
        const imagePath = articleData.imageUrl.includes(storage.app.options.storageBucket)
            ? ref(storage, articleData.imageUrl).name // Basic example: get file name from URL if it's a full URL
            : articleData.imageUrl; // Otherwise assume it's already a path

        const imageRef = ref(storage, `article_images/${imagePath}`); // Reconstruct the storage ref
        await deleteObject(imageRef);
      }
    }
  } catch (error) {
    console.error("Error deleting article image from storage:", error);
    // Continue with document deletion even if image deletion fails
  }

  await deleteDoc(articleRef);
};


export const toggleArticleLike = async (userId: string, articleId: string, isLiked: boolean): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  const articleRef = doc(articlesCollection, articleId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const articleDoc = await transaction.get(articleRef);

    if (!userDoc.exists()) {
      throw new Error("User does not exist!");
    }
    if (!articleDoc.exists()) {
      throw new Error("Article does not exist!");
    }

    const userData = userDoc.data();
    const articleData = articleDoc.data();
    const likedArticles = userData?.likedArticles || [];
    let currentFavoriteCount = articleData?.favoriteCount || 0;

    if (isLiked) {
      if (!likedArticles.includes(articleId)) {
        transaction.update(userRef, { likedArticles: arrayUnion(articleId) });
        transaction.update(articleRef, { favoriteCount: currentFavoriteCount + 1 });
      }
    } else {
      if (likedArticles.includes(articleId)) {
        transaction.update(userRef, { likedArticles: arrayRemove(articleId) });
        // Ensure favoriteCount doesn't go below zero
        transaction.update(articleRef, { favoriteCount: Math.max(0, currentFavoriteCount - 1) });
      }
    }
  });
};

export const getUserLikedArticles = async (userId: string): Promise<string[]> => {
  const userRef = doc(usersCollection, userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData?.likedArticles || [];
  }
  return [];
};

export const getCategories = (): Category[] => {
    return initialCategories;
}

export const commonTrafficInfractions: TrafficInfraction[] = [
  { id: 'speeding', name: 'Exceso de velocidad' },
  { id: 'red-light', name: 'No respetar semáforo en rojo' },
  { id: 'illegal-parking', name: 'Estacionamiento en lugar prohibido' },
  { id: 'dui', name: 'Manejar bajo los efectos del alcohol o drogas' },
  { id: 'mobile-phone', name: 'Uso del celular al manejar' },
  { id: 'seatbelt', name: 'No usar cinturón de seguridad' },
];
