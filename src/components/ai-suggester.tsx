// src/components/ai-suggester.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BrainCircuit, ListChecks, Loader2, Sparkles, Search as SearchIcon } from 'lucide-react';
import { suggestRelevantArticles } from '@/ai/flows/suggest-relevant-articles';
import { commonTrafficInfractions, getAllArticles } from '@/lib/articles';
import type { TrafficInfraction, Article } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { ArticleCard } from '@/components/article-card';

const formSchema = z.object({
  trafficInfraction: z.string().min(1, 'Por favor, selecciona una infracción.'),
});

type FormValues = z.infer<typeof formSchema>;

export function AiSuggester() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchResults, setLocalSearchResults] = useState<Article[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trafficInfraction: '',
    },
  });

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setLocalSearchResults([]);
      return;
    }

    const allArticles = getAllArticles();
    const query = searchQuery.toLowerCase();
    const results = allArticles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.shortDescription.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.content.introduction.toLowerCase().includes(query) ||
      article.content.points.some(point => point.toLowerCase().includes(query)) ||
      (article.content.conclusion && article.content.conclusion.toLowerCase().includes(query))
    );
    setLocalSearchResults(results);
  }, [searchQuery]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setSuggestions([]);
    setError(null);
    setSearchQuery(''); // Clear local search when submitting for AI suggestions
    setLocalSearchResults([]);

    try {
      const selectedInfraction = commonTrafficInfractions.find(inf => inf.id === values.trafficInfraction);
      if (!selectedInfraction) {
        throw new Error("Infracción no válida seleccionada.");
      }

      const result = await suggestRelevantArticles({ trafficInfraction: selectedInfraction.name });
      setSuggestions(result.articleSuggestions);
      if (result.articleSuggestions.length === 0) {
        toast({
          title: "Sin sugerencias de IA",
          description: "No se encontraron sugerencias de artículos para esta infracción.",
        });
      }
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al obtener sugerencias de IA.';
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
    // Clear AI-related states if user starts typing in local search
    if (suggestions.length > 0) setSuggestions([]);
    if (error) setError(null);
    if (form.formState.isSubmitted) form.reset(); // Reset AI form state
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center ">
        <div className="flex justify-center items-center mb-2 animate-in fade-in-0 zoom-in-95 duration-500 delay-100">
          <BrainCircuit className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-200">Asesoría de Artículos</CardTitle>
        <CardDescription className="animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-300">
          Selecciona una infracción para recibir sugerencias de nuestra IA o usa la búsqueda local.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400">
            <FormField
              control={form.control}
              name="trafficInfraction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Sugerencias por IA: Tipo de Infracción
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una infracción..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonTrafficInfractions.map((infraction: TrafficInfraction) => (
                        <SelectItem key={infraction.id} value={infraction.id}>
                          {infraction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Obtener Sugerencias de IA
            </Button>
          </form>
        </Form>

        {/* Display AI Error (only if not local searching) */}
        {error && !searchQuery && (
          <Alert variant="destructive" className="mt-6 animate-in fade-in-0 duration-500">
            <AlertTitle>Error de IA</AlertTitle>
            <AlertDescription>{error} Puede intentar una búsqueda local a continuación.</AlertDescription>
          </Alert>
        )}

        {/* Display AI Suggestions (only if not local searching) */}
        {suggestions.length > 0 && !searchQuery && (
          <div className="mt-8 animate-in fade-in-0 duration-500">
            <h3 className="text-lg font-semibold mb-3 text-primary">Sugerencias de la IA:</h3>
            <ul className="list-disc list-inside space-y-2 bg-secondary/50 p-4 rounded-md border">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-secondary-foreground">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Message if AI submitted but no suggestions and not local searching */}
         { !isLoading && suggestions.length === 0 && form.formState.isSubmitted && !error && !searchQuery && (
           <p className="mt-6 text-sm text-muted-foreground text-center animate-in fade-in-0 duration-500">La IA no encontró sugerencias. Pruebe la búsqueda local.</p>
         )}

        <Separator className="my-8" />

        {/* Local Search Section */}
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-200"> {/* Adjusted delay */}
          <h3 className="text-xl font-semibold text-center text-primary flex items-center justify-center gap-2">
            <SearchIcon className="h-6 w-6" />
            Búsqueda Local de Artículos
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Encuentre artículos por palabra clave. Funciona incluso sin conexión a internet.
          </p>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar (ej: velocidad, estacionamiento)..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="pl-10"
              aria-label="Buscar artículos localmente"
            />
          </div>
        </div>
        
        {/* Display Local Search Results */}
        {searchQuery && localSearchResults.length > 0 && (
          <div className="mt-8 animate-in fade-in-0 duration-500">
            <h3 className="text-lg font-semibold mb-3 text-primary">Resultados de Búsqueda Local:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localSearchResults.map(article => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* Message if local search active but no results */}
        {searchQuery && localSearchResults.length === 0 && !isLoading && (
          <p className="mt-6 text-sm text-muted-foreground text-center animate-in fade-in-0 duration-500">
            No se encontraron artículos locales para "{searchQuery}".
          </p>
        )}
      </CardContent>
    </Card>
  );
}
