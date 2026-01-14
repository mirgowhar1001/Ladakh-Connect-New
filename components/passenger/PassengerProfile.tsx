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
        <div className="bg-[var(--pass-bg)] min-h-screen pb-24 relative text-white">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* Hero Background - Passenger Theme Abstract */}
            <div className={`transition-all duration-500 ease-in-out h-[45vh] rounded-b-[40px] relative overflow-hidden shadow-2xl group bg-[var(--pass-primary)]`}>
                {/* Abstract geometric shapes */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-black/10 skew-y-3 origin-bottom-left"></div>
                <div className="absolute bottom-10 right-0 w-full h-24 bg-white/5 -skew-y-3 origin-bottom-right"></div>

                {/* Subtle Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <div className="p-6 pt-10 relative z-10 text-white">
                    <div className="flex justify-between items-start mb-6">
                        <button onClick={onBack} className="bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md transition border border-white/10">
                            <ChevronDown className="rotate-90 text-white" />
                        </button>
                    </div>

                    <div className="flex flex-row items-center gap-6 mt-6 px-2">
                        <div className="w-24 h-24 bg-white/10 p-1 rounded-full shadow-2xl relative flex-shrink-0 backdrop-blur-sm border border-white/20">
                            <div className="w-full h-full bg-gray-900 rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-pass-primary text-3xl font-black">
                                        {user?.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={triggerImageUpload}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--pass-primary)] text-white border-2 border-gray-900 rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg"
                            >
                                <Camera size={14} />
                            </button>
                        </div>

                        <div className="text-left flex-1">
                            <h1 className="text-2xl font-black leading-tight tracking-tight drop-shadow-md mb-2">{user?.name}</h1>
                            <div className="flex flex-col items-start gap-1.5 opacity-90">
                                <p className="text-white text-sm flex items-center gap-2 font-bold bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                    <Phone size={14} className="text-[var(--pass-primary)]" /> +91 {user?.mobile}
                                </p>
                                <p className="text-white text-xs flex items-center gap-2 font-medium bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                    <Mail size={12} className="text-[var(--pass-primary)]" /> {user?.email || 'user@example.com'}
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

                        let scoreColor = 'text-green-400';
                        if (honestyScore < 70) scoreColor = 'text-red-400';
                        else if (honestyScore < 90) scoreColor = 'text-yellow-400';

                        return (
                            <>
                                <div className="bg-[var(--pass-card)] p-3 rounded-2xl shadow-xl border border-white/5 text-center">
                                    <p className="text-xl font-black text-[var(--pass-primary)]">{completed}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Completed</p>
                                </div>
                                <div className="bg-[var(--pass-card)] p-3 rounded-2xl shadow-xl border border-white/5 text-center">
                                    <p className="text-xl font-black text-red-500">{cancelled}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Cancelled</p>
                                </div>
                                <div className="bg-[var(--pass-card)] p-3 rounded-2xl shadow-xl border border-white/5 text-center">
                                    <p className={`text-xl font-black ${scoreColor}`}>{honestyScore}%</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Honesty Score</p>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Simplified Menu Grid */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 ml-2 tracking-wider">My Toolkit</h4>
                    <div className="grid grid-cols-1 gap-4">


                        {/* Edit Profile */}
                        <button
                            onClick={() => onNavigate('edit-profile')}
                            className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-5 rounded-3xl shadow-lg hover:shadow-xl transition flex items-center gap-4 text-left group relative overflow-hidden text-white border border-green-500/20"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 group-hover:scale-110 transition relative z-10 backdrop-blur-sm border border-green-500/20">
                                <Edit3 size={22} />
                            </div>
                            <div className="relative z-10 flex-1">
                                <h4 className="font-bold text-lg">Edit Profile</h4>
                                <p className="text-xs text-gray-400 font-medium">Update your details</p>
                            </div>
                            <ChevronRight className="text-gray-600" />
                        </button>

                        {/* Ask Me (Gemini) */}
                        <button
                            onClick={() => onNavigate('gemini-chat')}
                            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-5 rounded-3xl shadow-lg hover:shadow-xl transition flex items-center gap-4 text-left group relative overflow-hidden text-white border border-blue-500/20"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition relative z-10 backdrop-blur-sm border border-blue-500/20">
                                <Bot size={24} />
                            </div>
                            <div className="relative z-10 flex-1">
                                <h4 className="font-bold text-lg">Ask Me</h4>
                                <p className="text-xs text-gray-400 font-medium">AI Support Assistant</p>
                            </div>
                            <ChevronRight className="text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="pt-6 pb-8">
                    <button
                        onClick={logout}
                        className="w-full bg-[var(--pass-cta)] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-900/20 hover:opacity-90 transition flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        <LogOut size={22} /> LOGOUT
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                deleteAccount();
                            }
                        }}
                        className="w-full mt-4 text-red-500/70 py-3 rounded-2xl font-bold text-sm hover:bg-red-500/5 transition flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} /> Delete Account
                    </button>

                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center mt-6">Taxi Booking Ladakh v2.2</p>
                </div>
            </div>
        </div>
    );
};
