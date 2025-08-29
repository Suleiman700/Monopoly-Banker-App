import { Banknote } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="bg-primary/95 text-primary-foreground shadow-md backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-accent" />
          <h1 className="text-xl sm:text-2xl font-headline font-bold">Banker's Best Friend</h1>
        </Link>
      </div>
    </header>
  );
}
