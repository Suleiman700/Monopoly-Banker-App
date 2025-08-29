import Link from 'next/link';
import type { Game } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Landmark } from 'lucide-react';

interface GameHistoryListProps {
  games: Game[];
}

export function GameHistoryList({ games }: GameHistoryListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-secondary/30">
        <h2 className="text-xl font-semibold text-muted-foreground">No Games Yet!</h2>
        <p className="text-muted-foreground mt-2">Click "Create New Game" to start your first session.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <Link href={`/game/${game.id}`} key={game.id} className="block">
          <Card className="hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-primary">Game Session</CardTitle>
              <CardDescription>Started on {new Date(game.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5 text-primary" />
                <span>{game.playerCount} Players</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Landmark className="h-5 w-5 text-primary" />
                <span>Starting Balance: ${game.startingBalance.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
