import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, ShieldCheck, Loader2, ArrowRight, MapPin, AlertCircle, RefreshCw, Copy, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react';
import { VEHICLES } from '../../constants';
import { useApp } from '../../context/AppContext';
import { auth, db } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, ConfirmationResult, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

export const LoginScreen: React.FC = () => {
  const { login, loginWithPassword, setupPassword, resetPassword } = useApp();
  const [view, setView] = useState<'WELCOME' | 'LOGIN' | 'REGISTER_PASSENGER' | 'REGISTER_DRIVER' | 'FORGOT_PASSWORD'>('WELCOME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState(VEHICLES[0].type);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Firebase State
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize Recaptcha
  useEffect(() => {
    const initRecaptcha = async () => {
      if (!auth) return;
      const container = document.getElementById('recaptcha-container');
      if (!container) return;

      try {
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) { }
          window.recaptchaVerifier = null;
        }

        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            console.log("Recaptcha solved automatically");
          },
          'expired-callback': () => {
            setError("Security check expired. Please refresh the page.");
            setLoading(false);
          }
        });

        await verifier.render();
        window.recaptchaVerifier = verifier;
        verifierRef.current = verifier;

      } catch (err) {
        console.error("Recaptcha Init Error", err);
      }
    };

    const timer = setTimeout(initRecaptcha, 1000);

    return () => {
      clearTimeout(timer);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) { }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Resend Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const resetState = () => {
    setMobile('');
    setPassword('');
    setOtp(['', '', '', '', '', '']);
    setName('');
    setVehicleNo('');
    setConfirmResult(null);
    setOtpVerified(false);
    setError(null);
    setLoading(false);
    setResendTimer(0);
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setLoading(true);

    // Check if user already exists during registration
    if (view.startsWith('REGISTER')) {
      try {
        const q = query(collection(db, 'users'), where('mobile', '==', mobile));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setError("User already registered. Please Login.");
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn("Pre-check error (Permissions?):", err.message);
      }
    }

    if (mobile === '9999999999') {
      setConfirmResult({} as any);
      setLoading(false);
      setResendTimer(30);
      return;
    }

    try {
      if (!verifierRef.current) {
        throw new Error("Recaptcha not initialized");
      }
      const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, verifierRef.current);
      setConfirmResult(confirmation);
      setResendTimer(30);
    } catch (err: any) {
      console.error("OTP Error", err);
      if (err.code === 'auth/too-many-requests') {
        setError("Blocked due to unusual activity. Try again in 20 mins or use dummy 9999999999.");
      } else {
        setError(err.message || "Failed to send OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmResult) return;
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError("Please enter valid 6-digit OTP");
      return;
    }

    setLoading(true);

    if (mobile === '9999999999') {
      if (otpString === '123456') {
        setOtpVerified(true);
        setError(null);
      } else {
        setError("Incorrect OTP for dummy number. Use 123456.");
      }
      setLoading(false);
      return;
    }

    try {
      const credential = await confirmResult.confirm(otpString);

      if (view.startsWith('REGISTER')) {
        try {
          const userDocRef = doc(db, 'users', credential.user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            await signOut(auth);
            setError("Account already exists. Please login.");
            setLoading(false);
            return;
          }
        } catch (dbErr: any) {
          console.error("Firestore Permission Error:", dbErr);
          // If Firestore fails but OTP is correct, we might have a permission issue.
          // We'll show the actual error to the user.
          setError(`Database Error: ${dbErr.message}. Please check Firestore Rules.`);
          setLoading(false);
          return;
        }
      }

      setOtpVerified(true);
      setError(null);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/invalid-verification-code') {
        setError("Wrong OTP. Please check the code sent to your phone.");
      } else {
        setError(`Verify Error: ${error.message}`);
      }
    }
  };

  // ... rest of the component remains same ...

  const handleLogin = async () => {
    if (mobile.length !== 10 || !password) {
      setError("Please enter Mobile Number and Password");
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(mobile, password);
    } catch (error: any) {
      setLoading(false);
      setError(error.message || "Login failed.");
    }
  };

  const handleCompleteRegistration = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (mobile !== '9999999999') {
        await setupPassword(mobile, password);
      }
      const role = view === 'REGISTER_DRIVER' ? 'owner' : 'passenger';
      await login(role, {
        name: role === 'owner' ? name : 'New Passenger',
        mobile,
        ...(role === 'owner' ? { vehicleNo, vehicleType } : {})
      });
    } catch (error: any) {
      setLoading(false);
      setError(error.message || "Registration failed.");
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password);
      alert("Success! Please Login.");
      resetState();
      setView('LOGIN');
    } catch (error: any) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLElement).focus();
    }
  };

  const renderWelcome = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
      <button
        onClick={() => { resetState(); setView('LOGIN'); }}
        className="w-full bg-[#7209b7] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition"
      >
        LOGIN
      </button>
      <div className="flex items-center gap-4 py-2">
        <div className="h-[1px] bg-black flex-1"></div>
        <span className="text-black text-sm font-black uppercase tracking-wider">Register</span>
        <div className="h-[1px] bg-black flex-1"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { resetState(); setView('REGISTER_PASSENGER'); }}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-xl font-bold text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 uppercase tracking-wide"
        >
          Passenger
        </button>
        <button
          onClick={() => { resetState(); setView('REGISTER_DRIVER'); }}
          className="w-full bg-gradient-to-r from-sky-500 to-cyan-600 text-white py-2 rounded-xl font-bold text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 uppercase tracking-wide"
        >
          Driver
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Login</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
          <div className="flex items-center border-b-2 border-gray-200 py-2">
            <span className="text-gray-800 font-bold mr-3 text-xl">+91</span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="flex-1 outline-none font-bold text-2xl text-black bg-transparent"
              placeholder="99999 99999"
              maxLength={10}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
          <div className="flex items-center border-b-2 border-gray-200 py-2">
            <Lock size={20} className="text-gray-400 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 outline-none font-bold text-xl text-black bg-transparent"
              placeholder="Enter Password"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={() => { resetState(); setView('FORGOT_PASSWORD'); }} className="text-xs font-bold text-[#7209b7]">
            Forgot Password?
          </button>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading || mobile.length < 10 || !password}
          className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : 'LOGIN'}
        </button>
      </div>
    </div>
  );

  const renderRegister = (role: 'passenger' | 'owner') => (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Register as {role === 'passenger' ? 'Passenger' : 'Driver'}</h2>
      {!confirmResult ? (
        <div className="space-y-4">
          {role === 'owner' && (
            <>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold" placeholder="Full Name" />
              <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold uppercase" placeholder="Vehicle No (JK-10-XXXX)" />
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold">
                {VEHICLES.map(v => <option key={v.type} value={v.type}>{v.type}</option>)}
              </select>
            </>
          )}
          <div className="flex items-center border-b-2 border-gray-200 py-2">
            <span className="text-gray-800 font-bold mr-3">+91</span>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} className="flex-1 outline-none font-bold text-xl" placeholder="Mobile Number" maxLength={10} />
          </div>
          <button onClick={handleSendOtp} disabled={loading || mobile.length < 10} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-6">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Send OTP'}
          </button>
        </div>
      ) : !otpVerified ? (
        renderOtpInput()
      ) : (
        <div className="space-y-4">
          <div className="flex items-center border-b-2 border-gray-200 py-2">
            <Lock size={18} className="text-gray-400 mr-2" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 outline-none font-bold text-lg" placeholder="Set Password (Min 6 chars)" />
            <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <button onClick={handleCompleteRegistration} disabled={loading || !password} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-6">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Account'}
          </button>
        </div>
      )}
    </div>
  );

  const renderForgotPassword = () => (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Reset Password</h2>
      {!confirmResult ? (
        <div className="space-y-4">
          <div className="flex items-center border-b-2 border-gray-200 py-2">
            <span className="text-gray-800 font-bold mr-3">+91</span>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} className="flex-1 outline-none font-bold text-xl" placeholder="Mobile Number" maxLength={10} />
          </div>
          <button onClick={handleSendOtp} disabled={loading || mobile.length < 10} className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Send OTP'}
          </button>
        </div>
      ) : !otpVerified ? (
        renderOtpInput()
      ) : (
        <div className="space-y-4">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold" placeholder="New Password" />
          <button onClick={handleResetPassword} disabled={loading || !password} className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Reset Password'}
          </button>
        </div>
      )}
    </div>
  );

  const renderOtpInput = () => (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <p className="text-gray-400 text-sm mb-6">Enter OTP sent to <span className="font-bold text-gray-800">+91 {mobile}</span></p>
      <div className="grid grid-cols-6 gap-2 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target, index)}
            name={`otp-${index}`}
            className="w-full h-12 border-2 border-gray-200 rounded-xl text-center text-xl font-bold focus:border-[#7209b7] outline-none bg-white text-black transition-all"
          />
        ))}
      </div>
      <div className="flex justify-center mb-6">
        {resendTimer > 0 ? (
          <p className="text-xs font-bold text-gray-400 uppercase">Resend in <span className="text-[#E02E49]">{resendTimer}s</span></p>
        ) : (
          <button onClick={handleSendOtp} className="text-xs font-bold text-[#7209b7] uppercase flex items-center gap-1">
            <RefreshCw size={12} /> Resend OTP
          </button>
        )}
      </div>
      <button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify OTP'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--login-bg)] flex flex-col relative">
      <div id="recaptcha-container"></div>
      <div className={`h-[35vh] bg-violet-700 relative overflow-hidden rounded-b-[40px] shadow-2xl flex items-center justify-center`}>
        <div className="text-center text-white pb-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md p-3 rounded-full mb-4 border border-white/30 mx-auto flex items-center justify-center">
            <MapPin size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-extrabold">Taxi Booking Ladakh</h1>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Your Journey Begins Here</p>
        </div>
      </div>
      <div className="flex-1 px-6 -mt-12 relative z-20 pb-10">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 min-h-[400px]">
          {view !== 'WELCOME' && (
            <button onClick={() => { resetState(); setView('WELCOME'); }} className="mb-4 text-gray-400 flex items-center gap-1 text-xs font-bold uppercase">
              <ChevronLeft size={14} /> Back
            </button>
          )}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {view === 'WELCOME' && renderWelcome()}
          {view === 'LOGIN' && renderLogin()}
          {view === 'REGISTER_PASSENGER' && renderRegister('passenger')}
          {view === 'REGISTER_DRIVER' && renderRegister('owner')}
          {view === 'FORGOT_PASSWORD' && renderForgotPassword()}
        </div>
      </div>
    </div>
  );
};