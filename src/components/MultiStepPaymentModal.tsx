'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { Loader2, ArrowLeft, University } from 'lucide-react';
import { playPaymentSound } from '@/lib/sounds';

interface MultiStepPaymentModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  allPlayers: Player[];
  gameId: string;
  onPaymentSuccess: () => void;
  settings: GameSettings;
}

type Payer = Player | { id: 'bank'; name: 'Bank'; balance: Infinity };

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  reason: z.string().min(1, 'Reason is required.'),
  reasonType: z.string().min(1, 'Please select a reason type.'),
});

export function MultiStepPaymentModal({ isOpen, setIsOpen, allPlayers, gameId, onPaymentSuccess, settings }: MultiStepPaymentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [fromPayer, setFromPayer] = useState<Payer | null>(null);
  const [toPayer, setToPayer] = useState<Payer | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      reason: '',
      reasonType: 'manual',
    },
  });
  
  const reasonType = form.watch('reasonType');

  useEffect(() => {
    if (reasonType === 'manual') {
      form.setValue('reason', '');
    } else {
      form.setValue('reason', reasonType);
    }
  }, [reasonType, form]);

  const resetFlow = () => {
    setStep(1);
    setFromPayer(null);
    setToPayer(null);
    form.reset();
  };

  useEffect(() => {
    if (isOpen) {
      resetFlow();
    }
  }, [isOpen]);
  
  const bankAsPayer: Payer = { id: 'bank', name: 'Bank', balance: Infinity };
  const availablePayers: Payer[] = [bankAsPayer, ...allPlayers];
  
  const availablePayees = useMemo(() => {
    if (!fromPayer) return [];
    return availablePayers.filter(p => p.id !== fromPayer.id);
  }, [fromPayer, allPlayers]);
  
  const handleSetToPayer = (payer: Payer) => {
    setToPayer(payer);
    // Set default reason if applicable
    if (fromPayer?.id !== 'bank' && payer.id !== 'bank') {
      form.setValue('reasonType', 'Rent');
      form.setValue('reason', 'Rent');
    } else {
      form.setValue('reasonType', 'manual');
      form.setValue('reason', '');
    }
    setStep(3);
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!fromPayer || !toPayer) {
      toast({ variant: 'destructive', title: 'Error', description: 'Payer and payee must be selected.' });
      return;
    }
    
    if (fromPayer.balance < values.amount) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: `${fromPayer.name} does not have enough money.`});
        return;
    }

    try {
      await makePayment({
        gameId,
        fromPlayerId: fromPayer.id,
        toPlayerId: toPayer.id,
        amount: values.amount,
        reason: values.reason,
      });

      if (settings.soundsEnabled) {
        playPaymentSound();
      }
      onPaymentSuccess();
      setIsOpen(false);
      
    } catch (error) {
      toast({ variant: 'destructive', title: 'Payment Failed', description: (error as Error).message });
    }
  }
  
  const renderStepContent = () => {
    switch (step) {
      case 1: // Select Payer
        return (
          <div>
            <DialogTitle className="font-headline text-2xl text-center mb-4">Who is paying?</DialogTitle>
            <div className="grid grid-cols-2 gap-4">
              {availablePayers.map(p => (
                <Button key={p.id} variant="outline" className="h-20 text-lg" onClick={() => { setFromPayer(p); setStep(2); }}>
                    {p.id === 'bank' && <University className="mr-2"/>} {p.name}
                </Button>
              ))}
            </div>
          </div>
        );
      case 2: // Select Payee
        return (
          <div>
            <DialogTitle className="font-headline text-2xl text-center mb-4">Who are they paying?</DialogTitle>
             <div className="grid grid-cols-2 gap-4">
                {availablePayees.map(p => (
                  <Button key={p.id} variant="outline" className="h-20 text-lg" onClick={() => handleSetToPayer(p)}>
                     {p.id === 'bank' && <University className="mr-2"/>} {p.name}
                  </Button>
                ))}
            </div>
          </div>
        );
      case 3: // Enter Amount
        return (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Payment Details</DialogTitle>
              <DialogDescription>
                Paying from <span className="font-bold text-primary">{fromPayer?.name}</span> to <span className="font-bold text-primary">{toPayer?.name}</span>.
              </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                            {toPayer?.id === 'bank' ? (
                              <>
                                <SelectItem value="Jail Fee">Jail Fee</SelectItem>
                                <SelectItem value="Mortgage">Mortgage</SelectItem>
                                <SelectItem value="Buy Property">Buy Property</SelectItem>
                                <SelectItem value="Buy Building">Buy Building</SelectItem>
                              </>
                            ) : (
                              <SelectItem value="Rent">Rent</SelectItem>
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
                          <Input type="number" placeholder="e.g., 200" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
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
                            <Input placeholder="e.g., Rent for Boardwalk" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                   <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Payment
                    </Button>
                  </DialogFooter>
                </form>
             </Form>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        {step > 1 && (
            <Button variant="ghost" size="icon" className="absolute left-4 top-4" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
        )}
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
