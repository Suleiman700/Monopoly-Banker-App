'use client';
import { useState, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Landmark, ArrowUpCircle } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { passGo, getPlayersByGameId } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface BankTabProps {
  initialPlayers: Player[];
  gameId: string;
}

export function BankTab({ initialPlayers, gameId }: BankTabProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const refreshPlayers = async () => {
    const updatedPlayers = await getPlayersByGameId(gameId);
    setPlayers(updatedPlayers);
  };

  const handlePassGo = async (player: Player) => {
    try {
      await passGo(player.id, gameId);
      await refreshPlayers();
      router.refresh();
      toast({
        title: "Passed GO!",
        description: `${player.name} collected $200.`,
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  const handleOpenPaymentModal = (player: Player) => {
    setSelectedPlayer(player);
    setPaymentModalOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    refreshPlayers();
    router.refresh(); // Triggers a soft refresh to update other tabs like Stats
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Player Balances</CardTitle>
        <CardDescription>Manage player funds and transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map(player => (
            <div key={player.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center bg-card">
              <div>
                <p className="font-bold text-lg text-primary">{player.name}</p>
                <p className="text-2xl font-mono">${player.balance.toLocaleString()}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Player Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleOpenPaymentModal(player)}>
                    <Landmark className="mr-2 h-4 w-4" />
                    <span>Pay...</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handlePassGo(player)}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    <span>Pass GO ($200)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        {selectedPlayer && (
          <PaymentModal
            isOpen={paymentModalOpen}
            setIsOpen={setPaymentModalOpen}
            fromPlayer={selectedPlayer}
            allPlayers={players}
            gameId={gameId}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </CardContent>
    </Card>
  );
}
