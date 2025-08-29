'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Player, GameSettings, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Landmark, ArrowUpCircle, Pencil, Banknote, PiggyBank, University, HandCoins } from 'lucide-react';
import { passGo } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { EditPlayerModal } from './EditPlayerModal';
import { MassPaymentModal } from './MassPaymentModal';
import { playPassGoSound } from '@/lib/sounds';
import { MultiStepPaymentModal } from './MultiStepPaymentModal';

interface BankTabProps {
  initialPlayers: Player[];
  initialSettings: GameSettings;
  gameId: string;
  initialTransactions: Transaction[];
}

export function BankTab({ initialPlayers, initialSettings, gameId, initialTransactions }: BankTabProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editPlayerModalOpen, setEditPlayerModalOpen] = useState(false);
  const [massPaymentModalOpen, setMassPaymentModalOpen] = useState(false);
  const [massPaymentType, setMassPaymentType] = useState<'give' | 'take'>('give');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setPlayers(initialPlayers);
    setTransactions(initialTransactions);
    setSettings(initialSettings);
  }, [initialPlayers, initialTransactions, initialSettings]);
  
  const refreshData = async () => {
    router.refresh();
  };

  const bankBalance = useMemo(() => {
    const income = transactions
      .filter(t => t.toPlayerId === 'bank')
      .reduce((sum, t) => sum + t.amount, 0);
    const outcome = transactions
      .filter(t => t.fromPlayerId === 'bank')
      .reduce((sum, t) => sum + t.amount, 0);
    return income - outcome;
  }, [transactions]);

  const handlePassGo = async (player: Player) => {
    try {
      await passGo(player.id, gameId);
      if (settings.soundsEnabled) {
        playPassGoSound();
      }
      await refreshData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
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
    refreshData();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Player & Bank Balances</CardTitle>
        <CardDescription>Manage player funds and bank transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          
          {/* Bank Card */}
          <div className="p-4 border rounded-lg shadow-sm flex justify-between items-center bg-secondary/30">
            <div>
              <p className="font-bold text-lg text-primary flex items-center gap-2"><University /> The Bank</p>
              <p className="text-2xl font-mono">${bankBalance.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Player Cards */}
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
                  <DropdownMenuItem onSelect={() => handlePassGo(player)}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    <span>Pass GO (${settings.passGoAmount})</span>
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
        
        <MultiStepPaymentModal
            isOpen={paymentModalOpen}
            setIsOpen={setPaymentModalOpen}
            allPlayers={players}
            gameId={gameId}
            onPaymentSuccess={handleSuccess}
            settings={settings}
        />
       
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
            settings={settings}
          />
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2 pt-6">
         <Button onClick={() => setPaymentModalOpen(true)}>
            <HandCoins className="mr-2"/> Make a Payment
        </Button>
        <Button variant="outline" onClick={() => handleOpenMassPaymentModal('give')}>
            <PiggyBank className="mr-2"/> Give To All Players...
        </Button>
        <Button variant="outline" onClick={() => handleOpenMassPaymentModal('take')}>
            <Banknote className="mr-2"/> Take From All Players...
        </Button>
      </CardFooter>
    </Card>
  );
}
