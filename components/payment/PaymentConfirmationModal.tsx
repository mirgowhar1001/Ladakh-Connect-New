import React from 'react';
import { Trip } from '../../types';
import { ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentConfirmationModalProps {
    trip: Trip;
    onConfirm: () => void;
    onClose: () => void; // Although usually we force confirmation, we might want a way to dismiss if needed (though flow suggests it should be persistent until paid)
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({ trip, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">

                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <ShieldCheck size={40} className="text-green-600" />
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2">Ride Completed?</h3>
                <p className="text-gray-500 text-sm mb-6 px-4">
                    Your driver <span className="font-bold text-gray-800">{trip.driverName}</span> has marked the ride as complete.
                    Please confirm to release the payment of <span className="font-bold text-black">₹{trip.cost}</span>.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 font-bold uppercase">Amount</span>
                        <span className="text-xl font-black text-gray-900">₹{trip.cost}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold bg-green-100 p-2 rounded-lg">
                        <CheckCircle size={12} /> Funds will be transferred securely.
                    </div>
                </div>

                <button
                    onClick={onConfirm}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2"
                >
                    Yes, Release Payment
                </button>

                <button
                    onClick={onClose}
                    className="mt-4 text-xs text-gray-400 font-bold hover:text-gray-600"
                >
                    Not yet arrived? Report Issue
                </button>
            </div>
        </div>
    );
};
