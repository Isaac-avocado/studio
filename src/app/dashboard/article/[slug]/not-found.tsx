import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ArticleNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <AlertTriangle className="w-20 h-20 text-destructive mb-6" />
      <h1 className="text-4xl font-bold mb-4">Artículo No Encontrado</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Lo sentimos, no pudimos encontrar el artículo que estás buscando.
      </p>
      <Link href="/dashboard">
        <Button>Volver al Panel Principal</Button>
      </Link>
    </div>
  );
}
