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
            <div className="flex bg-[var(--pass-card)] p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar gap-2">
                {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 px-4 rounded-xl text-sm font-black transition-all whitespace-nowrap uppercase tracking-wide ${activeTab === tab ? 'bg-[var(--pass-primary)] shadow-lg shadow-purple-900/50 text-white scale-105' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
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
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="text-gray-600" size={24} />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">No {activeTab.toLowerCase()} bookings found.</p>
                    </div>
                ) : (
                    filteredTrips.map(trip => (
                        <div key={trip.id} className="bg-[var(--pass-card)] rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden group">
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pass-primary)]/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

                            {/* Header: Status Indicators */}
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex items-center gap-2">
                                    {(trip.status === 'COMPLETED' || activeTab === 'COMPLETED') ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                                            <span className="text-sm font-bold text-blue-500">Completed</span>
                                        </div>
                                    ) : (['CANCELLED', 'REJECTED'].includes(trip.status) || activeTab === 'CANCELLED') ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                                            <span className="text-sm font-bold text-red-500">Cancelled</span>
                                        </div>
                                    ) : ['CONFIRMED', 'EN_ROUTE', 'ARRIVED'].includes(trip.status) ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
                                            <span className="text-sm font-bold text-green-500">Confirmed</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                                            <span className="text-sm font-bold text-gray-500">Waiting Confirmation</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-600 font-mono absolute top-2 right-2">#{trip.id.slice(0, 6).toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Route Details */}
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <div className="w-0.5 h-10 bg-gray-700 border-l border-dashed border-gray-600"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                </div>
                                <div className="flex-1 space-y-5">
                                    <div>
                                        <p className="font-black text-lg text-white leading-none mb-1">{trip.from}</p>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{new Date(trip.date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="font-black text-lg text-white leading-none">{trip.to}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center font-black text-sm text-gray-400 border border-white/5">
                                        {trip.driverName?.[0] || 'D'}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-white leading-tight">{trip.driverName || 'Assigned Driver'}</p>
                                        <p className="text-[10px] text-gray-500 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-wider">
                                            {trip.vehicleNo}
                                            {trip.driverMobile ? (
                                                <> • <span className="text-[var(--pass-primary)]">{trip.driverMobile}</span></>
                                            ) : (
                                                <> • <span className="text-gray-600">No Mobile</span></>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-center">
                                    {trip.status === 'COMPLETED' && (
                                        <button
                                            onClick={() => setSelectedInvoiceTrip(trip)}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition flex items-center gap-2"
                                        >
                                            <FileText size={14} className="text-[var(--pass-primary)]" /> Invoice
                                        </button>
                                    )}

                                    {activeTab === 'UPCOMING' && trip.status === 'WAITING_CONFIRMATION' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to cancel this booking request?')) {
                                                    updateTripStatus(trip.id, 'CANCELLED');
                                                }
                                            }}
                                            className="text-red-500 hover:scale-110 transition p-2 bg-red-500/10 rounded-full"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    )}
                                </div>
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

            {/* Rating Modal */}
            {
                ratingModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[var(--pass-card)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center border border-gray-700">
                            <h3 className="font-bold text-lg mb-2 text-white">Rate your Driver</h3>
                            <p className="text-gray-400 text-xs mb-6">How was your ride?</p>

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
                                            className={star <= ratingModal.rating ? "text-yellow-400" : "text-gray-600"}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRatingModal(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-white/5 transition"
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
