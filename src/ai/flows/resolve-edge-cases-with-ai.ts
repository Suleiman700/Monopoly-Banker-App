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
  title: z.string().describe('A short, catchy title for the ruling, in the same language as the user\'s query.'),
  resolution: z.string().describe('The AI-resolved solution to the game scenario based on Monopoly rules.'),
  reasoning: z.string().describe('The AI reasoning behind the provided resolution, referencing specific Monopoly rules.'),
  isRtl: z.boolean().describe('Set to true if the detected language is written right-to-left (e.g., Arabic, Hebrew).'),
});
export type ResolveEdgeCaseOutput = z.infer<typeof ResolveEdgeCaseOutputSchema>;

export async function resolveEdgeCase(input: ResolveEdgeCaseInput): Promise<ResolveEdgeCaseOutput> {
  return resolveEdgeCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resolveEdgeCasePrompt',
  input: {schema: ResolveEdgeCaseInputSchema},
  output: {schema: ResolveEdgeCaseOutputSchema},
  prompt: `You are an expert in Monopoly rules and regulations. A player will describe an ambiguous scenario that has occurred during their game. 
Your primary task is to detect the language of the user's query and respond entirely in that same language.

Your job is to provide a ruling based on official Monopoly rules. You must generate:
1. A short, catchy title for the ruling.
2. A clear resolution to the scenario.
3. An explanation for the reasoning behind it, referencing specific rules where applicable.
4. A boolean 'isRtl' flag: set this to true if the detected language is one that is written right-to-left (like Arabic or Hebrew), otherwise set it to false.

Scenario: {{{gameScenario}}}

Remember: Your entire output (title, resolution, and reasoning) must be in the same language as the scenario description.`,
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
