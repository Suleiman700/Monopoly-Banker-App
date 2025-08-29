'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteGame, resetGame, updateGameSettings } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCcw, Loader2, Settings2, Palette, Music } from 'lucide-react';
import type { GameSettings } from '@/lib/types';
import { GameSettingsModal } from './GameSettingsModal';
import { ThemeSelectionModal } from './ThemeSelectionModal';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"


interface OptionsTabProps {
    gameId: string;
    initialSettings: GameSettings;
}

export function OptionsTab({ gameId, initialSettings }: OptionsTabProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [themeModalOpen, setThemeModalOpen] = useState(false);
    const [soundsEnabled, setSoundsEnabled] = useState(initialSettings.soundsEnabled ?? true);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteGame(gameId);
            router.push('/');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the game.' });
            setIsDeleting(false);
        }
    };
    
    const handleReset = async () => {
        setIsResetting(true);
        try {
            await resetGame(gameId);
            router.refresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to reset the game.' });
        } finally {
            setIsResetting(false);
        }
    };

    const handleSettingsUpdated = () => {
        router.refresh();
    }

    const handleSoundToggle = async (enabled: boolean) => {
        setSoundsEnabled(enabled);
        try {
            await updateGameSettings(gameId, { ...initialSettings, soundsEnabled: enabled });
        } catch (error) {
            setSoundsEnabled(!enabled); // Revert on error
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save sound settings.' });
        }
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Game Options</CardTitle>
                    <CardDescription>Manage the overall state of this game session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/30">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Music /> Game Sounds</h3>
                            <p className="text-sm text-muted-foreground pl-7">
                                Enable or disable sound effects for actions like dice rolls and payments.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="sound-switch"
                                checked={soundsEnabled}
                                onCheckedChange={handleSoundToggle}
                            />
                            <Label htmlFor="sound-switch">{soundsEnabled ? "On" : "Off"}</Label>
                        </div>
                    </div>

                     <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/30">
                        <div>
                            <h3 className="font-semibold text-lg">Customize Amounts</h3>
                            <p className="text-sm text-muted-foreground">
                                Set custom amounts for Jail Fees, Pass Go, and Free Parking.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setSettingsModalOpen(true)}>
                            <Settings2 className="mr-2" />
                            Customize
                        </Button>
                    </div>

                    <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/30">
                        <div>
                            <h3 className="font-semibold text-lg">Change Theme</h3>
                            <p className="text-sm text-muted-foreground">
                                Personalize the look and feel of your game board.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setThemeModalOpen(true)}>
                            <Palette className="mr-2" />
                            Change Theme
                        </Button>
                    </div>

                    <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/30">
                        <div>
                            <h3 className="font-semibold text-lg">Reset Game</h3>
                            <p className="text-sm text-muted-foreground">
                                This will reset all player balances to the starting amount and clear all transaction and dice roll history. This action cannot be undone.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={isResetting}>
                                    {isResetting ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCcw className="mr-2" />}
                                    {isResetting ? 'Resetting...' : 'Reset Game'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to reset the game?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will reset all player balances, transactions, and dice history. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReset}>Confirm Reset</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="p-4 border border-destructive/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-destructive/10">
                        <div>
                            <h3 className="font-semibold text-lg text-destructive">Delete Game</h3>
                            <p className="text-sm text-destructive/80">
                                This will permanently delete this game session and all of its data. This action cannot be undone.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2" />}
                                    {isDeleting ? 'Deleting...' : 'Delete Game'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this game and remove its data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete game
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
            <GameSettingsModal
                isOpen={settingsModalOpen}
                setIsOpen={setSettingsModalOpen}
                gameId={gameId}
                initialSettings={initialSettings}
                onSettingsUpdated={handleSettingsUpdated}
            />
            <ThemeSelectionModal
                isOpen={themeModalOpen}
                setIsOpen={setThemeModalOpen}
                gameId={gameId}
                initialSettings={initialSettings}
                onSettingsUpdated={handleSettingsUpdated}
            />
        </>
    );
}
