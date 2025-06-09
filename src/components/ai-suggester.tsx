
// src/components/ai-suggester.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea'; // Changed from Select to Textarea
import { Input } from '@/components/ui/input';
import { BrainCircuit, HelpCircle, Loader2, Sparkles, Search as SearchIcon, MessageSquareQuote } from 'lucide-react'; // Changed MessageSquareQuestion to MessageSquareQuote
import { answerTrafficQuery } from '@/ai/flows/answer-traffic-query'; // Updated import
import { getAllArticles } from '@/lib/articles';
import type { Article } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { ArticleCard } from '@/components/article-card';

// Updated form schema for free-form query
const formSchema = z.object({
  userQuery: z.string()
    .min(10, 'Por favor, ingresa tu consulta (mínimo 10 caracteres).')
    .max(300, 'La consulta no puede exceder los 300 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

export function AiSuggester() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null); // Changed from suggestions to aiAdvice
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchResults, setLocalSearchResults] = useState<Article[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userQuery: '',
    },
  });

  useEffect(() => {
    const fetchAndFilterArticles = async () => {
      if (searchQuery.trim() === '') {
        setLocalSearchResults([]);
        return;
      }

      const allArticles = await getAllArticles(); 
      const query = searchQuery.toLowerCase();
      const results = allArticles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.shortDescription.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) || // Search by category
        article.content.introduction.toLowerCase().includes(query) ||
        (article.content.points && Array.isArray(article.content.points) && article.content.points.some(point => point.toLowerCase().includes(query))) ||
        (article.content.conclusion && article.content.conclusion.toLowerCase().includes(query))
      );
      setLocalSearchResults(results); // Corrected this line
    };
    fetchAndFilterArticles(); 
  }, [searchQuery]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setAiAdvice(null);
    setError(null);
    setSearchQuery(''); // Clear local search when AI query is submitted
    setLocalSearchResults([]);

    try {
      const result = await answerTrafficQuery({ userQuery: values.userQuery }); 
      setAiAdvice(result.advice);
      if (!result.advice) {
        toast({
          title: "Sin respuesta de IA",
          description: "La IA no pudo generar una respuesta para esta consulta.",
        });
      }
    } catch (err) {
      console.error('Error getting AI advice:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al obtener asesoría de IA.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (aiAdvice) setAiAdvice(null); // Clear AI advice if user starts a local search
    if (error) setError(null); // Clear AI error
    if (form.formState.isSubmitted) form.reset(); // Reset AI form if user types in search
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center ">
        <div className="flex justify-center items-center mb-2 animate-in fade-in-0 zoom-in-95 duration-500 delay-100">
          <MessageSquareQuote className="w-12 h-12 text-primary" /> 
        </div>
        <CardTitle className="text-2xl animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-200">Asesoría Vial con IA</CardTitle>
        <CardDescription className="animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-300">
          Haz una pregunta sobre una situación de tránsito o ley vial en México. También puedes usar la búsqueda local de artículos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400">
            <FormField
              control={form.control}
              name="userQuery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Tu Consulta para la IA:
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: 'Tuve un choque leve, ¿qué debo hacer?' o 'Me detuvo un oficial, ¿cuáles son mis derechos?'"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe tu situación o pregunta de forma clara y concisa.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Consultar a la IA
            </Button>
          </form>
        </Form>

        {error && !searchQuery && (
          <Alert variant="destructive" className="mt-6 animate-in fade-in-0 duration-500">
            <AlertTitle>Error de IA</AlertTitle>
            <AlertDescription>{error} Puede intentar una búsqueda local de artículos a continuación.</AlertDescription>
          </Alert>
        )}

        {aiAdvice && !searchQuery && (
          <div className="mt-8 animate-in fade-in-0 duration-500">
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Asesoría de la IA:
            </h3>
            <div className="bg-secondary/50 p-4 rounded-md border">
                <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{aiAdvice}</p>
            </div>
          </div>
        )}
         { !isLoading && !aiAdvice && form.formState.isSubmitted && !error && !searchQuery && (
           <p className="mt-6 text-sm text-muted-foreground text-center animate-in fade-in-0 duration-500">La IA no generó una respuesta. Intenta reformular tu pregunta o prueba la búsqueda local.</p>
         )}

        <Separator className="my-8" />

        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-200">
          <h3 className="text-xl font-semibold text-center text-primary flex items-center justify-center gap-2">
            <SearchIcon className="h-6 w-6" />
            Búsqueda Local de Artículos
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Encuentra artículos predefinidos por palabra clave.
          </p>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar (ej: velocidad, estacionamiento, seguridad vial)..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="pl-10"
              aria-label="Buscar artículos localmente"
            />
          </div>
        </div>

        {searchQuery && localSearchResults.length > 0 && (
          <div className="mt-8 animate-in fade-in-0 duration-500">
            <h3 className="text-lg font-semibold mb-3 text-primary">Resultados de Búsqueda Local:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localSearchResults.map(article => (
                <ArticleCard key={article.slug || article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        {searchQuery && localSearchResults.length === 0 && !isLoading && (
          <p className="mt-6 text-sm text-muted-foreground text-center animate-in fade-in-0 duration-500">
            No se encontraron artículos locales para "{searchQuery}".
          </p>
        )}
      </CardContent>
    </Card>
  );
}
