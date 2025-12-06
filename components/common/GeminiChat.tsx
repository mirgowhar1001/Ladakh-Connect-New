import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, Bot, User, MapPin, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface GeminiChatProps {
    onBack: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

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

        // Simulate AI processing
        setTimeout(() => {
            const responseText = generateResponse(userMessage.text);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const generateResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        const activeTrip = trips.find(t => t.status === 'EN_ROUTE' || t.status === 'BOOKED');

        // 1. Driver / Contact Info (Context: Active Trip OR Search in Offers)
        if (lowerQuery.includes('driver') || lowerQuery.includes('contact') || lowerQuery.includes('who')) {
            if (activeTrip) {
                return `Your driver is **${activeTrip.driverName}**. Contact: **+91 9906XXXXXX**. Vehicle: **${activeTrip.vehicleNo}**.`;
            }
            // Search in Ride Offers if asking about a specific route
            const routeMatch = trips.find(t => lowerQuery.includes(t.to.toLowerCase()));
            if (routeMatch) {
                return `For your trip to ${routeMatch.to}, the driver was **${routeMatch.driverName}**.`;
            }
            return "I can give you driver details for your active or past trips. You currently don't have an active trip.";
        }

        // 2. Trip Status / History
        if (lowerQuery.includes('trip') || lowerQuery.includes('status') || lowerQuery.includes('where')) {
            if (activeTrip) {
                return `You have an upcoming trip from **${activeTrip.from}** to **${activeTrip.to}**. Status: **${activeTrip.status}**.`;
            }
            const pastTrips = trips.filter(t => t.status === 'COMPLETED');
            if (pastTrips.length > 0) {
                return `You have completed ${pastTrips.length} trips. Your last trip was to **${pastTrips[0].to}**.`;
            }
            return "You don't have any active trips. Check 'Upcoming Rides' to book one!";
        }

        // 3. Database / General Queries (Simulated "Whole Database" Access)
        if (lowerQuery.includes('available') || lowerQuery.includes('rides') || lowerQuery.includes('cabs')) {
            // Use rideOffers context
            const count = trips.length; // Using trips as a proxy for "known" data in this mock
            return `We currently have multiple drivers available across Ladakh. I can see ${count} records in your history. Search for a destination to see live cabs.`;
        }

        if (lowerQuery.includes('cancel') || lowerQuery.includes('refund')) {
            return "To cancel, go to 'My Trips'. Refunds are processed to your wallet instantly.";
        }

        if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
            return `Hello ${user?.name || 'Traveler'}! I have access to our driver network and your trip history. Ask me anything!`;
        }

        return "I can help with driver details, trip status, or booking info. I have access to the full Ladakh Connect network.";
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <Bot size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 text-lg">Gemini Support</h1>
                    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                ? 'bg-black text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}
                        >
                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full border border-gray-200 focus-within:border-black/30 transition">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your driver, trip..."
                        className="flex-1 bg-transparent px-3 py-1 focus:outline-none text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition shadow-md"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
