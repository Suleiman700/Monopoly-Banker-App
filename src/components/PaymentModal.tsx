'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Player, GameSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { makePayment } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { playPaymentSound } from '@/lib/sounds';

interface PaymentModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fromPlayer: Player;
  allPlayers: Player[];
  gameId: string;
  onPaymentSuccess: () => void;
  settings: GameSettings;
}

const formSchema = z.object({
  toPlayerId: z.string().min(1, 'Please select a recipient.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  reason: z.string().optional(),
  reasonType: z.string().min(1, 'Please select a reason type.'),
});

export function PaymentModal({ isOpen, setIsOpen, fromPlayer, allPlayers, gameId, onPaymentSuccess, settings }: PaymentModalProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      toPlayerId: undefined,
      reason: '',
      reasonType: 'manual',
    }
  });

  const reasonType = form.watch('reasonType');
  const toPlayerId = form.watch('toPlayerId');
  
  useEffect(() => {
    if(toPlayerId === 'bank' && (reasonType === 'Jail Fee' || reasonType === 'Income Tax' || reasonType === 'Luxury Tax')) {
       let amount = 0;
       if (reasonType === 'Jail Fee') amount = settings.jailFee;
       if (reasonType === 'Income Tax') amount = 100; // These could also come from settings
       if (reasonType === 'Luxury Tax') amount = 200; // These could also come from settings
       form.setValue('amount', amount);
       form.setValue('reason', reasonType);
    } else if (reasonType === 'manual') {
      form.setValue('reason', '');
      form.setValue('amount', '' as unknown as number);
    }
  }, [reasonType, toPlayerId, settings, form]);

  const handleShortcutPayment = async (amount: number, reason: string) => {
    form.setValue('toPlayerId', 'bank');
    form.setValue('amount', amount);
    form.setValue('reasonType', 'manual'); // Set to manual so the amount isn't locked
    form.setValue('reason', reason);
    await form.handleSubmit(onSubmit)();
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (values.amount > fromPlayer.balance) {
          toast({ variant: 'destructive', title: 'Insufficient Funds', description: `${fromPlayer.name} does not have enough money.`});
          return;
      }

      const finalReason = values.reasonType === 'manual' ? values.reason : values.reasonType;

      await makePayment({
        gameId,
        fromPlayerId: fromPlayer.id,
        toPlayerId: values.toPlayerId,
        amount: values.amount,
        reason: finalReason || 'Payment',
      });
      
      if (settings.soundsEnabled) {
        playPaymentSound();
      }
      onPaymentSuccess();

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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="toPlayerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('reasonType', 'manual');
                    form.setValue('reason', '');
                    form.setValue('amount', '' as unknown as number);
                  }} defaultValue={field.value}>
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

            {toPlayerId === 'bank' && (
               <div className="space-y-3 py-2">
                  <p className="font-semibold text-sm text-muted-foreground">Bank Payment Shortcuts</p>
                  <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleShortcutPayment(settings.jailFee, 'Jail Fee')}>Jail Fee (${settings.jailFee})</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleShortcutPayment(100, 'Income Tax')}>Income Tax ($100)</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleShortcutPayment(200, 'Luxury Tax')}>Luxury Tax ($200)</Button>
                  </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="reasonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                     <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      {toPlayerId === 'bank' ? (
                        <>
                          <SelectItem value="Jail Fee">Jail Fee (${settings.jailFee})</SelectItem>
                          <SelectItem value="Income Tax">Income Tax ($100)</SelectItem>
                          <SelectItem value="Luxury Tax">Luxury Tax ($200)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Mortgage Property">Mortgage Property</SelectItem>
                          <SelectItem value="Sell Property">Sell Property</SelectItem>
                        </>
                      )}
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
                    <Input type="number" placeholder="e.g., 200" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)} disabled={toPlayerId === 'bank' && reasonType !== 'manual'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {reasonType === 'manual' && (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manual Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rent for Boardwalk" {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
