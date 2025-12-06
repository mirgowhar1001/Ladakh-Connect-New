import React from 'react';

interface RideFilterProps {
    onFilterChange: (query: string) => void;
    onDateChange: (date: string) => void;
}

export const RideFilter: React.FC<RideFilterProps> = ({ onFilterChange, onDateChange }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4 mb-6 sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search destination, driver, vehicle..."
                        className="input-field pl-10"
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        type="date"
                        className="input-field sm:w-auto"
                        onChange={(e) => onDateChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};
