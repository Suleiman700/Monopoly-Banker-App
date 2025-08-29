'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction, Player, DiceRoll, Game } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Undo, Loader2 } from 'lucide-react';
import { undoTransaction } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface StatsTabProps {
  initialTransactions: Transaction[];
  players: Player[];
  initialDiceRolls: DiceRoll[];
  gameId: string;
}

export function StatsTab({ initialTransactions, players, initialDiceRolls, gameId }: StatsTabProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [diceRolls, setDiceRolls] = useState(initialDiceRolls);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [undoingTransactionId, setUndoingTransactionId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    setDiceRolls(initialDiceRolls);
  }, [initialDiceRolls]);

  const chartConfig = useMemo(() => {
    const config = {
      income: { label: 'Income', color: 'hsl(var(--chart-2))' },
      outcome: { label: 'Outcome', color: 'hsl(var(--chart-1))' },
      rolls: { label: 'Rolls', color: 'hsl(var(--chart-3))' },
    };
    players.forEach((player, index) => {
        const chartNum = (index % 5) + 1;
        config[player.id] = { label: player.name, color: `hsl(var(--chart-${chartNum}))`};
    });
    return config;
  }, [players]);

  const filteredData = useMemo(() => {
    const isPlayerSpecific = selectedPlayerId !== 'all';
    
    const filteredTransactions = isPlayerSpecific
      ? transactions.filter(t => t.fromPlayerId === selectedPlayerId || t.toPlayerId === selectedPlayerId)
      : transactions;

    const passGoCount = transactions.filter(t => t.reason.toLowerCase().includes('go')).length;
    const jailCount = transactions.filter(t => t.reason.toLowerCase().includes('jail')).length;

    const incomeOutcome = players.map(p => {
        const income = transactions
            .filter(t => t.toPlayerId === p.id)
            .reduce((sum, t) => sum + t.amount, 0);
        const outcome = transactions
            .filter(t => t.fromPlayerId === p.id)
            .reduce((sum, t) => sum + t.amount, 0);
        return { name: p.name, income, outcome };
    });

    const startingBalance = players[0]?.balance ? (transactions.length > 0 ? players[0].balance + incomeOutcome.reduce((acc, p) => acc + p.outcome, 0) - incomeOutcome.reduce((acc, p) => acc + p.income, 0) : players[0].balance) : 1500;
    
    const balanceHistory = (() => {
        const history: any[] = [{ transactionIndex: 0 }];
        players.forEach(p => history[0][p.id] = startingBalance);

        transactions
            .slice()
            .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .forEach((t, index) => {
                const prev = { ...history[history.length - 1] };
                
                if (t.fromPlayerId !== 'bank') {
                    prev[t.fromPlayerId] -= t.amount;
                }
                if (t.toPlayerId !== 'bank') {
                    prev[t.toPlayerId] += t.amount;
                }

                prev.transactionIndex = index + 1;
                history.push(prev);
            });
        return history;
    })();
    
    const diceRollFrequency = (() => {
        const counts = new Map<number, number>();
        for (let i = 2; i <= 12; i++) {
            counts.set(i, 0);
        }
        diceRolls.forEach(roll => {
            counts.set(roll.total, (counts.get(roll.total) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([total, count]) => ({ name: total.toString(), rolls: count }));
    })();

    return {
        passGoCount,
        jailCount,
        incomeOutcome,
        balanceHistory,
        diceRollFrequency,
        filteredTransactions: filteredTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        totalMoneySpent: transactions.reduce((sum, t) => sum + t.amount, 0),
        numberOfRounds: players.length > 0 ? Math.floor(diceRolls.length / players.length) : 0,
    };
  }, [selectedPlayerId, transactions, diceRolls, players]);

  
  const getPlayerName = (id: string | 'bank') => {
    if (id === 'bank') return 'Bank';
    return players.find(p => p.id === id)?.name || 'Unknown';
  };

  const handleUndo = async (transactionId: string) => {
    setUndoingTransactionId(transactionId);
    try {
      await undoTransaction(gameId, transactionId);
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Undo Failed',
        description: (error as Error).message
      });
    } finally {
      setUndoingTransactionId(null);
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-headline">Total Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{filteredData.numberOfRounds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-headline">Money Exchanged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">${filteredData.totalMoneySpent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-headline">"Pass Go" Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{filteredData.passGoCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-headline">Jail Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{filteredData.jailCount}</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 lg:grid-cols-3">
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Player Balances Over Time</CardTitle>
            <CardDescription>How player wealth has changed during the game.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer>
                <LineChart data={filteredData.balanceHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="transactionIndex" label={{ value: 'Transactions', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  {players.map(p => (
                    (selectedPlayerId === 'all' || selectedPlayerId === p.id) &&
                      <Line key={p.id} type="monotone" dataKey={p.id} stroke={chartConfig[p.id]?.color} name={p.name} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle className="font-headline">Dice Roll Frequency</CardTitle>
            <CardDescription>How many times each total has been rolled.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
               <ResponsiveContainer>
                  <BarChart data={filteredData.diceRollFrequency} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Legend content={<ChartLegendContent />} />
                      <Bar dataKey="rolls" fill={chartConfig.rolls.color} radius={4} />
                  </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
       </div>
       
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Income vs. Outcome</CardTitle>
            <CardDescription>Total money received vs. money spent by each player.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer>
                <BarChart data={filteredData.incomeOutcome} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="income" fill={chartConfig.income.color} radius={4} />
                    <Bar dataKey="outcome" fill={chartConfig.outcome.color} radius={4} />
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Transaction History</CardTitle>
            <CardDescription>A log of all payments made.</CardDescription>
          </div>
          <Select onValueChange={setSelectedPlayerId} defaultValue="all">
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              {players.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.filteredTransactions.length > 0 ? filteredData.filteredTransactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{getPlayerName(t.fromPlayerId)}</TableCell>
                    <TableCell className="font-medium">{getPlayerName(t.toPlayerId)}</TableCell>
                    <TableCell className="text-right">${t.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{t.reason}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{new Date(t.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUndo(t.id)}
                        disabled={undoingTransactionId === t.id}
                      >
                        {undoingTransactionId === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Undo className="h-4 w-4" />
                        )}
                        <span className="sr-only">Undo</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No transactions to display.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
