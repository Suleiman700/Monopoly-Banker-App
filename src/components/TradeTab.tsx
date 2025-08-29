'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRightLeft, User, Banknote } from 'lucide-react';
import { executeTrade } from '@/lib/db';
import type { Player, GameSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { playPaymentSound } from '@/lib/sounds';

interface TradeTabProps {
  initialPlayers: Player[];
  gameId: string;
  settings: GameSettings;
}

const formSchema = z.object({
  player1Id: z.string().min(1, "Please select Player 1."),
  player2Id: z.string().min(1, "Please select Player 2."),
  player1Amount: z.coerce.number().min(0, "Amount must be zero or more."),
  player2Amount: z.coerce.number().min(0, "Amount must be zero or more."),
  reason: z.string().min(1, "A reason for the trade is required."),
}).refine(data => data.player1Id !== data.player2Id, {
  message: "Players cannot trade with themselves.",
  path: ["player2Id"],
});


export function TradeTab({ initialPlayers, gameId, settings }: TradeTabProps) {
  const [players, setPlayers] = useState(initialPlayers);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player1Id: undefined,
      player2Id: undefined,
      player1Amount: 0,
      player2Amount: 0,
      reason: ''
    }
  });

  const { watch, formState: { isSubmitting } } = form;
  const player1Id = watch('player1Id');
  const player2Id = watch('player2Id');
  const player1Amount = watch('player1Amount');
  const player2Amount = watch('player2Amount');
  
  const player1 = useMemo(() => players.find(p => p.id === player1Id), [players, player1Id]);
  const player2 = useMemo(() => players.find(p => p.id === player2Id), [players, player2Id]);

  const player1NewBalance = useMemo(() => {
    if (!player1) return null;
    return player1.balance - Number(player1Amount) + Number(player2Amount);
  }, [player1, player1Amount, player2Amount]);

  const player2NewBalance = useMemo(() => {
    if (!player2) return null;
    return player2.balance - Number(player2Amount) + Number(player1Amount);
  }, [player2, player1Amount, player2Amount]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await executeTrade({ gameId, ...values });
      if (settings.soundsEnabled) {
        playPaymentSound();
      }
      form.reset();
      router.refresh();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Trade Failed',
        description: (error as Error).message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Player-to-Player Trade</CardTitle>
        <CardDescription>Exchange cash between two players. Other assets must be traded manually.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Player 1 Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg text-primary flex items-center gap-2"><User /> Player 1</h3>
                 <FormField
                    control={form.control}
                    name="player1Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Player</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a player..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {player1 && (
                     <div className="text-sm space-y-1">
                        <FormField
                          control={form.control}
                          name="player1Amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount to Give</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <p>
                          Balance:&nbsp;
                          <span className="font-mono text-muted-foreground">${player1.balance.toLocaleString()}</span>
                          <span className="font-bold"> &rarr; </span>
                          <span className="font-mono font-bold text-primary">${player1NewBalance?.toLocaleString()}</span>
                        </p>
                    </div>
                  )}
              </div>

              {/* Player 2 Section */}
               <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg text-primary flex items-center gap-2"><User /> Player 2</h3>
                 <FormField
                    control={form.control}
                    name="player2Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Player</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a player..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {player2 && (
                     <div className="text-sm space-y-1">
                        <FormField
                          control={form.control}
                          name="player2Amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount to Give</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <p>
                          Balance:&nbsp;
                          <span className="font-mono text-muted-foreground">${player2.balance.toLocaleString()}</span>
                           <span className="font-bold"> &rarr; </span>
                          <span className="font-mono font-bold text-primary">${player2NewBalance?.toLocaleString()}</span>
                        </p>
                    </div>
                  )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Trade</FormLabel>
                   <FormControl>
                    <Input placeholder="e.g., Cash for property deal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Executing Trade...' : 'Execute Trade'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
