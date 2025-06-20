// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPublishedArticles, getDraftArticles, getCategories, saveArticleToFirestore, deleteArticleFromFirestore, getUserLikedArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/article-card';
import { AiSuggester } from '@/components/ai-suggester';
import { Newspaper, Lightbulb, PlusCircle, Archive, Edit, Send, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleFormDialog } from '@/components/article-form-dialog';
import type { Article, Category } from '@/types';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, rtdb } from '@/lib/firebase/config'; // Import rtdb
import { ref, get as getRTDBData } from 'firebase/database'; // Import ref and get from RTDB
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const { toast } = useToast();

  const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
  const [draftArticles, setDraftArticles] = useState<Article[]>([]);
  const [userLikedArticleSlugs, setUserLikedArticleSlugs] = useState<string[]>([]);

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchArticlesWithRTDBCounts = async (articles: Article[]): Promise<Article[]> => {
    const articlesWithCounts = await Promise.all(
      articles.map(async (article) => {
        if (!article.slug) return { ...article, favoriteCount: article.favoriteCount || 0 };
        try {
          const favCountRef = ref(rtdb, `article_favorites/${article.slug}/count`);
          const snapshot = await getRTDBData(favCountRef);
          const count = snapshot.val();
          return { ...article, favoriteCount: count !== null ? count : (article.favoriteCount || 0) };
        } catch (error) {
          console.error(`Error fetching RTDB count for ${article.slug}:`, error);
          return { ...article, favoriteCount: article.favoriteCount || 0 }; // Fallback to Firestore count
        }
      })
    );
    return articlesWithCounts;
  };

  const fetchArticles = useCallback(async () => {
    try {
      let published = await getPublishedArticles();
      let drafts = await getDraftArticles();

      published = await fetchArticlesWithRTDBCounts(published);
      drafts = await fetchArticlesWithRTDBCounts(drafts); // Also update drafts if needed for consistency

      setPublishedArticles(published);
      setDraftArticles(drafts);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({ variant: "destructive", title: "Error al cargar artículos", description: "No se pudieron obtener los artículos." });
    }
  }, [toast]);

  const fetchUserLikedArticles = useCallback(async (userId: string) => {
    try {
      const likedSlugs = await getUserLikedArticles(userId);
      setUserLikedArticleSlugs(likedSlugs);
    } catch (error) {
      console.error("Error fetching user liked articles:", error);
      setUserLikedArticleSlugs([]); // Default to empty on error
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsAdmin(user.email === 'admin@test.com');
        fetchUserLikedArticles(user.uid);
      } else {
        setIsAdmin(false);
        setUserLikedArticleSlugs([]);
      }
      fetchArticles();
    });

    return () => unsubscribe();
  }, [fetchArticles, fetchUserLikedArticles]);

  const handleArticleLikeUpdated = useCallback(async () => {
    // Refetch articles to get updated RTDB counts for sorting
    await fetchArticles();
    if (currentUser) {
      await fetchUserLikedArticles(currentUser.uid); // Also update user's liked list
    }
  }, [currentUser, fetchArticles, fetchUserLikedArticles]);


  const handleOpenArticleForm = (article?: Article) => {
    setEditingArticle(article || null);
    setIsArticleFormOpen(true);
  };

  const handleSaveArticle = async (data: any, status: 'draft' | 'published') => {
    try {
      const savedArticle = await saveArticleToFirestore(data, status, editingArticle?.id);
      toast({
        title: `Artículo ${status === 'draft' ? (editingArticle ? 'actualizado como borrador' : 'guardado como borrador') : (editingArticle ? 'actualizado y publicado' : 'publicado')}`,
        description: `"${savedArticle.title}" ha sido procesado.`,
      });
      setIsArticleFormOpen(false);
      setEditingArticle(null);
      fetchArticles();

    } catch (error) {
      console.error("Error en handleSaveArticle:", error);
      toast({ variant: "destructive", title: "Error al guardar artículo", description: "No se pudo guardar el artículo." });
    }
  };

  const handleDeleteConfirmation = (article: Article) => {
    setArticleToDelete(article);
  };

  const handleConfirmDelete = async () => {
    if (!articleToDelete || !articleToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteArticleFromFirestore(articleToDelete.id);
      toast({ title: "Artículo eliminado", description: `"${articleToDelete.title}" ha sido eliminado.` });
      fetchArticles();

      setArticleToDelete(null);
    } catch (error) {
      console.error("Error en handleConfirmDelete:", error);
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el artículo." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublishStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const articleDataToSave = {
          title: article.title,
          shortDescription: article.shortDescription,
          category: getCategories().find(c => c.name === article.category)?.id || article.category,
          imageUrl: article.imageUrl,
          introduction: article.content.introduction,
          points: Array.isArray(article.content.points) ? article.content.points.join('\n') : '',
          conclusion: article.content.conclusion,
          imageHint: article.imageHint,
      };

      await saveArticleToFirestore(
        articleDataToSave,
        newStatus,
        article.id
      );

      toast({ title: `Artículo ${newStatus === 'published' ? 'publicado' : 'movido a borradores'}`, description: `"${article.title}" ahora está ${newStatus === 'published' ? 'público' : 'en borradores'}.` });

      fetchArticles();

    } catch (error) {
      console.error("Error en handleTogglePublishStatus:", error);
      toast({ variant: "destructive", title: "Error al actualizar estado", description: "No se pudo cambiar el estado del artículo." });
    }
  };

  const sortedPublishedArticles = useMemo(() => {
    if (!publishedArticles || publishedArticles.length === 0) {
      return [];
    }
    return [...publishedArticles].sort((a, b) => {
      const aIsLiked = userLikedArticleSlugs.includes(a.slug);
      const bIsLiked = userLikedArticleSlugs.includes(b.slug);

      if (aIsLiked && !bIsLiked) return -1;
      if (!aIsLiked && bIsLiked) return 1;

      // If both are liked or both are not liked, sort by favoriteCount descending
      // This favoriteCount should now be the RTDB count
      return (b.favoriteCount || 0) - (a.favoriteCount || 0); 
    });
  }, [publishedArticles, userLikedArticleSlugs]);


  return (
    <div className="bg-[hsl(var(--dashboard-background))] text-[hsl(var(--dashboard-foreground))] -m-4 md:-m-8 p-4 md:p-8 min-h-[calc(100vh-var(--header-height,10rem))] rounded-lg shadow-inner">
      <div className="container mx-auto">

        {isAdmin && (
          <section className="mb-12 animate-in fade-in-0 slide-in-from-top-5 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-primary-foreground drop-shadow-sm flex items-center gap-3">
                <ShieldAlert className="w-10 h-10" /> Panel de Administrador
              </h2>
              <Button onClick={() => handleOpenArticleForm()} size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Artículo
              </Button>
            </div>
             {draftArticles.length > 0 && (
                <>
                    <div className="flex items-center gap-3 mb-6 ">
                        <Archive className="w-8 h-8 text-primary-foreground drop-shadow-sm" />
                        <h3 className="text-2xl font-semibold text-primary-foreground drop-shadow-sm">Artículos Guardados (Borradores)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                    {draftArticles.map((article, index) => (
                        <div key={article.id || article.slug} className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        <ArticleCard
                            article={article}
                            isAdmin={isAdmin}
                            onEdit={() => handleOpenArticleForm(article)}
                            onDelete={() => handleDeleteConfirmation(article)}
                            onTogglePublish={() => handleTogglePublishStatus(article)}
                            onLikeUpdated={handleArticleLikeUpdated}
                        />
                        </div>
                    ))}
                    </div>
                    <Separator className="my-12 bg-primary-foreground/30" />
                </>
            )}
          </section>
        )}

        <section className="mb-12 animate-in fade-in-0 slide-in-from-top-5 duration-500 delay-100">
          <div className="flex items-center gap-3 mb-6 ">
            <Lightbulb className="w-10 h-10 text-primary-foreground drop-shadow-sm" />
            <h2 className="text-3xl font-bold text-primary-foreground drop-shadow-sm">Asesoría con IA</h2>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200">
            <AiSuggester />
          </div>
        </section>

        <section className="animate-in fade-in-0 slide-in-from-top-5 duration-500 delay-300">
          <div className="flex items-center gap-3 mb-8 ">
             <Newspaper className="w-10 h-10 text-primary-foreground drop-shadow-sm" />
            <h2 className="text-3xl font-bold text-primary-foreground drop-shadow-sm">Artículos Destacados</h2>
          </div>
          {sortedPublishedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ">
              {sortedPublishedArticles.map((article, index) => (
                <div key={article.id || article.slug} className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${300 + index * 100}ms` }}>
                  <ArticleCard
                    article={article}
                    isAdmin={isAdmin}
                    onEdit={() => handleOpenArticleForm(article)}
                    onDelete={() => handleDeleteConfirmation(article)}
                    onTogglePublish={() => handleTogglePublishStatus(article)}
                    onLikeUpdated={handleArticleLikeUpdated}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-primary-foreground/80 animate-in fade-in-0 duration-500 delay-400">No hay artículos publicados disponibles en este momento.</p>
          )}
        </section>
      </div>
      {isArticleFormOpen && (
        <ArticleFormDialog
          isOpen={isArticleFormOpen}
          onOpenChange={setIsArticleFormOpen}
          article={editingArticle}
          onSave={handleSaveArticle}
        />
      )}
      {articleToDelete && (
        <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                    Estás a punto de eliminar el artículo "{articleToDelete.title}". Esta acción no se puede deshacer.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setArticleToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
