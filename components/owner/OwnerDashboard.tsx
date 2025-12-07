import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { Navigation, User, LogOut, MapPin, ShieldCheck, Wallet, ChevronRight, MessageCircle, Plus, Calendar, Clock, IndianRupee, X, ArrowRight, History, Home, Phone, Star, Menu, CheckCircle, Search, Users, Edit, Trash2, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import { ChatScreen } from '../common/ChatScreen';
import { DatePicker } from '../common/DatePicker';
import { SideMenu } from '../common/SideMenu';
import { PaymentModal } from '../common/PaymentModal';
import { CITIES, ROUTE_WHITELIST, VEHICLE_WHITELIST, BASE_RATES } from '../../constants';

type OwnerView = 'marketplace' | 'all-rides' | 'my-rides' | 'profile' | 'wallet' | 'support';

export const OwnerDashboard: React.FC = () => {
  const { user, trips, rideOffers, driverBalance, updateTripStatus, logout, publishRide, requestPayment, cancelRideOffer, updateRideOfferPrice, updateRideOffer, updateUser, completeRide, withdrawFromWallet, deleteAccount } = useApp();
  const [activeChatTripId, setActiveChatTripId] = useState<string | null>(null);
  const [showAddRide, setShowAddRide] = useState(false);
  const [showEditRide, setShowEditRide] = useState(false);
  const [editingRide, setEditingRide] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posted' | 'booked' | 'active' | 'completed'>('posted');
  const [currentView, setCurrentView] = useState<OwnerView>('marketplace');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

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

  // Add Ride Form State
  const [newRide, setNewRide] = useState({
    from: 'Leh',
    to: 'Srinagar',
    date: new Date().toISOString().split('T')[0],
    time: '07:00 AM',
    price: 0,
    totalSeats: 7,
    vehicleType: 'Toyota Innova',
    seatPrices: {} as { [key: number]: number },
    activeSeats: [] as number[]
  });

  const myTrips = trips.filter(t => t.driverId === user?.uid || t.driverName === user?.name);
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
    .sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeB - timeA;
    });

  const myPostedRides = rideOffers.filter(o => (o.driverId === user?.uid || o.driverName === user?.name) && (o.totalSeats - (o.bookedSeats?.length || 0) > 0) && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

  const handlePublish = () => {
    // if (newRide.price < 500 || newRide.price > 5000) return alert("Price per seat must be between ₹500 and ₹5000.");

    const activeCount = activeTrips.length + myPostedRides.length;
    if (activeCount >= 10) return alert("You can only have a maximum of 10 active rides.");

    const [timePart, ampm] = newRide.time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let h = parseInt(hours);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const rideDateObj = new Date(newRide.date);
    rideDateObj.setHours(h, parseInt(minutes), 0, 0);

    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    if (rideDateObj < oneHourFromNow) return alert("You must post rides at least 1 hour in advance.");

    const hasOverlap = [...activeTrips, ...myPostedRides].some(trip => {
      const [tTime, tAmpm] = trip.time.split(' ');
      const [tHours, tMinutes] = tTime.split(':');
      let th = parseInt(tHours);
      if (tAmpm === 'PM' && th !== 12) th += 12;
      if (tAmpm === 'AM' && th === 12) th = 0;
      const tripDateObj = new Date(trip.date);
      tripDateObj.setHours(th, parseInt(tMinutes), 0, 0);
      const diffHours = Math.abs(rideDateObj.getTime() - tripDateObj.getTime()) / 36e5;
      return diffHours < 1;
    });

    if (hasOverlap) return alert("You have another ride scheduled within 1 hour.");

    publishRide({
      vehicleNo: user?.vehicleNo || '',
      vehicleType: newRide.vehicleType,
      from: newRide.from,
      to: newRide.to,
      date: newRide.date,
      time: newRide.time,
      pricePerSeat: newRide.price,
      totalSeats: newRide.totalSeats,
      activeSeats: newRide.activeSeats.length > 0 ? newRide.activeSeats : Array.from({ length: newRide.totalSeats }, (_, i) => i + 1),
      seatPrices: newRide.seatPrices
    });
    setShowAddRide(false);
    alert('Ride Published Successfully!');
    setCurrentView('my-rides');
  };

  const handleUpdateRide = () => {
    if (!editingRide) return;
    updateRideOffer(editingRide.id, {
      from: editingRide.from,
      to: editingRide.to,
      date: editingRide.date,
      time: editingRide.time,
      pricePerSeat: editingRide.pricePerSeat,
      totalSeats: editingRide.totalSeats, // Assuming totalSeats reflects the new active count
      activeSeats: editingRide.activeSeats,
      seatPrices: editingRide.seatPrices
    });
    setShowEditRide(false);
    setEditingRide(null);
    alert('Ride Updated Successfully!');
  };

  const handleNavigate = (view: string) => {
    if (view === 'bookings') setCurrentView('my-rides');
    else setCurrentView(view as OwnerView);
    setIsMenuOpen(false);
  };

  const handleWithdraw = async (amount: number, details: any) => {
    const success = await withdrawFromWallet(amount);
    if (success) {
      alert(`Withdrawal request for ₹${amount} sent successfully!`);
      setShowWithdrawModal(false);
    }
  };

  if (activeChatTripId) {
    return <ChatScreen tripId={activeChatTripId} onBack={() => setActiveChatTripId(null)} />;
  } const DriverHeader = () => (
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
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
              <User className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg drop-shadow-md leading-none">{user?.name}</h1>
              <p className="text-xs text-white/80 font-medium">{user?.vehicleNo}</p>
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
      <div className="flex h-[calc(100vh-220px)] overflow-hidden">
        {/* Left Sidebar Filters */}
        <div className="w-1/4 h-full bg-[var(--driver-card)] border-r border-gray-800 p-4 overflow-y-auto hidden md:block">
          <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Filter Routes</h3>

          <button
            onClick={() => setSelectedRouteFilter(null)}
            className={`w-full text-left p-3 rounded-xl mb-2 text-sm font-medium transition ${!selectedRouteFilter ? 'bg-[var(--driver-primary)] text-black' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            All Routes
          </button>

          {uniqueRoutes.map(route => (
            <button
              key={route}
              onClick={() => setSelectedRouteFilter(route)}
              className={`w-full text-left p-3 rounded-xl mb-2 text-sm font-medium transition ${selectedRouteFilter === route ? 'bg-[var(--driver-primary)] text-black' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              {route.replace('-', ' → ')}
              <span className="float-right text-xs opacity-70">
                {availableRides.filter(r => `${r.from}-${r.to}` === route).length}
              </span>
            </button>
          ))}
        </div>

        {/* Mobile Filter Horizontal Scroll (Visible only on mobile) */}
        <div className="md:hidden w-full overflow-x-auto whitespace-nowrap px-4 py-2 bg-[var(--driver-bg)]/95 backdrop-blur-sm border-b border-gray-800 mb-2">
          <button
            onClick={() => setSelectedRouteFilter(null)}
            className={`inline-block px-4 py-1.5 rounded-full mr-2 text-xs font-bold ${!selectedRouteFilter ? 'bg-[var(--driver-primary)] text-black' : 'bg-gray-800 text-gray-400'}`}
          >
            All
          </button>
          {uniqueRoutes.map(route => (
            <button
              key={route}
              onClick={() => setSelectedRouteFilter(route)}
              className={`inline-block px-4 py-1.5 rounded-full mr-2 text-xs font-bold ${selectedRouteFilter === route ? 'bg-[var(--driver-primary)] text-black' : 'bg-gray-800 text-gray-400'}`}
            >
              {route.replace('-', ' → ')}
            </button>
          ))}
        </div>

        {/* Right Content Area - Ride List */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 pb-32">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              {selectedRouteFilter ? selectedRouteFilter.replace('-', ' → ') : 'All Available Rides'}
            </h2>
            <p className="text-xs text-gray-400">{filteredRides.length} rides found</p>
          </div>

          <div className="space-y-4">
            {filteredRides.map(offer => (
              <div key={offer.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                {/* Flight Style Body */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">

                  {/* Airline/Driver Info */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{offer.driverName}</p>
                      <p className="text-xs text-gray-500">{offer.vehicleType} • {offer.vehicleNo}</p>
                    </div>
                  </div>

                  {/* Flight Path / Route Info */}
                  <div className="flex-1 flex items-center justify-center gap-6 px-4 w-full md:w-auto">
                    <div className="text-right">
                      <p className="md:text-lg font-black text-gray-800">{offer.time}</p>
                      <p className="text-xs text-gray-500 font-medium uppercase">{offer.from}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 w-24">
                      <span className="text-[10px] text-gray-400 font-mono">Non-stop</span>
                      <div className="w-full h-[2px] bg-gray-300 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                          <span className="rotate-90 block">✈</span>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      </div>
                      <span className="text-[10px] text-green-600 font-bold">Available</span>
                    </div>

                    <div className="text-left">
                      <p className="md:text-lg font-black text-gray-800">
                        -- {/* End time placeholder */}
                      </p>
                      <p className="text-xs text-gray-500 font-medium uppercase">{offer.to}</p>
                    </div>
                  </div>

                  {/* Book Action - PRICE REMOVED */}
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0">
                    <div className="text-center md:text-right hidden md:block">
                      <p className="text-xs text-red-500 font-bold">{offer.totalSeats - (offer.bookedSeats?.length || 0)} Seats Left</p>
                    </div>

                    <a href={`tel:${offer.driverMobile}`} className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:bg-orange-700 transition w-full md:w-auto text-center">
                      Call Driver
                    </a>
                    <span className="md:hidden text-xs text-red-500 font-bold">{offer.totalSeats - (offer.bookedSeats?.length || 0)} Seats Left</span>
                  </div>

                </div>

                {/* Footer Info */}
                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-xs text-gray-500 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-green-500" /> Verified Driver
                  </span>
                  <span>Date: {new Date(offer.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const AllRidesView = () => (
    <div className="px-6 pb-24 pt-6">
      <h2 className="text-2xl font-bold text-white mb-6">All Rides</h2>
      <div className="text-gray-400 text-center py-10">Coming Soon</div>
    </div>
  );

  const MyRidesView = () => (
    <div className="px-6 pb-24 pt-6">
      <h2 className="text-2xl font-bold text-white mb-6">My Trips</h2>
      <div className="space-y-4">
        {activeTrips.length === 0 && myPostedRides.length === 0 ? (
          <div className="text-gray-400 text-center py-10">No trips found.</div>
        ) : (
          <>
            {myPostedRides.map(offer => (
              <div key={offer.id} className="bg-[var(--driver-card)] p-4 rounded-2xl border border-gray-800 mb-4">
                <div className="flex justify-between">
                  <h3 className="text-white font-bold">{offer.from} → {offer.to}</h3>
                  <span className="text-[var(--driver-primary)] font-bold">{offer.status || 'OPEN'}</span>
                </div>
                <p className="text-gray-400 text-sm">{new Date(offer.date).toLocaleDateString()} at {offer.time}</p>
                <button
                  onClick={() => { setEditingRide(offer); setShowEditRide(true); }}
                  className="mt-2 text-sm bg-gray-700 px-3 py-1 rounded text-white"
                >
                  Edit
                </button>
              </div>
            ))}
            {activeTrips.map(trip => (
              <div key={trip.id} className="bg-[var(--driver-card)] p-4 rounded-2xl border border-gray-800 mb-4 opacity-75">
                <h3 className="text-white font-bold">{trip.from} → {trip.to}</h3>
                <p className="text-gray-400 text-sm">Trip ID: {trip.id}</p>
                <p className="text-yellow-500 text-xs">Active Trip</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  const ProfileView = () => {
    const [isEditingVehicle, setIsEditingVehicle] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editVehicleData, setEditVehicleData] = useState({ vehicleNo: '', vehicleType: '' });
    const [editProfileData, setEditProfileData] = useState({ name: '', mobile: '', email: '' });

    useEffect(() => {
      if (isEditingVehicle && user) {
        setEditVehicleData({
          vehicleNo: user.vehicleNo || '',
          vehicleType: user.vehicleType || 'Toyota Innova'
        });
      }
      if (isEditingProfile && user) {
        setEditProfileData({
          name: user.name || '',
          mobile: user.mobile || '',
          email: user.name ? `${user.name.toLowerCase().replace(' ', '.')}@example.com` : ''
        });
      }
    }, [isEditingVehicle, isEditingProfile, user]);

    const handleSaveVehicle = async () => {
      if (!editVehicleData.vehicleNo || !editVehicleData.vehicleType) return alert("All fields are required.");
      await updateUser({
        vehicleNo: editVehicleData.vehicleNo,
        vehicleType: editVehicleData.vehicleType
      });
      setIsEditingVehicle(false);
      alert("Vehicle details updated successfully!");
    };

    const handleSaveProfile = async () => {
      if (!editProfileData.name || !editProfileData.mobile) return alert("Name and Mobile are required.");
      await updateUser({
        name: editProfileData.name,
        mobile: editProfileData.mobile
      });
      setIsEditingProfile(false);
      alert("Profile details updated successfully!");
    };

    return (
      <div className="px-6 pb-24 pt-6 animate-in slide-in-from-right">
        <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>

        {/* Vehicle Details Section */}
        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white">Vehicle Details</h3>
            {!isEditingVehicle ? (
              <button onClick={() => setIsEditingVehicle(true)} className="text-[var(--driver-primary)] p-2 hover:bg-white/5 rounded-full transition">
                <Edit size={18} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingVehicle(false)} className="text-gray-400 p-2 hover:bg-white/5 rounded-full transition">
                  <X size={18} />
                </button>
                <button onClick={handleSaveVehicle} className="text-green-400 p-2 hover:bg-white/5 rounded-full transition">
                  <Check size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400 text-sm py-2">Vehicle Number</span>
              {isEditingVehicle ? (
                <input
                  type="text"
                  value={editVehicleData.vehicleNo}
                  onChange={(e) => setEditVehicleData({ ...editVehicleData, vehicleNo: e.target.value.toUpperCase() })}
                  className="bg-gray-900 text-white font-bold p-2 rounded-lg border border-gray-700 w-40 text-right uppercase"
                />
              ) : (
                <span className="font-bold text-white py-2">{user?.vehicleNo}</span>
              )}
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400 text-sm py-2">Vehicle Type</span>
              {isEditingVehicle ? (
                <select
                  value={editVehicleData.vehicleType}
                  onChange={(e) => setEditVehicleData({ ...editVehicleData, vehicleType: e.target.value })}
                  className="bg-gray-900 text-white font-bold p-2 rounded-lg border border-gray-700 w-40 text-right appearance-none"
                >
                  {VEHICLE_WHITELIST.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              ) : (
                <span className="font-bold text-white py-2">{user?.vehicleType}</span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white">Personal Info</h3>
            {!isEditingProfile ? (
              <button onClick={() => setIsEditingProfile(true)} className="text-[var(--driver-primary)] p-2 hover:bg-white/5 rounded-full transition">
                <Edit size={18} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 p-2 hover:bg-white/5 rounded-full transition">
                  <X size={18} />
                </button>
                <button onClick={handleSaveProfile} className="text-green-400 p-2 hover:bg-white/5 rounded-full transition">
                  <Check size={18} />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400 text-sm py-2">Mobile</span>
              {isEditingProfile ? (
                <input
                  type="tel"
                  value={editProfileData.mobile}
                  onChange={(e) => setEditProfileData({ ...editProfileData, mobile: e.target.value })}
                  className="bg-gray-900 text-white font-bold p-2 rounded-lg border border-gray-700 w-40 text-right"
                />
              ) : (
                <span className="font-bold text-white py-2">+91 {user?.mobile}</span>
              )}
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400 text-sm py-2">Name</span>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editProfileData.name}
                  onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                  className="bg-gray-900 text-white font-bold p-2 rounded-lg border border-gray-700 w-40 text-right"
                />
              ) : (
                <span className="font-bold text-white py-2">{user?.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Section moved here? No, user wanted it removed from Home. Might as well be in Profile or Wallet. Let's put in Profile lightly. */}
        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6">
          <h3 className="font-bold text-lg text-white mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-[var(--driver-primary)]">{completedTrips.length}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Trips</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">₹{totalEarnings}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Earnings</p>
            </div>
          </div>
        </div>

        {/* Documents Section including Upload */}
        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mt-6 mb-6">
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[var(--driver-primary)]" /> My Documents
          </h3>

          <div className="space-y-4">
            {[
              { id: 'start_readingl', label: 'Driving License' },
              { id: 'rc', label: 'Vehicle Registration' },
              { id: 'insurance', label: 'Vehicle Insurance' },
              { id: 'vehicleFront', label: 'Vehicle Photo' }
            ].map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id] ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id] ? <Check size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-base text-gray-300 font-medium">{doc.label}</p>
                    {(user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id]) && <p className="text-xs text-green-400">Uploaded</p>}
                  </div>
                </div>

                {uploading[doc.id] ? (
                  <Loader2 size={18} className="animate-spin text-[var(--driver-primary)]" />
                ) : (
                  <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center ${user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id] ? 'bg-gray-800 text-gray-400' : 'bg-[var(--driver-primary)]/10 hover:bg-[var(--driver-primary)]/20 text-[var(--driver-primary)]'}`}>
                    {user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id] ? 'Change' : 'Upload'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], doc.id);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full bg-[#E02E49] text-black py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-red-600 transition flex items-center justify-center gap-2 mb-4"
        >
          <LogOut size={22} /> LOGOUT
        </button>

        <button
          onClick={handleClearAllData}
          className="w-full text-orange-500 py-3 rounded-2xl font-bold text-sm hover:bg-orange-900/20 transition flex items-center justify-center gap-2 border border-dashed border-orange-500/50"
        >
          <Trash2 size={18} /> Clean DB (Debug)
        </button>
      </div>
    );
  };

  return (
    <div className="bg-[var(--driver-bg)] min-h-screen pb-24 relative">
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
      />

      <DriverHeader />

      {currentView === 'marketplace' && <MarketplaceView />}
      {currentView === 'all-rides' && <AllRidesView />}
      {currentView === 'my-rides' && <MyRidesView />}
      {currentView === 'profile' && <ProfileView />}
      {currentView === 'support' && <div className="p-6 text-center text-gray-500">Support coming soon...</div>}

      {/* Floating Action Button for Post Ride */}
      <button
        onClick={() => {
          if (user?.verificationStatus === 'verified') {
            setShowAddRide(true);
          } else {
            alert("Please upload your documents in the Profile section to verify your account before posting rides.");
            setCurrentView('profile');
          }
        }}
        className={`fixed bottom-24 right-6 p-4 rounded-full shadow-2xl transition z-40 animate-in zoom-in duration-300 ${user?.verificationStatus === 'verified' ? 'bg-[var(--driver-primary)] text-[var(--login-btn-text)] hover:opacity-90' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
      >
        <Plus size={28} />
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--driver-card)] border-t border-gray-800 p-4 flex justify-around items-center z-50 pb-6 rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <button
          onClick={() => setCurrentView('marketplace')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-full transition-all ${currentView === 'marketplace' ? 'bg-yellow-900/40 text-[var(--driver-primary)]' : 'text-gray-500'} `}
        >
          <Home size={24} fill={currentView === 'marketplace' ? 'currentColor' : 'none'} />
          <span className="text-xs font-bold">Home</span>
        </button>
        <button
          onClick={() => setCurrentView('my-rides')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-full transition-all ${currentView === 'my-rides' ? 'bg-yellow-900/40 text-[var(--driver-primary)]' : 'text-gray-500'} `}
        >
          <Navigation size={24} fill={currentView === 'my-rides' ? 'currentColor' : 'none'} />
          <span className="text-xs font-bold">My Trips</span>
        </button >
        <button
          onClick={() => setCurrentView('profile')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-full transition-all ${currentView === 'profile' ? 'bg-yellow-900/40 text-[var(--driver-primary)]' : 'text-gray-500'} `}
        >
          <User size={24} fill={currentView === 'profile' ? 'currentColor' : 'none'} />
          <span className="text-xs font-bold">Account</span>
        </button>
      </div>

      {/* Add Ride Modal - Simplified Re-implementation */}
      {showAddRide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[var(--driver-bg)] p-5 flex justify-between items-center text-white border-b border-gray-800 flex-shrink-0">
              <h3 className="font-bold">Post New Ride</h3>
              <button onClick={() => setShowAddRide(false)} className="bg-white/10 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 bg-[var(--driver-card)] text-white">
              <p className="mb-4 text-sm text-gray-400">Please select route and details. (Simplified for Recovery)</p>

              {/* Simplified Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-gray-400">Route</label>
                  <select
                    value={`${newRide.from}-${newRide.to}`}
                    onChange={e => {
                      const [from, to] = e.target.value.split('-');
                      setNewRide({ ...newRide, from, to, price: BASE_RATES[`${from}-${to}`] || 2500 });
                    }}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white"
                  >
                    {ROUTE_WHITELIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <button onClick={handlePublish} className="w-full bg-[var(--driver-primary)] text-black font-bold py-3 rounded-xl mt-4">
                  Publish Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};