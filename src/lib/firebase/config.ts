
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database'; // Added
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`, // Added for RTDB
};

console.log('Firebase config loaded:', firebaseConfig);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let rtdb: Database; // Added

if (
    !firebaseConfig.apiKey || firebaseConfig.apiKey === "TU_API_KEY_AQUI" ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.databaseURL // Added check
   ) {
  console.warn(
    'La configuración de Firebase falta o está incompleta. Por favor, revisa tu archivo .env o las variables de entorno. Asegúrate de reemplazar los placeholders como "TU_API_KEY_AQUI" con tus valores reales y que databaseURL esté presente.'
  );
}

if (!getApps().length) {
 console.log('Initializing new Firebase app with config:', firebaseConfig);

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    rtdb = getDatabase(app); // Added
    if (typeof window !== 'undefined') {
      const analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error('Error de inicialización de Firebase', error);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  rtdb = getDatabase(app); // Added
}

export { app, auth, db, storage, rtdb }; // Added rtdb
