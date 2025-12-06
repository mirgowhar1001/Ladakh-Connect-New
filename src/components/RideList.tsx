import React, { useState } from 'react';
import type { Ride } from '../data/mockData';
import { UserRole, RideStatus, Booking } from '../types';

interface RideListProps {
    rides: Ride[];
    userRole?: UserRole;
    onBookRide?: (rideId: string, seats: number) => void;
    onCloseBooking?: (rideId: string) => void;
    statuses?: Record<string, RideStatus>;
    bookings?: Booking[];
}

export const RideList: React.FC<RideListProps> = ({ rides, userRole = 'PASSENGER', onBookRide, onCloseBooking, statuses = {}, bookings = [] }) => {
    const [expandedRideId, setExpandedRideId] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Record<string, number>>({});

    const toggleExpand = (rideId: string) => {
        setExpandedRideId(prev => prev === rideId ? null : rideId);
    };

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
                const rideStatus = statuses[ride.id] || 'OPEN';
                const isCompleted = rideStatus === 'COMPLETED';

                // Calculate available seats properly
                const sessionBookedSeats = bookings
                    .filter(b => b.rideId === ride.id && b.status === 'CONFIRMED')
                    .reduce((sum, b) => sum + (b.seats || 1), 0);

                const totalBooked = ride.seatsBooked + sessionBookedSeats;
                const seatsAvailable = Math.max(0, ride.seatsTotal - totalBooked);
                const isFull = seatsAvailable === 0;

                if (isCompleted && userRole === 'DRIVER') {
                    const rideBookings = bookings.filter(b => b.rideId === ride.id && (b.status === 'CONFIRMED' || b.status === 'PENDING'));
                    const isExpanded = expandedRideId === ride.id;

                    // Support expandable view for completed rides
                    return (
                        <div
                            key={ride.id}
                            className={`card bg-slate-50 border-slate-200 transition-all cursor-pointer hover:bg-slate-100 ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}
                            onClick={() => toggleExpand(ride.id)}
                        >
                            <div className="flex justify-between items-center p-4">
                                <div>
                                    <h3 className="font-bold text-slate-700">{ride.from} → {ride.to}</h3>
                                    <p className="text-sm text-slate-500">{ride.date} • {ride.time}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-1 rounded">Completed</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="p-4 pt-0 border-t border-slate-200 mt-2 bg-white mx-2 mb-2 rounded shadow-inner" onClick={(e) => e.stopPropagation()}>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2 mt-3">Passenger List</h4>
                                    {rideBookings.length > 0 ? (
                                        <ul className="space-y-2">
                                            {rideBookings.map(booking => (
                                                <li key={booking.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                                                    <div>
                                                        <span className="font-medium text-slate-900">{booking.passengerName}</span>
                                                        <span className="text-xs text-slate-500 ml-2">ID: {booking.id.slice(0, 6)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                            {booking.seats || 1} {booking.seats > 1 ? 'seats' : 'seat'}
                                                        </span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No passengers booked for this ride.</p>
                                    )}
                                </div>
                            )}
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
                                        {seatsAvailable} seats left
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
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {!isCompleted && !isFull && (
                                        <select
                                            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
                                            value={selectedSeats[ride.id] || 1}
                                            onChange={(e) => setSelectedSeats(prev => ({ ...prev, [ride.id]: parseInt(e.target.value) }))}
                                        >
                                            {[...Array(seatsAvailable)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        onClick={() => onBookRide && onBookRide(ride.id, selectedSeats[ride.id] || 1)}
                                        disabled={isFull || isCompleted}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isFull || isCompleted
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'btn-primary'
                                            }`}
                                    >
                                        {isCompleted ? 'Ride Completed' : isFull ? 'Full' : 'Book Seat'}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
    );
};
