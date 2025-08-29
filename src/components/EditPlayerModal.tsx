'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Player } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updatePlayerName } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface EditPlayerModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  player: Player;
  gameId: string;
  onPlayerUpdated: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Player name is required.'),
});

export function EditPlayerModal({ isOpen, setIsOpen, player, gameId, onPlayerUpdated }: EditPlayerModalProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: player.name,
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updatePlayerName(player.id, gameId, values.name);
      onPlayerUpdated();
      setIsOpen(false);
      form.reset({ name: values.name });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) form.reset({ name: player.name });}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Edit Player</DialogTitle>
          <DialogDescription>Change the name for {player.name}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
