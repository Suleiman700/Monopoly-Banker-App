'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTab } from '@/components/BankTab';
import { DiceTab } from '@/components/DiceTab';
import { RulesAdvisorTab } from '@/components/RulesAdvisorTab';
import { OptionsTab } from '@/components/OptionsTab';
import { Banknote, Dices, LayoutDashboard, HelpCircle, Settings, ArrowRightLeft, BrainCircuit } from 'lucide-react';
import { TradeTab } from '@/components/TradeTab';
import { StatsDashboard } from '@/components/StatsDashboard';
import { AIForecasterTab } from '@/components/AIForecasterTab';
import type { Game } from '@/lib/types';
import type { PredictWinnerOutput } from '@/ai/flows/predict-winner-flow';

interface GameTabsProps {
  game: Game;
}

export function GameTabs({ game }: GameTabsProps) {
  const { players, transactions, diceRolls, settings, id: gameId } = game;
  const [predictionResult, setPredictionResult] = useState<PredictWinnerOutput | null>(null);

  return (
    <Tabs defaultValue="bank" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 h-auto">
            <TabsTrigger value="bank" className="py-2"><Banknote className="mr-2 h-5 w-5" />Bank</TabsTrigger>
            <TabsTrigger value="trade" className="py-2"><ArrowRightLeft className="mr-2 h-5 w-5" />Trade</TabsTrigger>
            <TabsTrigger value="dice" className="py-2"><Dices className="mr-2 h-5 w-5" />Dice</TabsTrigger>
            <TabsTrigger value="stats" className="py-2"><LayoutDashboard className="mr-2 h-5 w-5" />Stats</TabsTrigger>
            <TabsTrigger value="advisor" className="py-2"><HelpCircle className="mr-2 h-5 w-5" />Rules Advisor</TabsTrigger>
            <TabsTrigger value="forecaster" className="py-2"><BrainCircuit className="mr-2 h-5 w-5" />AI</TabsTrigger>
            <TabsTrigger value="options" className="py-2"><Settings className="mr-2 h-5 w-5" />Options</TabsTrigger>
        </TabsList>
        <TabsContent value="bank" className="mt-6">
            <BankTab initialPlayers={players} gameId={gameId} initialSettings={settings} initialTransactions={transactions} />
        </TabsContent>
        <TabsContent value="trade" className="mt-6">
            <TradeTab gameId={gameId} initialPlayers={players} settings={settings} />
        </TabsContent>
        <TabsContent value="dice" className="mt-6">
            <DiceTab gameId={gameId} settings={settings} />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
            <StatsDashboard initialTransactions={transactions} players={players} gameId={gameId} initialDiceRolls={diceRolls} initialSettings={settings} />
        </TabsContent>
        <TabsContent value="advisor" className="mt-6">
            <RulesAdvisorTab />
        </TabsContent>
        <TabsContent value="forecaster" className="mt-6">
            <AIForecasterTab gameData={game} result={predictionResult} setResult={setPredictionResult} />
        </TabsContent>
        <TabsContent value="options" className="mt-6">
            <OptionsTab gameId={gameId} initialSettings={settings} />
        </TabsContent>
    </Tabs>
  );
}
