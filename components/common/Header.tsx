import React from 'react';
import { ChevronRight, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  theme?: 'dark' | 'light';
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showBack, onBack, rightAction, theme = 'dark', onProfileClick }) => (
  <div className={`flex items-center p-4 sticky top-0 z-50 shadow-md ${theme === 'dark' ? 'bg-violet-600 text-white' : 'bg-white text-gray-800'}`}>
    {showBack && (
      <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-black/10 transition">
        <ChevronRight className="rotate-180" size={28} />
      </button>
    )}
    <div className="flex-1">
      <h1 className="text-xl font-black leading-tight">{title}</h1>
      {subtitle && <p className={`text-sm font-bold mt-0.5 ${theme === 'dark' ? 'text-white/90' : 'text-gray-500'}`}>{subtitle}</p>}
    </div>
    {rightAction ? rightAction : (
      <button onClick={onProfileClick} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
        <User size={24} className={theme === 'dark' ? 'text-white' : 'text-gray-600'} />
      </button>
    )}
  </div>
);