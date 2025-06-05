
// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getPublishedArticles, getDraftArticles, getCategories } from '@/lib/articles'; // Actualizado
import { ArticleCard } from '@/components/article-card';
import { AiSuggester } from '@/components/ai-suggester';
import { Newspaper, Lightbulb, PlusCircle, Archive, Edit, Send, Trash2, ShieldAlert } from 'lucide-react';
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


// Mock/Placeholder functions for Firestore operations
// En una implementación real, estas interactuarían con Firestore
const saveArticleToFirestore = async (articleData: any, status: 'draft' | 'published', existingArticleId?: string): Promise<Article> => {
  console.log(`Simulando ${existingArticleId ? 'actualización' : 'guardado'} de artículo ${status}:`, articleData);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de red
  
  // Esto es solo una simulación. Necesitarías una lógica real aquí.
  const newId = existingArticleId || Date.now().toString();
  const slug = articleData.title.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
  
  const newArticle: Article = {
    id: newId,
    slug: slug,
    title: articleData.title,
    shortDescription: articleData.shortDescription,
    category: getCategories().find(c => c.id === articleData.category)?.name || articleData.category,
    imageUrl: articleData.imageUrl || (articleData.imageFile ? 'https://placehold.co/600x400.png?text=Subida' : 'https://placehold.co/600x400.png?text=Sin+Imagen'),
    imageHint: 'custom article',
    content: {
      introduction: articleData.introduction,
      points: articleData.points.split('\n').filter((p:string) => p.trim() !== ''),
      conclusion: articleData.conclusion,
    },
    favoriteCount: 0,
    status: status,
    authorId: auth.currentUser?.uid,
    createdAt: existingArticleId ? (getPublishedArticles().find(a => a.id === existingArticleId)?.createdAt || new Date()) : new Date(),
    updatedAt: new Date(),
  };
  
  // Aquí actualizarías tu estado local o re-fetchearías para ver los cambios.
  // Esta simulación NO actualiza la UI automáticamente.
  return newArticle;
};

const deleteArticleFromFirestore = async (articleId: string) => {
  console.log('Simulando eliminación de artículo:', articleId);
  await new Promise(resolve => setTimeout(resolve, 500));
  // Aquí actualizarías tu estado local o re-fetchearías.
  return true;
};


export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const { toast } = useToast();

  // Estas listas se deberían cargar desde Firestore en una app real
  const [publishedArticles, setPublishedArticles] = useState<Article[]>(getPublishedArticles());
  const [draftArticles, setDraftArticles] = useState<Article[]>(getDraftArticles());
  
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === 'admin@test.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      // Cargar artículos aquí si vinieran de Firestore y dependieran del usuario/admin
      setPublishedArticles(getPublishedArticles());
      setDraftArticles(getDraftArticles());
    });
    return () => unsubscribe();
  }, []);

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
      // Actualizar listas (simulación, en real se re-fetchearía o actualizaría estado)
      // Esta es una forma muy básica de actualizar, puede no ser la ideal para producción.
      if (status === 'published') {
        setPublishedArticles(prev => {
          const existing = prev.find(a => a.id === savedArticle.id);
          if (existing) return prev.map(a => a.id === savedArticle.id ? savedArticle : a);
          return [...prev, savedArticle];
        });
        setDraftArticles(prev => prev.filter(a => a.id !== savedArticle.id));
      } else { // draft
        setDraftArticles(prev => {
          const existing = prev.find(a => a.id === savedArticle.id);
          if (existing) return prev.map(a => a.id === savedArticle.id ? savedArticle : a);
          return [...prev, savedArticle];
        });
         if (editingArticle) { // si estaba editando un publicado y lo guardo como borrador
            setPublishedArticles(prev => prev.filter(a => a.id !== savedArticle.id));
         }
      }

    } catch (error) {
      // El toast de error se maneja en el ArticleFormDialog o aquí si es necesario
      console.error("Error en handleSaveArticle:", error);
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
      toast({ title: "Artículo eliminado", description: `"${articleToDelete.title}" ha sido eliminado.`});
      if (articleToDelete.status === 'published') {
        setPublishedArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
      } else {
        setDraftArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
      }
      setArticleToDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el artículo." });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleTogglePublishStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      // Simula la actualización en backend
      const updatedArticle = await saveArticleToFirestore(
        { // Necesitamos pasar los datos del artículo como si vinieran del formulario
          title: article.title,
          shortDescription: article.shortDescription,
          category: getCategories().find(c => c.name === article.category)?.id || article.category,
          imageUrl: article.imageUrl,
          introduction: article.content.introduction,
          points: article.content.points.join('\n'),
          conclusion: article.content.conclusion,
        },
        newStatus,
        article.id
      );
      
      toast({
        title: `Artículo ${newStatus === 'published' ? 'publicado' : 'movido a borradores'}`,
        description: `"${updatedArticle.title}" ahora está ${newStatus === 'published' ? 'público' : 'en borradores'}.`,
      });

      // Actualizar estado local
      if (newStatus === 'published') {
        setPublishedArticles(prev => [...prev.filter(a=>a.id !== updatedArticle.id), updatedArticle]);
        setDraftArticles(prev => prev.filter(a => a.id !== updatedArticle.id));
      } else { // draft
        setDraftArticles(prev => [...prev.filter(a=>a.id !== updatedArticle.id), updatedArticle]);
        setPublishedArticles(prev => prev.filter(a => a.id !== updatedArticle.id));
      }

    } catch (error) {
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
