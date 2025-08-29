'use client';

const playSound = (src: string, volume: number = 0.5) => {
    if (typeof window !== 'undefined') {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play().catch(error => {
            console.error("Audio playback failed:", error);
        });
    }
};

export const playDiceSound = () => {
    playSound('/sounds/dice-roll.mp3', 0.7);
};

export const playPaymentSound = () => {
    playSound('/sounds/cash-register.mp3', 0.5);
};

export const playPassGoSound = () => {
    playSound('/sounds/pass-go.mp3', 0.6);
};
