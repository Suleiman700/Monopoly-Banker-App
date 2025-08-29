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

interface BankPaymentModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  allPlayers: Player[];
  gameId: string;
  onPaymentSuccess: () => void;
  settings: GameSettings;
}

const formSchema = z.object({
  toPlayerId: z.string().min(1, 'Please select a player.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  reason: z.string().min(1, 'Reason is required'),
  reasonType: z.string().min(1, 'Please select a reason.'),
});

export function BankPaymentModal({ isOpen, setIsOpen, allPlayers, gameId, onPaymentSuccess, settings }: BankPaymentModalProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toPlayerId: undefined,
      amount: '' as unknown as number,
      reason: '',
      reasonType: 'manual',
    }
  });

  const reasonType = form.watch('reasonType');

  useEffect(() => {
    if (reasonType === 'Pass Go') {
      form.setValue('amount', settings.passGoAmount);
      form.setValue('reason', 'Pass Go');
    } else if (reasonType === 'Free Parking' && settings.freeParkingAmount > 0) {
      form.setValue('amount', settings.freeParkingAmount);
       form.setValue('reason', 'Free Parking');
    } else if (reasonType === 'manual') {
      form.setValue('reason', '');
      form.setValue('amount', '' as unknown as number);
    }
  }, [reasonType, settings, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await makePayment({
        gameId,
        fromPlayerId: 'bank',
        toPlayerId: values.toPlayerId,
        amount: values.amount,
        reason: values.reasonType === 'manual' ? values.reason : values.reasonType,
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
          <DialogTitle className="font-headline text-2xl">Bank Payment</DialogTitle>
          <DialogDescription>Pay a player from the bank.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="toPlayerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Player</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player to pay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allPlayers.map(p => (
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
                      <SelectItem value="Pass Go">Pass Go (${settings.passGoAmount})</SelectItem>
                      {settings.freeParkingAmount > 0 && (
                        <SelectItem value="Free Parking">Free Parking (${settings.freeParkingAmount})</SelectItem>
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
                    <Input type="number" placeholder="e.g., 200" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} disabled={reasonType !== 'manual'} />
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
                      <Input placeholder="e.g., Bank error in your favor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
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
