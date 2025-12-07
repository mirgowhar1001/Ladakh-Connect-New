import React from 'react';
import { User, CreditCard, Ticket, HelpCircle, LogOut, X, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate }) => {
    const { user, logout } = useApp();

    const isDriver = user?.role === 'owner';
    const headerGradient = isDriver ? 'bg-[var(--driver-bg)]' : 'bg-[var(--pass-primary)]';
    const hoverText = isDriver ? 'group-hover:text-[#7209b7]' : 'group-hover:text-[var(--pass-primary)]';
    const hoverIcon = isDriver ? 'group-hover:text-[#7209b7]' : 'group-hover:text-[var(--pass-primary)]';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Menu Content */}
            <div className="relative w-[80%] max-w-xs bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">

                {/* Header */}
                <div className={`${headerGradient} p-6 text-white pt-12`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
                            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">{user?.name || 'Guest'}</h2>
                            <p className="text-xs text-red-100 opacity-90">{user?.mobile}</p>
                        </div>
                    </div>

                    {user?.role === 'owner' && (
                        <span className="inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/10">
                            Vehicle Owner
                        </span>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 overflow-y-auto py-4">
                    <MenuItem
                        icon={<User size={20} />}
                        label="My Profile"
                        onClick={() => { onNavigate('profile'); onClose(); }}
                        hoverClass={hoverText}
                    />
                    <MenuItem
                        icon={<Ticket size={20} />}
                        label="My Trips"
                        onClick={() => { onNavigate('history'); onClose(); }}
                        hoverClass={hoverText}
                    />

                    <div className="my-2 border-t border-gray-100"></div>
                    <MenuItem
                        icon={<HelpCircle size={20} />}
                        label="Help & Support"
                        onClick={() => { onNavigate('support'); onClose(); }}
                        hoverClass={hoverText}
                    />
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={() => { logout(); onClose(); }}
                        className="w-full flex items-center justify-center gap-2 bg-[#E02E49] text-black py-4 rounded-xl font-bold shadow-lg hover:bg-red-600 transition"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                    <p className="text-center text-[10px] text-gray-300 mt-4 uppercase tracking-widest">
                        Taxi Booking Ladakh v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

const MenuItem = ({ icon, label, onClick, hoverClass }: { icon: React.ReactNode, label: string, onClick: () => void, hoverClass: string }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition group"
    >
        <div className={`flex items-center gap-4 text-gray-600 ${hoverClass}`}>
            {icon}
            <span className="font-bold text-sm">{label}</span>
        </div>
        <ChevronRight size={16} className={`text-gray-300 ${hoverClass}`} />
    </button>
);
