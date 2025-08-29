
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction, Player, DiceRoll, GameSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Undo, Loader2, Repeat, TrendingUp, PiggyBank, Landmark } from 'lucide-react';
import { undoTransaction } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface StatsDashboardProps {
  initialTransactions: Transaction[];
  players: Player[];
  gameId: string;
  initialDiceRolls: DiceRoll[];
  initialSettings: GameSettings;
}

const incomeOutcomeConfig = {
  income: { label: 'Income', color: 'hsl(var(--chart-2))' },
  outcome: { label: 'Outcome', color: 'hsl(var(--chart-1))' },
};

const diceRollConfig = {
  rolls: { label: 'Rolls', color: 'hsl(var(--chart-3))' },
};

export function StatsDashboard({ initialTransactions, players, gameId, initialDiceRolls, initialSettings }: StatsDashboardProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [diceRolls, setDiceRolls] = useState(initialDiceRolls);
  const [settings, setSettings] = useState(initialSettings);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [undoingTransactionId, setUndoingTransactionId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setTransactions(initialTransactions);
    setDiceRolls(initialDiceRolls);
    setSettings(initialSettings);
  }, [initialTransactions, initialDiceRolls, initialSettings]);

  const getPlayerName = (id: string | 'bank') => {
    if (id === 'bank') return 'Bank';
    return players.find(p => p.id === id)?.name || 'Unknown';
  };

  const keyMetrics = useMemo(() => {
    const totalMoneyExchanged = transactions.reduce((sum, t) => sum + t.amount, 0);
    const passGoTransactions = transactions.filter(t => t.reason === 'Passed GO');
    const passGoCount = passGoTransactions.length;
    const passGoAmount = passGoTransactions.reduce((sum, t) => sum + t.amount, 0);

    const jailFeeTransactions = transactions.filter(t => t.reason === 'Jail Fee');
    const jailFeeCount = jailFeeTransactions.length;
    const jailFeeAmount = jailFeeTransactions.reduce((sum, t) => sum + t.amount, 0);

    const totalRounds = diceRolls.length;

    return { totalMoneyExchanged, passGoCount, passGoAmount, jailFeeCount, jailFeeAmount, totalRounds };
  }, [transactions, diceRolls]);

  const playerBalanceTimeline = useMemo(() => {
    const timeline: { transaction: number, [playerName: string]: number }[] = [];
    const playerBalances: { [playerId: string]: number } = {};
    const playerColors: { [playerName: string]: string } = {};
    const chartPlayerConfig: any = {};

    players.forEach((p, i) => {
      playerBalances[p.id] = settings.startingBalance;
      const color = `hsl(var(--chart-${(i % 5) + 1}))`;
      playerColors[p.name] = color;
      chartPlayerConfig[p.name] = { label: p.name, color };
    });
  
    const initialBalances = players.reduce((acc, p) => ({ ...acc, [p.name]: playerBalances[p.id] }), {});
    timeline.push({
      transaction: 0,
      ...initialBalances
    });
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedTransactions.forEach((t, i) => {
        if (t.fromPlayerId !== 'bank') {
            playerBalances[t.fromPlayerId] -= t.amount;
        }
        if (t.toPlayerId !== 'bank') {
            playerBalances[t.toPlayerId] += t.amount;
        }

        const currentBalances = players.reduce((acc, p) => ({ ...acc, [p.name]: playerBalances[p.id] }), {});
        timeline.push({
            transaction: i + 1,
            ...currentBalances
        });
    });

    return { data: timeline, config: chartPlayerConfig, colors: playerColors };
  }, [players, transactions, settings.startingBalance]);

  const incomeOutcomeData = useMemo(() => {
    return players.map(player => {
      const income = transactions
        .filter(t => t.toPlayerId === player.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const outcome = transactions
        .filter(t => t.fromPlayerId === player.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: player.name, income, outcome };
    });
  }, [players, transactions]);

  const diceRollFrequency = useMemo(() => {
    const counts = new Map<number, number>();
    for (let i = 2; i <= 12; i++) {
      counts.set(i, 0);
    }
    diceRolls.forEach(roll => {
      counts.set(roll.total, (counts.get(roll.total) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([total, count]) => ({ name: total.toString(), rolls: count }));
  }, [diceRolls]);

  const filteredTransactions = useMemo(() => {
    const isPlayerSpecific = selectedPlayerId !== 'all';
    const filtered = isPlayerSpecific
      ? transactions.filter(t => t.fromPlayerId === selectedPlayerId || t.toPlayerId === selectedPlayerId)
      : transactions;
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedPlayerId, transactions]);

  const handleUndo = async (transactionId: string) => {
    setUndoingTransactionId(transactionId);
    try {
      await undoTransaction(gameId, transactionId);
      router.refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Undo Failed', description: (error as Error).message });
    } finally {
      setUndoingTransactionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Repeat />Total Rolls</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{keyMetrics.totalRounds}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp />Money Exchanged</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">${keyMetrics.totalMoneyExchanged.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank />"Pass Go" Payments</CardTitle></CardHeader>
           <CardContent>
             <p className="text-3xl font-bold">${keyMetrics.passGoAmount.toLocaleString()}</p>
             <p className="text-sm text-muted-foreground">{keyMetrics.passGoCount} times</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Landmark />Jail Fees Paid</CardTitle></CardHeader>
          <CardContent>
             <p className="text-3xl font-bold">${keyMetrics.jailFeeAmount.toLocaleString()}</p>
             <p className="text-sm text-muted-foreground">{keyMetrics.jailFeeCount} times</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         <Card>
          <CardHeader><CardTitle>Player Balance Timeline</CardTitle><CardDescription>How player wealth has changed over time.</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={playerBalanceTimeline.config} className="h-[300px] w-full">
              <ResponsiveContainer>
                <LineChart data={playerBalanceTimeline.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="transaction" type="number" allowDecimals={false} />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  {players.map(p => <Line key={p.id} type="monotone" dataKey={p.name} stroke={playerBalanceTimeline.colors[p.name]} />)}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Player Income vs. Outcome</CardTitle><CardDescription>Total money received vs. money spent.</CardDescription></CardHeader>
          <CardContent>
             <ChartContainer config={incomeOutcomeConfig} className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={incomeOutcomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                  <Bar dataKey="outcome" fill="var(--color-outcome)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader><CardTitle>Dice Roll Frequency</CardTitle><CardDescription>How many times each total has been rolled.</CardDescription></CardHeader>
        <CardContent>
          <ChartContainer config={diceRollConfig} className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={diceRollFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Legend />
                <Bar dataKey="rolls" fill="var(--color-rolls)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><CardTitle>Transaction History</CardTitle><CardDescription>A log of all payments made.</CardDescription></div>
          <Select onValueChange={setSelectedPlayerId} defaultValue="all">
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by player" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead><TableHead>To</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Reason</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{getPlayerName(t.fromPlayerId)}</TableCell>
                    <TableCell className="font-medium">{getPlayerName(t.toPlayerId)}</TableCell>
                    <TableCell className="text-right">${t.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{t.reason}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{new Date(t.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleUndo(t.id)} disabled={undoingTransactionId === t.id}>
                        {undoingTransactionId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo className="h-4 w-4" />}
                        <span className="sr-only">Undo</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">No transactions to display.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    