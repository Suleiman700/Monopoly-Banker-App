import { GameHistoryList } from '@/components/GameHistoryList';
import { CreateGameDialog } from '@/components/CreateGameDialog';
import { Header } from '@/components/Header';
import { getGames } from '@/lib/db';

export default async function Home() {
  const games = await getGames();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Game History</h1>
          <CreateGameDialog />
        </div>
        <GameHistoryList games={games} />
      </main>
    </div>
  );
}
