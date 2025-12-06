import React from 'react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
    return (
        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex gap-2">
            <button
                className={`flex-1 py-1 px-3 rounded text-sm font-medium transition-colors ${currentRole === 'DRIVER'
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                onClick={() => onRoleChange('DRIVER')}
            >
                Driver
            </button>
            <button
                className={`flex-1 py-1 px-3 rounded text-sm font-medium transition-colors ${currentRole === 'PASSENGER'
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                onClick={() => onRoleChange('PASSENGER')}
            >
                Passenger
            </button>
        </div>
    );
};
