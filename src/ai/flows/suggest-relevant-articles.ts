// src/ai/flows/suggest-relevant-articles.ts
'use server';
/**
 * @fileOverview An AI agent that suggests relevant articles based on a traffic infraction.
 *
 * - suggestRelevantArticles - A function that suggests relevant articles based on a traffic infraction.
 * - SuggestRelevantArticlesInput - The input type for the suggestRelevantArticles function.
 * - SuggestRelevantArticlesOutput - The return type for the suggestRelevantArticles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantArticlesInputSchema = z.object({
  trafficInfraction: z
    .string()
    .describe('The traffic infraction selected by the user.'),
});
export type SuggestRelevantArticlesInput = z.infer<typeof SuggestRelevantArticlesInputSchema>;

const SuggestRelevantArticlesOutputSchema = z.object({
  articleSuggestions: z
    .array(z.string())
    .describe('A list of relevant articles based on the traffic infraction.'),
});
export type SuggestRelevantArticlesOutput = z.infer<typeof SuggestRelevantArticlesOutputSchema>;

export async function suggestRelevantArticles(input: SuggestRelevantArticlesInput): Promise<SuggestRelevantArticlesOutput> {
  return suggestRelevantArticlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelevantArticlesPrompt',
  input: {schema: SuggestRelevantArticlesInputSchema},
  output: {schema: SuggestRelevantArticlesOutputSchema},
  prompt: `You are a legal assistant specializing in traffic law.

You will receive a traffic infraction and will suggest a list of articles that explain the regulations, obligations, and potential consequences related to the infraction.

Traffic Infraction: {{{trafficInfraction}}}

Suggest articles:
`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestRelevantArticlesFlow = ai.defineFlow(
  {
    name: 'suggestRelevantArticlesFlow',
    inputSchema: SuggestRelevantArticlesInputSchema,
    outputSchema: SuggestRelevantArticlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
