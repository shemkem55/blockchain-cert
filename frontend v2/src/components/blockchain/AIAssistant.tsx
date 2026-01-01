import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bot, X, Send, User, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'ai';
};

export const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Welcome to CertChain! I'm your Intelligent Career Advisor. I can analyze your blockchain credentials and suggest optimal career paths. How can I assist you today?", sender: 'ai' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (textOverride?: string) => {
        const messageText = textOverride || inputValue;
        if (!messageText.trim()) return;

        const userMsg: Message = { id: Date.now(), text: messageText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        if (!textOverride) setInputValue('');
        setIsTyping(true);

        try {
            const res = await fetch('/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: messageText }),
                credentials: 'include'
            });

            const data = await res.json();

            const aiMsg: Message = {
                id: Date.now() + 1,
                text: data.reply || "My neural links are slightly unstable. Could you repeat that?",
                sender: 'ai'
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('Chat error', err);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Critical connection error. My systems are offline.", sender: 'ai' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="mb-6 w-[350px] md:w-[400px] pointer-events-auto"
                    >
                        <Card className="border-primary/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden glass rounded-[2rem] relative">
                            {/* Decorative Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

                            <CardHeader className="bg-primary/10 border-b border-primary/10 p-5 flex flex-row items-center justify-between relative z-10">
                                <CardTitle className="text-sm font-bold flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary blur-md opacity-50 animate-pulse" />
                                        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg relative">
                                            <Bot className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-foreground">CertChain AI</span>
                                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Active Intelligence</span>
                                    </div>
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/5 transition-colors" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="p-0 relative z-10 bg-[#0a0f18]/40">
                                <div className="h-[380px] overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-primary/20">
                                    {messages.map((msg) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: msg.sender === 'user' ? 10 : -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={msg.id}
                                            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {msg.sender === 'ai' && (
                                                <div className="mt-1 h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${msg.sender === 'user'
                                                    ? 'bg-primary text-primary-foreground font-semibold shadow-lg rounded-tr-none'
                                                    : 'bg-secondary/50 border border-white/5 text-foreground rounded-tl-none backdrop-blur-md'
                                                    }`}
                                            >
                                                {msg.text}
                                            </div>
                                            {msg.sender === 'user' && (
                                                <div className="mt-1 h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border border-white/10">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <div className="bg-secondary/50 border border-white/5 rounded-2xl rounded-tl-none p-4 flex gap-1.5 items-center backdrop-blur-md">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.span
                                                        key={i}
                                                        animate={{ y: [0, -6, 0] }}
                                                        transition={{
                                                            duration: 0.8,
                                                            repeat: Infinity,
                                                            delay: i * 0.15,
                                                            ease: "easeInOut"
                                                        }}
                                                        className="w-1.5 h-1.5 bg-primary rounded-full"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Action Chips */}
                                <div className="flex flex-wrap gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
                                    {[
                                        "How do I sync to ledger?",
                                        "What is a soulbound token?",
                                        "Is my data secure?",
                                        "What is the system's technical stack?"
                                    ].map((q, i) => (
                                        <button
                                            key={i}
                                            disabled={isTyping}
                                            onClick={() => handleSendMessage(q)}
                                            className="text-[10px] whitespace-nowrap px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-medium disabled:opacity-50"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 relative z-10">
                                <form
                                    className="flex w-full gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                >
                                    <div className="relative flex-1 group">
                                        <Input
                                            placeholder="Consult AI advisor..."
                                            className="w-full bg-secondary/50 border-white/5 focus:border-primary/50 rounded-xl pr-10 py-5 text-xs transition-all placeholder:text-muted-foreground/50"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                        />
                                        <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!inputValue.trim() || isTyping}
                                        className="h-10 w-10 rounded-xl gradient-primary transition-transform hover:scale-105 active:scale-95 shadow-glow"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 rounded-2xl gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all pointer-events-auto group relative overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-7 h-7" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="bot"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="flex items-center justify-center"
                        >
                            <Bot className="w-9 h-9" />
                            {/* Unread indicator */}
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-white rounded-full border-2 border-primary animate-ping" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Visual waves Effect when idle */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-white/20 scale-0 group-hover:animate-ping rounded-full pointer-events-none" />
                )}
            </motion.button>
        </div >
    );
};

