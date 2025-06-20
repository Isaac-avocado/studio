
// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // db and Firestore functions no longer needed here for admin check
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, BarChart3, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAIL = 'admin@test.com';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('[AdminPage] User authenticated:', user.uid, user.email);
        setCurrentUser(user);
        // Admin check based on hardcoded email
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          console.log('[AdminPage] User is Admin based on email admin@test.com.');
        } else {
          setIsAdmin(false);
          console.warn(`[AdminPage] Access Denied: User email ${user.email} does NOT match ${ADMIN_EMAIL}. Redirecting.`);
          setTimeout(() => router.push('/dashboard'), 100);
        }
      } else {
        console.log('[AdminPage] No user authenticated. Redirecting to login.');
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
        <p className="text-muted-foreground">Verificando acceso de administrador...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">No tienes permisos de administrador para acceder a esta página.</p>
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
            Bienvenido, {currentUser?.displayName || currentUser?.email || 'Admin'}. Aquí puedes ver información general de la aplicación.
            <br />
            <span className="text-xs text-amber-600 dark:text-amber-400">Nota: En esta versión de prueba, el estado de administrador se otorga al usuario con el correo electrónico: <strong>{ADMIN_EMAIL}</strong>.</span>
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
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? (
                     <Button asChild variant="outline" size="sm">
                        <a
                          href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/analytics/dashboard`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir Firebase Analytics
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                  ) : (
                    <p className="text-sm text-red-500">PROJECT_ID de Firebase no configurado para el enlace de Analytics.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
