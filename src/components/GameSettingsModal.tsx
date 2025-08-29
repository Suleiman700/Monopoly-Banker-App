'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GameSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateGameSettings } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface GameSettingsModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialSettings: GameSettings;
  gameId: string;
  onSettingsUpdated: () => void;
}

const formSchema = z.object({
  passGoAmount: z.coerce.number().min(0, 'Must be a positive number.'),
  jailFee: z.coerce.number().min(0, 'Must be a positive number.'),
  freeParkingAmount: z.coerce.number().min(0, 'Must be a positive number.'),
});

export function GameSettingsModal({ isOpen, setIsOpen, initialSettings, gameId, onSettingsUpdated }: GameSettingsModalProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialSettings,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(initialSettings);
    }
  }, [isOpen, initialSettings, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateGameSettings(gameId, values);
      onSettingsUpdated();
      setIsOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Customize Game Amounts</DialogTitle>
          <DialogDescription>Change the standard amounts for key game events.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="passGoAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pass Go Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="jailFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jail Fee</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="freeParkingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Free Parking Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
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
