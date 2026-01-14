import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChatScreenProps {
  tripId: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ tripId, onBack }) => {
  const { trips, user, sendMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const trip = trips.find(t => t.id === tripId);

  // Determine the other person's name
  const otherName = user?.role === 'passenger' ? trip?.driverName : trip?.passengerName;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [trip?.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(tripId, inputText);
      setInputText('');
    }
  };

  if (!trip) return null;

  return (
    <div className="flex flex-col h-screen bg-[var(--pass-bg)] text-white">
      {/* Chat Header */}
      <div className="bg-[var(--pass-card)] p-4 shadow-sm flex items-center gap-3 sticky top-0 z-50 border-b border-white/5">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <div>
          <h2 className="font-bold text-white">{otherName}</h2>
          {user?.role === 'passenger' && trip?.driverMobile && (
            <p className="text-xs text-gray-400 font-medium">
              {trip.vehicleNo} • +91 {trip.driverMobile}
            </p>
          )}
          <p className="text-[10px] text-green-400 flex items-center gap-1 mt-0.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active Trip
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 shadow-inner">
        {trip.messages && trip.messages.length > 0 ? (
          trip.messages.map(msg => {
            const isMe = msg.senderId === user?.name;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-xl relative ${isMe ? 'bg-[var(--pass-primary)] text-white rounded-tr-none' : 'bg-[var(--pass-card)] text-white border border-white/5 rounded-tl-none'}`}>
                  <p className="font-medium">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center mt-10">
            <div className="bg-white/5 inline-block px-4 py-2 rounded-xl text-xs text-gray-500 shadow-sm border border-white/5 font-bold uppercase tracking-widest">
              No messages yet
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[var(--pass-card)] border-t border-white/5 pb-8">
        <div className="flex items-center gap-2 bg-gray-800 px-2 py-2 rounded-3xl border border-white/5">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-white placeholder:text-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-3 rounded-full text-white shadow-lg transition transform active:scale-95 ${inputText.trim() ? 'bg-[var(--pass-primary)] hover:opacity-90' : 'bg-gray-700 opacity-50'}`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};