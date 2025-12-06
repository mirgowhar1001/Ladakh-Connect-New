import React, { useState } from 'react';
import { X, CreditCard, Wallet, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount?: number; // Optional pre-filled amount
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount: initialAmount }) => {
    const { depositToWallet } = useApp();
    const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [method, setMethod] = useState<'CARD' | 'UPI'>('UPI');

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!amount || isNaN(Number(amount))) return;

        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        depositToWallet(Number(amount));
        setLoading(false);
        setSuccess(true);

        // Close after success animation
        setTimeout(() => {
            setSuccess(false);
            setAmount('');
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                    >
                        <X size={18} />
                    </button>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Wallet className="text-mmt-red" /> Add Money
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Secure Payment Gateway</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Payment Successful!</h3>
                            <p className="text-gray-500 mt-2">₹{amount} added to your wallet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</label>
                                <div className="flex items-center border-b-2 border-gray-200 focus-within:border-mmt-red transition-colors py-2 mt-1">
                                    <span className="text-2xl font-bold text-gray-400 mr-2">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full text-3xl font-bold text-gray-800 outline-none placeholder-gray-200"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Method</label>

                                <button
                                    onClick={() => setMethod('UPI')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${method === 'UPI' ? 'border-mmt-red bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100">
                                        <span className="font-bold text-xs text-gray-600">UPI</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-gray-800">UPI / GPay / PhonePe</p>
                                        <p className="text-xs text-gray-400">Fastest way to pay</p>
                                    </div>
                                    {method === 'UPI' && <CheckCircle2 size={20} className="text-mmt-red" />}
                                </button>

                                <button
                                    onClick={() => setMethod('CARD')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${method === 'CARD' ? 'border-mmt-red bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100">
                                        <CreditCard size={20} className="text-gray-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-gray-800">Credit / Debit Card</p>
                                        <p className="text-xs text-gray-400">Visa, Mastercard, RuPay</p>
                                    </div>
                                    {method === 'CARD' && <CheckCircle2 size={20} className="text-mmt-red" />}
                                </button>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={loading || !amount}
                                className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : `Pay ₹${amount || '0'}`}
                            </button>
                        </>
                    )}
                </div>

                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium">
                        <ShieldCheck size={14} />
                        Payments are secure and encrypted
                    </div>
                </div>
            </div>
        </div>
    );
};
