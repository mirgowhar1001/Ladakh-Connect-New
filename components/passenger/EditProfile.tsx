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
        <div className="bg-gray-50 min-h-screen pb-24 relative">
            {/* Header - Green Ribbon */}
            <div className="bg-green-600 p-4 sticky top-0 z-50 shadow-md flex items-center gap-3 text-white">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
                    <ChevronLeft size={24} className="text-white" />
                </button>
                <h1 className="text-xl font-bold">Edit Profile</h1>
            </div>

            <div className="p-6 space-y-6 max-w-md mx-auto mt-4">
                {/* Avatar Preview */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-bold text-2xl">
                                {name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Fields with Violet Ribbons */}
                <div className="space-y-4">
                    {/* Name */}
                    <div className="bg-violet-600 p-1 rounded-xl shadow-sm">
                        <div className="bg-white rounded-lg p-1">
                            <label className="block text-[10px] font-bold text-violet-600 uppercase mb-1 ml-2 mt-1">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-gray-800 font-bold focus:ring-0 outline-none"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="bg-violet-600 p-1 rounded-xl shadow-sm">
                        <div className="bg-white rounded-lg p-1">
                            <label className="block text-[10px] font-bold text-violet-600 uppercase mb-1 ml-2 mt-1">Mobile Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={mobile}
                                    onChange={(e) => { setMobile(e.target.value); setIsVerified(false); }}
                                    className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-gray-800 font-bold focus:ring-0 outline-none"
                                    placeholder="Enter mobile number"
                                />
                                {mobile !== user?.mobile && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                        Verify Required
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="bg-violet-600 p-1 rounded-xl shadow-sm">
                        <div className="bg-white rounded-lg p-1">
                            <label className="block text-[10px] font-bold text-violet-600 uppercase mb-1 ml-2 mt-1">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setIsVerified(false); }}
                                    className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-gray-800 font-bold focus:ring-0 outline-none"
                                    placeholder="Enter email address"
                                />
                                {email !== (user?.email || 'user@example.com') && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                        Verify Required
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6">
                    <button
                        onClick={onBack}
                        className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges()}
                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-green-600 shadow-lg hover:shadow-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>

            {/* Verification Modal */}
            {showVerification && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">Verify Changes</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            You changed your {verificationType}. Please verify to save.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleVerify}
                                className="w-full py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                            >
                                Verify with OTP
                            </button>
                            <button
                                onClick={handleVerify}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                Verify with Google
                            </button>
                            <button
                                onClick={() => setShowVerification(false)}
                                className="w-full py-2 text-gray-400 font-bold text-xs hover:text-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
