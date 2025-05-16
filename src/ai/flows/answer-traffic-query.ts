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
    .describe('Concise advice or information based on the user\'s query, relevant to Mexican traffic law, in Spanish.'),
});
export type AnswerTrafficQueryOutput = z.infer<typeof AnswerTrafficQueryOutputSchema>;

export async function answerTrafficQuery(input: AnswerTrafficQueryInput): Promise<AnswerTrafficQueryOutput> {
  return answerTrafficQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerTrafficQueryPrompt',
  input: {schema: AnswerTrafficQueryInputSchema},
  output: {schema: AnswerTrafficQueryOutputSchema},
  prompt: `Eres un útil asistente legal de IA especializado en leyes y procedimientos de tránsito mexicanos.
El usuario está pidiendo consejo o información sobre una situación relacionada con el tránsito en México.
Por favor, proporciona una respuesta concisa, útil e informativa basada en su consulta, EN ESPAÑOL.
Concéntrate en proporcionar orientación e información general. NO des consejos legales definitivos que deban provenir de un abogado humano calificado.
Si la consulta es sobre una emergencia (por ejemplo, "Tuve un choque"), prioriza los pasos de seguridad y qué hacer de inmediato.
Si la consulta es sobre interacciones con las autoridades (por ejemplo, "Me detuvieron"), explica los derechos y los procedimientos esperados con calma.
Basa tus respuestas en el conocimiento común de las regulaciones de tránsito mexicanas.

User's Query: {{{userQuery}}}

Tu consejo (en español):
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
