
// src/components/article-form-dialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Article, Category } from '@/types';
import { getCategories } from '@/lib/articles'; // Usaremos las categorías iniciales por ahora
import { Loader2, UploadCloud, XCircle, Save, Send, FileText, Tag, Image as ImageIcon } from 'lucide-react';

// TODO: Adaptar el esquema Zod a la estructura completa de Article si es necesario
const articleFormSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  shortDescription: z.string().min(10, 'La descripción corta debe tener al menos 10 caracteres.'),
  category: z.string().min(1, 'Debes seleccionar una categoría.'),
  imageUrl: z.string().url('Debe ser una URL válida para la imagen.').or(z.literal('')),
  imageFile: z.custom<FileList>().optional(), // Para carga de archivo
  introduction: z.string().min(20, 'La introducción debe tener al menos 20 caracteres.'),
  points: z.string().min(10, 'Debe haber al menos un punto clave. Separa múltiples puntos con un salto de línea.'), // Simplificado a un string
  conclusion: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface ArticleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  article?: Article | null; // Artículo existente para editar
  onSave: (data: ArticleFormValues, status: 'draft' | 'published') => Promise<void>; // Simulación
}

export function ArticleFormDialog({ isOpen, onOpenChange, article, onSave }: ArticleFormDialogProps) {
  const { toast } = useToast();
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isSubmittingPublished, setIsSubmittingPublished] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const categories = getCategories();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      category: '',
      imageUrl: '',
      imageFile: undefined,
      introduction: '',
      points: '',
      conclusion: '',
    },
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        shortDescription: article.shortDescription,
        category: categories.find(c => c.name === article.category)?.id || '',
        imageUrl: article.imageUrl || '',
        introduction: article.content.introduction,
        points: article.content.points.join('\n'),
        conclusion: article.content.conclusion || '',
        imageFile: undefined,
      });
      if (article.imageUrl) {
        setImagePreview(article.imageUrl);
      } else {
        setImagePreview(null);
      }
    } else {
      form.reset(); // Resetea a defaultValues
      setImagePreview(null);
    }
  }, [article, form, isOpen, categories]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: 'destructive', title: 'Archivo muy grande', description: 'La imagen no debe exceder los 5MB.' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Archivo inválido', description: 'Por favor, selecciona un archivo de imagen.'});
        return;
      }
      form.setValue('imageFile', event.target.files);
      form.setValue('imageUrl', ''); // Limpiar URL si se sube archivo
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('imageUrl', event.target.value);
    form.setValue('imageFile', undefined); // Limpiar archivo si se pega URL
    if (event.target.value && form.getFieldState('imageUrl').isDirty && !form.getFieldState('imageUrl').error) {
      setImagePreview(event.target.value);
    } else if (!event.target.value) {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    form.setValue('imageUrl', '');
    form.setValue('imageFile', undefined);
    if (imageFileRef.current) {
      imageFileRef.current.value = '';
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (status === 'draft') setIsSubmittingDraft(true);
    if (status === 'published') setIsSubmittingPublished(true);

    await form.trigger(); // Activar validaciones
    if (!form.formState.isValid) {
       toast({ variant: "destructive", title: "Errores en el formulario", description: "Por favor, corrige los campos marcados."});
       if (status === 'draft') setIsSubmittingDraft(false);
       if (status === 'published') setIsSubmittingPublished(false);
       return;
    }
    
    const values = form.getValues();
     // TODO: Aquí iría la lógica real para subir la imagen a Firebase Storage si values.imageFile existe.
     // Por ahora, si hay imageFile, podríamos necesitar una URL de placeholder o manejarla.
     // Si hay values.imageUrl, se usa esa. Si hay imageFile, idealmente se sube y se obtiene una nueva URL.

    // Simulación de guardado
    try {
        await onSave(values, status); // Esta función se pasará desde el dashboard
        // La función onSave se encargará de mostrar el toast de éxito
        // onOpenChange(false); // Cerrar el diálogo en éxito
    } catch (error) {
        console.error("Error saving article:", error);
        toast({ variant: "destructive", title: "Error al guardar", description: "No se pudo guardar el artículo." });
    } finally {
        if (status === 'draft') setIsSubmittingDraft(false);
        if (status === 'published') setIsSubmittingPublished(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{article ? 'Editar Artículo' : 'Crear Nuevo Artículo'}</DialogTitle>
          <DialogDescription>
            {article ? 'Modifica los detalles de tu artículo.' : 'Completa los campos para agregar un nuevo artículo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
          {/* Image Upload / URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-1"><ImageIcon size={16}/> Imagen del Artículo</Label>
            {imagePreview && (
              <div className="relative group">
                <Image src={imagePreview} alt="Vista previa" width={600} height={400} className="rounded-md object-cover w-full aspect-video" data-ai-hint="article cover" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-70 group-hover:opacity-100" onClick={clearImage} type="button">
                  <XCircle size={18} />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => imageFileRef.current?.click()} className="flex-shrink-0">
                  <UploadCloud size={16} className="mr-2" /> Subir Archivo
                </Button>
                 <span className="text-xs text-muted-foreground">o</span>
                 <Input
                  id="imageUrl"
                  placeholder="Pegar URL de imagen existente"
                  {...form.register('imageUrl')}
                  onChange={handleImageUrlChange}
                  className="flex-grow"
                />
            </div>
             <Input
                id="imageFile"
                type="file"
                ref={imageFileRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
            {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
            {form.formState.errors.imageFile && <p className="text-sm text-destructive">{(form.formState.errors.imageFile as any).message}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-1"><FileText size={16}/> Título</Label>
            <Input id="title" {...form.register('title')} placeholder="Título atractivo del artículo" />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Descripción Corta</Label>
            <Textarea id="shortDescription" {...form.register('shortDescription')} placeholder="Un resumen breve para la tarjeta del artículo (2-3 líneas)." rows={3} />
            {form.formState.errors.shortDescription && <p className="text-sm text-destructive">{form.formState.errors.shortDescription.message}</p>}
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-1"><Tag size={16}/> Categoría</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
          </div>

          {/* Content: Introduction */}
          <div className="space-y-2">
            <Label htmlFor="introduction">Introducción</Label>
            <Textarea id="introduction" {...form.register('introduction')} placeholder="Párrafo introductorio del artículo." rows={5} />
            {form.formState.errors.introduction && <p className="text-sm text-destructive">{form.formState.errors.introduction.message}</p>}
          </div>

          {/* Content: Points */}
          <div className="space-y-2">
            <Label htmlFor="points">Puntos Clave (uno por línea)</Label>
            <Textarea id="points" {...form.register('points')} placeholder=" - Primer punto clave\n - Segundo punto clave" rows={6} />
            {form.formState.errors.points && <p className="text-sm text-destructive">{form.formState.errors.points.message}</p>}
          </div>

          {/* Content: Conclusion */}
          <div className="space-y-2">
            <Label htmlFor="conclusion">Conclusión (opcional)</Label>
            <Textarea id="conclusion" {...form.register('conclusion')} placeholder="Párrafo de cierre del artículo." rows={4} />
            {form.formState.errors.conclusion && <p className="text-sm text-destructive">{form.formState.errors.conclusion.message}</p>}
          </div>
        </div>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmittingDraft || isSubmittingPublished}
          >
            {isSubmittingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Borrador
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={isSubmittingDraft || isSubmittingPublished}
          >
            {isSubmittingPublished ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {article?.status === 'published' ? 'Actualizar Publicado' : 'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
