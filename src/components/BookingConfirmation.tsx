import React from 'react';
import { Booking } from '../types';

interface BookingConfirmationProps {
    booking: Booking;
    onConfirm: (bookingId: string) => void;
    onReject: (bookingId: string) => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ booking, onConfirm, onReject }) => {
    return (
        <div className="absolute top-16 left-4 right-4 z-50 animate-in slide-in-from-top-2">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm mx-auto">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900">New Booking Request</h4>
                        <p className="text-sm text-slate-600 mb-3">
                            <span className="font-medium text-slate-900">{booking.passengerName}</span> wants to book a seat.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onConfirm(booking.id)}
                                className="flex-1 bg-primary text-white text-sm font-medium py-1.5 px-3 rounded hover:bg-primary/90 transition-colors"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => onReject(booking.id)}
                                className="flex-1 bg-white text-slate-600 border border-slate-200 text-sm font-medium py-1.5 px-3 rounded hover:bg-slate-50 transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
