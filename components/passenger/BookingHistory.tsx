import React, { useState } from 'react';
import { Trip } from '../../types';
import { useApp } from '../../context/AppContext';
import { MapPin, Calendar, Clock, MessageCircle, FileText, CheckCircle, XCircle, Star } from 'lucide-react';
import { InvoiceModal } from '../common/InvoiceModal';
import { ChatScreen } from '../common/ChatScreen';

interface BookingHistoryProps {
    trips: Trip[];
    onChat: (tripId: string) => void;
}

export const BookingHistory: React.FC<BookingHistoryProps> = ({ trips, onChat }) => {
    const { updateTripStatus, rateTrip, confirmRideCompletion } = useApp();
    const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
    const [selectedInvoiceTrip, setSelectedInvoiceTrip] = useState<Trip | null>(null);
    const [ratingModal, setRatingModal] = useState<{ tripId: string, rating: number } | null>(null);

    const { user } = useApp(); // Need user context for filtering

    const filteredTrips = trips
        .filter(trip => trip.passengerUid === user?.uid) // PRIVACY FIX: Only show current user's trips
        .filter(trip => {
            if (activeTab === 'UPCOMING') return trip.status === 'BOOKED' || trip.status === 'WAITING_CONFIRMATION' || trip.status === 'CONFIRMED' || trip.status === 'EN_ROUTE' || trip.status === 'ARRIVED';
            if (activeTab === 'COMPLETED') return trip.status === 'COMPLETED';
            if (activeTab === 'CANCELLED') return trip.status === 'CANCELLED';
            return false;
        });

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner overflow-x-auto no-scrollbar gap-2">
                {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 px-4 rounded-xl text-sm font-black transition-all whitespace-nowrap uppercase tracking-wide ${activeTab === tab ? 'bg-white shadow-md text-[var(--pass-primary)] scale-105' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4 pb-20">
                {filteredTrips.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="text-gray-300" size={24} />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No {activeTab.toLowerCase()} bookings found.</p>
                    </div>
                ) : (

                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-gray-200 border-l border-dashed"></div>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="font-bold text-gray-800">{trip.from}</p>
                                <p className="text-xs text-gray-400">{new Date(trip.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{trip.to}</p>
                            </div>
                        </div>
                    </div>



                            {/* Post-Ride Confirmation: Removed as per "Zero Payment" flow */}

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">
                            {trip.driverName?.[0] || 'D'}
                        </div>
                        <div>
                            <p className="text-lg font-black text-gray-800">{trip.driverName || 'Assigned Driver'}</p>
                            <p className="text-xs text-gray-600 font-bold mt-0.5">{trip.vehicleNo} • {trip.driverMobile || 'No Mobile'}</p>
                        </div>
                    </div>

                    {activeTab === 'UPCOMING' && (
                        <div className="flex gap-4 items-center">
                            {trip.status === 'WAITING_CONFIRMATION' ? (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to cancel this booking request?')) {
                                            updateTripStatus(trip.id, 'CANCELLED');
                                        }
                                    }}
                                    className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-red-600 transition flex items-center justify-center gap-2"
                                >
                                    <XCircle size={18} /> CANCEL RIDE
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    {trip.status !== 'EN_ROUTE' && trip.status !== 'ARRIVED' && trip.status !== 'COMPLETED' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                                                        updateTripStatus(trip.id, 'CANCELLED');
                                                    }
                                                }}
                                                className="bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 p-3 rounded-full transition"
                                                title="Cancel Booking"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                            <span className="text-[10px] font-bold text-gray-400">Cancel</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'COMPLETED' && (
                        <div className="flex gap-2">
                            {!trip.userRating && (
                                <button
                                    onClick={() => setRatingModal({ tripId: trip.id, rating: 5 })}
                                    className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-yellow-200 transition"
                                >
                                    <Star size={14} fill="currentColor" /> Rate
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedInvoiceTrip(trip)}
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition"
                            >
                                <FileText size={14} /> Invoice
                            </button>
                        </div>
                    )}
                </div>
            </div>
            ))
                )}
        </div>

            {
        selectedInvoiceTrip && (
            <InvoiceModal trip={selectedInvoiceTrip} onClose={() => setSelectedInvoiceTrip(null)} />
        )
    }

    {/* Rating Modal */ }
    {
        ratingModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
                    <h3 className="font-bold text-lg mb-2">Rate your Driver</h3>
                    <p className="text-gray-500 text-xs mb-6">How was your ride?</p>

                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setRatingModal({ ...ratingModal, rating: star })}
                                className="transition-all hover:scale-110"
                            >
                                <Star
                                    size={32}
                                    fill={star <= ratingModal.rating ? "#FFD700" : "none"}
                                    className={star <= ratingModal.rating ? "text-yellow-400" : "text-gray-300"}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setRatingModal(null)}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                        >
                            Skip
                        </button>
                        <button
                            onClick={() => {
                                rateTrip(ratingModal.tripId, ratingModal.rating);
                                setRatingModal(null);
                                alert("Thanks for your feedback!");
                            }}
                            className="flex-1 bg-mmt-blue text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        )
    }
        </div >
    );
};
