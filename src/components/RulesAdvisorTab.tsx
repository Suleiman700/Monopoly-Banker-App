'use client';
import { useState } from 'react';
import { resolveEdgeCase, type ResolveEdgeCaseOutput } from '@/ai/flows/resolve-edge-cases-with-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RulesAdvisorTabProps {
    results: ResolveEdgeCaseOutput[];
    setResults: (results: ResolveEdgeCaseOutput[]) => void;
}

export function RulesAdvisorTab({ results, setResults }: RulesAdvisorTabProps) {
  const [scenario, setScenario] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!scenario.trim()) {
      setError('Please describe a scenario.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await resolveEdgeCase({ gameScenario: scenario });
      setResults([response, ...results]);
      setScenario('');
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
          Have a tricky situation? Describe it below (in any language) and our AI expert will provide a ruling based on official Monopoly rules.
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

        {results.length > 0 && (
          <div className="pt-6 space-y-4">
             <h3 className="font-headline text-xl text-primary flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/> AI Rulings</h3>
             <Accordion type="single" collapsible className="w-full">
                {results.map((result, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-headline text-lg hover:no-underline" dir={result.isRtl ? 'rtl' : 'ltr'}>{result.title}</AccordionTrigger>
                        <AccordionContent dir={result.isRtl ? 'rtl' : 'ltr'}>
                           <div className="space-y-4 pt-2">
                              <div>
                                <h4 className="font-semibold text-base">Resolution:</h4>
                                <p className="text-foreground/90">{result.resolution}</p>
                              </div>
                              <div className="pt-2">
                                <h4 className="font-semibold text-base">Reasoning:</h4>
                                <p className="whitespace-pre-wrap text-foreground/90 font-sans">{result.reasoning}</p>
                              </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
