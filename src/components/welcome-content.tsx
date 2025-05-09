import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoSplashIcon } from '@/components/icons/logo-splash-icon';

export function WelcomeContent() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 min-h-[calc(100vh-12rem)]"> {/* Adjust min-height to fill screen better within layout */}
      <LogoSplashIcon className="w-36 h-36 md:w-44 md:h-44 mb-8" />
      
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-primary">
        Mi Asesor Vial
      </h1>
      
      <p className="text-lg md:text-xl text-primary/90 max-w-xs md:max-w-sm mb-12 leading-relaxed">
        Conduce con conocimiento, actúa con seguridad.
      </p>
      
      <Link href="/login" legacyBehavior>
        <Button 
          asChild
          size="lg" 
          className="h-14 px-12 text-lg rounded-full shadow-xl font-semibold
                     transform transition-all duration-150 ease-in-out 
                     hover:scale-105 hover:shadow-2xl active:scale-95
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <a>Empecemos</a>
        </Button>
      </Link>
    </div>
  );
}
