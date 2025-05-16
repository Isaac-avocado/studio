// src/ai/flows/answer-traffic-query.ts
'use server';
/**
 * @fileOverview An AI agent that provides advice on Mexican traffic law queries.
 *
 * - answerTrafficQuery - A function that answers user queries about traffic situations.
 * - AnswerTrafficQueryInput - The input type for the answerTrafficQuery function.
 * - AnswerTrafficQueryOutput - The return type for the answerTrafficQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerTrafficQueryInputSchema = z.object({
  userQuery: z
    .string()
    .describe('The user\'s question about a traffic situation or Mexican traffic law.'),
});
export type AnswerTrafficQueryInput = z.infer<typeof AnswerTrafficQueryInputSchema>;

const AnswerTrafficQueryOutputSchema = z.object({
  advice: z
    .string()
    .describe('Concise advice or information based on the user\'s query, relevant to Mexican traffic law.'),
});
export type AnswerTrafficQueryOutput = z.infer<typeof AnswerTrafficQueryOutputSchema>;

export async function answerTrafficQuery(input: AnswerTrafficQueryInput): Promise<AnswerTrafficQueryOutput> {
  return answerTrafficQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerTrafficQueryPrompt',
  input: {schema: AnswerTrafficQueryInputSchema},
  output: {schema: AnswerTrafficQueryOutputSchema},
  prompt: `You are a helpful AI legal assistant specializing in Mexican traffic law and procedures.
The user is asking for advice or information about a traffic-related situation in Mexico.
Please provide a concise, helpful, and informative answer based on their query.
Focus on providing general guidance and information. Do NOT give definitive legal advice that should come from a qualified human lawyer.
If the query is about an emergency (e.g., "I had a crash"), prioritize safety steps and what to do immediately.
If the query is about interactions with authorities (e.g., "I got pulled over"), explain rights and expected procedures calmly.
Base your answers on common knowledge of Mexican traffic regulations.

User's Query: {{{userQuery}}}

Your advice:
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE', // Allow potentially sensitive advice for emergencies
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

const answerTrafficQueryFlow = ai.defineFlow(
  {
    name: 'answerTrafficQueryFlow',
    inputSchema: AnswerTrafficQueryInputSchema,
    outputSchema: AnswerTrafficQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);