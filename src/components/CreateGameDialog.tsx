'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Loader2, UserPlus, UserMinus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createGame } from '@/lib/db';

const formSchema = z.object({
  players: z.array(z.object({ name: z.string().min(1, 'Player name is required.') })).min(2, 'Must have at least 2 players').max(8, 'Cannot have more than 8 players'),
  startingBalance: z.coerce.number().min(1, 'Starting balance must be positive'),
});

export function CreateGameDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      players: [{ name: 'Player 1' }, { name: 'Player 2' }],
      startingBalance: 1500,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "players",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const playerNames = values.players.map(p => p.name);
      const newGame = await createGame(playerNames, values.startingBalance);
      setOpen(false);
      form.reset();
      router.push(`/game/${newGame.id}`);
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Create New Game</DialogTitle>
          <DialogDescription>
            Set up a new game of Monopoly. Let's get rolling!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div>
              <FormLabel>Players</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`players.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                         <div className="flex items-center gap-2">
                           <FormControl>
                            <Input placeholder={`Player ${index + 1} Name`} {...field} />
                           </FormControl>
                           <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                              <UserMinus className="h-4 w-4"/>
                              <span className="sr-only">Remove Player</span>
                           </Button>
                         </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '' })} disabled={fields.length >= 8}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
               {form.formState.errors.players && <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.players.message}</p>}
            </div>

            <FormField
              control={form.control}
              name="startingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Balance (e.g., $1500)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Start Game'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
