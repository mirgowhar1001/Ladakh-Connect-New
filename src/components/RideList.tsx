import React from 'react';
import type { Ride } from '../data/mockData';
import { UserRole, RideStatus } from '../types';

interface RideListProps {
    rides: Ride[];
    userRole?: UserRole;
    onBookRide?: (rideId: string) => void;
    onCloseBooking?: (rideId: string) => void;
    statuses?: Record<string, RideStatus>;
}

export const RideList: React.FC<RideListProps> = ({ rides, userRole = 'PASSENGER', onBookRide, onCloseBooking, statuses = {} }) => {
    if (rides.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                <p className="text-lg font-medium">No rides found matching your criteria.</p>
                <p className="text-sm">Try using different keywords or dates.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {rides.map((ride) => {
                const isFull = ride.seatsBooked >= ride.seatsTotal;
                const status = statuses[ride.id] || 'OPEN';
                const isCompleted = status === 'COMPLETED';

                if (isCompleted && userRole === 'DRIVER') {
                    // Simplified view for completed rides in driver dashboard
                    return (
                        <div key={ride.id} className="card bg-slate-50 border-slate-200 opacity-75">
                            <div className="flex justify-between items-center p-4">
                                <div>
                                    <h3 className="font-bold text-slate-700">{ride.from} → {ride.to}</h3>
                                    <p className="text-sm text-slate-500">{ride.date} • {ride.time}</p>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-1 rounded">Completed</span>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={ride.id} className="card hover:shadow-md transition-shadow relative overflow-hidden group">
                        {/* Status Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} />

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                            {/* Route & Time Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{ride.date}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-accent bg-sky-50 px-2 py-0.5 rounded">{ride.time}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {ride.from}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                    {ride.to}
                                </h3>

                                <div className="mt-2 flex items-center gap-4 text-slate-600 text-sm">
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a2.5 2.5 0 014.9 0H16a1 1 0 001-1V5a1 1 0 00-1-1h-2.5C13.5 4 13.5 1.5 10 1.5S6.5 4 6.5 4H3z" />
                                        </svg>
                                        <span>{ride.vehicle} <span className="text-slate-400">({ride.vehicleNumber})</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Price & Seats */}
                            <div className="flex flex-col sm:items-end gap-1">
                                <div className="text-2xl font-bold text-slate-800">₹{ride.price}</div>
                                <div className="flex items-center gap-1 text-sm">
                                    <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {ride.seatsTotal - ride.seatsBooked} seats left
                                    </span>
                                    <span className="text-slate-400 text-xs">/ {ride.seatsTotal} total</span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-100 my-3" />

                        {/* Driver Info & Action */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                    {ride.driverName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">{ride.driverName}</span>
                                    <span className="text-xs text-slate-500">{ride.driverMobile}</span>
                                </div>
                            </div>

                            {userRole === 'DRIVER' ? (
                                <button
                                    onClick={() => onCloseBooking && onCloseBooking(ride.id)}
                                    className="w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    Close Booking
                                </button>
                            ) : (
                                <button
                                    onClick={() => onBookRide && onBookRide(ride.id)}
                                    disabled={isFull || isCompleted}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isFull || isCompleted
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'btn-primary'
                                        }`}
                                >
                                    {isCompleted ? 'Ride Completed' : isFull ? 'Full' : 'Book Seat'}
                                </button>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
    );
};
