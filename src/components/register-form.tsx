
// src/components/register-form.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const registerSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'], // path of error
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, {
          displayName: values.username,
        });

        // Save user profile to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: values.username,
          email: values.email,
          createdAt: new Date().toISOString(),
          photoURL: null, // Initialize photoURL
          isAdmin: values.email === 'admin@test.com', // Set isAdmin based on email for testing
          likedArticles: [], // Initialize likedArticles for new user
        });
      }

      toast({
        title: 'Registro exitoso',
        description: 'Tu cuenta ha sido creada. ¡Bienvenido!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Error al registrar la cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      }
      toast({
        variant: 'destructive',
        title: 'Error de registro',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="p-6 relative">
            <Skeleton className="absolute top-6 left-6 h-6 w-6 rounded" /> {/* Back Arrow */}
            <div className="flex flex-col items-center pt-8">
              <Skeleton className="mb-6 h-[100px] w-[100px] rounded-full" /> {/* Icon container */}
              <Skeleton className="h-9 w-3/5 mb-2 rounded" /> {/* Title */}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>
              <Skeleton className="h-12 w-full rounded-md py-3 mt-6" /> {/* Register Button */}
            </div>
            <div className="mt-6 text-center">
              <Skeleton className="h-4 w-2/5 mx-auto rounded" /> {/* Login link */}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
       <Card className="w-full max-w-md shadow-xl animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="p-6 relative">
          <Link href="/login" className="absolute top-6 left-6 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex flex-col items-center pt-8">
             <div className="mb-6 p-5 rounded-full bg-[hsl(var(--dashboard-background))] animate-in fade-in-0 zoom-in-95 duration-500 delay-200">
                <UserPlus size={60} className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-300">Bienvenido</h1>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-400">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="username" className="text-primary">Nombre de usuario</Label>
                      <FormControl>
                        <Input
                          id="username"
                          placeholder="Tu nombre de usuario"
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email" className="text-primary">Correo electrónico</Label>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@correo.com"
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password" className="text-primary">Contraseña</Label>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="confirmPassword" className="text-primary">Confirmar Contraseña</Label>
                      <FormControl>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-lg py-3 h-auto mt-6" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Registrarse'}
                </Button>
              </form>
            </Form>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-500">
            <div className="mt-6 text-center">
              <Link href="/login" legacyBehavior>
                <a className="text-sm text-primary hover:underline">
                  Iniciar sesión
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
