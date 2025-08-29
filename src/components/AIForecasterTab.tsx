'use client';
import { useState } from 'react';
import { predictWinner, type PredictWinnerOutput } from '@/ai/flows/predict-winner-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Game } from '@/lib/types';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface AIForecasterTabProps {
  gameData: Game;
  result: PredictWinnerOutput | null;
  setResult: (result: PredictWinnerOutput | null) => void;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

const renderLegend = () => {
    return <p className="text-center text-sm text-muted-foreground mt-2">Win Probability</p>;
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

export function AIForecasterTab({ gameData, result, setResult }: AIForecasterTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (retryCount = 0) => {
    setError(null);
    setIsLoading(true);
    if (retryCount === 0) {
      setResult(null);
    }

    try {
      const { players, transactions, diceRolls } = gameData;
      const response = await predictWinner({ players, transactions, diceRolls });
      setResult(response);
    } catch (e: any) {
       const errorMessage = e.message || 'An unknown error occurred.';
       if (errorMessage.includes('503') && retryCount < MAX_RETRIES) {
         await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
         await handleSubmit(retryCount + 1);
         return; // Exit to avoid setting final error message
       }
      setError('Failed to get prediction. The AI model may be unavailable or the request timed out. Please try again later.');
      console.error(e);
    } finally {
      // Only set loading to false on the final attempt (success or failure)
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  const chartConfig = result?.predictions.reduce((acc, prediction, index) => {
    acc[prediction.playerName] = {
      label: prediction.playerName,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const chartData = result?.predictions.map(p => ({
    name: p.playerName,
    value: Math.round(p.winProbability * 100),
    fill: chartConfig?.[p.playerName].color,
    reasoning: p.reasoning
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Game Forecaster</CardTitle>
        <CardDescription>
          Our AI analyst will predict each player's probability of winning based on the current game state.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
            <Alert variant="destructive" className="mt-2">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <div className="flex justify-center">
            <Button onClick={() => handleSubmit()} disabled={isLoading} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BrainCircuit className="mr-2 h-5 w-5" />}
                {isLoading ? 'Analyzing Game...' : 'Predict Winner'}
            </Button>
        </div>
        
        {isLoading && (
            <div className="flex flex-col items-center justify-center pt-8 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                <p className="mt-4 text-lg">Analyzing game data, please wait...</p>
            </div>
        )}

        {result && chartData && chartConfig && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-6 animate-in fade-in">
             <div className="w-full h-[350px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend content={renderLegend} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
             </div>
             <div className="space-y-4">
                 <h3 className="font-headline text-xl text-primary">AI Analyst Reasoning</h3>
                 {result.predictions.map((p, index) => (
                     <Alert key={p.playerName} className="border-l-4" style={{ borderColor: chartConfig[p.playerName].color }}>
                         <Info className="h-4 w-4"/>
                         <AlertTitle className="font-bold" style={{ color: chartConfig[p.playerName].color }}>{p.playerName}</AlertTitle>
                         <AlertDescription>
                            {p.reasoning}
                         </AlertDescription>
                     </Alert>
                 ))}
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
