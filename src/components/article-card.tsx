
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Tag, Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(article.favoriteCount);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    setIsFavorite((prevIsFavorite) => {
      const newIsFavoriteState = !prevIsFavorite;
      setFavoriteCount((prevFavoriteCount) => {
        if (newIsFavoriteState) {
          return prevFavoriteCount + 1;
        } else {
          return prevFavoriteCount - 1;
        }
      });
      return newIsFavoriteState;
    });
    // Here you would typically also call an API to update the favorite status and count on the backend
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-48">
          <Image
            src={article.imageUrl}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={article.imageHint}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/70 hover:bg-background/90 text-destructive hover:text-destructive rounded-full h-9 w-9"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Quitar de destacados" : "Marcar como destacado"}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-destructive")} />
        </Button>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="mb-2 flex justify-between items-center">
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Tag size={14} /> {article.category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Heart className={cn("h-4 w-4 mr-1", isFavorite ? "fill-destructive text-destructive" : "text-gray-400")} />
            <span>{favoriteCount}</span>
          </div>
        </div>
        <CardTitle className="text-xl mb-2 line-clamp-2">{article.title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {article.shortDescription}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Link href={`/dashboard/article/${article.slug}`} passHref legacyBehavior>
          <Button asChild className="w-full">
            <a>
              Ver Detalles
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

