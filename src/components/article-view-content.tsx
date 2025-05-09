// src/components/article-view-content.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Link2, Tag, Heart, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ArticleViewContentProps {
  article: Article;
}

export function ArticleViewContent({ article }: ArticleViewContentProps) {
  const [isFavorite, setIsFavorite] = useState(false); // Assuming false initially, could be fetched
  const [favoriteCount, setFavoriteCount] = useState(article.favoriteCount);
  const { toast } = useToast();

  const handleFavoriteClick = () => {
    setIsFavorite((prev) => {
      const newFavoriteState = !prev;
      setFavoriteCount((currentCount) => (newFavoriteState ? currentCount + 1 : currentCount - 1));
      // Here you would typically also call an API to update the favorite status and count on the backend
      toast({
        title: newFavoriteState ? "Agregado a destacados" : "Eliminado de destacados",
        description: `"${article.title}" ${newFavoriteState ? 'ahora está en tus destacados.' : 'ya no está en tus destacados.'}`,
      });
      return newFavoriteState;
    });
  };

  const handleShareClick = () => {
    // Placeholder for share functionality
    // In a real app, you might use navigator.share if available, or copy link to clipboard
    toast({
      title: "Compartir Artículo",
      description: "Funcionalidad de compartir estará disponible pronto.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard" className="mb-8 inline-flex items-center text-primary hover:underline animate-in fade-in-0 slide-in-from-left-5 duration-500">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Panel
      </Link>

      <Card className="shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-97 duration-500 delay-100">
        <CardHeader className="p-0 relative">
          <div className="relative w-full h-64 md:h-96">
            <Image
              src={article.imageUrl}
              alt={article.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={article.imageHint}
              priority
            />
          </div>
           <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/70 hover:bg-background/90 text-destructive hover:text-destructive rounded-full h-10 w-10"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? "Quitar de destacados" : "Marcar como destacado"}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-destructive")} />
            </Button>
             <Button
              variant="ghost"
              size="icon"
              className="bg-background/70 hover:bg-background/90 text-primary hover:text-primary/80 rounded-full h-10 w-10"
              onClick={handleShareClick}
              aria-label="Compartir artículo"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-300">
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag size={14} /> {article.category}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className={cn("h-4 w-4 mr-1", isFavorite ? "fill-destructive text-destructive" : "text-gray-400")} />
              <span>{favoriteCount}</span>
            </div>
          </div>

          <CardTitle className="text-3xl md:text-4xl font-bold mb-4 text-primary animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-400">
            {article.title}
          </CardTitle>
          
          <Separator className="my-6 animate-in fade-in-0 duration-500 delay-500" />

          <div className="prose prose-lg max-w-none text-foreground/90 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-600">
            <p className="lead text-lg mb-6">{article.content.introduction}</p>
            
            {article.content.points && article.content.points.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary/90 flex items-center ">
                  <BookOpen className="mr-2 h-5 w-5" /> Puntos Clave:
                </h3>
                <ul className="list-disc space-y-2 pl-5 mb-6">
                  {article.content.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </>
            )}

            {article.content.conclusion && (
              <p className="mt-6 border-l-4 border-primary pl-4 italic text-foreground/80">{article.content.conclusion}</p>
            )}
          </div>

          {article.readMoreLink && article.readMoreLink !== '#' && (
            <div className="mt-10 text-center animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-700">
              <Button asChild size="lg" variant="outline">
                <a href={article.readMoreLink} target="_blank" rel="noopener noreferrer">
                  <Link2 className="mr-2 h-5 w-5" />
                  Leer Más (Fuente Externa)
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
