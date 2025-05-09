import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export function WelcomeContent() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-20">
      <ShieldCheck className="w-24 h-24 text-primary mb-6" strokeWidth={1.5} />
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        Bienvenido a <span className="text-primary">Mi Asesor Vial</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
        Tu guía inteligente para entender las normativas de tránsito, evitar infracciones y conducir con seguridad.
      </p>
      <div className="relative w-full max-w-3xl h-64 md:h-96 rounded-xl overflow-hidden shadow-2xl mb-10">
        <Image
          src="https://picsum.photos/seed/cityroad/1200/600"
          alt="City road with traffic"
          layout="fill"
          objectFit="cover"
          data-ai-hint="city road"
          className="transform transition-transform duration-500 hover:scale-105"
        />
         <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      <Link href="/dashboard">
        <Button size="lg" className="text-lg px-8 py-6 shadow-lg transform transition-transform hover:scale-105 active:scale-95">
          <PlayCircle className="mr-2 h-6 w-6" />
          Ir al Panel Principal
        </Button>
      </Link>
      <p className="mt-8 text-sm text-muted-foreground">
        Mantente informado, conduce seguro.
      </p>
    </div>
  );
}
