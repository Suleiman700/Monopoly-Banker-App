import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { getGameById } from '@/lib/db';
import type { ThemeColors } from '@/lib/types';
import { GameTabs } from '@/components/GameTabs';

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
  
  const theme = game.settings?.theme || defaultTheme;

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
          <GameTabs game={game} />
        </main>
      </div>
    </>
  );
}
