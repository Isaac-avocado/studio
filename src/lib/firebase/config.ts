
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = { // Ensure firebaseConfig is fully defined here
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase config loaded:', firebaseConfig);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Comprobar si las variables de configuración de Firebase están cargadas
if ( // Keep checks for incomplete configuration and the warning
    !firebaseConfig.apiKey || firebaseConfig.apiKey === "TU_API_KEY_AQUI" || // Placeholder común
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
   ) {
  console.warn(
    'La configuración de Firebase falta o está incompleta. Por favor, revisa tu archivo .env o las variables de entorno. Asegúrate de reemplazar los placeholders como "TU_API_KEY_AQUI" con tus valores reales.'
  );
}

if (!getApps().length) {
 console.log('Initializing new Firebase app with config:', firebaseConfig);

  try {
    // Initialize Firebase app and services
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    const analytics = getAnalytics(app);
  } catch (error) {
    // Keep error handling
    console.error('Error de inicialización de Firebase', error);
    // Fallback o lanzar error, dependiendo de cuán crítico sea Firebase para que la app inicie
    // Por ahora, permitiremos que proceda, pero las características dependientes de la autenticación fallarán.
    // Una solución más robusta sería mostrar una página de error o prevenir la carga de la app.
    // Si ves este error, verifica que tus variables de entorno de Firebase sean correctas.
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
