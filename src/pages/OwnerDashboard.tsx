import React, { useState, useMemo } from 'react';
import { MOCK_RIDES } from '../data/mockData';
import { RideList } from '../components/RideList';
import { RideFilter } from '../components/RideFilter';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { BookingConfirmation } from '../components/BookingConfirmation';
import { UpcomingRides } from '../components/UpcomingRides';
import type { Booking, UserRole, RideStatus } from '../types';

export const OwnerDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // New State for confirmation flow
    const [userRole, setUserRole] = useState<UserRole>('PASSENGER');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rideStatuses, setRideStatuses] = useState<Record<string, RideStatus>>({});

    // Filter Logic
    const filteredRides = useMemo(() => {
        return MOCK_RIDES.filter(ride => {
            const matchQuery =
                ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ride.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ride.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

            const matchDate = dateFilter ? ride.date === dateFilter : true;

            // For driver, show all rides they "own" (mocked as all for now/demo)
            // For passenger, filter out completed rides from main list optionally or keep them mark completed
            // Requirement: "automatically go from posted rides to completed section"
            const status = rideStatuses[ride.id] || 'OPEN';

            if (status === 'COMPLETED') {
                return false; // Don't show in main list
            }

            return matchQuery && matchDate;
        });
    }, [searchQuery, dateFilter, rideStatuses]);

    // Derived state for completed rides
    const completedRides = useMemo(() => {
        return MOCK_RIDES.filter(ride => rideStatuses[ride.id] === 'COMPLETED');
    }, [rideStatuses]);


    // Handlers
    const handleBookRide = (rideId: string) => {
        const newBooking: Booking = {
            id: Math.random().toString(36).substr(2, 9),
            rideId,
            passengerName: 'Current User', // Mocked
            status: 'PENDING'
        };
        setBookings(prev => [...prev, newBooking]);
    };

    const handleConfirmBooking = (bookingId: string) => {
        setBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b
        ));
    };

    const handleRejectBooking = (bookingId: string) => {
        setBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, status: 'REJECTED' } : b
        ));
    };

    const handleCloseBooking = (rideId: string) => {
        setRideStatuses(prev => ({
            ...prev,
            [rideId]: 'COMPLETED'
        }));
    };

    const handleCancelBooking = (bookingId: string) => {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
    };

    // Find pending bookings for the "driver" (mock logic: all pending bookings are for this driver)
    const pendingBookings = bookings.filter(b => b.status === 'PENDING');

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-20">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Ladakh Connect</h1>
                        <p className="text-xs text-slate-400">
                            {userRole === 'DRIVER' ? 'Driver Dashboard' : 'Passenger Dashboard'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <RoleSwitcher currentRole={userRole} onRoleChange={setUserRole} />
                        <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto p-4 relative">

                {/* Driver Confirmation Popups */}
                {userRole === 'DRIVER' && pendingBookings.length > 0 && (
                    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                        {/* Making it fixed bottom for better visibility or absolute for context */}
                        {/* Reusing the component but positioning might need tweak to specific design */}
                        {pendingBookings.map(booking => (
                            <div key={booking.id} className="pointer-events-auto">
                                <BookingConfirmation
                                    booking={booking}
                                    onConfirm={handleConfirmBooking}
                                    onReject={handleRejectBooking}
                                />
                            </div>
                        ))}
                    </div>
                )}


                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {userRole === 'DRIVER' ? 'My Posted Rides' : 'Available Rides'}
                    </h2>
                    <p className="text-slate-500">
                        {userRole === 'DRIVER'
                            ? 'Manage your rides and bookings.'
                            : 'Browse and manage your travel.'}
                    </p>
                </div>

                {userRole === 'PASSENGER' && (
                    <UpcomingRides
                        bookings={bookings}
                        rides={MOCK_RIDES}
                        onCancelBooking={handleCancelBooking}
                    />
                )}

                {/* Completed Rides Section */}
                {completedRides.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-700 mb-3 border-b pb-2">Completed Rides</h3>
                        <RideList
                            rides={completedRides}
                            userRole={userRole}
                            statuses={rideStatuses}
                        // No actions for completed rides
                        />
                    </div>
                )}

                <h3 className="text-lg font-bold text-slate-700 mb-3 border-b pb-2">
                    {userRole === 'DRIVER' ? 'Active Rides' : 'Book a Ride'}
                </h3>

                <RideFilter
                    onFilterChange={setSearchQuery}
                    onDateChange={setDateFilter}
                />

                <RideList
                    rides={filteredRides}
                    userRole={userRole}
                    onBookRide={handleBookRide}
                    onCloseBooking={handleCloseBooking}
                    statuses={rideStatuses}
                />
            </main>
        </div>
    );
};
