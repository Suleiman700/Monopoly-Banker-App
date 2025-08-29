'use client';
import { useState } from 'react';
import type { Player } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Landmark, ArrowUpCircle, Pencil, ArrowDownCircle, Banknotes, PiggyBank } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { passGo, getPlayersByGameId } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { EditPlayerModal } from './EditPlayerModal';
import { MassPaymentModal } from './MassPaymentModal';

interface BankTabProps {
  initialPlayers: Player[];
  gameId: string;
}

export function BankTab({ initialPlayers, gameId }: BankTabProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editPlayerModalOpen, setEditPlayerModalOpen] = useState(false);
  const [massPaymentModalOpen, setMassPaymentModalOpen] = useState(false);
  const [massPaymentType, setMassPaymentType] = useState<'give' | 'take'>('give');
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
  
  const handleOpenEditPlayerModal = (player: Player) => {
    setSelectedPlayer(player);
    setEditPlayerModalOpen(true);
  };

  const handleOpenMassPaymentModal = (type: 'give' | 'take') => {
    setMassPaymentType(type);
    setMassPaymentModalOpen(true);
  }

  const handleSuccess = () => {
    refreshPlayers();
    router.refresh();
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
                   <DropdownMenuItem onSelect={() => handleOpenEditPlayerModal(player)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit Player</span>
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
            onPaymentSuccess={handleSuccess}
          />
        )}
        {selectedPlayer && (
          <EditPlayerModal
            isOpen={editPlayerModalOpen}
            setIsOpen={setEditPlayerModalOpen}
            player={selectedPlayer}
            gameId={gameId}
            onPlayerUpdated={handleSuccess}
          />
        )}
        <MassPaymentModal
            isOpen={massPaymentModalOpen}
            setIsOpen={setMassPaymentModalOpen}
            gameId={gameId}
            onSuccess={handleSuccess}
            type={massPaymentType}
          />
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2 pt-6">
        <Button variant="outline" onClick={() => handleOpenMassPaymentModal('give')}>
            <PiggyBank className="mr-2"/> Give To All Players...
        </Button>
        <Button variant="outline" onClick={() => handleOpenMassPaymentModal('take')}>
            <Banknotes className="mr-2"/> Take From All Players...
        </Button>
      </CardFooter>
    </Card>
  );
}
