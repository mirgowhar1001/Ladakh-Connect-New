import React from 'react';
import { Phone, ShieldAlert } from 'lucide-react';

export const SOSButton: React.FC = () => {
    const handleSOS = () => {
        if (confirm("EMERGENCY ALERT: Are you sure you want to call emergency services?")) {
            window.location.href = "tel:112";
            alert("Calling Emergency Services (112)... and notifying trusted contacts.");
        }
    };

    return (
        <button
            onClick={handleSOS}
            className="fixed top-24 right-4 z-[100] bg-red-600 text-white p-3 rounded-full shadow-lg animate-pulse hover:bg-red-700 transition-all border-4 border-red-200"
        >
            <div className="flex flex-col items-center">
                <ShieldAlert size={24} fill="currentColor" />
                <span className="text-[10px] font-black">SOS</span>
            </div>
        </button>
    );
};
