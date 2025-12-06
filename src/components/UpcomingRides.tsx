import React from 'react';
import { Booking, BookingStatus } from '../types';
import { Ride } from '../data/mockData';

interface UpcomingRidesProps {
    bookings: Booking[];
    rides: Ride[];
    onCancelBooking: (bookingId: string) => void;
}

export const UpcomingRides: React.FC<UpcomingRidesProps> = ({ bookings, rides, onCancelBooking }) => {
    if (bookings.length === 0) return null;

    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Upcoming Rides</h2>
            <div className="space-y-3">
                {bookings.map(booking => {
                    const ride = rides.find(r => r.id === booking.rideId);
                    if (!ride) return null;

                    const isConfirmed = booking.status === 'CONFIRMED';
                    const isRejected = booking.status === 'REJECTED';

                    return (
                        <div key={booking.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {ride.from}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        {ride.to}
                                    </h3>
                                    <p className="text-sm text-slate-500">{ride.date} at {ride.time}</p>
                                </div>
                                <StatusBadge status={booking.status} />
                            </div>

                            <div className="mt-3 flex gap-3">
                                {isConfirmed ? (
                                    <button className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm cursor-default">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Seat Confirmed
                                    </button>
                                ) : !isRejected && (
                                    <button
                                        onClick={() => onCancelBooking(booking.id)}
                                        className="flex-1 bg-red-100 text-red-700 text-sm font-bold py-2 rounded-lg hover:bg-red-200 transition-colors border border-red-200"
                                    >
                                        CANCEL
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
    switch (status) {
        case 'CONFIRMED':
            return <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Confirmed</span>;
        case 'PENDING':
            return <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded">Pending</span>;
        case 'REJECTED':
            return <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded">Rejected</span>;
    }
};
