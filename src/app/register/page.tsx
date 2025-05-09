import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro - Mi Asesor Vial',
  description: 'Crea una cuenta en Mi Asesor Vial.',
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/login" className="absolute top-6 left-6 text-primary hover:opacity-80 transition-opacity md:top-10 md:left-10">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-primary mb-8">Crear Cuenta</h1>
        <p className="text-muted-foreground mb-8">
          La funcionalidad de registro estará disponible próximamente.
        </p>
        <Button asChild>
          <Link href="/login">Volver a Iniciar Sesión</Link>
        </Button>
      </div>
    </div>
  );
}
