'use server';
/**
 * @fileOverview An AI agent that predicts the winner of a Monopoly game based on the current state.
 *
 * - predictWinner - A function that predicts the win probabilities for each player.
 * - PredictWinnerInput - The input type for the predictWinner function.
 * - PredictWinnerOutput - The return type for the predictWinner function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Player, Transaction, DiceRoll } from '@/lib/types';

// Define the Zod schema for a single player's prediction
const PlayerPredictionSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  winProbability: z.number().min(0).max(1).describe('The predicted probability of this player winning the game, between 0 and 1.'),
  reasoning: z.string().describe('A brief explanation for why this probability was assigned, based on game state.')
});

export const PredictWinnerInputSchema = z.object({
  players: z.any().describe('An array of player objects, including their current balance.'),
  transactions: z.any().describe('The history of all transactions in the game.'),
  diceRolls: z.any().describe('The history of all dice rolls in the game.'),
});
export type PredictWinnerInput = z.infer<typeof PredictWinnerInputSchema>;

export const PredictWinnerOutputSchema = z.object({
  predictions: z.array(PlayerPredictionSchema).describe('An array of win probability predictions for each player.'),
});
export type PredictWinnerOutput = z.infer<typeof PredictWinnerOutputSchema>;

export async function predictWinner(input: PredictWinnerInput): Promise<PredictWinnerOutput> {
  return predictWinnerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictWinnerPrompt',
  input: { schema: PredictWinnerInputSchema },
  output: { schema: PredictWinnerOutputSchema },
  prompt: `You are a Monopoly game analyst. Your task is to predict the winner based on the current game state. Analyze the provided data and return a win probability for each player. The sum of all probabilities should equal 1.0.

Consider these factors in your analysis:
- Current cash balance (very important).
- Recent transaction history: Is a player mostly paying out money (rent, taxes) or receiving it?
- Dice roll frequency: High rollers may have a slight advantage.
- Number of players: In a larger game, wealth is spread thinner.

Here is the current game state:
Players and their balances:
{{{json players}}}

Transaction History (a log of all payments):
{{{json transactions}}}

Dice Roll History:
{{{json diceRolls}}}

Based on this data, provide a win probability for each player along with a brief reasoning for your prediction. Ensure the probabilities sum to 1.0.`,
});

const predictWinnerFlow = ai.defineFlow(
  {
    name: 'predictWinnerFlow',
    inputSchema: PredictWinnerInputSchema,
    outputSchema: PredictWinnerOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return an output.');
    }
    
    // Normalize probabilities to ensure they sum to 1.0
    const totalProbability = output.predictions.reduce((sum, p) => sum + p.winProbability, 0);
    if (totalProbability > 0) {
        output.predictions.forEach(p => {
            p.winProbability = p.winProbability / totalProbability;
        });
    }

    return output;
  }
);
