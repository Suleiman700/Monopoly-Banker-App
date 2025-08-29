'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GameSettings, ThemeColors } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateGameSettings } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeSelectionModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialSettings: GameSettings;
  gameId: string;
  onSettingsUpdated: () => void;
}

const THEMES: Record<string, ThemeColors> = {
    "Classic Teal": { primary: "180 100% 25%", accent: "204 70% 67%", background: "180 60% 96%" },
    "Sunset Orange": { primary: "24 96% 54%", accent: "45 93% 58%", background: "35 50% 96%" },
    "Forest Green": { primary: "120 39% 40%", accent: "90 30% 65%", background: "90 25% 96%" },
    "Royal Purple": { primary: "265 39% 45%", accent: "290 50% 70%", background: "270 40% 96%" },
    "Midnight Blue": { primary: "240 50% 30%", accent: "220 60% 70%", background: "220 25% 95%" }
};

const formSchema = z.object({
  themeName: z.string().min(1, 'Please select a theme.'),
});

export function ThemeSelectionModal({ isOpen, setIsOpen, initialSettings, gameId, onSettingsUpdated }: ThemeSelectionModalProps) {
  const { toast } = useToast();
  
  const getCurrentThemeName = () => {
    const currentTheme = initialSettings.theme;
    return Object.keys(THEMES).find(name => 
      THEMES[name].primary === currentTheme.primary &&
      THEMES[name].accent === currentTheme.accent &&
      THEMES[name].background === currentTheme.background
    ) || "Classic Teal";
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      themeName: getCurrentThemeName(),
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const selectedTheme = THEMES[values.themeName];
      await updateGameSettings(gameId, { ...initialSettings, theme: selectedTheme });
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
          <DialogTitle className="font-headline text-2xl">Select a Theme</DialogTitle>
          <DialogDescription>Choose a color palette for your game board.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="themeName"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Available Themes</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {Object.entries(THEMES).map(([name, theme]) => (
                        <FormItem key={name} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={name} />
                          </FormControl>
                          <FormLabel className="font-normal w-full">
                            <div className={cn("p-4 rounded-md border-2", field.value === name && "border-primary")}>
                                <div className="font-bold mb-2">{name}</div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full" style={{ background: `hsl(${theme.primary})` }}></div>
                                    <div className="w-8 h-8 rounded-full" style={{ background: `hsl(${theme.accent})` }}></div>
                                    <div className="w-8 h-8 rounded-full border" style={{ background: `hsl(${theme.background})` }}></div>
                                </div>
                            </div>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Theme
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
