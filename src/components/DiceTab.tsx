'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dices, Loader2 } from 'lucide-react';
import { recordDiceRoll } from '@/lib/db';
import { playDiceSound } from '@/lib/sounds';
import type { GameSettings } from '@/lib/types';

const DiceFace = ({ value }: { value: number }) => {
    return (
        <div className="w-24 h-24 bg-card border-2 border-primary/50 rounded-lg shadow-lg flex items-center justify-center p-2" aria-label={`Dice showing ${value}`}>
            <svg width="100%" height="100%" viewBox="0 0 100 100">
                { value === 1 && <circle cx="50" cy="50" r="10" fill="hsl(var(--primary))" /> }
                { value === 2 && (<><circle cx="25" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="75" r="10" fill="hsl(var(--primary))" /></>) }
                { value === 3 && (<><circle cx="25" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="50" cy="50" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="75" r="10" fill="hsl(var(--primary))" /></>) }
                { value === 4 && (<><circle cx="25" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="25" cy="75" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="75" r="10" fill="hsl(var(--primary))" /></>) }
                { value === 5 && (<><circle cx="25" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="50" cy="50" r="10" fill="hsl(var(--primary))" /><circle cx="25" cy="75" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="75" r="10" fill="hsl(var(--primary))" /></>) }
                { value === 6 && (<><circle cx="25" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="25" r="10" fill="hsl(var(--primary))" /><circle cx="25" cy="50" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="50" r="10" fill="hsl(var(--primary))" /><circle cx="25" cy="75" r="10" fill="hsl(var(--primary))" /><circle cx="75" cy="75" r="10" fill="hsl(var(--primary))" /></>) }
            </svg>
        </div>
    );
};

interface DiceTabProps {
  gameId: string;
  settings: GameSettings;
}

export function DiceTab({ gameId, settings }: DiceTabProps) {
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [lastRollMethod, setLastRollMethod] = useState<'multiply' | 'add'>('multiply');
  const [isRolling, setIsRolling] = useState(false);
  const router = useRouter();

  const rollDice = async () => {
    setIsRolling(true);
    setDice(null);
    setTotal(null);
    
    if (settings.soundsEnabled) {
      playDiceSound();
    }
    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const date = new Date();
    const seconds = date.getSeconds();
    const secStr = seconds.toString().padStart(2, '0');
    const [d1, d2] = secStr.split('').map(Number);
    
    let roll1: number;
    let roll2: number;

    const nextMethod = lastRollMethod === 'add' ? 'multiply' : 'add';

    if (nextMethod === 'add') {
      // Method 1: sum digits of seconds, use milliseconds for other die
      roll1 = ((d1 + d2) % 6) + 1;
      roll2 = (date.getMilliseconds() % 6) + 1;
    } else {
      // Method 2: multiply digits of seconds, use timestamp for other die
      roll1 = (Math.floor((d1 * d2) / 2) % 6) + 1;
      roll2 = (Math.floor(date.getTime() / 100) % 6) + 1;
    }
    
    const newTotal = roll1 + roll2;
    setDice([roll1, roll2]);
    setTotal(newTotal);
    setLastRollMethod(nextMethod);
    setIsRolling(false); // Re-enable button immediately
    
    // Record and refresh in the background
    recordDiceRoll({
        gameId,
        values: [roll1, roll2],
        total: newTotal,
        method: nextMethod,
    }).then(() => {
        router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Roll the Dice</CardTitle>
        <CardDescription>Click the button to see your next move.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-8 min-h-[350px]">
        <div className="flex gap-4 sm:gap-8">
            {dice ? (
                <>
                    <DiceFace value={dice[0]} />
                    <DiceFace value={dice[1]} />
                </>
            ) : (
                <div className="flex items-center justify-center text-muted-foreground h-24 text-center">
                    <p>{isRolling ? 'Rolling...' : 'Click the button to roll'}</p>
                </div>
            )}
        </div>
        {total !== null && <p className="text-6xl font-bold font-headline text-primary">{total}</p>}
        <Button size="lg" onClick={rollDice} disabled={isRolling} className="w-full max-w-xs bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
          {isRolling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Dices className="mr-2 h-5 w-5" />}
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </Button>
      </CardContent>
    </Card>
  );
}
