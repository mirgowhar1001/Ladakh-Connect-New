import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { RealSeat } from '../common/RealSeat';
import { Navigation, User, LogOut, MapPin, ShieldCheck, Wallet, ChevronRight, MessageCircle, Plus, Calendar, Clock, IndianRupee, X, ArrowRight, History, Home, Phone, Star, Menu, CheckCircle, Search, Users, Edit, Trash2, FileText, Loader2, Check, AlertCircle, Lock } from 'lucide-react';
import { ChatScreen } from '../common/ChatScreen';
import { DatePicker } from '../common/DatePicker';
import { VEHICLE_WHITELIST } from '../../constants';

type OwnerView = 'marketplace' | 'my-rides' | 'bookings' | 'profile' | 'history' | 'wallet';

export default function OwnerDashboard() {
  const { user, updateUser, logout, deleteAccount, rideOffers, publishRide, trips, updateTripStatus, updateRideOffer, cancelRideOffer, completeRide, withdrawFromWallet, driverBalance } = useApp();

  const [showAddRide, setShowAddRide] = useState(false);
  const [showEditRide, setShowEditRide] = useState(false);
  const [editingRide, setEditingRide] = useState<any>(null);
  const [activeChatTripId, setActiveChatTripId] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posted' | 'booked' | 'active' | 'completed'>('posted');
  const [currentView, setCurrentView] = useState<OwnerView>('marketplace');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobile: '',
    vehicleNo: '',
    vehicleType: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Initialize form data when opening modal
  useEffect(() => {
    if (showEditProfile && user) {
      setEditFormData({
        name: user.name,
        mobile: user.mobile,
        vehicleNo: user.vehicleNo || '',
        vehicleType: user.vehicleType || ''
      });
      setOtpSent(false);
      setOtp('');
    }
  }, [showEditProfile, user]);

  const handleClearAllData = async () => {
    if (window.confirm("CRITICAL WARNING: This will WIPE ALL DATA (Trips, Bookings, Wallet, Documents) for ALL USERS, keeping only Login Details. Are you sure?")) {
      const password = prompt("Enter admin password to confirm (type 'admin'):");
      if (password !== 'admin') return alert("Wrong password.");

      try {
        const tripsSnap = await getDocs(collection(db, 'trips'));
        const offersSnap = await getDocs(collection(db, 'rideOffers'));
        const usersSnap = await getDocs(collection(db, 'users'));

        const deletePromises = [
          ...tripsSnap.docs.map(d => deleteDoc(d.ref)),
          ...offersSnap.docs.map(d => deleteDoc(d.ref)),
          ...usersSnap.docs.map(d => updateDoc(d.ref, {
            walletBalance: 0,
            escrowBalance: 0,
            documents: {},
            verificationStatus: 'none',
            vehicleNo: deleteField(),
            vehicleType: deleteField(),
            profileImage: deleteField()
          }))
        ];

        await Promise.all(deletePromises);
        alert("System Wiped: All trips, offers, and user data (except login) have been cleared.");
        window.location.reload();
      } catch (error) {
        console.error("Error clearing data:", error);
        alert("Failed to clear data: " + error);
      }
    }
  };

  // Document Upload State
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: string }>({});

  const handleFileUpload = async (file: File, docType: string) => {
    if (!user?.uid) return;
    if (!['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'].includes(file.type)) {
      alert("Only JPG/JPEG/PNG files are allowed.");
      return;
    }
    if (file.size > 500 * 1024) {
      alert("File size must be less than 500KB.");
      return;
    }

    setUploading(prev => ({ ...prev, [docType]: true }));
    try {
      const storageRef = ref(storage, `drivers/${user.uid}/documents/${docType}.jpg`);
      const metadata = { contentType: file.type };
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timed out.")), 15000);
      });

      await Promise.race([
        uploadBytes(storageRef, file, metadata),
        timeoutPromise
      ]);

      const url = await getDownloadURL(storageRef);
      setUploadedDocs(prev => ({ ...prev, [docType]: url }));
      const newDocs = { ...user?.documents, ...uploadedDocs, [docType]: url };
      await updateUser({ documents: newDocs });

    } catch (error: any) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const storageRef = ref(storage, `users/${user?.uid}/profile.jpg`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        await updateUser({ profileImage: url });
        alert("Profile Picture Updated!");
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload profile picture.");
      }
    }
  };

  const handleProfileUpdate = async () => {
    // Check if mobile changed
    if (editFormData.mobile !== user?.mobile && !otpSent) {
      // Simulate OTP Request
      setOtpSent(true);
      alert("OTP sent to new mobile number: " + editFormData.mobile);
      return;
    }

    if (otpSent) {
      if (otp !== '123456') { // Mock OTP Verification
        alert("Invalid OTP");
        return;
      }
    }

    // Save changes
    await updateUser({
      name: editFormData.name,
      mobile: editFormData.mobile,
      vehicleNo: editFormData.vehicleNo,
      vehicleType: editFormData.vehicleType
    });

    alert("Profile Updated Successfully!");
    setShowEditProfile(false);
    setOtpSent(false);
  };

  // Add Ride Form State
  const [newRide, setNewRide] = useState({
    from: 'Leh',
    to: 'Srinagar',
    date: new Date().toISOString().split('T')[0],
    time: '06:00 AM',
    price: 2000,
    totalSeats: 7,
    vehicleType: 'Innova Crysta',
    vehicleNo: user?.vehicleNo || '',
    seatPrices: {} as { [key: number]: number },
    activeSeats: [1, 2, 3, 4, 5, 6, 7] as number[]
  });

  const myTrips = trips.filter(t => t.driverId === user?.uid);
  const activeTrips = myTrips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const completedTrips = myTrips.filter(t => t.status === 'COMPLETED');
  const totalEarnings = myTrips.filter(t => t.status === 'COMPLETED').reduce((acc, t) => acc + t.cost, 0);
  const todayEarnings = completedTrips.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).reduce((acc, t) => acc + t.cost, 0);

  const averageRating = useMemo(() => {
    const ratedTrips = completedTrips.filter(t => t.userRating);
    if (ratedTrips.length === 0) return "New";
    const sum = ratedTrips.reduce((acc, t) => acc + (t.userRating || 0), 0);
    return (sum / ratedTrips.length).toFixed(1);
  }, [completedTrips]);

  const availableRides = rideOffers
    .filter(offer => (offer.totalSeats - (offer.bookedSeats?.length || 0)) > 0)
    .filter(offer => !offer.status || offer.status === 'OPEN') // ONLY SHOW OPEN RIDES
    .filter(offer => {
      // Filter out past rides
      try {
        const [tTime, tAmpm] = offer.time.split(' ');
        const [tHours, tMinutes] = tTime.split(':');
        let th = parseInt(tHours);
        if (tAmpm === 'PM' && th !== 12) th += 12;
        if (tAmpm === 'AM' && th === 12) th = 0;

        const rideDate = new Date(offer.date);
        rideDate.setHours(th, parseInt(tMinutes), 0, 0);

        return rideDate > new Date(); // Only show future rides
      } catch (e) {
        return true; // Keep if date parsing fails to avoid empty list on error
      }
    })
    .sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeB - timeA;
    });

  const myPostedRides = rideOffers.filter(o => (o.driverId === user?.uid || o.driverName === user?.name) && (o.totalSeats - (o.bookedSeats?.length || 0) > 0) && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

  const handlePublish = async () => {
    const activeCount = activeTrips.length + myPostedRides.length;
    if (activeCount >= 10) return alert("You can only have a maximum of 10 active rides.");

    // ROBUST DATE PARSING
    const [year, month, day] = newRide.date.split('-').map(Number);
    const rideDateObj = new Date(year, month - 1, day); // Local Time Midnight

    // Parse Time
    const [timePart, ampm] = newRide.time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let h = parseInt(hours);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    rideDateObj.setHours(h, parseInt(minutes), 0, 0);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Debug Log
    console.log("Validation:", { rideDate: rideDateObj.toString(), now: now.toString() });

    if (rideDateObj < now) return alert("Passed time! The time you selected is in the past.");
    if (rideDateObj < oneHourFromNow) return alert("You must post rides at least 1 hour in advance.");

    const hasOverlap = [...activeTrips, ...myPostedRides].some(trip => {
      // Fix Trip Date Parsing for Overlap Check
      try {
        const tripDate = new Date(trip.date);
        // Note: trip.date is stored as YYYY-MM-DD string. 
        // Ideally we should parse it same as above, but for now let's be careful.
        // Re-parsing strictly:
        const [tY, tM, tD] = trip.date.split('-').map(Number);
        const tObj = new Date(tY, tM - 1, tD);

        const [tTime, tAmpm] = trip.time.split(' ');
        const [tHours, tMinutes] = tTime.split(':');
        let th = parseInt(tHours);
        if (tAmpm === 'PM' && th !== 12) th += 12;
        if (tAmpm === 'AM' && th === 12) th = 0;

        tObj.setHours(th, parseInt(tMinutes), 0, 0);

        const diffHours = Math.abs(rideDateObj.getTime() - tObj.getTime()) / 36e5;
        return diffHours < 1;
      } catch (e) { return false; }
    });

    if (hasOverlap) return alert("You already have a ride scheduled within 1 hour of this time.");

    try {
      await publishRide(newRide);
      setShowAddRide(false);
      alert('Ride Published Successfully!');
      setCurrentView('my-rides');
    } catch (error: any) {
      console.error("Post Ride Error:", error);
      alert(error.message || "Failed to post ride. Please try again.");
    }
  };

  const handlePostRide = async () => {
    // Basic Validation
    if (!newRide.from || !newRide.to || !newRide.date || !newRide.time) {
      alert("Please fill all fields");
      return;
    }
  };

  const handleUpdateRide = () => {
    if (!editingRide) return;
    updateRideOffer(editingRide.id, {
      from: editingRide.from,
      to: editingRide.to,
      date: editingRide.date,
      time: editingRide.time,
      pricePerSeat: editingRide.pricePerSeat,
      totalSeats: editingRide.totalSeats,
      activeSeats: editingRide.activeSeats,
      seatPrices: editingRide.seatPrices
    });
    setShowEditRide(false);
    setEditingRide(null);
    alert('Ride Updated Successfully!');
  };

  const handleNavigate = (view: string) => {
    if (view === 'bookings' || view === 'history') setCurrentView('my-rides');
    else setCurrentView(view as OwnerView);
    setIsMenuOpen(false);
  };

  const handleWithdraw = async (amount: number, details: any) => {
    const success = await withdrawFromWallet(amount);
    if (success) {
      alert(`Withdrawal request for \u20B9${amount} sent successfully!`);
      setShowWithdrawModal(false);
    }
  };

  if (activeChatTripId) {
    return <ChatScreen tripId={activeChatTripId} onBack={() => setActiveChatTripId(null)} />;
  }

  const DriverHeader = () => (
    <div className="bg-[var(--driver-bg)] text-[var(--driver-text)] p-6 pt-6 rounded-b-[2rem] shadow-xl mb-6 relative overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -translate-x-5 translate-y-5 blur-lg"></div>

      <div className="relative z-10 flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
            <Menu className="text-white" size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('profile-upload')?.click()}>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-md">
                <img src={user?.profileImage || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Driver" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit size={16} className="text-white" />
              </div>
              <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-bold text-xl drop-shadow-md leading-none text-white">{user?.name}</h1>
                <p className="text-sm text-gray-300 font-medium">{user?.vehicleNo}</p>
              </div>
              <div className="mt-1 bg-yellow-500/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full inline-block border border-yellow-500/50">
                v2.1 TAXI Optimized
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          if (user?.verificationStatus === 'verified') {
            setShowAddRide(true);
          } else {
            alert("Please upload your documents in the Profile section to verify your account before posting rides.");
            setCurrentView('profile');
          }
        }}
        className="bg-[var(--driver-primary)] text-black px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition flex items-center gap-2"
      >
        <Plus size={18} /> New Ride
      </button>
    </div>
  );

  // New Flight-Style Marketplace View
  const MarketplaceView = () => {
    const [selectedRouteFilter, setSelectedRouteFilter] = useState<string | null>(null);

    const uniqueRoutes = useMemo(() => {
      const routes = new Set<string>();
      availableRides.forEach(offer => {
        routes.add(`${offer.from}-${offer.to}`);
      });
      return Array.from(routes);
    }, [availableRides]);

    const filteredRides = useMemo(() => {
      if (!selectedRouteFilter) return availableRides;
      const [from, to] = selectedRouteFilter.split('-');
      return availableRides.filter(r => r.from === from && r.to === to);
    }, [selectedRouteFilter, availableRides]);

    return (
      <div className="px-4 pb-24 h-full flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Filter */}
        <div className="hidden md:block w-64 shrink-0 space-y-6">
          <div className="bg-[var(--driver-card)] p-5 rounded-2xl border border-gray-800">
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Route Filters</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedRouteFilter(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${!selectedRouteFilter ? 'bg-[var(--driver-primary)] text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                All Routes
              </button>
              {uniqueRoutes.map(route => {
                const count = availableRides.filter(r => `${r.from}-${r.to}` === route).length;
                return (
                  <button
                    key={route}
                    onClick={() => setSelectedRouteFilter(route)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex justify-between items-center ${selectedRouteFilter === route ? 'bg-[var(--driver-primary)] text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
                  >
                    <span className="flex items-center gap-2">{route.split('-')[0]} <ArrowRight size={12} /> {route.split('-')[1]}</span>
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Filter (Horizontal Scroll) */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedRouteFilter(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${!selectedRouteFilter ? 'bg-[var(--driver-primary)] text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
          >
            All Routes
          </button>
          {uniqueRoutes.map(route => (
            <button
              key={route}
              onClick={() => setSelectedRouteFilter(route)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${selectedRouteFilter === route ? 'bg-[var(--driver-primary)] text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
            >
              <span className="flex items-center gap-1">{route.split('-')[0]} <ArrowRight size={10} /> {route.split('-')[1]}</span>
            </button>
          ))}
        </div>

        {/* Main Content - Ride List */}
        <div className="flex-1">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Available Rides</h2>
            <p className="text-gray-400 text-sm">{selectedRouteFilter ? `Showing rides for ${selectedRouteFilter.replace('-', ' → ')}` : 'All posted rides'}</p>
          </div>

          <div className="space-y-4">
            {(selectedRouteFilter ? filteredRides : availableRides).length === 0 ? (
              <div className="text-center py-12 px-8 bg-[var(--driver-card)] rounded-3xl border border-gray-800 opacity-50">
                <MapPin size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No active rides found for this route.</p>
              </div>
            ) : (selectedRouteFilter ? filteredRides : availableRides).map(offer => (
              <div key={offer.id} className="bg-[var(--driver-card)] rounded-2xl p-0 border border-gray-800 overflow-hidden hover:border-gray-600 transition shadow-lg">
                <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-center relative">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-black text-white">{offer.time.split(' ')[0]}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{offer.time.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold text-gray-300">{offer.from}</span>
                        <div className="h-[2px] w-12 bg-gray-700 flex items-center justify-center relative">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full absolute -left-0.5"></div>
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full absolute -right-0.5"></div>
                        </div>
                        <span className="text-sm font-bold text-white">{offer.to}</span>
                      </div>
                      <p className="text-xs text-[var(--driver-primary)] font-medium flex items-center gap-1">
                        <Calendar size={10} /> {new Date(offer.date).toDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="md:w-auto flex items-center gap-3 bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-700/50 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 shrink-0">
                      <User size={14} />
                    </div>
                    <div className="flex flex-row items-center gap-3 overflow-hidden whitespace-nowrap">
                      <p className="text-xs font-bold text-white uppercase truncate">{offer.driverName}</p>
                      <p className="text-xs font-bold text-white uppercase">{offer.vehicleNo}</p>
                      <p className="text-xs font-bold text-white">{offer.driverMobile}</p>
                      <p className="text-xs font-bold text-gray-400 capitalize">{offer.vehicleType}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Booked</p>
                      <p className={`text-lg font-black ${offer.bookedSeats?.length >= offer.totalSeats ? 'text-red-400' : 'text-green-400'}`}>
                        {offer.bookedSeats?.length || 0} <span className="text-xs text-gray-500 font-medium">/ {offer.totalSeats}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MyRidesView = () => {
    // UNIFIED VIEW: Show all active rides for this driver to ensure nothing is hidden by logic gaps
    // This combines posted (open), booked, and in-progress rides into one list.
    const allMyActiveRides = rideOffers.filter(o =>
      o.driverId === user?.uid &&
      o.status !== 'CANCELLED' &&
      o.status !== 'COMPLETED'
    );

    const getPassengersForOffer = (offerId: string) => {
      return trips.filter(t => t.offerId === offerId && t.status !== 'CANCELLED');
    };

    return (
      <div className="px-6 animate-in slide-in-from-right duration-300 pb-24">
        <h2 className="font-bold text-[var(--driver-text)] mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Calendar size={18} className="text-[var(--driver-primary)]" /> My Rides
        </h2>

        <div className="flex p-1 bg-black/20 rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {['posted', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab
                ? 'bg-[var(--driver-primary)] text-black shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab === 'posted' ? 'My Active Rides' : 'History'}
            </button>
          ))}
        </div>

        {activeTab === 'posted' && (
          <div className="space-y-6">
            {allMyActiveRides.length === 0 ? (
              <div className="text-center py-12 bg-[var(--driver-card)] rounded-2xl border border-gray-800">
                <p className="text-gray-400 text-base">No active rides found.</p>
                <p className="text-xs text-gray-500 mt-2">Post a ride to get started.</p>
              </div>
            ) : (
              allMyActiveRides.map(offer => {
                const passengers = getPassengersForOffer(offer.id);
                const isEnRoute = passengers.some(t => t.status === 'EN_ROUTE');
                const isArrived = passengers.some(t => t.status === 'ARRIVED');
                const isBooked = passengers.length > 0;

                return (
                  <div key={offer.id} className="bg-[var(--driver-card)] rounded-3xl shadow-lg p-6 border border-gray-800 relative overflow-hidden mb-4">
                    <div className={`absolute top-0 left-0 w-2 h-full ${isEnRoute ? 'bg-orange-500' : isArrived ? 'bg-green-500' : 'bg-[var(--driver-primary)]'}`}></div>

                    <div className="flex justify-between items-start mb-6 pl-2">
                      <div>
                        <div className="mb-2">
                          {isEnRoute ? <span className="bg-orange-900/40 text-orange-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">In Progress</span> :
                            isArrived ? <span className="bg-green-900/40 text-green-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Arrived</span> :
                              passengers.length > 0 ? <span className="bg-green-900/40 text-green-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Active ({passengers.length} Booked)</span> :
                                <span className="bg-blue-900/40 text-blue-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Open for Booking</span>
                          }
                        </div>
                        <div className="flex items-center justify-between gap-4 w-full mb-4">
                          <h3 className="font-bold text-white text-xl leading-none flex items-center gap-2">
                            {offer.from} <ArrowRight size={16} className="text-gray-500" /> {offer.to}
                          </h3>
                        </div>
                        <p className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-2">
                          <span className="text-white bg-gray-800 px-2 py-1 rounded text-xs">{new Date(offer.date).toDateString()}</span>
                          <span className="text-white bg-gray-800 px-2 py-1 rounded text-xs">{offer.time}</span>
                        </p>
                      </div>

                      {/* Quick Action Button */}
                      <div className="flex flex-col gap-2 relative z-10">
                        {!isEnRoute && !isArrived && passengers.length > 0 && (
                          <button onClick={() => { if (confirm("Start Ride?")) passengers.forEach(p => updateTripStatus(p.id, 'EN_ROUTE')); }} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-xs shadow hover:bg-green-700">Start Ride</button>
                        )}
                        {isEnRoute && (
                          <button onClick={() => { if (confirm("Finish Ride?")) passengers.forEach(p => completeRide(p.id)); }} className="px-4 py-2 bg-[var(--driver-primary)] text-black rounded-lg font-bold text-xs shadow hover:scale-105 transition">Finish Ride</button>
                        )}
                        {passengers.length === 0 && (
                          <button onClick={() => { if (confirm("Delete Offer?")) cancelRideOffer(offer.id); }} className="px-4 py-2 bg-red-900/20 text-red-500 rounded-lg font-bold text-xs border border-red-900/30 hover:bg-red-900/40">Delete</button>
                        )}
                      </div>
                    </div>

                    {/* Mini Seat Map Info */}
                    <div className="bg-black/20 p-3 rounded-xl flex justify-between items-center text-xs">
                      <span className="text-gray-500">Seats: <span className="text-white font-bold">{offer.totalSeats}</span></span>
                      <span className="text-gray-500">Booked: <span className="text-white font-bold">{offer.bookedSeats?.length || 0}</span></span>
                    </div>
                  </div>
                );
              })
            )}

            {/* DEBUG PANEL */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mt-8 text-xs font-mono text-gray-400 overflow-x-auto">
              <p className="border-b border-gray-700 pb-2 mb-2 font-bold text-white">DEBUG INFO - UNIFIED VIEW</p>
              <p>UID: <span className="text-green-400">{user?.uid}</span></p>
              <p>Role: <span className="text-yellow-400">{user?.role}</span></p>
              <p>Active Rides Fetched: {allMyActiveRides.length}</p>
              <p>Total Offers in DB: {rideOffers.length}</p>
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedTrips.length === 0 ? (
              <div className="text-center py-8 bg-[var(--driver-card)] rounded-2xl border border-gray-800">
                <p className="text-gray-400 text-xs text-center">No completed rides history.</p>
              </div>
            ) : (
              completedTrips.map(trip => (
                <div key={trip.id} className="bg-[var(--driver-card)] p-4 rounded-2xl shadow-sm border border-gray-800 flex flex-col gap-3 opacity-90 hover:opacity-100 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white mb-1 flex items-center gap-2">{trip.from} <ArrowRight size={14} className="text-gray-500" /> {trip.to}</h4>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Calendar size={10} /> {new Date(trip.date).toDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-green-900/30 text-green-400 px-2.5 py-1 rounded-lg font-bold border border-green-900/50">COMPLETED</span>
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Patient/Passenger Details</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <User size={14} className="text-[var(--driver-primary)]" /> {trip.passengerName || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 pl-6">{trip.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white tracking-wide">{trip.passengerMobile || 'N/A'}</p>
                        <p className="text-[10px] text-gray-500">Mobile</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
        }
      </div >
    );
  };
  const WalletView = () => {
    const pendingPayouts = activeTrips.reduce((acc, t) => acc + t.cost, 0);
    const availableBalance = driverBalance;

    return (
      <div className="px-6 animate-in slide-in-from-right duration-300 pb-24">
        <h2 className="font-bold text-[var(--driver-text)] mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Wallet size={18} className="text-[var(--driver-primary)]" /> My Wallet
        </h2>

        <div className="bg-gradient-to-br from-gray-800 to-black p-6 rounded-3xl shadow-lg border border-gray-700 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--driver-primary)]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
            <h1 className="text-4xl font-black text-white mb-4">\u20B9 {availableBalance.toLocaleString()}</h1>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Pending Payouts</p>
                <p className="text-lg font-bold text-yellow-400">\u20B9 {pendingPayouts.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Total Earned</p>
                <p className="text-lg font-bold text-green-400">\u20B9 {totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full bg-[var(--driver-primary)] text-black py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-2"
            >
              <Wallet size={18} /> Withdraw Funds
            </button>
          </div>
        </div>

        <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Recent Transactions</h3>
        <div className="space-y-4">
          {completedTrips.length === 0 ? (
            <div className="text-center py-8 bg-[var(--driver-card)] rounded-2xl border border-gray-800">
              <p className="text-gray-400 text-xs">No transactions yet.</p>
            </div>
          ) : (
            completedTrips.slice(0, 10).map(trip => (
              <div key={trip.id} className="bg-[var(--driver-card)] p-4 rounded-2xl shadow-sm border border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-900/20 flex items-center justify-center text-green-400">
                    <ArrowRight size={18} className="-rotate-45" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Ride Payment</h4>
                    <p className="text-[10px] text-gray-400">{new Date(trip.date).toDateString()} • {trip.from} → {trip.to}</p>
                  </div>
                </div>
                <span className="font-bold text-green-400">+ \u20B9{trip.cost}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const ProfileView = () => (
    <div className="px-6 animate-in slide-in-from-right duration-300 pb-20">
      <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6 relative">
        <button className="absolute top-6 right-6 p-2 bg-gray-800 rounded-lg text-[var(--driver-primary)] hover:bg-gray-700 transition" onClick={() => setShowEditProfile(true)}>
          <Edit size={16} />
        </button>
        <h3 className="font-bold text-lg text-white mb-4">Vehicle Details</h3>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm">Vehicle Number</span>
            <span className="font-bold text-white">{user?.vehicleNo}</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm">Vehicle Type</span>
            <span className="font-bold text-white">{user?.vehicleType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Driver Name</span>
            <span className="font-bold text-white">{user?.name}</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6 relative">
        <button className="absolute top-6 right-6 p-2 bg-gray-800 rounded-lg text-[var(--driver-primary)] hover:bg-gray-700 transition" onClick={() => setShowEditProfile(true)}>
          <Edit size={16} />
        </button>
        <h3 className="font-bold text-lg text-white mb-4">Personal Info</h3>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm">Mobile</span>
            <span className="font-bold text-white">+91 {user?.mobile}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Member Since</span>
            <span className="font-bold text-white">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Existing Statistics Section can be kept or removed - preserving for completeness */}
      <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Performance Stats</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-500 text-xs mb-1">Trips Completed</p>
          <p className="text-2xl font-bold text-white">{completedTrips.length}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-500 text-xs mb-1">Pass. Rating</p>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={16} fill="currentColor" />
            <span className="text-2xl font-bold text-white">{averageRating}</span>
          </div>
        </div>
      </div>


      {/* My Documents Section */}
      <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6">
        <h3 className="font-bold text-lg text-white mb-4">My Documents</h3>
        <div className="space-y-4">
          <div className="p-4 bg-black/20 rounded-xl border border-gray-700/50">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <FileText className="text-[var(--driver-primary)]" size={20} />
                <span className="font-bold text-white text-sm">Vehicle Photo (Side)</span>
              </div>
              {uploadedDocs.vehicleSide || user?.documents?.vehicleSide ? (
                <CheckCircle className="text-green-500" size={18} />
              ) : (
                <span className="text-xs text-orange-400 font-bold bg-orange-900/20 px-2 py-1 rounded">Required</span>
              )}
            </div>
            {uploading.vehicleSide ? (
              <div className="text-center py-2"><Loader2 className="animate-spin mx-auto text-[var(--driver-primary)]" size={20} /></div>
            ) : (uploadedDocs.vehicleSide || user?.documents?.vehicleSide) ? (
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><Check size={12} /> File Uploaded</div>
            ) : (
              <label className="block w-full text-center py-3 bg-[var(--driver-primary)]/10 text-[var(--driver-primary)] rounded-xl text-xs font-bold cursor-pointer hover:bg-[var(--driver-primary)]/20 transition border border-dashed border-[var(--driver-primary)]/30">
                Upload Photo
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'vehicleSide')} />
              </label>
            )}
          </div>
        </div>
        <button onClick={() => {
          if (user?.documents?.vehicleSide) {
            updateUser({ verificationStatus: 'verified' }); alert("Documents submitted! You can now post rides.");
          } else { alert("Please upload Vehicle Photo first."); }
        }} className={`w-full py-4 rounded-xl font-bold mt-6 shadow-lg transition flex items-center justify-center gap-2 ${user?.verificationStatus === 'verified' ? 'bg-green-600 text-white cursor-default' : 'bg-green-600 text-white hover:bg-green-700'}`}>
          {user?.verificationStatus === 'verified' ? <><CheckCircle size={20} /> Verified Driver</> : 'Upload'}
        </button>
      </div>

      <button onClick={logout} className="w-full bg-gray-800 text-gray-300 py-4 rounded-xl font-bold hover:bg-gray-700 transition flex items-center justify-center gap-2 mb-4"><LogOut size={18} /> Sign Out</button>
      <button onClick={handleClearAllData} className="w-full bg-red-900/20 text-red-500 py-4 rounded-xl font-bold hover:bg-red-900/30 transition flex items-center justify-center gap-2"><Trash2 size={18} /> Reset All Data (Dev)</button>
    </div>
  );

  return (
    <div className="bg-black min-h-screen font-sans text-white pb-24">
      <DriverHeader />

      {/* Main View Render */}
      {currentView === 'marketplace' && <MarketplaceView />}
      {currentView === 'my-rides' && <MyRidesView />}
      {currentView === 'wallet' && <WalletView />}
      {currentView === 'profile' && <ProfileView />}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800 p-4 pb-6 z-40">
        <div className="flex justify-around items-center max-w-lg mx-auto bg-gray-900/80 rounded-full p-2 border border-gray-800 shadow-2xl">
          <button onClick={() => setCurrentView('marketplace')} className={`p-3 rounded-full transition-all duration-300 ${currentView === 'marketplace' ? 'bg-[var(--driver-primary)] text-black scale-110 shadow-lg shadow-[var(--driver-primary)]/20' : 'text-gray-400 hover:text-white'}`}>
            <Home size={22} fill={currentView === 'marketplace' ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setCurrentView('my-rides')} className={`p-3 rounded-full transition-all duration-300 ${currentView === 'my-rides' ? 'bg-[var(--driver-primary)] text-black scale-110 shadow-lg shadow-[var(--driver-primary)]/20' : 'text-gray-400 hover:text-white'}`}>
            <Calendar size={22} fill={currentView === 'my-rides' ? "currentColor" : "none"} />
          </button>

          <button onClick={() => setCurrentView('profile')} className={`p-3 rounded-full transition-all duration-300 ${currentView === 'profile' ? 'bg-[var(--driver-primary)] text-black scale-110 shadow-lg shadow-[var(--driver-primary)]/20' : 'text-gray-400 hover:text-white'}`}>
            <User size={22} fill={currentView === 'profile' ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Floating Action Button for New Ride */}
      {currentView === 'marketplace' && (
        <button onClick={() => setShowAddRide(true)} className="fixed bottom-24 right-6 bg-[var(--driver-primary)] text-black p-4 rounded-full shadow-2xl hover:scale-105 transition z-40 animate-in zoom-in duration-300 border-2 border-black">
          <Plus size={24} strokeWidth={3} />
        </button>
      )}

      {/* Add Ride Modal */}
      {showAddRide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] text-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-800 relative">
            <button onClick={() => setShowAddRide(false)} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 transition"><X size={20} /></button>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Plus className="text-[var(--driver-primary)]" /> Post New Ride</h3>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">From</label>
                  <select value={newRide.from} onChange={e => setNewRide({ ...newRide, from: e.target.value })} className="w-full bg-black border border-gray-700 p-4 rounded-xl font-bold focus:border-[var(--driver-primary)] focus:outline-none transition">
                    {['Leh', 'Kargil', 'Srinagar', 'Jammu', 'Drass'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">To</label>
                  <select value={newRide.to} onChange={e => setNewRide({ ...newRide, to: e.target.value })} className="w-full bg-black border border-gray-700 p-4 rounded-xl font-bold focus:border-[var(--driver-primary)] focus:outline-none transition">
                    {['Leh', 'Kargil', 'Srinagar', 'Jammu', 'Drass'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
                  <input type="date" value={newRide.date} onClick={(e) => e.currentTarget.showPicker()} onChange={e => setNewRide({ ...newRide, date: e.target.value })} className="w-full bg-black border border-gray-700 p-4 rounded-xl font-bold focus:border-[var(--driver-primary)] focus:outline-none transition text-white scheme-dark cursor-pointer" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time</label>
                  <select value={newRide.time} onChange={e => setNewRide({ ...newRide, time: e.target.value })} className="w-full bg-black border border-gray-700 p-4 rounded-xl font-bold focus:border-[var(--driver-primary)] focus:outline-none transition">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = i % 12 || 12;
                      const ampm = i < 12 ? 'AM' : 'PM';
                      const time = `${h.toString().padStart(2, '0')}:00 ${ampm}`;
                      return <option key={time} value={time}>{time}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Auto-Price Display */}
              {/* <div className="bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Recommended Price</span>
                     <span className="text-xl font-bold text-[var(--driver-primary)]">\u20B9{newRide.price}</span>
                  </div>
               </div> */}
              {/* Seat Matrix Selection */}
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-xs font-bold uppercase mb-4 text-center tracking-wider">Select Available Seats</p>

                {/* Car Chassis Container - Synced with Passenger View */}
                <div className="bg-white rounded-[3rem] shadow-xl border-4 border-gray-300 px-6 py-10 w-full max-w-[320px] mx-auto relative mt-4">
                  {/* Front Windshield Hint */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-blue-100/50 rounded-b-xl"></div>

                  {/* Front Row (Driver + Passenger) */}
                  <div className="flex justify-between gap-8 mb-6 border-b border-dashed border-gray-200 pb-4 relative z-10">
                    <RealSeat
                      seatNum={1}
                      status={newRide.activeSeats.includes(1) ? 'selected' : 'inactive'}
                      onClick={() => {
                        const seats = newRide.activeSeats.includes(1)
                          ? newRide.activeSeats.filter(s => s !== 1)
                          : [...newRide.activeSeats, 1];
                        setNewRide({ ...newRide, activeSeats: seats });
                      }}
                    />
                    <RealSeat status="driver" />
                  </div>

                  {/* Middle Row */}
                  <div className="flex justify-center gap-8 mb-4 relative z-10">
                    {[2, 3, 4].map(s => (
                      <RealSeat
                        key={s}
                        seatNum={s}
                        status={newRide.activeSeats.includes(s) ? 'selected' : 'inactive'}
                        onClick={() => {
                          const seats = newRide.activeSeats.includes(s)
                            ? newRide.activeSeats.filter(x => x !== s)
                            : [...newRide.activeSeats, s];
                          setNewRide({ ...newRide, activeSeats: seats });
                        }}
                      />
                    ))}
                  </div>

                  {/* Back Row */}
                  <div className="flex justify-center gap-8 relative z-10">
                    {[5, 6, 7].map(s => (
                      <RealSeat
                        key={s}
                        seatNum={s}
                        status={newRide.activeSeats.includes(s) ? 'selected' : 'inactive'}
                        onClick={() => {
                          const seats = newRide.activeSeats.includes(s)
                            ? newRide.activeSeats.filter(x => x !== s)
                            : [...newRide.activeSeats, s];
                          setNewRide({ ...newRide, activeSeats: seats });
                        }}
                      />
                    ))}
                  </div>

                  {/* Legend Overlay */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rear</div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">Tap seats to toggle availability (<span className="text-green-400 font-bold">{newRide.activeSeats.length} Selected</span>)</p>
              </div>

              <div className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-700/30 text-yellow-500 text-xs font-mono">
                Market prices are fixed for this route.
              </div>

              <button onClick={handlePublish} className="w-full bg-[var(--driver-primary)] text-black py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#e6c200] transition transform active:scale-95">
                Publish Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ride Modal */}
      {showEditRide && editingRide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] text-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-800 relative">
            <button onClick={() => setShowEditRide(false)} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 transition"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-6">Edit Ride</h3>
            <div className="space-y-4">
              {/* Simplified Edit - Just Active/Inactive seats logic mostly but for now user just wants basic edit date/time maybe? */}
              {/* Reusing New Ride inputs for simplicity but bound to editingRide */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
                  <input type="date" value={editingRide.date} onClick={(e) => e.currentTarget.showPicker()} onChange={e => setEditingRide({ ...editingRide, date: e.target.value })} className="w-full bg-black border border-gray-700 p-3 rounded-xl font-bold text-white scheme-dark cursor-pointer" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time</label>
                  <select value={editingRide.time} onChange={e => setEditingRide({ ...editingRide, time: e.target.value })} className="w-full bg-black border border-gray-700 p-3 rounded-xl font-bold">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = i % 12 || 12;
                      const ampm = i < 12 ? 'AM' : 'PM';
                      const time = `${h.toString().padStart(2, '0')}:00 ${ampm}`;
                      return <option key={time} value={time}>{time}</option>;
                    })}
                  </select>
                </div>
              </div>
              <button onClick={handleUpdateRide} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition mt-4">
                Update Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-800 relative">
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 transition"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Wallet size={20} /> Withdraw</h3>
            <p className="text-gray-400 text-sm mb-6">Enter amount to withdraw from your available balance of \u20B9{driverBalance}.</p>

            <form onSubmit={(e) => { e.preventDefault(); const amt = Number((e.target as any).amount.value); if (amt > driverBalance) return alert("Insufficient balance"); handleWithdraw(amt, {}); }}>
              <input name="amount" type="number" placeholder="Enter Amount" className="w-full bg-black border border-gray-700 p-4 rounded-xl font-bold text-xl mb-4 focus:border-[var(--driver-primary)] outline-none" max={driverBalance} min={100} required />
              <button type="submit" className="w-full bg-[var(--driver-primary)] text-black py-4 rounded-xl font-bold shadow-lg hover:bg-[#e6c200] transition">Send Request</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-black w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setShowEditProfile(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Edit Profile</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                <input type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full bg-gray-100 p-3 rounded-xl font-bold border-none focus:ring-2 focus:ring-[var(--driver-primary)]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Vehicle Number</label>
                <input type="text" value={editFormData.vehicleNo} onChange={e => setEditFormData({ ...editFormData, vehicleNo: e.target.value })} className="w-full bg-gray-100 p-3 rounded-xl font-bold border-none focus:ring-2 focus:ring-[var(--driver-primary)]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Vehicle Type</label>
                <select
                  className="w-full bg-gray-100 p-3 rounded-xl font-bold border-none focus:ring-2 focus:ring-[var(--driver-primary)]"
                  value={editFormData.vehicleType}
                  onChange={e => setEditFormData({ ...editFormData, vehicleType: e.target.value })}
                >
                  {Object.keys(VEHICLE_WHITELIST).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mobile Number</label>
                <input type="tel" value={editFormData.mobile} onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })} className="w-full bg-gray-100 p-3 rounded-xl font-bold border-none focus:ring-2 focus:ring-[var(--driver-primary)]" />
                {editFormData.mobile !== user?.mobile && (
                  <p className="text-[10px] text-orange-500 mt-1 font-bold flex items-center gap-1"><AlertCircle size={10} /> Verification required</p>
                )}
              </div>

              {otpSent && (
                <div className="animate-in slide-in-from-top duration-300">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Enter OTP (Mock: 123456)</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-yellow-50 p-3 rounded-xl font-bold border-2 border-yellow-400 text-center tracking-widest text-xl" placeholder="XXXXXX" />
                </div>
              )}

              <button onClick={handleProfileUpdate} className="w-full bg-[var(--driver-primary)] text-black py-4 rounded-xl font-bold shadow-lg mt-4">
                {otpSent ? 'Verify & Save' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DEBUG PANEL - RE-ADDED FOR USER VERIFICATION */}
      <div className="fixed bottom-0 right-0 m-4 p-4 bg-black/80 text-white text-[10px] font-mono rounded-lg z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
        <p className="font-bold text-yellow-400 border-b border-gray-600 mb-1">DEBUG v1.2</p>
        <p>User: {user?.name} ({user?.role})</p>
        <p>UID: {user?.uid?.slice(0, 6)}...</p>
        <p>Total Offers Fetched: {rideOffers.length}</p>
        <p>My Active Rides: {myPostedRides.length}</p>
        <p>Marketplace Rides: {availableRides.length}</p>
      </div>
    </div>
  );
}