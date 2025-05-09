import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña - Mi Asesor Vial',
  description: 'Restablece tu contraseña de Mi Asesor Vial.',
};


export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/login" className="absolute top-6 left-6 text-primary hover:opacity-80 transition-opacity md:top-10 md:left-10">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-primary mb-8">Restablecer Contraseña</h1>
        <p className="text-muted-foreground mb-8">
          La funcionalidad de restablecimiento de contraseña estará disponible próximamente.
        </p>
        <Button asChild>
          <Link href="/login">Volver a Iniciar Sesión</Link>
        </Button>
      </div>
    </div>
  );
}
