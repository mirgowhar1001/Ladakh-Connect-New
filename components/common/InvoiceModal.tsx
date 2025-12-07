import React from 'react';
import { X, Printer, MapPin, Calendar, Clock } from 'lucide-react';
import { Trip } from '../../types';

interface InvoiceModalProps {
    trip: Trip;
    onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ trip, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gray-50 p-4 flex items-center justify-between border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Trip Invoice</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Invoice Content */}
                <div className="p-4 space-y-4" id="invoice-content">
                    <div className="text-center border-b border-gray-100 pb-4">
                        <h1 className="text-2xl font-black text-violet-600 tracking-tight uppercase">LADAKH TAXI</h1>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Official Receipt</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Passenger Details */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Passenger</p>
                            <p className="font-bold text-gray-800 text-xs">{trip.passengerId}</p>
                            <p className="text-[10px] text-gray-500 font-mono">+91 {trip.passengerMobile || 'N/A'}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">#{trip.id.slice(0, 8).toUpperCase()}</p>
                        </div>

                        {/* Driver Details */}
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Driver</p>
                            <p className="font-bold text-gray-800 text-xs">{trip.driverName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">+91 {trip.driverMobile || 'N/A'}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{trip.vehicleType} <span className="font-black text-gray-800">{trip.vehicleNo}</span></p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Date</p>
                            <p className="font-bold text-gray-800 text-sm">{new Date(trip.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Time</p>
                            {/* Assuming trip might have time, else hide */}
                            <p className="font-bold text-gray-800 text-sm">{(trip as any).time || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <p className="font-bold text-gray-700 text-sm">{trip.from}</p>
                        </div>
                        <div className="border-l-2 border-gray-200 h-3 ml-0.5"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <p className="font-bold text-gray-700 text-sm">{trip.to}</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Base Fare</span>
                            <span className="font-bold">₹{trip.cost}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Taxes & Fees</span>
                            <span className="font-bold">₹0</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-2"></div>
                        <div className="flex justify-between text-base">
                            <span className="font-bold text-gray-800">Total Paid</span>
                            <span className="font-extrabold text-blue-600">₹{trip.cost}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        <Printer size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
};
