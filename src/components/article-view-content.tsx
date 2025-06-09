
// src/components/article-view-content.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Link2, Tag, Heart, Share2, ImageIcon, Loader2 } from 'lucide-react'; // Added ImageIcon, Loader2
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { rtdb, auth, db } from '@/lib/firebase/config'; // Added auth, db
import { ref, onValue, runTransaction, off } from 'firebase/database';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // Added User
import { getUserLikedArticles, updateUserArticleLike } from '@/lib/articles'; // Added new functions

interface ArticleViewContentProps {
  article: Article;
}

export function ArticleViewContent({ article }: ArticleViewContentProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userLikedArticleSlugs, setUserLikedArticleSlugs] = useState<string[]>([]);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [rtdbFavoriteCount, setRtdbFavoriteCount] = useState<number>(article.favoriteCount);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && article.slug) {
        const likedSlugs = await getUserLikedArticles(user.uid);
        setUserLikedArticleSlugs(likedSlugs);
      } else {
        setUserLikedArticleSlugs([]);
      }
    });
    return () => unsubscribeAuth();
  }, [article.slug]);

  useEffect(() => {
    if (!article.slug) {
        setRtdbFavoriteCount(article.favoriteCount || 0);
        return;
    }
    const favCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
    const listener = onValue(favCountRef, (snapshot) => {
      const count = snapshot.val();
      setRtdbFavoriteCount(count !== null ? count : (article.favoriteCount || 0));
    }, (error) => {
      console.error(`Error fetching RTDB count for ${article.slug}:`, error);
      setRtdbFavoriteCount(article.favoriteCount || 0); // Fallback on error
    });
    return () => {
      off(favCountRef, 'value', listener);
    };
  }, [article.slug, article.favoriteCount]);
  
  const isLikedByUser = currentUser ? userLikedArticleSlugs.includes(article.slug) : false;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || !article.slug || isProcessingLike) {
       if(!currentUser) toast({title: "Inicia sesión", description: "Debes iniciar sesión para marcar un artículo como favorito."});
      return;
    }

    setIsProcessingLike(true);
    const newLikedStateForUser = !isLikedByUser;

    try {
      await updateUserArticleLike(currentUser.uid, article.slug, newLikedStateForUser);

      const articleFavCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
      await runTransaction(articleFavCountRef, (currentCount) => {
        if (currentCount === null) {
          return newLikedStateForUser ? 1 : 0;
        }
        return newLikedStateForUser ? currentCount + 1 : Math.max(0, currentCount - 1);
      });

      if (newLikedStateForUser) {
        setUserLikedArticleSlugs(prev => [...prev, article.slug]);
      } else {
        setUserLikedArticleSlugs(prev => prev.filter(slug => slug !== article.slug));
      }

      toast({
        title: newLikedStateForUser ? "Agregado a favoritos" : "Eliminado de favoritos",
      });

    } catch (error) {
      console.error("Error processing like: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar tu 'Me Gusta'." });
    } finally {
      setIsProcessingLike(false);
    }
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.shortDescription,
        url: window.location.href,
      }).then(() => {
        toast({ title: "Artículo compartido", description: "Gracias por compartir." });
      }).catch((error) => {
        console.error('Error al compartir:', error);
        navigator.clipboard.writeText(window.location.href).then(() => {
          toast({ title: "Enlace copiado", description: "El enlace al artículo ha sido copiado a tu portapapeles." });
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({ title: "Enlace copiado", description: "El enlace al artículo ha sido copiado a tu portapapeles." });
      }).catch(err => {
         toast({ variant: "destructive", title: "Error", description: "No se pudo copiar el enlace." });
      });
    }
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
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={article.imageHint || 'article details'}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground">
                <ImageIcon className="w-24 h-24" />
              </div>
            )}
          </div>
           <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/70 hover:bg-background/90 text-destructive hover:text-destructive rounded-full h-10 w-10"
              onClick={handleLikeClick}
              aria-label={isLikedByUser ? "Quitar de favoritos" : "Marcar como favorito"}
              disabled={isProcessingLike || !currentUser}
            >
              {isProcessingLike ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-5 w-5", isLikedByUser && "fill-destructive text-destructive")} /> }
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
              <Heart className={cn("h-4 w-4 mr-1", isLikedByUser && currentUser ? "fill-destructive text-destructive" : "text-gray-400")} />
              <span>{rtdbFavoriteCount}</span>
            </div>
          </div>

          <CardTitle className="text-3xl md:text-4xl font-bold mb-4 text-primary animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-400">
            {article.title}
          </CardTitle>
          
          <Separator className="my-6 animate-in fade-in-0 duration-500 delay-500" />

          {article.content && typeof article.content === 'object' ? (
            <div className="prose prose-lg max-w-none text-foreground/90 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-600">
              {article.content.introduction && (
                <p className="lead text-lg mb-6">{article.content.introduction}</p>
              )}

              {article.content.points && Array.isArray(article.content.points) && article.content.points.length > 0 && (
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
            ) : (
            <div className="text-foreground/80 italic animate-in fade-in-0 duration-500 delay-600">No content available for this article.</div>
            )}

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

