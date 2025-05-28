
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Tag, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { rtdb } from '@/lib/firebase/config'; // Import RTDB
import { ref, onValue, runTransaction, off } from 'firebase/database'; // Import RTDB functions

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  // Favorite count will now come from RTDB, initialize with article's static count as fallback
  const [rtdbFavoriteCount, setRtdbFavoriteCount] = useState<number>(article.favoriteCount);

  useEffect(() => {
    const favCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
    const listener = onValue(favCountRef, (snapshot) => {
      const count = snapshot.val();
      if (count !== null) {
        setRtdbFavoriteCount(count);
      } else {
        // If no value in RTDB, use the static one (or 0 if you prefer)
        setRtdbFavoriteCount(article.favoriteCount);
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      off(favCountRef, 'value', listener);
    };
  }, [article.slug, article.favoriteCount]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newIsFavoriteState = !isFavorite;
    setIsFavorite(newIsFavoriteState);

    const articleFavCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
    runTransaction(articleFavCountRef, (currentCount) => {
      if (currentCount === null) {
        // Initialize if not present, ensuring it's at least 0
        return newIsFavoriteState ? Math.max(1, article.favoriteCount + 1) : Math.max(0, article.favoriteCount);
      }
      if (newIsFavoriteState) {
        return currentCount + 1;
      } else {
        return Math.max(0, currentCount - 1); // Ensure count doesn't go below 0
      }
    }).catch(error => {
      console.error("Transaction failed: ", error);
      // Optionally revert UI state or show toast
      setIsFavorite(!newIsFavoriteState); // Revert optimistic update
    });
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
            <span>{rtdbFavoriteCount}</span>
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
