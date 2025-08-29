'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Player } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { makePayment } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Separator } from './ui/separator';

interface PaymentModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fromPlayer: Player;
  allPlayers: Player[];
  gameId: string;
  onPaymentSuccess: () => void;
}

const formSchema = z.object({
  toPlayerId: z.string().min(1, 'Please select a recipient.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  reason: z.string().optional(),
});

export function PaymentModal({ isOpen, setIsOpen, fromPlayer, allPlayers, gameId, onPaymentSuccess }: PaymentModalProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      toPlayerId: undefined,
      reason: '',
    }
  });
  
  const handleShortcutPayment = async (amount: number, reason: string) => {
    form.setValue('toPlayerId', 'bank');
    form.setValue('amount', amount);
    form.setValue('reason', reason);
    await form.handleSubmit(onSubmit)();
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (values.amount > fromPlayer.balance) {
          toast({ variant: 'destructive', title: 'Insufficient Funds', description: `${fromPlayer.name} does not have enough money.`});
          return;
      }

      await makePayment({
        gameId,
        fromPlayerId: fromPlayer.id,
        toPlayerId: values.toPlayerId,
        amount: values.amount,
        reason: values.reason || 'Payment',
      });
      
      onPaymentSuccess();
      
      toast({
          title: 'Payment Successful',
          description: `${fromPlayer.name} paid $${values.amount} to ${values.toPlayerId === 'bank' ? 'the Bank' : allPlayers.find(p => p.id === values.toPlayerId)?.name}.`
      });

      setIsOpen(false);
      form.reset();

    } catch (error) {
      toast({ variant: 'destructive', title: 'Payment Failed', description: (error as Error).message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) form.reset();}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Make a Payment</DialogTitle>
          <DialogDescription>From: {fromPlayer.name} (Balance: ${fromPlayer.balance.toLocaleString()})</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
            <p className="font-semibold text-sm text-muted-foreground">Pay to Bank (Shortcuts)</p>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShortcutPayment(50, 'Jail Fee')}>Jail Fee ($50)</Button>
                <Button variant="outline" size="sm" onClick={() => handleShortcutPayment(100, 'Income Tax')}>Income Tax ($100)</Button>
                <Button variant="outline" size="sm" onClick={() => handleShortcutPayment(200, 'Luxury Tax')}>Luxury Tax ($200)</Button>
            </div>
        </div>
        <Separator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="font-semibold text-sm text-muted-foreground">Custom Payment</p>
            <FormField
              control={form.control}
              name="toPlayerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player or bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      {allPlayers
                        .filter(p => p.id !== fromPlayer.id)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 200" {...field} />
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
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rent for Boardwalk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit">Confirm Payment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
