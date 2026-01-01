import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Keyboard, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutItem {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description: string;
}

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: ShortcutItem[];
}

const KeyDisplay = ({ shortcut }: { shortcut: ShortcutItem }) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());

    return (
        <div className="flex items-center gap-1">
            {keys.map((key, idx) => (
                <span key={idx} className="flex items-center gap-1">
                    <Badge variant="outline" className="font-mono text-[10px] px-2 py-1">
                        {key}
                    </Badge>
                    {idx < keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
                </span>
            ))}
        </div>
    );
};

export const KeyboardShortcutsHelp = ({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
                    >
                        <Card className="bg-background border-white/10 shadow-2xl">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Keyboard className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black">Keyboard Shortcuts</h2>
                                            <p className="text-xs text-muted-foreground">Boost your productivity</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="rounded-xl"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid gap-3">
                                    {shortcuts.map((shortcut, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border border-white/5",
                                                "hover:bg-white/5 transition-colors"
                                            )}
                                        >
                                            <span className="text-sm font-medium">{shortcut.description}</span>
                                            <KeyDisplay shortcut={shortcut} />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Command className="h-3 w-3" />
                                        <span>Press <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-[10px]">Ctrl+/</kbd> to toggle this help</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
