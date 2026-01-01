import { useState, useEffect } from 'react';

interface Shortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
    description: string;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Show help with Ctrl+/
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setShowHelp(prev => !prev);
                return;
            }

            shortcuts.forEach(({ key, ctrlKey, shiftKey, altKey, action }) => {
                const keyMatch = e.key.toLowerCase() === key.toLowerCase();
                const ctrlMatch = ctrlKey === undefined || e.ctrlKey === ctrlKey;
                const shiftMatch = shiftKey === undefined || e.shiftKey === shiftKey;
                const altMatch = altKey === undefined || e.altKey === altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    e.preventDefault();
                    action();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);

    return { showHelp, setShowHelp, shortcuts };
};
