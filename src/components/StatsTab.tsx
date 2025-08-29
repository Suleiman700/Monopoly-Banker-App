'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction, Player } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Undo, Loader2 } from 'lucide-react';
import { undoTransaction } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";

interface StatsTabProps {
  initialTransactions: Transaction[];
  players: Player[];
  gameId: string;
}

export function StatsTab({ initialTransactions, players, gameId }: StatsTabProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [undoingTransactionId, setUndoingTransactionId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const filteredTransactions = useMemo(() => {
    const isPlayerSpecific = selectedPlayerId !== 'all';
    
    const filtered = isPlayerSpecific
      ? transactions.filter(t => t.fromPlayerId === selectedPlayerId || t.toPlayerId === selectedPlayerId)
      : transactions;

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedPlayerId, transactions]);
  
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
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
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
