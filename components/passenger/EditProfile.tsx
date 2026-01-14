import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, User, Phone, Mail, Save, X, ChevronLeft, ShieldCheck } from 'lucide-react';

interface EditProfileProps {
    onBack: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onBack }) => {
    const { user, updateUser } = useApp();
    const [name, setName] = useState(user?.name || '');
    const [mobile, setMobile] = useState(user?.mobile || '');
    const [email, setEmail] = useState(user?.email || 'user@example.com');

    // Verification State
    const [showVerification, setShowVerification] = useState(false);
    const [verificationType, setVerificationType] = useState<'mobile' | 'email' | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    const hasChanges = () => {
        return name !== user?.name || mobile !== user?.mobile || email !== (user?.email || 'user@example.com');
    };

    const handleSave = () => {
        // Check if sensitive fields changed
        const mobileChanged = mobile !== user?.mobile;
        const emailChanged = email !== (user?.email || 'user@example.com');

        if ((mobileChanged || emailChanged) && !isVerified) {
            setVerificationType(mobileChanged ? 'mobile' : 'email');
            setShowVerification(true);
            return;
        }

        updateUser({
            name,
            mobile,
            email
        });
        onBack();
    };

    const handleVerify = () => {
        // Simulate Verification
        setTimeout(() => {
            setIsVerified(true);
            setShowVerification(false);
            handleSave(); // Retry save after verification
        }, 1500);
    };

    return (
        <div className="bg-[var(--pass-bg)] min-h-screen pb-24 relative text-white">
            {/* Header - Dark Ribbon */}
            <div className="bg-[var(--pass-card)] p-4 sticky top-0 z-50 shadow-md flex items-center gap-3 text-white border-b border-white/10">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition">
                    <ChevronLeft size={24} className="text-white" />
                </button>
                <h1 className="text-xl font-black italic uppercase tracking-tighter">Edit Profile</h1>
            </div>

            <div className="p-6 space-y-6 max-w-md mx-auto mt-4">
                {/* Avatar Preview */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gray-900 rounded-full overflow-hidden border-4 border-[var(--pass-card)] shadow-2xl relative">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-pass-primary font-black text-2xl">
                                {name.charAt(0)}
                            </div>
                        )}
                        <div className="absolute inset-0 border border-white/10 rounded-full pointer-events-none"></div>
                    </div>
                </div>

                {/* Form Fields with Brand Ribbons */}
                <div className="space-y-4">
                    {/* Name */}
                    <div className="bg-[var(--pass-primary)] p-0.5 rounded-2xl shadow-lg shadow-purple-900/20">
                        <div className="bg-[var(--pass-card)] rounded-[14px] p-1.5">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-2 mt-1 tracking-widest">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pass-primary)]" />
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-white font-bold focus:ring-0 outline-none placeholder:text-gray-600"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="bg-[var(--pass-primary)] p-0.5 rounded-2xl shadow-lg shadow-purple-900/20">
                        <div className="bg-[var(--pass-card)] rounded-[14px] p-1.5">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-2 mt-1 tracking-widest">Mobile Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pass-primary)]" />
                                <input
                                    value={mobile}
                                    onChange={(e) => { setMobile(e.target.value); setIsVerified(false); }}
                                    className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-white font-bold focus:ring-0 outline-none placeholder:text-gray-600"
                                    placeholder="Enter mobile number"
                                />
                                {mobile !== user?.mobile && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--pass-accent)] bg-[var(--pass-accent)]/10 px-2 py-0.5 rounded-full border border-[var(--pass-accent)]/20 uppercase">
                                        Verify
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="bg-[var(--pass-primary)] p-0.5 rounded-2xl shadow-lg shadow-purple-900/20">
                        <div className="bg-[var(--pass-card)] rounded-[14px] p-1.5">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-2 mt-1 tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pass-primary)]" />
                                <input
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setIsVerified(false); }}
                                    className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-white font-bold focus:ring-0 outline-none placeholder:text-gray-600"
                                    placeholder="Enter email address"
                                />
                                {email !== (user?.email || 'user@example.com') && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--pass-accent)] bg-[var(--pass-accent)]/10 px-2 py-0.5 rounded-full border border-[var(--pass-accent)]/20 uppercase">
                                        Verify
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6">
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 rounded-2xl font-black text-gray-400 bg-[var(--pass-card)] border border-white/5 hover:bg-white/5 transition uppercase tracking-widest text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges()}
                        className="flex-1 py-4 rounded-2xl font-black text-white bg-[var(--pass-primary)] shadow-xl shadow-purple-900/30 hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        <Save size={18} /> Save
                    </button>
                </div>
            </div>

            {/* Verification Modal */}
            {showVerification && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[var(--pass-card)] w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border border-white/10">
                        <div className="w-20 h-20 bg-[var(--pass-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--pass-primary)] border border-[var(--pass-primary)]/20">
                            <ShieldCheck size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Security Check</h3>
                        <p className="text-sm text-gray-400 mb-8 font-medium">
                            Please verify your new {verificationType} to keep your account secure.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={handleVerify}
                                className="w-full py-4 bg-[var(--pass-primary)] text-white font-black rounded-2xl shadow-xl shadow-purple-900/30 hover:opacity-90 transition flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                Get OTP
                            </button>
                            <button
                                onClick={() => setShowVerification(false)}
                                className="w-full py-3 text-gray-500 font-bold text-xs hover:text-white transition uppercase tracking-widest"
                            >
                                Back to Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
