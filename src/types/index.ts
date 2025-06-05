
// src/types/index.ts
import type { Timestamp } from 'firebase/firestore';

export interface Article {
  id?: string; // ID de Firestore, opcional en la creación
  slug: string; // Podría ser el ID de Firestore o generarse
  title: string;
  shortDescription: string;
  category: string; // Nombre o ID de la categoría
  imageUrl: string;
  imageHint: string;
  content: {
    introduction: string;
    points: string[];
    conclusion?: string;
  };
  readMoreLink?: string;
  favoriteCount: number; // Se sigue manejando con RTDB
  status: 'draft' | 'published'; // Nuevo estado
  authorId?: string; // UID del admin/creador
  createdAt?: Timestamp | Date | string; // Flexible para datos iniciales y Firestore
  updatedAt?: Timestamp | Date | string; // Flexible para datos iniciales y Firestore
}

export interface TrafficInfraction {
  id: string;
  name: string;
}

export interface FirestoreUser {
  uid: string;
  username: string; // Corresponde a Firebase Auth displayName
  email: string;
  createdAt: string;
  photoURL?: string | null;
  isAdmin?: boolean; // Para la versión de prueba con Firestore
}

export interface Category {
  id: string;
  name: string;
}
