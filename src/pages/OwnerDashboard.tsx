import React, { useState, useMemo } from 'react';
import { MOCK_RIDES } from '../data/mockData';
import { RideList } from '../components/RideList';
import { RideFilter } from '../components/RideFilter';

export const OwnerDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredRides = useMemo(() => {
        return MOCK_RIDES.filter(ride => {
            const matchQuery =
                ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ride.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ride.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

            const matchDate = dateFilter ? ride.date === dateFilter : true;

            return matchQuery && matchDate;
        });
    }, [searchQuery, dateFilter]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-20">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Ladakh Connect</h1>
                        <p className="text-xs text-slate-400">Driver Dashboard</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600"></div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto p-4">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Available Rides</h2>
                    <p className="text-slate-500">Browse and manage rides posted by drivers.</p>
                </div>

                <RideFilter
                    onFilterChange={setSearchQuery}
                    onDateChange={setDateFilter}
                />

                <RideList rides={filteredRides} />
            </main>
        </div>
    );
};
