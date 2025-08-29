import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-8xl font-bold font-headline text-primary">404</h1>
        <p className="text-2xl mt-4 text-muted-foreground">Oops! Page Not Found.</p>
        <p className="mt-2 text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </Button>
      </main>
    </div>
  );
}
