
// src/components/article-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Tag, Heart, MoreVertical, Edit, Send, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { rtdb, auth, db } from '@/lib/firebase/config'; // Added auth, db
import { ref, onValue, runTransaction, off } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // Added User
import { getUserLikedArticles, updateUserArticleLike } from '@/lib/articles'; // Added new functions

interface ArticleCardProps {
  article: Article;
  isAdmin?: boolean;
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  onTogglePublish?: (article: Article) => void;
}

export function ArticleCard({ article, isAdmin = false, onEdit, onDelete, onTogglePublish }: ArticleCardProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userLikedArticleSlugs, setUserLikedArticleSlugs] = useState<string[]>([]);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [rtdbFavoriteCount, setRtdbFavoriteCount] = useState<number>(article.favoriteCount || 0);
  const [isProcessingAdminAction, setIsProcessingAdminAction] = useState(false);
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
        if (currentCount === null) { // First like ever for this article or count not set
          return newLikedStateForUser ? 1 : 0;
        }
        return newLikedStateForUser ? currentCount + 1 : Math.max(0, currentCount - 1);
      });
      
      // Update local state for UI responsiveness
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

  const handleAdminAction = async (action: 'edit' | 'delete' | 'togglePublish') => {
    setIsProcessingAdminAction(true);
    try {
      if (action === 'edit' && onEdit) onEdit(article);
      if (action === 'delete' && onDelete) onDelete(article);
      if (action === 'togglePublish' && onTogglePublish) await onTogglePublish(article);
    } catch (error) {
        toast({ variant: "destructive", title: "Error de Admin", description: `No se pudo realizar la acción: ${action}` });
    } finally {
        if (action === 'togglePublish' || action === 'edit' || action === 'delete') {
            setIsProcessingAdminAction(false);
        }
    }
  };
  
  const isDraftByAdmin = isAdmin && article.status === 'draft';

  return (
    <Card className={cn(
        "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full",
        isDraftByAdmin && "opacity-70 grayscale-[50%] hover:opacity-90 hover:grayscale-0",
        (isProcessingAdminAction || isProcessingLike) && "cursor-not-allowed opacity-60"
      )}>
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-48">
          {article.imageUrl && (
            <Image
              src={article.imageUrl}
              alt={article.title || 'Article image'}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={article.imageHint || 'article image'}
              className={cn((isProcessingAdminAction || isProcessingLike) && "opacity-50")}
            />
          )}
          {!article.imageUrl && (
             <div className="w-full h-full bg-secondary flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="bg-background/70 hover:bg-background/90 text-destructive hover:text-destructive rounded-full h-9 w-9"
                onClick={handleLikeClick}
                aria-label={isLikedByUser ? "Quitar de favoritos" : "Marcar como favorito"}
                disabled={isProcessingAdminAction || isProcessingLike || !currentUser}
            >
              {isProcessingLike ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-5 w-5", isLikedByUser && "fill-destructive text-destructive")} /> }
            </Button>
            {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={isProcessingAdminAction || isProcessingLike}>
                        <Button variant="ghost" size="icon" className="bg-background/70 hover:bg-background/90 rounded-full h-9 w-9">
                            {(isProcessingAdminAction || isProcessingLike) ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreVertical className="h-5 w-5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAdminAction('edit')} disabled={isProcessingAdminAction || isProcessingLike}>
                            <Edit className="mr-2 h-4 w-4" /> Actualizar
                        </DropdownMenuItem>
                        {article.status === 'published' ? (
                            <DropdownMenuItem onClick={() => handleAdminAction('togglePublish')} disabled={isProcessingAdminAction || isProcessingLike}>
                                <EyeOff className="mr-2 h-4 w-4" /> Ocultar (Borrador)
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleAdminAction('togglePublish')} disabled={isProcessingAdminAction || isProcessingLike}>
                                <Send className="mr-2 h-4 w-4" /> Publicar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAdminAction('delete')} className="text-destructive focus:text-destructive" disabled={isProcessingAdminAction || isProcessingLike}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent className={cn("p-6 flex-grow", (isProcessingAdminAction || isProcessingLike) && "opacity-50")}>
        <div className="mb-2 flex justify-between items-center">
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Tag size={14} /> {article.category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Heart className={cn("h-4 w-4 mr-1", isLikedByUser && currentUser ? "fill-destructive text-destructive" : "text-gray-400")} />
            <span>{rtdbFavoriteCount}</span>
          </div>
        </div>
        <CardTitle className="text-xl mb-2 line-clamp-2">{article.title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {article.shortDescription}
        </CardDescription>
        {isDraftByAdmin && <Badge variant="outline" className="mt-2 border-amber-500 text-amber-600">Borrador</Badge>}
      </CardContent>
      <CardFooter className={cn("p-6 pt-0", (isProcessingAdminAction || isProcessingLike) && "opacity-50")}>
        <Link href={`/dashboard/article/${article.slug}`} passHref legacyBehavior>
          <Button asChild className="w-full" disabled={isProcessingAdminAction || isProcessingLike || isDraftByAdmin}>
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

