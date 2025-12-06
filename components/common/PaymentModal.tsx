import React, { useState } from 'react';
import { X, CreditCard, ArrowRight, ShieldCheck, IndianRupee, Building } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'deposit' | 'withdraw';
    balance: number;
    onConfirm: (amount: number, details: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, type, balance, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [bankDetails, setBankDetails] = useState({ accountNo: '', ifsc: '' });
    const [method, setMethod] = useState<'upi' | 'bank'>('upi');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const val = parseInt(amount);
        if (!val || val <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        if (type === 'withdraw' && val > balance) {
            alert("Insufficient balance");
            return;
        }
        if (type === 'withdraw') {
            if (method === 'upi' && !upiId) {
                alert("Please enter UPI ID");
                return;
            }
            if (method === 'bank' && (!bankDetails.accountNo || !bankDetails.ifsc)) {
                alert("Please enter Bank Details");
                return;
            }
        }

        onConfirm(val, { method, upiId, bankDetails });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`p-6 text-white ${type === 'deposit' ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-mmt-red to-mmt-darkRed'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold">{type === 'deposit' ? 'Add Money' : 'Withdraw Funds'}</h2>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-white/80 text-sm">
                        {type === 'deposit' ? 'Add money to your wallet for seamless bookings.' : 'Transfer your earnings to your bank account.'}
                    </p>
                    <div className="mt-4 bg-black/20 p-3 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Current Balance</span>
                        <span className="font-black text-xl">₹ {balance.toLocaleString()}</span>
                    </div>
                </div>

                <div className="p-6">
                    {/* Amount Input */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Amount</label>
                        <div className="flex items-center border-b-2 border-gray-200 focus-within:border-gray-800 transition-all pb-2 group">
                            <span className="text-3xl font-bold text-gray-400 mr-2">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full text-4xl font-bold text-gray-800 bg-transparent outline-none placeholder-gray-200"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Withdrawal Method Selection */}
                    {type === 'withdraw' && (
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Transfer To</label>
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={() => setMethod('upi')}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition ${method === 'upi' ? 'border-mmt-red bg-red-50 text-mmt-red' : 'border-gray-200 text-gray-500'}`}
                                >
                                    <CreditCard size={16} /> UPI
                                </button>
                                <button
                                    onClick={() => setMethod('bank')}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition ${method === 'bank' ? 'border-mmt-red bg-red-50 text-mmt-red' : 'border-gray-200 text-gray-500'}`}
                                >
                                    <Building size={16} /> Bank Transfer
                                </button>
                            </div>

                            {method === 'upi' ? (
                                <input
                                    type="text"
                                    placeholder="Enter UPI ID (e.g. name@okhdfc)"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none border border-transparent focus:border-mmt-red transition"
                                />
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Account Number"
                                        value={bankDetails.accountNo}
                                        onChange={e => setBankDetails({ ...bankDetails, accountNo: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none border border-transparent focus:border-mmt-red transition"
                                    />
                                    <input
                                        type="text"
                                        placeholder="IFSC Code"
                                        value={bankDetails.ifsc}
                                        onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none border border-transparent focus:border-mmt-red transition"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2
              ${type === 'deposit' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-mmt-red hover:bg-red-700 shadow-red-200'}
            `}
                    >
                        {type === 'deposit' ? 'PROCEED TO PAY' : 'REQUEST WITHDRAWAL'} <ArrowRight size={20} />
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <ShieldCheck size={14} /> Secure Payment Gateway
                    </div>
                </div>
            </div>
        </div>
    );
};
