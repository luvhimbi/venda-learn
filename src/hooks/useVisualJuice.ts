import { useCallback, useState, useEffect } from 'react';
import { Howl } from 'howler';
import { fetchUserData } from '../services/dataCache';

const sounds = {
    correct: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'], volume: 0.5 }),
    wrong: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'], volume: 0.4 }),
    click: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.3 }),
    swipe: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'], volume: 1.0 }),
    win: new Howl({ src: ['/Audio/you_win.ogg'], volume: 0.6 }),
    lose: new Howl({ src: ['/Audio/you_lose.ogg'], volume: 0.6 }),
    winner: new Howl({ src: ['/Audio/winner.ogg'], volume: 0.6 }),
};

export const useVisualJuice = () => {
    const [preferences, setPreferences] = useState({ sound: true, haptic: true });

    useEffect(() => {
        fetchUserData().then(data => {
            if (data) {
                setPreferences({
                    sound: data.soundEnabled !== false, // Default to true
                    haptic: data.hapticEnabled !== false
                });
            }
        });
    }, []);

    const playCorrect = useCallback(() => {
        if (preferences.sound) sounds.correct.play();
    }, [preferences.sound]);

    const playWrong = useCallback(() => {
        if (preferences.sound) sounds.wrong.play();
    }, [preferences.sound]);

    const playClick = useCallback(() => {
        if (preferences.sound) sounds.click.play();
    }, [preferences.sound]);

    const playWin = useCallback(() => {
        if (preferences.sound) sounds.win.play();
    }, [preferences.sound]);

    const playLose = useCallback(() => {
        if (preferences.sound) sounds.lose.play();
    }, [preferences.sound]);

    const playWinner = useCallback(() => {
        if (preferences.sound) sounds.winner.play();
    }, [preferences.sound]);

    const playSwipe = useCallback(() => {
        if (preferences.sound) sounds.swipe.play();
    }, [preferences.sound]);

    const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
        if (!preferences.haptic || !window.navigator.vibrate) return;
        
        const pattern = type === 'light' ? 10 : type === 'medium' ? 20 : 40;
        window.navigator.vibrate(pattern);
    }, [preferences.haptic]);

    const triggerShake = useCallback((elementId: string) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.remove('shake');
            void el.offsetWidth; // Force reflow
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 500);
        }
    }, []);

    return { playCorrect, playWrong, playClick, playSwipe, playWin, playLose, playWinner, triggerHaptic, triggerShake };
};

