import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, Bot, User, MapPin, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiChatProps {
    onBack: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const GeminiChat: React.FC<GeminiChatProps> = ({ onBack }) => {
    const { user, trips } = useApp();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Hello ${user?.name || 'Traveler'}! I'm Gemini, your AI assistant for Taxi Booking Ladakh. How can I help you today?`,
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const result = await model.generateContent(input);
            const response = await result.response;
            const text = response.text();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: text,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error: any) {
            console.error("Error generating content:", error);

            let errorText = "Oops! Something went wrong while fetching the response. Please try again.";

            if (error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota') || error?.message?.toLowerCase().includes('exhausted')) {
                errorText = "I'm currently overloaded (Quota Exhausted). Please check your API usage limits or try again later.";
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: errorText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[var(--pass-bg)] text-white">
            {/* Header */}
            <div className="bg-[var(--pass-card)] p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10 border-b border-white/5">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition">
                    <ChevronLeft size={24} className="text-white" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--pass-primary)] to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Bot size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg">Gemini Support</h1>
                    <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 shadow-inner">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-xl ${msg.sender === 'user'
                                ? 'bg-[var(--pass-primary)] text-white rounded-br-none border border-white/10'
                                : 'bg-[var(--pass-card)] text-white border border-white/5 rounded-bl-none'
                                }`}
                        >
                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} className="font-medium" />
                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/50' : 'text-gray-500'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-[var(--pass-card)] border border-white/5 p-3 rounded-2xl rounded-bl-none shadow-xl flex gap-1">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[var(--pass-card)] border-t border-white/5">
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-full border border-white/5 focus-within:border-[var(--pass-primary)] transition">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your driver, trip..."
                        className="flex-1 bg-transparent px-3 py-1 focus:outline-none text-sm text-white placeholder:text-gray-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-10 h-10 bg-[var(--pass-primary)] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition shadow-lg"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
