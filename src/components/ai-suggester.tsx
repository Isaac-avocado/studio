'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, ListChecks, Loader2, Sparkles } from 'lucide-react';
import { suggestRelevantArticles } from '@/ai/flows/suggest-relevant-articles';
import { commonTrafficInfractions } from '@/lib/articles';
import type { TrafficInfraction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  trafficInfraction: z.string().min(1, 'Por favor, selecciona una infracción.'),
});

type FormValues = z.infer<typeof formSchema>;

export function AiSuggester() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trafficInfraction: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    try {
      const selectedInfraction = commonTrafficInfractions.find(inf => inf.id === values.trafficInfraction);
      if (!selectedInfraction) {
        throw new Error("Infracción no válida seleccionada.");
      }

      const result = await suggestRelevantArticles({ trafficInfraction: selectedInfraction.name });
      setSuggestions(result.articleSuggestions);
      if (result.articleSuggestions.length === 0) {
        toast({
          title: "Sin sugerencias",
          description: "No se encontraron sugerencias de artículos para esta infracción.",
        });
      }
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al obtener sugerencias.';
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

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center ">
        <div className="flex justify-center items-center mb-2 animate-in fade-in-0 zoom-in-95 duration-500 delay-100">
          <BrainCircuit className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-200">Asesor IA de Artículos</CardTitle>
        <CardDescription className="animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-300">
          Selecciona una infracción y nuestra IA te sugerirá artículos relevantes para entender mejor tus obligaciones y regulaciones.
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
                    Tipo de Infracción
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
              Obtener Sugerencias
            </Button>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mt-6 animate-in fade-in-0 duration-500">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions.length > 0 && (
          <div className="mt-8 animate-in fade-in-0 duration-500">
            <h3 className="text-lg font-semibold mb-3 text-primary">Artículos Sugeridos:</h3>
            <ul className="list-disc list-inside space-y-2 bg-secondary/50 p-4 rounded-md border">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-secondary-foreground">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
         { !isLoading && suggestions.length === 0 && form.formState.isSubmitted && !error && (
           <p className="mt-6 text-sm text-muted-foreground text-center animate-in fade-in-0 duration-500">No se encontraron sugerencias específicas para esta infracción en este momento.</p>
         )}
      </CardContent>
    </Card>
  );
}
