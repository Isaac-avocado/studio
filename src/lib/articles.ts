
import type { Article, TrafficInfraction, Category } from '@/types';
import { db, storage, auth } from '@/lib/firebase/config'; // Added auth
import { collection, getDocs, query, where, getDoc, doc, updateDoc, arrayUnion, arrayRemove, DocumentData, runTransaction, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
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

const convertFirestoreDocToArticle = (docSnapshot: DocumentData): Article => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
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
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
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
  const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50); // More robust slug generation


  let finalImageUrl = imageUrl || null;
  let imageHint = articleData.imageHint || 'article cover';

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User must be authenticated to save an article.");
  }

  const currentArticle = existingArticleId ? await getArticleById(existingArticleId) : null;

  if (imageFile && imageFile[0]) {
    if (currentArticle?.imageUrl) {
      try {
        const oldImageRef = ref(storage, currentArticle.imageUrl);
        await deleteObject(oldImageRef);
      } catch (e: any) {
         if (e.code !== 'storage/object-not-found') console.warn("Could not delete old article image:", e);
      }
    }
    const fileToUpload = imageFile[0];
    const storageFileName = `${Date.now()}_${fileToUpload.name.replace(/\s+/g, '_')}`;
    const imageStorageRef = ref(storage, `article_images/${storageFileName}`);
    const snapshot = await uploadBytes(imageStorageRef, fileToUpload);
    finalImageUrl = await getDownloadURL(snapshot.ref);
    imageHint = `article ${title.substring(0, 20)}`; // Basic hint from title
  } else if (imageUrl === '' && currentArticle?.imageUrl) { // Image URL cleared, means delete existing
     try {
        const oldImageRef = ref(storage, currentArticle.imageUrl);
        await deleteObject(oldImageRef);
        finalImageUrl = null;
      } catch (e: any) {
         if (e.code !== 'storage/object-not-found') console.warn("Could not delete old article image when URL was cleared:", e);
      }
  }


  const articleContent = {
    introduction: introduction || '',
    points: points ? points.split('\n').filter((p: string) => p.trim() !== '') : [],
    conclusion: conclusion || '',
  };

  const dataToSave = {
    slug,
    title,
    shortDescription: shortDescription || '',
    category: category || '', // Ensure category is stored as ID
    imageUrl: finalImageUrl,
    imageHint,
    content: articleContent,
    status,
    authorId: currentUser.uid,
    updatedAt: serverTimestamp(),
    ...(existingArticleId ? {} : { createdAt: serverTimestamp(), favoriteCount: 0 }),
  };


  let articleRef;
  if (existingArticleId) {
    articleRef = doc(db, 'articles', existingArticleId);
    // Retain existing favoriteCount if updating
    const currentData = (await getDoc(articleRef)).data();
    await updateDoc(articleRef, {
        ...dataToSave,
        favoriteCount: currentData?.favoriteCount || 0, // Preserve existing fav count
    });
  } else {
    articleRef = await addDoc(articlesCollection, dataToSave);
  }

  const savedDoc = await getDoc(articleRef);
  if (!savedDoc.exists()) {
      throw new Error("Saved article not found!");
  }

  return convertFirestoreDocToArticle(savedDoc);
};

export const deleteArticleFromFirestore = async (articleId: string): Promise<void> => {
  const articleRef = doc(db, 'articles', articleId);
  try {
    const articleDoc = await getDoc(articleRef);
    if (articleDoc.exists()) {
      const articleData = articleDoc.data();
      if (articleData?.imageUrl) {
        try {
            const imageStorageRef = ref(storage, articleData.imageUrl); // Direct URL if stored fully
            await deleteObject(imageStorageRef);
        } catch (e: any) {
            if(e.code !== 'storage/object-not-found') console.warn("Could not delete article image:", e);
        }
      }
    }
    await deleteDoc(articleRef);
    // TODO: Also delete corresponding entries in article_favorites in RTDB if any
  } catch (error) {
    console.error("Error deleting article from Firestore:", error);
    throw error;
  }
};


export const updateUserArticleLike = async (userId: string, articleSlug: string, shouldBeLiked: boolean): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  try {
    if (shouldBeLiked) {
      await updateDoc(userRef, {
        likedArticles: arrayUnion(articleSlug)
      });
    } else {
      await updateDoc(userRef, {
        likedArticles: arrayRemove(articleSlug)
      });
    }
  } catch (error) {
    console.error("Error updating user article like status in Firestore:", error);
    throw error; // Re-throw to be caught by the component
  }
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

// Keep commonTrafficInfractions if used elsewhere, or remove if not.
export const commonTrafficInfractions: TrafficInfraction[] = [
  { id: 'speeding', name: 'Exceso de velocidad' },
  { id: 'red-light', name: 'No respetar semáforo en rojo' },
  { id: 'illegal-parking', name: 'Estacionamiento en lugar prohibido' },
  { id: 'dui', name: 'Manejar bajo los efectos del alcohol o drogas' },
  { id: 'mobile-phone', name: 'Uso del celular al manejar' },
  { id: 'seatbelt', name: 'No usar cinturón de seguridad' },
];

