import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Camera, Phone, Edit3, Plus, ChevronRight, Briefcase, LogOut, ArrowRight, Save, X, Mail, User, Bot, Trash2 } from 'lucide-react';

interface PassengerProfileProps {
    onBack: () => void;
    onNavigate: (view: string) => void;
}

// import { handlePayment } from '../common/PaymentService';

export const PassengerProfile: React.FC<PassengerProfileProps> = ({ onBack, onNavigate }) => {
    const { user, passengerBalance, depositToWallet, updateUser, logout, deleteAccount, trips } = useApp();
    /* Edit state removed - moved to EditProfile.tsx */
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* handleTopUp Removed */

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUser({ profileImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    /* Top Up Modal Removed */

    return (
        <div className="bg-gray-50 min-h-screen pb-24 relative">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* Hero Background - Passenger Theme Abstract */}
            <div className={`transition-all duration-500 ease-in-out h-[45vh] rounded-b-[40px] relative overflow-hidden shadow-lg group bg-[var(--pass-primary)]`}>
                {/* Abstract geometric shapes similar to login screen */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-white/10 skew-y-3 origin-bottom-left"></div>
                <div className="absolute bottom-10 right-0 w-full h-24 bg-white/10 -skew-y-3 origin-bottom-right"></div>

                {/* Subtle Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <div className="p-6 pt-10 relative z-10 text-white">
                    <div className="flex justify-between items-start mb-6">
                        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition border border-white/10">
                            <ChevronDown className="rotate-90 text-white" />
                        </button>
                    </div>

                    <div className="flex flex-row items-center gap-6 mt-6 px-2">
                        <div className="w-24 h-24 bg-white p-1 rounded-full shadow-2xl relative flex-shrink-0">
                            <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-pass-primary text-3xl font-black">
                                        {user?.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={triggerImageUpload}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white border-2 border-white rounded-full flex items-center justify-center hover:bg-gray-800 transition shadow-lg"
                            >
                                <Camera size={14} />
                            </button>
                        </div>

                        <div className="text-left flex-1">
                            <h1 className="text-2xl font-black leading-tight tracking-tight drop-shadow-md mb-2">{user?.name}</h1>
                            <div className="flex flex-col items-start gap-1.5 opacity-90">
                                <p className="text-white text-sm flex items-center gap-2 font-bold bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                                    <Phone size={14} /> +91 {user?.mobile}
                                </p>
                                <p className="text-white text-xs flex items-center gap-2 font-medium bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                                    <Mail size={12} /> {user?.email || 'user@example.com'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cards Container */}
            <div className="px-5 -mt-16 relative z-20 space-y-6 animate-in slide-in-from-bottom-10 duration-500 fade-in">

                {/* Statistics Row */}
                <div className="grid grid-cols-3 gap-3">
                    {(() => {
                        const myTrips = trips || []; // Access trips from context
                        const completed = myTrips.filter(t => t.status === 'COMPLETED').length;
                        const cancelled = myTrips.filter(t => t.status === 'CANCELLED').length;
                        const total = completed + cancelled;
                        const honestyScore = total === 0 ? 100 : Math.round((completed / total) * 100);

                        let scoreColor = 'text-green-500';
                        if (honestyScore < 70) scoreColor = 'text-red-500';
                        else if (honestyScore < 90) scoreColor = 'text-yellow-500';

                        return (
                            <>
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <p className="text-xl font-black text-[var(--pass-primary)]">{completed}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Completed</p>
                                </div>
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <p className="text-xl font-black text-red-500">{cancelled}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Cancelled</p>
                                </div>
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <p className={`text-xl font-black ${scoreColor}`}>{honestyScore}%</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Honesty Score</p>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Wallet Card - HIDDEN */}
                {/* <div className="bg-white p-2 rounded-3xl shadow-card"> ... </div> */}

                {/* Transaction List - HIDDEN */}
                {/* <div> ... </div> */}

                {/* Simplified Menu Grid */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-2 tracking-wider">My Toolkit</h4>
                    <div className="grid grid-cols-1 gap-4">


                        {/* Edit Profile */}
                        <button
                            onClick={() => onNavigate('edit-profile')}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-3xl shadow-lg hover:shadow-xl transition flex items-center gap-4 text-left group relative overflow-hidden text-white"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition relative z-10 backdrop-blur-sm">
                                <Edit3 size={22} />
                            </div>
                            <div className="relative z-10 flex-1">
                                <h4 className="font-bold text-lg">Edit Profile</h4>
                                <p className="text-xs text-white/80 font-medium">Update your details</p>
                            </div>
                            <ChevronRight className="text-white/50" />
                        </button>

                        {/* Ask Me (Gemini) */}
                        <button
                            onClick={() => onNavigate('gemini-chat')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 rounded-3xl shadow-lg hover:shadow-xl transition flex items-center gap-4 text-left group relative overflow-hidden text-white"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition relative z-10 backdrop-blur-sm">
                                <Bot size={24} />
                            </div>
                            <div className="relative z-10 flex-1">
                                <h4 className="font-bold text-lg">Ask Me</h4>
                                <p className="text-xs text-white/80 font-medium">AI Support Assistant</p>
                            </div>
                            <ChevronRight className="text-white/50" />
                        </button>
                    </div>
                </div>

                <div className="pt-6 pb-8">
                    <button
                        onClick={logout}
                        className="w-full bg-[#E02E49] text-black py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={22} /> LOGOUT
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                deleteAccount();
                            }
                        }}
                        className="w-full mt-4 text-red-500 py-3 rounded-2xl font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} /> Delete Account
                    </button>

                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center mt-6">Taxi Booking Ladakh v2.2</p>
                </div>
            </div>
        </div>
    );
};
