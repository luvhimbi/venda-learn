import { useEffect, useRef, useState } from 'react';

/**
 * useAutoSave - Saves form data to localStorage as the user types.
 *
 * @param key       A unique localStorage key (e.g. "add-lesson" or "edit-lesson-food")
 * @param data      The current form state to persist
 * @param setData   Setter to restore saved data
 * @param delay     Debounce delay in ms (default 1000)
 */
const useAutoSave = (key: string, data: any, setData: (d: any) => void, delay = 1000) => {
    const [recovered, setRecovered] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const isInitialLoad = useRef(true);

    // On mount: check if there is saved data
    useEffect(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.data) {
                    setData(parsed.data);
                    setRecovered(true);
                    setLastSaved(parsed.savedAt || null);
                }
            }
        } catch {
            // Corrupt data, ignore
        }
        // Small delay before we start tracking changes
        const timer = setTimeout(() => {
            isInitialLoad.current = false;
        }, 500);
        return () => clearTimeout(timer);
    }, [key]); // Only run once per key

    // Debounced save whenever data changes
    useEffect(() => {
        if (isInitialLoad.current) return;

        const timer = setTimeout(() => {
            try {
                const payload = {
                    data,
                    savedAt: new Date().toLocaleTimeString()
                };
                localStorage.setItem(key, JSON.stringify(payload));
                setLastSaved(payload.savedAt);
            } catch {
                // Storage full or unavailable
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [data, key, delay]);

    const clearSaved = () => {
        localStorage.removeItem(key);
        setRecovered(false);
        setLastSaved(null);
    };

    const dismissRecovery = () => {
        setRecovered(false);
    };

    return { recovered, lastSaved, clearSaved, dismissRecovery };
};

export default useAutoSave;
