'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { giveToAllPlayers, takeFromAllPlayers } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface MassPaymentModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  gameId: string;
  onSuccess: () => void;
  type: 'give' | 'take';
}

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  reason: z.string().min(1, 'Reason is required.'),
});

export function MassPaymentModal({ isOpen, setIsOpen, gameId, onSuccess, type }: MassPaymentModalProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      reason: '',
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (type === 'give') {
        await giveToAllPlayers(gameId, values.amount, values.reason);
        toast({
          title: 'Success!',
          description: `Gave $${values.amount} to all players.`,
        });
      } else {
        await takeFromAllPlayers(gameId, values.amount, values.reason);
        toast({
          title: 'Success!',
          description: `Took $${values.amount} from all players.`,
        });
      }
      onSuccess();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action Failed', description: (error as Error).message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) form.reset();}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{type === 'give' ? 'Give Money to All Players' : 'Take Money from All Players'}</DialogTitle>
          <DialogDescription>
            {type === 'give' ? 'This amount will be added to every player\'s balance.' : 'This amount will be subtracted from every player\'s balance.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bank error in your favor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
