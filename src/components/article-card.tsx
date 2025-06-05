
// src/components/article-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Tag, Heart, MoreVertical, Edit, Send, EyeOff, Trash2, Loader2 } from 'lucide-react'; // EyeOff para ocultar
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { rtdb } from '@/lib/firebase/config';
import { ref, onValue, runTransaction, off } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface ArticleCardProps {
  article: Article;
  isAdmin?: boolean;
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  onTogglePublish?: (article: Article) => void;
}

export function ArticleCard({ article, isAdmin = false, onEdit, onDelete, onTogglePublish }: ArticleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [rtdbFavoriteCount, setRtdbFavoriteCount] = useState<number>(article.favoriteCount || 0);
  const [isProcessingAdminAction, setIsProcessingAdminAction] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const favCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
    const listener = onValue(favCountRef, (snapshot) => {
      const count = snapshot.val();
      if (count !== null) {
        setRtdbFavoriteCount(count);
      } else {
        setRtdbFavoriteCount(article.favoriteCount || 0);
      }
    });
    return () => {
      off(favCountRef, 'value', listener);
    };
  }, [article.slug, article.favoriteCount]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessingAdminAction) return; // Evitar interacción si se está procesando otra acción

    const newIsFavoriteState = !isFavorite;
    setIsFavorite(newIsFavoriteState);

    const articleFavCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
    runTransaction(articleFavCountRef, (currentCount) => {
      const initialCount = article.favoriteCount || 0;
      if (currentCount === null) {
        return newIsFavoriteState ? Math.max(1, initialCount + 1) : Math.max(0, initialCount);
      }
      if (newIsFavoriteState) {
        return currentCount + 1;
      } else {
        return Math.max(0, currentCount - 1);
      }
    }).catch(error => {
      console.error("Transaction failed: ", error);
      setIsFavorite(!newIsFavoriteState);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el contador de Me Gusta." });
    });
  };

  const handleAdminAction = async (action: 'edit' | 'delete' | 'togglePublish') => {
    setIsProcessingAdminAction(true);
    try {
      if (action === 'edit' && onEdit) onEdit(article);
      if (action === 'delete' && onDelete) onDelete(article); // La confirmación se maneja en DashboardPage
      if (action === 'togglePublish' && onTogglePublish) await onTogglePublish(article);
    } catch (error) {
        toast({ variant: "destructive", title: "Error de Admin", description: `No se pudo realizar la acción: ${action}` });
    } finally {
        // No resetear isProcessingAdminAction aquí si la acción principal (como abrir dialog)
        // debe mantener el control, o si el componente se desmonta.
        // Considerar resetearlo desde el componente padre si es necesario.
        // Por ahora, para acciones rápidas como togglePublish lo reseteamos.
        if (action === 'togglePublish') setIsProcessingAdminAction(false);
    }
  };
  
  const isDraftByAdmin = isAdmin && article.status === 'draft';

  return (
    <Card className={cn(
        "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full",
        isDraftByAdmin && "opacity-70 grayscale hover:opacity-90 hover:grayscale-0",
        isProcessingAdminAction && "cursor-not-allowed opacity-60"
      )}>
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-48">
          <Image
            src={article.imageUrl || 'https://placehold.co/600x400.png?text=Art%C3%ADculo'}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={article.imageHint || 'article image'}
            className={cn(isProcessingAdminAction && "opacity-50")}
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="bg-background/70 hover:bg-background/90 text-destructive hover:text-destructive rounded-full h-9 w-9"
                onClick={handleFavoriteClick}
                aria-label={isFavorite ? "Quitar de destacados" : "Marcar como destacado"}
                disabled={isProcessingAdminAction}
            >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-destructive")} />
            </Button>
            {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={isProcessingAdminAction}>
                        <Button variant="ghost" size="icon" className="bg-background/70 hover:bg-background/90 rounded-full h-9 w-9">
                            {isProcessingAdminAction ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreVertical className="h-5 w-5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAdminAction('edit')} disabled={isProcessingAdminAction}>
                            <Edit className="mr-2 h-4 w-4" /> Actualizar
                        </DropdownMenuItem>
                        {article.status === 'published' ? (
                            <DropdownMenuItem onClick={() => handleAdminAction('togglePublish')} disabled={isProcessingAdminAction}>
                                <EyeOff className="mr-2 h-4 w-4" /> Ocultar (Borrador)
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleAdminAction('togglePublish')} disabled={isProcessingAdminAction}>
                                <Send className="mr-2 h-4 w-4" /> Publicar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAdminAction('delete')} className="text-destructive focus:text-destructive" disabled={isProcessingAdminAction}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent className={cn("p-6 flex-grow", isProcessingAdminAction && "opacity-50")}>
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
        {isDraftByAdmin && <Badge variant="outline" className="mt-2 border-amber-500 text-amber-600">Borrador</Badge>}
      </CardContent>
      <CardFooter className={cn("p-6 pt-0", isProcessingAdminAction && "opacity-50")}>
        <Link href={`/dashboard/article/${article.slug}`} passHref legacyBehavior>
          <Button asChild className="w-full" disabled={isProcessingAdminAction || isDraftByAdmin}>
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
