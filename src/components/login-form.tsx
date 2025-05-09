// src/components/login-form.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Bienvenido de nuevo.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      }
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
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
          <CardHeader className="p-6">
            <Skeleton className="absolute top-6 left-6 h-6 w-6 rounded" /> {/* Back Arrow */}
            <div className="flex flex-col items-center pt-8">
              <Skeleton className="mb-6 h-[100px] w-[100px] rounded-full" /> {/* Icon container */}
              <Skeleton className="h-9 w-3/5 mb-2 rounded" /> {/* Title */}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
              </div>
              <Skeleton className="h-12 w-full rounded-md py-3" /> {/* Login Button */}
            </div>
            <Skeleton className="h-12 w-full mt-4 rounded-md py-3" /> {/* Register Button */}
            <div className="mt-6 text-center">
              <Skeleton className="h-4 w-2/5 mx-auto rounded" /> {/* Forgot password link */}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="p-6">
          <Link href="/" className="absolute top-6 left-6 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex flex-col items-center pt-8">
            <div className="mb-6 p-5 rounded-full bg-[hsl(var(--dashboard-background))] animate-in fade-in-0 zoom-in-95 duration-500 delay-200">
              <UserCircle size={60} className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-300">¡Hola de nuevo!</h1>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-400">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button type="submit" className="w-full text-lg py-3 h-auto" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Iniciar'}
                </Button>
              </form>
            </Form>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-500">
            <Button variant="outline" className="w-full mt-4 text-lg py-3 h-auto border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
            <div className="mt-6 text-center">
              <Link href="/reset-password" legacyBehavior>
                <a className="text-sm text-primary hover:underline">
                  ¿Olvidaste la contraseña?
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
