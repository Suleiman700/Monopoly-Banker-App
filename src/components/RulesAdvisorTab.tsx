'use client';
import { useState } from 'react';
import { resolveEdgeCase, type ResolveEdgeCaseOutput } from '@/ai/flows/resolve-edge-cases-with-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RulesAdvisorTab() {
  const [scenario, setScenario] = useState('');
  const [result, setResult] = useState<ResolveEdgeCaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!scenario.trim()) {
      setError('Please describe a scenario.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await resolveEdgeCase({ gameScenario: scenario });
      setResult(response);
    } catch (e) {
      setError('Failed to get advice. The AI may be unavailable. Please try again later.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Game Rules Advisor</CardTitle>
        <CardDescription>
          Have a tricky situation? Describe it below and our AI expert will provide a ruling based on official Monopoly rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Textarea
              placeholder="e.g., What happens if I roll doubles three times in a row?"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={4}
              disabled={isLoading}
              className="font-code"
            />
            {error && <Alert variant="destructive" className="mt-2"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
        <Button onClick={handleSubmit} disabled={isLoading || !scenario.trim()}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Get Advice
        </Button>

        {result && (
          <Card className="bg-secondary/50 mt-6 animate-in fade-in">
            <CardHeader>
              <CardTitle className="font-headline text-primary">AI Ruling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Resolution:</h3>
                <p className="text-foreground/90">{result.resolution}</p>
              </div>
              <div className="pt-2">
                <h3 className="font-semibold text-lg">Reasoning:</h3>
                <p className="whitespace-pre-wrap text-foreground/90 font-sans">{result.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
