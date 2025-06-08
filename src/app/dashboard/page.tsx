// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { getPublishedArticles, getDraftArticles, getCategories, saveArticleToFirestore, deleteArticleFromFirestore } from '@/lib/articles'; // Actualizado
import { ArticleCard } from '@/components/article-card';
import { AiSuggester } from '@/components/ai-suggester';
import { Newspaper, Lightbulb, PlusCircle, Archive, Edit, Send, Trash2, ShieldAlert, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { ArticleFormDialog } from '@/components/article-form-dialog'; // Nuevo
import type { Article, Category } from '@/types';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

// export const metadata = { // Metadata no se puede usar en 'use client'
//   title: 'Panel Principal - Mi Asesor Vial',
//   description: 'Explora artículos sobre seguridad vial y obtén consejos de nuestra IA.',
// };

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const { toast } = useToast();

  const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
  const [draftArticles, setDraftArticles] = useState<Article[]>([]);

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to fetch articles
  const fetchArticles = useCallback(async () => { // Wrapped in useCallback
    try {
      const published = await getPublishedArticles();
      const drafts = await getDraftArticles();
      setPublishedArticles(published);
      setDraftArticles(drafts);
    } catch (error) {
      console.error("Error fetching articles:", error);
      // Optionally handle error, e.g., set articles to empty arrays or show a toast
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email === 'admin@test.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      fetchArticles(); // Fetch articles on auth state change
    });

    return () => unsubscribe();
  }, [fetchArticles]); // Add fetchArticles to dependency array

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
      fetchArticles(); // Re-fetch articles after saving

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
      fetchArticles(); // Re-fetch articles after deleting

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
      // We need to pass the full article data to saveArticleToFirestore
      // as if it came from the form, because saveArticleToFirestore now
      // handles creating/updating the full document.
      const articleDataToSave = {
          title: article.title,
          shortDescription: article.shortDescription,
          // Find the category ID based on the name if necessary, or store ID directly
          category: getCategories().find(c => c.name === article.category)?.id || article.category,
          imageUrl: article.imageUrl,
          // Assuming content.points is an array, join it back for the function expecting a string
          introduction: article.content.introduction,
          points: Array.isArray(article.content.points) ? article.content.points.join('\n') : '',
          conclusion: article.content.conclusion,
      };

      await saveArticleToFirestore(
        articleDataToSave,
        newStatus,
        article.id
      );

      toast({ title: `Artículo ${newStatus === 'published' ? 'publicado' : 'movido a borradores'}`, description: `"${article.title}" ahora está ${newStatus === 'published' ? 'público' : 'en borradores'}.` });

      fetchArticles(); // Re-fetch articles after status change

    } catch (error) {
      console.error("Error en handleTogglePublishStatus:", error);
      toast({ variant: "destructive", title: "Error al actualizar estado", description: "No se pudo cambiar el estado del artículo." });
    }
  };


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
          {publishedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ">
              {publishedArticles.map((article, index) => (
                <div key={article.id || article.slug} className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${300 + index * 100}ms` }}>
                  <ArticleCard
                    article={article}
                    isAdmin={isAdmin}
                    onEdit={() => handleOpenArticleForm(article)}
                    onDelete={() => handleDeleteConfirmation(article)}
                    onTogglePublish={() => handleTogglePublishStatus(article)}
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
