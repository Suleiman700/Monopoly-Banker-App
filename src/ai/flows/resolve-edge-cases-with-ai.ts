'use server';
/**
 * @fileOverview An AI agent that resolves ambiguous Monopoly game scenarios according to official rules.
 *
 * - resolveEdgeCase - A function that handles the resolution of edge cases in Monopoly.
 * - ResolveEdgeCaseInput - The input type for the resolveEdgeCase function.
 * - ResolveEdgeCaseOutput - The return type for the resolveEdgeCase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResolveEdgeCaseInputSchema = z.object({
  gameScenario: z
    .string()
    .describe('A description of the ambiguous game scenario in Monopoly.'),
});
export type ResolveEdgeCaseInput = z.infer<typeof ResolveEdgeCaseInputSchema>;

const ResolveEdgeCaseOutputSchema = z.object({
  resolution: z.string().describe('The AI-resolved solution to the game scenario based on Monopoly rules.'),
  reasoning: z.string().describe('The AI reasoning behind the provided resolution, referencing specific Monopoly rules.'),
});
export type ResolveEdgeCaseOutput = z.infer<typeof ResolveEdgeCaseOutputSchema>;

export async function resolveEdgeCase(input: ResolveEdgeCaseInput): Promise<ResolveEdgeCaseOutput> {
  return resolveEdgeCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resolveEdgeCasePrompt',
  input: {schema: ResolveEdgeCaseInputSchema},
  output: {schema: ResolveEdgeCaseOutputSchema},
  prompt: `You are an expert in Monopoly rules and regulations. A player will describe an ambiguous scenario that has occurred during their game. Your job is to provide a resolution to the scenario, according to official Monopoly rules.

Scenario: {{{gameScenario}}}

Provide a clear resolution and explain the reasoning behind it, referencing specific rules where applicable.`,
});

const resolveEdgeCaseFlow = ai.defineFlow(
  {
    name: 'resolveEdgeCaseFlow',
    inputSchema: ResolveEdgeCaseInputSchema,
    outputSchema: ResolveEdgeCaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
