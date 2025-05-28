
// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, BarChart3, AlertTriangle, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

// Metadata for admin page - can't be dynamically set easily in client component page
// export const metadata: Metadata = {
//   title: 'Panel de Administración - Mi Asesor Vial',
//   description: 'Gestión y analíticas de la aplicación.',
// };

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true); // Force refresh
          if (idTokenResult.claims.admin === true) {
            setIsAdmin(true);
          } else {
            // Not an admin, redirect or show access denied after a short delay
            // to prevent flashing content if claims are slow.
             setTimeout(() => router.push('/dashboard'), 100);
          }
        } catch (error) {
          console.error("Error fetching user claims for admin page:", error);
           setTimeout(() => router.push('/dashboard'), 100);
        }
      } else {
        // No user logged in, redirect to login
        router.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    // This state might be briefly visible before redirect or if redirect fails
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">No tienes permisos para acceder a esta página.</p>
        <Link href="/dashboard">
          <Button variant="outline">Volver al Panel Principal</Button>
        </Link>
      </div>
    );
  }

  // Admin content
  return (
    <div className="container mx-auto py-8">
       <head>
        <title>Panel de Administración - Mi Asesor Vial</title>
      </head>
      <Card className="shadow-lg animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
            <ShieldCheck size={32} /> Panel de Administración
          </CardTitle>
          <CardDescription>
            Bienvenido, {currentUser?.displayName || 'Admin'}. Aquí puedes ver información general de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary/90 flex items-center gap-2">
              <BarChart3 size={22} /> Datos de Firebase Analytics
            </h2>
            <div className="bg-secondary/30 p-6 rounded-lg border border-dashed">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Visualización de Analíticas</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Los datos detallados y agregados de Firebase Analytics se exploran de manera más efectiva directamente en la Consola de Firebase.
                    La integración de estos datos en la aplicación para una visualización personalizada generalmente requiere exportar los datos a BigQuery y luego consultarlos a través de un backend.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <a 
                      href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/analytics`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Abrir Firebase Analytics
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Puedes añadir más secciones aquí para futuras funcionalidades de admin */}
          {/* Por ejemplo:
          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary/90">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">Próximamente: herramientas para gestionar usuarios.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3 text-primary/90">Gestión de Contenido</h2>
            <p className="text-muted-foreground">Próximamente: herramientas para gestionar artículos.</p>
          </section>
          */}
        </CardContent>
      </Card>
    </div>
  );
}
