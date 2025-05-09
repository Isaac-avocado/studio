// src/components/reset-password-form.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, UserCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const resetPasswordSchema = z.object({
  email: z.string().email('Correo electrónico inválido.'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'Correo enviado',
        description: 'Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Error al enviar el correo de restablecimiento.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No se encontró ningún usuario con este correo electrónico.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="p-6">
          <Link href="/login" className="absolute top-6 left-6 text-primary hover:opacity-80 transition-opacity md:top-10 md:left-10">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex flex-col items-center pt-8">
             <div className="mb-6 p-5 rounded-full bg-[hsl(var(--dashboard-background))] animate-in fade-in-0 zoom-in-95 duration-500 delay-200">
                <UserCircle size={60} className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-300">Restaurar contraseña</h1>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground mb-6 text-center animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-350">
            Escriba su correo electrónico para recibir un enlace de restablecimiento.
          </p>
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
                <Button type="submit" className="w-full text-lg py-3 h-auto" disabled={isLoading}>
                   {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Enviar'}
                </Button>
              </form>
            </Form>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-500">
            <Button variant="outline" className="w-full mt-4 text-lg py-3 h-auto border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <div className="mt-6 text-center">
              <Link href="/register" legacyBehavior>
                <a className="text-sm text-primary hover:underline">
                  ¿Aún no tiene cuenta?
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
