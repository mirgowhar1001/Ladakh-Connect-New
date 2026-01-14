import React from 'react';
import { X, Printer, Download, Car } from 'lucide-react';
import { Trip } from '../../types';

interface InvoiceModalProps {
    trip: Trip;
    onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ trip, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0 print:static">
            <div className="bg-white text-black w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative print:shadow-none print:w-full print:max-w-none print:rounded-none">

                {/* Actions Header (Hidden on Print) */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">Trip Invoice</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition"
                        >
                            <Printer size={16} /> Print / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="p-8 print:p-0" id="invoice-content">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Ladakh Taxi</h1>
                            <p className="text-sm text-gray-500 font-medium">Premium Ride Services</p>
                            <p className="text-xs text-gray-400 mt-1">support@ladakhtaxi.com | +91 999 999 9999</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-400 uppercase">Invoice #</p>
                            <p className="font-mono font-bold text-xl">{trip.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-sm font-bold text-gray-400 uppercase mt-2">Date</p>
                            <p className="font-medium">{new Date(trip.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Trip Route */}
                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100 print:border-gray-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From</p>
                                <p className="text-xl font-black">{trip.from}</p>
                                <p className="text-sm text-gray-500 font-medium">{trip.time}</p>
                            </div>
                            <div className="flex-1 px-8 text-center text-gray-300">
                                ------------------&gt;
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">To</p>
                                <p className="text-xl font-black">{trip.to}</p>
                                <p className="text-sm text-gray-500 font-medium">{new Date(trip.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Passenger Info */}
                        <div>
                            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 border-b pb-2">Passenger Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Name</p>
                                    <p className="font-bold">{trip.passengerName || "Guest User"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Mobile</p>
                                    <p className="font-bold font-mono">{trip.passengerMobile || trip.passengerUid || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Seats Booked</p>
                                    <p className="font-bold">{trip.seats.join(', ')} ({trip.seats.length} Seats)</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver Info */}
                        <div>
                            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 border-b pb-2">Driver & Vehicle</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Driver Name</p>
                                    <p className="font-bold">{trip.driverName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Driver Mobile</p>
                                    <p className="font-bold font-mono">{trip.driverMobile || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Vehicle</p>
                                    <p className="font-bold flex items-center gap-1">
                                        {trip.vehicleType}
                                        <span className="bg-black text-white text-[10px] px-1.5 rounded py-0.5 ml-1 font-mono">{trip.vehicleNo}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="border-t-2 border-black pt-6">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-gray-600">Base Fare (x{trip.seats.length} seats)</span>
                            <span className="font-mono font-bold">₹ {trip.cost}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-4">
                            <span className="text-gray-600">Service Charges / Tax</span>
                            <span className="font-mono font-bold text-gray-400">₹ 0</span>
                        </div>
                        <div className="flex justify-between items-center text-xl border-t border-dashed border-gray-300 pt-4">
                            <span className="font-black uppercase">Total Amount Paid</span>
                            <span className="font-black font-mono">₹ {trip.cost}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-8 text-center uppercase tracking-widest">
                            Generated by Ladakh Taxi • Safe Travels
                        </p>
                    </div>

                </div>
            </div>

            {/* Print Styles */}
            <style>
                {`
          @media print {
            body * {
              visibility: hidden;
            }
            .fixed {
              position: static;
              background: white;
            }
            #invoice-content, #invoice-content * {
              visibility: visible;
            }
            #invoice-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
            }
            @page {
              margin: 0;
            }
          }
        `}
            </style>
        </div>
    );
};
