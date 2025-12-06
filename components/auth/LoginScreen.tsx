import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, ShieldCheck, Loader2, ArrowRight, MapPin, AlertCircle, RefreshCw, Copy, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react';
import { VEHICLES } from '../../constants';
import { useApp } from '../../context/AppContext';
import { auth, db } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, ConfirmationResult, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setLoading(true);

    if (mobile === '9999999999') {
      setConfirmResult({} as any); // Dummy confirmation result
      setLoading(false);
      return;
    }

    try {
      if (!verifierRef.current) {
        throw new Error("Recaptcha not initialized");
      }
      const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, verifierRef.current);
      setConfirmResult(confirmation);
    } catch (err: any) {
      console.error("OTP Error", err);
      setError(err.message || "Failed to send OTP. Try again.");
      if (err.code === 'auth/invalid-app-credential') {
        setError("Domain Blocked. Add localhost to Firebase Console.");
      } else if (err.code === 'auth/billing-not-enabled') {
        setError("SMS Limit Exceeded/Billing Required. Use Google Login or Mock Login.");
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
      setOtpVerified(true);
      setLoading(false);
      return;
    }

    try {
      const credential = await confirmResult.confirm(otpString);

      // Check if user already exists (Prevent Re-registration)
      if (view.startsWith('REGISTER')) {
        const userDocRef = doc(db, 'users', credential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const existingRole = userDoc.data().role;
          const requestedRole = view === 'REGISTER_DRIVER' ? 'owner' : 'passenger';

          await signOut(auth);

          if (existingRole === 'passenger' && requestedRole === 'owner') {
            setError("User already registered as passenger. Please login or use 'Forgot password'.");
          } else if (existingRole === 'owner' && requestedRole === 'passenger') {
            setError("User already registered as driver. Please login or use 'Forgot password'.");
          } else {
            setError("Account already registered. Please login or use 'Forgot password'.");
          }

          setLoading(false);
          return;
        }
      }

      setOtpVerified(true);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setError("Incorrect OTP. Please check.");
    }
  };

  const handleLogin = async () => {
    if (mobile.length !== 10 || !password) {
      setError("Please enter Mobile Number and Password");
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(mobile, password);
      // AppContext will detect login and redirect
    } catch (error: any) {
      setLoading(false);
      console.error("Login Error:", error);
      if (error.message.includes("User not registered")) {
        setError("User not found. register please");
      } else {
        setError("Invalid Credentials. Please check or reset password.");
      }
    }
  };

  const handleCompleteRegistration = async () => {
    if (!password) {
      setError("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // 1. Link Password Credential
      if (mobile !== '9999999999') {
        await setupPassword(mobile, password);
      }

      // 2. Save Profile
      const role = view === 'REGISTER_DRIVER' ? 'owner' : 'passenger';
      await login(role, {
        name: role === 'owner' ? name : 'New Passenger',
        mobile,
        ...(role === 'owner' ? { vehicleNo, vehicleType } : {})
      });
      // AppContext will detect doc and redirect
    } catch (error: any) {
      setLoading(false);
      console.error("Registration Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setError("Configuration Error: Email/Password Auth is not enabled in Firebase Console.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("Account already exists. Please Login.");
      } else if (error.message.includes("User already registered")) {
        setError(error.message);
      } else {
        setError("Registration Failed: " + error.message);
      }
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
      alert("Password Reset Successfully! Please Login.");
      resetState();
      setView('LOGIN');
    } catch (error: any) {
      setLoading(false);
      setError("Reset Failed: " + error.message);
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
          <label className="text-xs font-bold text-[var(--login-text)] uppercase tracking-wide">Mobile Number</label>
          <div className="flex items-center border-b-2 border-gray-200 py-2 focus-within:border-[var(--login-focus)] transition-colors">
            <span className="text-gray-800 font-bold mr-3 text-xl">+91</span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="flex-1 outline-none font-bold text-2xl text-[var(--login-text)] bg-[var(--login-input-bg)]"
              placeholder="99999 99999"
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--login-text)] uppercase tracking-wide">Password</label>
          <div className="flex items-center border-b-2 border-gray-200 py-2 focus-within:border-[var(--login-focus)] transition-colors">
            <Lock size={20} className="text-gray-400 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 outline-none font-bold text-xl text-[var(--login-text)] bg-[var(--login-input-bg)]"
              placeholder="Enter Password"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => { resetState(); setView('FORGOT_PASSWORD'); }} className="text-xs font-bold text-[#7209b7] hover:underline">
            Forgot Password?
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || mobile.length < 10 || !password}
          className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition"
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
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold text-gray-800 bg-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold text-gray-800 uppercase bg-transparent"
                  placeholder="JK-10-XXXX"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full py-3 border-b-2 border-gray-200 outline-none font-bold text-gray-800 bg-transparent"
                >
                  {VEHICLES.map(v => (
                    <option key={v.type} value={v.type}>{v.type}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Mobile Number</label>
            <div className="flex items-center border-b-2 border-gray-200 py-2">
              <span className="text-gray-800 font-bold mr-3">+91</span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="flex-1 outline-none font-bold text-xl text-black bg-transparent"
                placeholder="99999 99999"
                maxLength={10}
              />
            </div>
          </div>

          <button
            onClick={handleSendOtp}
            disabled={loading || mobile.length < 10 || (role === 'owner' && (!name || !vehicleNo))}
            className={`w-full bg-green-600 text-white py-5 rounded-xl font-black text-xl shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition transform hover:scale-[1.01]`}
          >
            {loading ? <Loader2 className="animate-spin mx-auto w-8 h-8" /> : 'Verify & Register'}
          </button>

        </div>
      ) : !otpVerified ? (
        renderOtpInput()
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Set Password</label>
            <div className="flex items-center border-b-2 border-gray-200 py-2">
              <Lock size={18} className="text-gray-400 mr-2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 outline-none font-bold text-lg text-gray-800 bg-transparent"
                placeholder="Min 6 chars"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleCompleteRegistration}
            disabled={loading || !password}
            className={`w-full bg-green-600 text-white py-5 rounded-xl font-black text-xl shadow-xl mt-6 hover:bg-green-700 transition transform hover:scale-[1.01]`}
          >
            {loading ? <Loader2 className="animate-spin mx-auto w-8 h-8" /> : 'Create Account'}
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
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Mobile Number</label>
            <div className="flex items-center border-b-2 border-gray-200 py-2">
              <span className="text-gray-800 font-bold mr-3">+91</span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="flex-1 outline-none font-bold text-xl text-black bg-transparent"
                placeholder="99999 99999"
                maxLength={10}
              />
            </div>
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading || mobile.length < 10}
            className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Send OTP'}
          </button>
        </div>
      ) : !otpVerified ? (
        renderOtpInput()
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">New Password</label>
            <div className="flex items-center border-b-2 border-gray-200 py-2">
              <Lock size={18} className="text-gray-400 mr-2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 outline-none font-bold text-lg text-gray-800 bg-transparent"
                placeholder="Min 6 chars"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            onClick={handleResetPassword}
            disabled={loading || !password}
            className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Reset Password'}
          </button>
        </div>
      )}
    </div>
  );

  const renderOtpInput = () => (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <p className="text-gray-400 text-sm mb-8">Enter OTP sent to <span className="font-bold text-gray-800">+91 {mobile}</span></p>
      <div className="flex justify-between gap-2 mb-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target, index)}
            name={`otp-${index}`}
            className="w-10 h-10 border-2 border-gray-200 rounded-xl text-center text-lg font-bold focus:border-mmt-blue outline-none bg-white text-black"
          />
        ))}
      </div>
      <button
        onClick={handleVerifyOtp}
        disabled={loading}
        className="w-full bg-[#E02E49] text-white py-4 rounded-xl font-bold text-lg shadow-lg"
      >
        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify OTP'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--login-bg)] flex flex-col relative">
      <div id="recaptcha-container"></div>

      {/* Header */}
      <div className={`h-[40vh] bg-violet-700 relative overflow-hidden rounded-b-[40px] shadow-2xl flex items-center justify-center transition-all duration-500`}>
        <div className="text-center text-white pb-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md p-3 rounded-full mb-4 border border-white/30 mx-auto flex items-center justify-center">
            <MapPin className="text-white" size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Taxi Booking Ladakh</h1>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Your Journey Begins Here</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-6 -mt-16 relative z-20 pb-10">
        <div className="bg-[var(--login-input-bg)] rounded-[2rem] shadow-floating p-8 min-h-[400px]">
          {view !== 'WELCOME' && (
            <button onClick={() => { resetState(); setView('WELCOME'); setConfirmResult(null); setError(null); }} className="mb-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs font-bold uppercase">
              <ChevronLeft size={14} /> Back
            </button>
          )}

          {error && (
            <div className="mb-4 bg-red-50 text-[var(--login-error)] p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-[var(--login-error)]/20">
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