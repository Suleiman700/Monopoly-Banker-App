import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTab } from '@/components/BankTab';
import { DiceTab } from '@/components/DiceTab';
import { StatsTab } from '@/components/StatsTab';
import { RulesAdvisorTab } from '@/components/RulesAdvisorTab';
import { OptionsTab } from '@/components/OptionsTab';
import { getGameById } from '@/lib/db';
import { Banknote, Dices, BarChart3, HelpCircle, Settings, ArrowRightLeft } from 'lucide-react';
import type { ThemeColors } from '@/lib/types';
import { TradeTab } from '@/components/TradeTab';

interface GamePageProps {
  params: { id: string };
}

const defaultTheme: ThemeColors = {
  primary: "180 100% 25%",
  accent: "204 70% 67%",
  background: "180 60% 96%",
};


export default async function GamePage({ params }: GamePageProps) {
  const gameId = params.id;
  const game = await getGameById(gameId);
  
  if (!game) {
    notFound();
  }

  // These are passed as initial data to client components
  const { players, transactions, diceRolls, settings } = game;
  const theme = settings?.theme || defaultTheme;

  const themeStyle = `
    :root {
      --primary: ${theme.primary};
      --accent: ${theme.accent};
      --background: ${theme.background};
    }
  `;

  return (
    <>
      <style>{themeStyle}</style>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Game In Progress</h1>
              <p className="text-muted-foreground font-code text-sm">ID: {game.id}</p>
          </div>
          <Tabs defaultValue="bank" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
              <TabsTrigger value="bank" className="py-2"><Banknote className="mr-2 h-5 w-5" />Bank</TabsTrigger>
              <TabsTrigger value="trade" className="py-2"><ArrowRightLeft className="mr-2 h-5 w-5" />Trade</TabsTrigger>
              <TabsTrigger value="dice" className="py-2"><Dices className="mr-2 h-5 w-5" />Dice</TabsTrigger>
              <TabsTrigger value="stats" className="py-2"><BarChart3 className="mr-2 h-5 w-5" />Stats</TabsTrigger>
              <TabsTrigger value="advisor" className="py-2"><HelpCircle className="mr-2 h-5 w-5" />Rules Advisor</TabsTrigger>
              <TabsTrigger value="options" className="py-2"><Settings className="mr-2 h-5 w-5" />Options</TabsTrigger>
            </TabsList>
            <TabsContent value="bank" className="mt-6">
              <BankTab initialPlayers={players} gameId={gameId} initialSettings={settings} />
            </TabsContent>
            <TabsContent value="trade" className="mt-6">
              <TradeTab gameId={gameId} initialPlayers={players} settings={settings} />
            </TabsContent>
            <TabsContent value="dice" className="mt-6">
              <DiceTab gameId={gameId} settings={settings} />
            </TabsContent>
            <TabsContent value="stats" className="mt-6">
              <StatsTab initialTransactions={transactions} players={players} initialDiceRolls={diceRolls} gameId={gameId} />
            </TabsContent>
            <TabsContent value="advisor" className="mt-6">
              <RulesAdvisorTab />
            </TabsContent>
            <TabsContent value="options" className="mt-6">
              <OptionsTab gameId={gameId} initialSettings={settings} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
