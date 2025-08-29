'use client';
import { useState } from 'react';
import type { Transaction, Player, DiceRoll } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from './ui/scroll-area';

interface StatsTabProps {
  initialTransactions: Transaction[];
  players: Player[];
  initialDiceRolls: DiceRoll[];
  gameId: string;
}

export function StatsTab({ initialTransactions, players, initialDiceRolls }: StatsTabProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  
  const totalMoneySpent = initialTransactions.reduce((sum, t) => sum + t.amount, 0);
  const numberOfRounds = players.length > 0 ? Math.floor(initialDiceRolls.length / players.length) : 0;
  
  const filteredTransactions = (selectedPlayerId === 'all'
    ? initialTransactions
    : initialTransactions.filter(t => t.fromPlayerId === selectedPlayerId || t.toPlayerId === selectedPlayerId)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getPlayerName = (id: string | 'bank') => {
    if (id === 'bank') return 'Bank';
    return players.find(p => p.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-headline">Total Rounds</CardTitle>
            <CardDescription>Based on total dice rolls per player.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{numberOfRounds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-headline">Total Money Exchanged</CardTitle>
            <CardDescription>Sum of all transactions in the game.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">${totalMoneySpent.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

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
          <ScrollArea className="h-[300px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Time</TableHead>
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
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No transactions to display.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
