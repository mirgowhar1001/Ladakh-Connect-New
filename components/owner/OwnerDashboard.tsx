import React, { useState, useMemo } from 'react';
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

      {/* Quick Stats Bar */}
      {/* Quick Stats Bar - HIDDEN */}


      {/* Dynamic Ride Earnings Stat */}
      {/* Dynamic Ride Earnings Stat - HIDDEN */}

    </div>
  );

  // Simplified Home Dashboard View
  const MarketplaceView = () => {
    const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

    const uniqueRoutes = useMemo(() => {
      const routes = new Set<string>();
      availableRides.forEach(offer => {
        routes.add(`${offer.from}-${offer.to}`);
      });
      return Array.from(routes);
    }, [availableRides]);

    const routeRides = useMemo(() => {
      if (!selectedRoute) return [];
      const [from, to] = selectedRoute.split('-');
      return availableRides.filter(r => r.from === from && r.to === to);
    }, [selectedRoute, availableRides]);

    if (selectedRoute) {
      return (
        <div className="px-6 animate-in slide-in-from-right duration-300 pb-24">
          <div className="flex items-center gap-2 mb-6 pt-4">
            <button onClick={() => setSelectedRoute(null)} className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition">
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <h2 className="font-bold text-[var(--driver-text)] text-lg uppercase">
              {selectedRoute.replace('-', ' → ')}
            </h2>
          </div>

          <div className="space-y-4">
            {routeRides.map(offer => (
              <div key={offer.id} className="bg-[var(--driver-card)] rounded-3xl shadow-sm p-5 border border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg">{offer.driverName}</h3>
                    <p className="text-xs text-gray-400 font-mono">{offer.vehicleNo}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-gray-400 uppercase">Seats</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-white text-md">{offer.totalSeats - offer.bookedSeats.length} Free</span>
                      <span className="text-[10px] text-gray-500 font-bold">{offer.bookedSeats.length} Booked</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400 font-medium">{offer.vehicleType}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50 mt-4">
                  <div className="text-xs text-gray-400">
                    <span className="block text-gray-500 mb-0.5">Mobile</span>
                    <span className="font-mono text-white">{offer.driverMobile || offer.driverId}</span>
                  </div>
                  {offer.driverMobile && (
                    <a href={`tel:${offer.driverMobile}`} className="bg-green-900/30 text-green-400 p-2 rounded-lg hover:bg-green-900/50 transition">
                      <Phone size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 animate-in slide-in-from-right duration-300 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, Driver!</h2>
          <p className="text-gray-400 text-sm">Select a route to view active drivers.</p>
        </div>

        <div className="space-y-3 mb-8">
          {uniqueRoutes.length === 0 ? (
            <div className="text-center py-12 px-8 bg-[var(--driver-card)] rounded-3xl border border-gray-800 opacity-50">
              <MapPin size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No active routes available.</p>
            </div>
          ) : (
            uniqueRoutes.map(route => {
              const count = availableRides.filter(r => `${r.from}-${r.to}` === route).length;
              return (
                <div
                  key={route}
                  onClick={() => setSelectedRoute(route)}
                  className="bg-[var(--driver-card)] p-5 rounded-2xl border border-gray-800 shadow-sm flex justify-between items-center hover:bg-gray-800 transition cursor-pointer"
                >
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wide">{route.replace('-', ' → ')}</h3>
                    <p className="text-xs text-[var(--driver-primary)] mt-1 font-medium">{count} Drivers</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-500" />
                </div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--driver-card)] p-4 rounded-2xl border border-gray-800">
            <p className="text-gray-400 text-xs uppercase font-bold mb-2">Active Trips</p>
            <p className="text-2xl font-black text-white">{activeTrips.length}</p>
          </div>
          <div className="bg-[var(--driver-card)] p-4 rounded-2xl border border-gray-800">
            <p className="text-gray-400 text-xs uppercase font-bold mb-2">Earnings Today</p>
            <p className="text-2xl font-black text-green-400">₹{todayEarnings}</p>
          </div>
        </div>
      </div>
    );
  };

  const AllRidesView = () => (
    <div className="px-6 animate-in slide-in-from-right duration-300 pb-24 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setCurrentView('marketplace')} className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700">
          <ArrowRight size={20} className="rotate-180" />
        </button>
        <h2 className="font-bold text-[var(--driver-text)] flex items-center gap-2 text-lg">
          All Available Rides
        </h2>
      </div>

      {availableRides.length === 0 ? (
        <div className="text-center py-16 px-8 bg-[var(--driver-card)] rounded-3xl shadow-sm border border-gray-800">
          <div className="bg-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-[var(--driver-primary)]" />
          </div>
          <p className="text-white font-bold mb-1">No Rides Available</p>
          <p className="text-gray-400 text-sm">Check back later for new ride offers.</p>
        </div>
    const bookedRides = rideOffers.filter(o => o.driverName === user?.name && o.bookedSeats.length > 0);

    // For Booked Rides, we need to find the associated trips (passengers)
    const getPassengersForOffer = (offerId: string) => {
      return trips.filter(t => t.offerId === offerId && t.status !== 'CANCELLED');
    };

    // Filter bookedRides to only show those that haven't started yet
    const pendingBookedRides = rideOffers.filter(o => {
      if (o.driverName !== user?.name) return false;
      const offersTrips = getPassengersForOffer(o.id);

      // If it has "real" bookings (BOOKED or WAITING), it's pending if not started
      const hasBookings = offersTrips.some(t => t.status === 'BOOKED' || t.status === 'WAITING_CONFIRMATION');
      if (!hasBookings && o.bookedSeats.length === 0) return false;

      // If any trip is EN_ROUTE or ARRIVED, this ride is active, not just booked
      const isStarted = offersTrips.some(t => t.status === 'EN_ROUTE' || t.status === 'ARRIVED' || t.status === 'COMPLETED');
      return !isStarted;
    });

    // Valid Active Trips for the 'Active' tab (En Route or Arrived)
    const inProgressTrips = activeTrips.filter(t => t.status === 'EN_ROUTE' || t.status === 'ARRIVED');

      return (
      <div className="px-6 animate-in slide-in-from-right duration-300 pb-24">
        <h2 className="font-bold text-[var(--driver-text)] mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Calendar size={18} className="text-[var(--driver-primary)]" /> My Rides
        </h2>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-black/20 rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {['posted', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab
                ? 'bg-[var(--driver-primary)] text-black shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* POSTED TAB: Combines Posted (Empty), Booked (Pending), and Active (En Route) */}
        {/* POSTED TAB: Combines Posted (Empty), Booked (Pending), and Active (En Route) */}
        {activeTab === 'posted' && (
          <div className="space-y-6">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-2">My Active Rides</h3>
            {[...postedRides, ...pendingBookedRides, ...inProgressTrips].length === 0 ? (
              <div className="text-center py-12 bg-[var(--driver-card)] rounded-2xl border border-gray-800">
                <p className="text-gray-400 text-base">No active rides.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Unified Render Loop for All Active/Posted Rides */}
                {[...inProgressTrips, ...pendingBookedRides, ...postedRides]
                  // Remove duplicates by ID
                  .filter((ride, index, self) => index === self.findIndex((t) => t.id === ride.id))
                  .map(ride => {
                    // Determine if it's a Trip (booking) or Offer
                    let offer: any = ride;
                    if ((ride as any).passengerId) {
                      const parentOffer = rideOffers.find(o => o.id === (ride as any).offerId);
                      if (parentOffer) offer = parentOffer;
                    }

                    // Re-fetch passengers
                    const passengers = getPassengersForOffer(offer.id);
                    const isEnRoute = passengers.some(t => t.status === 'EN_ROUTE');
                    const isArrived = passengers.some(t => t.status === 'ARRIVED');

                    return (
                      <div key={offer.id} className="bg-[var(--driver-card)] rounded-3xl shadow-lg p-6 border border-gray-800 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-2 h-full ${isEnRoute ? 'bg-orange-500' : isArrived ? 'bg-green-500' : 'bg-blue-500'}`}></div>

                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 pl-2">
                          <div>
                            <div className="mb-2">
                              {isEnRoute ? <span className="bg-orange-900/40 text-orange-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">In Progress</span> :
                                isArrived ? <span className="bg-green-900/40 text-green-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Arrived</span> :
                                  passengers.length > 0 ? <span className="bg-green-900/40 text-green-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Active ({passengers.length} Booked)</span> :
                                    <span className="bg-blue-900/40 text-blue-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Open</span>
                              }
                            </div>
                            <h3 className="font-bold text-white text-3xl mb-2">{offer.from} → {offer.to}</h3>
                            <p className="text-base text-gray-300">{new Date(offer.date).toDateString()} • {offer.time}</p>
                          </div>
                          <div className="text-right">
                            {/* <span className="block text-3xl font-bold text-[var(--driver-primary)]">₹{offer.pricePerSeat}</span> */}
                            <button onClick={() => { setEditingRide(offer); setShowEditRide(true); }} className="text-xs bg-gray-700 px-4 py-2 rounded-xl text-white mt-3 hover:bg-gray-600 font-bold transition-colors">Edit Details</button>
                          </div>
                        </div>

                        {/* SEAT MAP VISUALIZATION */}
                        <div className="bg-black/30 rounded-2xl p-5 mb-6 space-y-3">
                          <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 tracking-wider">Seat Status</h4>
                          <div className="space-y-3">
                            {Array.from({ length: offer.totalSeats }, (_, i) => i + 1).map(seatNum => {
                              const booking = passengers.find(p => p.seats && p.seats.includes(seatNum));
                              const isBooked = !!booking;

                              return (
                                <div key={seatNum} className="flex items-center justify-between bg-[var(--driver-bg)]/60 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                                  <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${isBooked
                                      ? (booking?.status === 'WAITING_CONFIRMATION'
                                        ? 'bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-yellow-900/50'
                                        : 'bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-green-900/50')
                                      : 'bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-red-900/50'
                                      }`}>
                                      {seatNum}
                                    </div>
                                    <div>
                                      <p className={`text-base font-bold mb-1 ${isBooked ? (booking?.status === 'WAITING_CONFIRMATION' ? 'text-yellow-400' : 'text-green-400') : 'text-red-400'}`}>
                                        {isBooked ? (booking?.status === 'WAITING_CONFIRMATION' ? 'Approval Needed' : 'Booked') : 'Available'}
                                      </p>
                                      {isBooked ? (
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-sm text-white font-medium">{booking?.passengerId}</span>
                                          <span className="text-xs text-gray-400 font-mono tracking-wide">+91 {booking?.passengerMobile || 'N/A'}</span>
                                          {booking?.status === 'WAITING_CONFIRMATION' && <span className="text-[10px] text-yellow-400 font-bold uppercase mt-1 animate-pulse">Waiting Confirmation</span>}
                                        </div>
                                      ) : (
                                        <span className="text-sm text-gray-500">Empty Seat</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div>
                                    {isBooked ? (
                                      booking?.status === 'WAITING_CONFIRMATION' ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => updateTripStatus(booking.id, 'CONFIRMED')}
                                            className="px-3 py-2 bg-green-600/20 text-green-400 rounded-lg border border-green-600/30 font-bold text-xs uppercase hover:bg-green-600/30 transition"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => updateTripStatus(booking.id, 'CANCELLED')}
                                            className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 font-bold text-xs uppercase hover:bg-red-600/30 transition"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        booking?.status === 'CONFIRMED' ? (
                                          <span className="text-xs text-green-400 font-bold uppercase border border-green-400/30 px-3 py-2 rounded-lg bg-green-400/10">Confirmed</span>
                                        ) : (
                                          <a href={`tel:${booking?.passengerMobile}`} className="p-3 bg-green-900/20 text-green-400 rounded-xl hover:bg-green-900/40 inline-flex items-center justify-center transition-colors">
                                            <Phone size={20} />
                                          </a>
                                        )
                                      )
                                    ) : (
                                      <button
                                        onClick={() => {
                                          updateRideOffer(offer.id, { totalSeats: offer.totalSeats - 1 });
                                        }}
                                        className="text-xs text-red-400 hover:text-red-200 font-bold px-4 py-2 bg-red-900/10 rounded-lg border border-red-900/30 transition-colors uppercase tracking-wide"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Ride Actions */}
                        {/* Ride Actions */}
                        <div className="flex flex-wrap gap-3">
                          {!isEnRoute && !isArrived && passengers.length > 0 && (
                            <button onClick={() => {
                              passengers.forEach(p => updateTripStatus(p.id, 'EN_ROUTE'));
                              updateRideOffer(offer.id, { status: 'EN_ROUTE' }); // LOCK THE RIDE
                              setActiveTab('posted');
                            }} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-base shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                              Start Ride <ChevronRight size={20} />
                            </button>
                          )}
                          {isEnRoute && (
                            <button onClick={() => {
                              passengers.forEach(p => completeRide(p.id));
                              updateRideOffer(offer.id, { status: 'COMPLETED' }); // BURY THE RIDE
                            }} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-base shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                              Finish Ride <CheckCircle size={20} />
                            </button>
                          )}
                          {isArrived && (
                            <div className="flex-1 bg-gray-800 text-gray-400 py-4 rounded-xl font-bold text-sm text-center border border-gray-700 flex items-center justify-center gap-2">
                              <CheckCircle size={18} /> Ride Completed
                            </div>
                          )}
                          {/* Show Cancel Ride only if no passengers or explicit user action */}
                          <button onClick={() => { if (confirm("Are you sure you want to cancel this ENTIRE ride offer?")) cancelRideOffer(offer.id); }} className={`px-4 py-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${passengers.length === 0 ? 'bg-red-900/20 text-red-500 w-full hover:bg-red-900/30' : 'bg-gray-800 text-gray-400 hover:bg-red-900/20 hover:text-red-500'}`}>
                            {passengers.length === 0 ? 'Cancel Ride' : <Trash2 size={20} />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}

        {/* COMPLETED TAB */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {rideOffers.filter(o => o.driverName === user?.name && o.status === 'COMPLETED').length === 0 ? (
              <div className="text-center py-8 bg-[var(--driver-card)] rounded-2xl border border-gray-800">
                <p className="text-gray-400 text-xs text-center">No completed rides history.</p>
              </div>
            ) : (
              rideOffers
                .filter(o => o.driverName === user?.name && o.status === 'COMPLETED')
                .map(offer => {
                  const offerTrips = getPassengersForOffer(offer.id);
                  const totalEarned = offerTrips.reduce((acc, t) => acc + t.cost, 0);

                  return (
                    <div
                })
            )}
          </div>
        )}
      </div>
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

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gray-800 to-black p-6 rounded-3xl shadow-lg border border-gray-700 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--driver-primary)]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
            <h1 className="text-4xl font-black text-white mb-4">₹ {availableBalance.toLocaleString()}</h1>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Pending Payouts</p>
                <p className="text-lg font-bold text-yellow-400">₹ {pendingPayouts.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Total Earned</p>
                <p className="text-lg font-bold text-green-400">₹ {totalEarnings.toLocaleString()}</p>
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

        {/* Transactions List */}
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
                <span className="font-bold text-green-400">+ ₹{trip.cost}</span>
              </div>
            ))
          )}
        </div>
      </div>
      );
  };

  const ProfileView = () => (
      <div className="px-6 animate-in slide-in-from-right duration-300 pb-20">
        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6">
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

        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6">
          <h3 className="font-bold text-lg text-white mb-4">Personal Info</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400 text-sm">Mobile</span>
              <span className="font-bold text-white">+91 {user?.mobile}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400 text-sm">Email</span>
              <span className="font-bold text-white">{user?.name.toLowerCase().replace(' ', '.')}@example.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Joined</span>
              <span className="font-bold text-white">Jan 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mb-6">
          <h3 className="font-bold text-lg text-white mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-[var(--driver-primary)]">{completedTrips.length}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Trips Done</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">4.8 <Star size={16} fill="currentColor" /></p>
              <p className="text-xs text-gray-400 font-bold uppercase">Rating</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-green-400">92%</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Acceptance</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">₹{totalEarnings}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Earnings</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full bg-[#E02E49] text-black py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
        >
          <LogOut size={22} /> LOGOUT
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
              // Assuming deleteAccount is available in useApp (it was added in previous steps)
              // We need to destructure it from useApp at the top of the component
              deleteAccount();
            }
          }}
          className="w-full mt-4 text-red-500 py-3 rounded-2xl font-bold text-sm hover:bg-red-900/20 transition flex items-center justify-center gap-2"
        >
          <Trash2 size={18} /> Delete Account
        </button>

        <button
          onClick={handleClearAllData}
          className="w-full mt-4 text-orange-500 py-3 rounded-2xl font-bold text-sm hover:bg-orange-900/20 transition flex items-center justify-center gap-2 border border-dashed border-orange-500/50"
        >
          <Trash2 size={18} /> Clean DB (Debug)
        </button>

        {/* Documents Section */}
        <div className="bg-[var(--driver-card)] rounded-3xl p-6 shadow-sm border border-gray-800 mt-6 mb-6">
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[var(--driver-primary)]" /> My Documents
          </h3>

          {user?.verificationStatus !== 'verified' && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-xl mb-4 flex items-start gap-2">
              <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-yellow-200">
                Please upload all documents to verify your account and start posting rides.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {[
              { id: 'dl', label: 'Driving License' },
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
                  <div className="flex gap-2">
                    {(user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id]) && (
                      <a
                        href={user?.documents?.[doc.id as keyof typeof user.documents] || uploadedDocs[doc.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-700 hover:bg-gray-600 text-white transition flex items-center"
                      >
                        View
                      </a>
                    )}

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
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Verification Button */}
          {user?.verificationStatus !== 'verified' && (
            <button
              onClick={async () => {
                // Check if all docs are present (either in user.documents or uploadedDocs)
                const allDocsPresent = ['dl', 'rc', 'insurance', 'vehicleFront'].every(
                  key => user?.documents?.[key as keyof typeof user.documents] || uploadedDocs[key]
                );

                if (!allDocsPresent) {
                  alert("Please upload all required documents first.");
                  return;
                }

                const confirmVerify = window.confirm("Submit documents for verification?");
                if (confirmVerify) {
                  // Merge existing docs with new uploads
                  const finalDocs = { ...user?.documents, ...uploadedDocs };

                  await updateUser({
                    verificationStatus: 'verified', // Auto-verify for now
                    documents: finalDocs
                  });
                  alert("Documents submitted and verified! You can now post rides.");
                }
              }}
              className="w-full mt-6 bg-[var(--driver-primary)] text-black py-4 rounded-xl font-bold shadow-lg shadow-yellow-900/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit for Verification
            </button>
          )}
        </div>
      </div>
      );

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
        {/* {currentView === 'wallet' && <WalletView />} */}
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
            className={`flex flex - col items - center gap - 1 px - 6 py - 2 rounded - full transition - all ${currentView === 'marketplace' ? 'bg-yellow-900/40 text-[var(--driver-primary)]' : 'text-gray-500'} `}
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
            className={`flex flex - col items - center gap - 1 px - 6 py - 2 rounded - full transition - all ${currentView === 'profile' ? 'bg-yellow-900/40 text-[var(--driver-primary)]' : 'text-gray-500'} `}
          >
            <User size={24} fill={currentView === 'profile' ? 'currentColor' : 'none'} />
            <span className="text-xs font-bold">Account</span>
          </button>
        </div >

        {/* Add Ride Modal */}
        {
          showAddRide && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[var(--driver-bg)] p-5 flex justify-between items-center text-white border-b border-gray-800 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Plus className="bg-white/10 p-1 rounded-lg" size={28} />
                    <div>
                      <h3 className="font-bold text-lg leading-tight">Post New Ride</h3>
                      <p className="text-xs text-gray-400 opacity-90">Fill details to get passengers</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddRide(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-5 bg-[var(--driver-card)] overflow-y-auto">
                  {/* Route Section */}
                  <div className="bg-[var(--driver-bg)] p-3 rounded-xl border border-gray-700 focus-within:border-[var(--driver-primary)] transition-all">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                      <MapPin size={12} /> Select Route
                    </label>
                    <select
                      value={`${newRide.from}-${newRide.to}`}
                      onChange={e => {
                        const [from, to] = e.target.value.split('-');
                        const routeKey = `${from}-${to}`;
                        const autoPrice = BASE_RATES[routeKey] || 2500;
                        // Reset active seats on new route? Optional.
                        setNewRide({ ...newRide, from, to, price: autoPrice });
                      }}
                      className="w-full font-bold text-white bg-transparent outline-none"
                    >
                      {ROUTE_WHITELIST.map(route => (
                        <option key={route} className="bg-[var(--driver-bg)]" value={route}>{route.replace('-', ' → ')}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Selection */}
                  <div className="bg-[var(--driver-bg)] p-3 rounded-xl border border-gray-700 focus-within:border-[var(--driver-primary)] transition-all">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                      <Users size={12} /> Vehicle Type
                    </label>
                    <select
                      value={newRide.vehicleType}
                      onChange={e => setNewRide({ ...newRide, vehicleType: e.target.value })}
                      className="w-full font-bold text-white bg-transparent outline-none"
                    >
                      {VEHICLE_WHITELIST.map(v => (
                        <option key={v} className="bg-[var(--driver-bg)]" value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time */}
                  <div className="flex gap-4">
                    <div className="flex-[2] border-b border-gray-700 pb-1">
                      <DatePicker
                        label="Departure Date"
                        selectedDate={newRide.date}
                        onDateSelect={(d) => setNewRide({ ...newRide, date: d })}
                        isDark={true}
                      />
                    </div>
                    <div className="flex-1 bg-[var(--driver-bg)] p-3 rounded-xl border border-gray-700 focus-within:border-[var(--driver-primary)] transition-all">
                      <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                        <Clock size={12} /> Time
                      </label>
                      <select
                        value={newRide.time}
                        onChange={e => setNewRide({ ...newRide, time: e.target.value })}
                        className="w-full font-bold text-white bg-transparent outline-none appearance-none"
                      >
                        <option className="bg-[var(--driver-bg)]" value="06:00 AM">06:00 AM</option>
                        <option className="bg-[var(--driver-bg)]" value="07:00 AM">07:00 AM</option>
                        <option className="bg-[var(--driver-bg)]" value="08:00 AM">08:00 AM</option>
                        <option className="bg-[var(--driver-bg)]" value="09:00 AM">09:00 AM</option>
                        <option className="bg-[var(--driver-bg)]" value="10:00 AM">10:00 AM</option>
                        <option className="bg-[var(--driver-bg)]" value="02:00 PM">02:00 PM</option>
                        <option className="bg-[var(--driver-bg)]" value="05:00 PM">05:00 PM</option>
                        <option className="bg-[var(--driver-bg)]" value="08:00 PM">08:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Visual Seat Selection */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-bold text-white mb-2">Select Available Seats</h4>
                    <p className="text-xs text-gray-400 mb-4">Tap on seats to select availability.</p>

                    <div className="bg-gray-200 rounded-3xl p-6 relative flex flex-col items-center">
                      <div className="w-56 bg-white rounded-[2.5rem] p-4 shadow-xl border-4 border-gray-100 flex flex-col gap-4 items-center">

                        {/* Front Row */}
                        <div className="flex gap-6 w-full justify-between px-2">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm transition-all ${(newRide.activeSeats?.includes(1)) ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-100 text-gray-300'
                                }`}
                              onClick={() => {
                                const current = newRide.activeSeats || [];
                                const updated = current.includes(1)
                                  ? current.filter((s: number) => s !== 1)
                                  : [...current, 1];
                                setNewRide({ ...newRide, activeSeats: updated, totalSeats: updated.length });
                              }}
                            >
                              {newRide.activeSeats?.includes(1) ? <Check size={18} /> : '1'}
                            </button>
                            <span className="text-[10px] text-gray-400 font-bold">Front</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 opacity-50">
                            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-white">
                              <img src="https://cdn-icons-png.flaticon.com/512/5108/5108609.png" className="w-6 h-6 invert opacity-50" alt="steering" />
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">Driver</span>
                          </div>
                        </div>

                        {/* Middle Row */}
                        <div className="flex gap-2 w-full justify-center">
                          {[2, 3, 4].map(seatNum => (
                            <div key={seatNum} className="flex flex-col items-center gap-1">
                              <button
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-all ${newRide.activeSeats?.includes(seatNum) ? 'bg-green-500 text-white shadow-green-200' : 'bg-orange-100 text-orange-300'
                                  }`}
                                onClick={() => {
                                  const current = newRide.activeSeats || [];
                                  const updated = current.includes(seatNum)
                                    ? current.filter((s: number) => s !== seatNum)
                                    : [...current, seatNum];
                                  setNewRide({ ...newRide, activeSeats: updated, totalSeats: updated.length });
                                }}
                              >
                                {newRide.activeSeats?.includes(seatNum) ? <Check size={14} /> : seatNum}
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Back Row */}
                        <div className="flex gap-2 w-full justify-center">
                          {[5, 6, 7].map(seatNum => (
                            <div key={seatNum} className="flex flex-col items-center gap-1">
                              <button
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-all ${newRide.activeSeats?.includes(seatNum) ? 'bg-green-500 text-white shadow-green-200' : 'bg-orange-100 text-orange-300'
                                  }`}
                                onClick={() => {
                                  const current = newRide.activeSeats || [];
                                  const updated = current.includes(seatNum)
                                    ? current.filter((s: number) => s !== seatNum)
                                    : [...current, seatNum];
                                  setNewRide({ ...newRide, activeSeats: updated, totalSeats: updated.length });
                                }}
                              >
                                {newRide.activeSeats?.includes(seatNum) ? <Check size={14} /> : seatNum}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-white font-bold">Total Seats: <span className="text-[var(--driver-primary)] text-xl">{newRide.totalSeats || 0}</span></p>
                    </div>
                  </div>

                  <button
                    onClick={handlePublish}
                    className="w-full bg-[var(--driver-primary)] text-[var(--login-btn-text)] py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    Publish Ride <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Edit Ride Modal */}
        {showEditRide && editingRide && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="bg-[var(--driver-bg)] p-5 flex justify-between items-center text-white border-b border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Edit className="bg-white/10 p-1 rounded-lg" size={28} />
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Manage Ride</h3>
                    <p className="text-xs text-gray-400 opacity-90">Update ride details</p>
                  </div>
                </div>
                <button onClick={() => setShowEditRide(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 bg-[var(--driver-card)] overflow-y-auto">
                {/* Route Section */}
                <div className="bg-[var(--driver-bg)] p-3 rounded-xl border border-gray-700">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                    <MapPin size={12} /> Route
                  </label>
                  <div className="font-bold text-white text-lg">{editingRide.from} → {editingRide.to}</div>
                </div>

                {/* Date & Time */}
                <div className="flex gap-4">
                  <div className="flex-[2] bg-[var(--driver-bg)] p-3 rounded-xl border border-gray-700 opacity-75">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                      <Calendar size={12} /> Date
                    </label>
                    <div className="text-white font-bold">{new Date(editingRide.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex-1 bg-[var(--driver-bg)] p-3 rounded-xl border border-gray-700 opacity-75">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                      <Clock size={12} /> Time
                    </label>
                    <div className="text-white font-bold">{editingRide.time}</div>
                  </div>
                </div>

                {/* Visual Seat Selection (Edit Mode) */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Available Seats</h4>
                  <p className="text-xs text-gray-400 mb-4">Tap on seats to change capacity. Note: You cannot unselect already booked seats.</p>

                  <div className="bg-gray-200 rounded-3xl p-6 relative flex flex-col items-center">
                    <div className="w-56 bg-white rounded-[2.5rem] p-4 shadow-xl border-4 border-gray-100 flex flex-col gap-4 items-center">

                      {/* Front Row */}
                      <div className="flex gap-6 w-full justify-between px-2">
                        <div className="flex flex-col items-center gap-1">
                          {/* Helper function to check if a seat is "active" in edit mode. 
                             If we don't have activeSeats, we assume 1..totalSeats are active */}
                          {(() => {
                            const isActive = editingRide.activeSeats
                              ? editingRide.activeSeats.includes(1)
                              : editingRide.totalSeats >= 1; // Fallback
                            const isBooked = editingRide.bookedSeats && editingRide.bookedSeats.includes(1);

                            return (
                              <button
                                disabled={isBooked}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm transition-all ${isBooked ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-600' :
                                  isActive ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-100 text-gray-300'
                                  }`}
                                onClick={() => {
                                  // Initialize activeSeats if missing
                                  const current = editingRide.activeSeats || Array.from({ length: editingRide.totalSeats }, (_, i) => i + 1);
                                  const updated = current.includes(1)
                                    ? current.filter((s: any) => s !== 1)
                                    : [...current, 1];
                                  setEditingRide({ ...editingRide, activeSeats: updated, totalSeats: updated.length });
                                }}
                              >
                                {isBooked ? 'B' : (isActive ? <Check size={18} /> : '1')}
                              </button>
                            );
                          })()}
                          <span className="text-[10px] text-gray-400 font-bold">Front</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-50">
                          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-white">
                            <img src="https://cdn-icons-png.flaticon.com/512/5108/5108609.png" className="w-6 h-6 invert opacity-50" alt="steering" />
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">Driver</span>
                        </div>
                      </div>

                      {/* Middle Row */}
                      <div className="flex gap-2 w-full justify-center">
                        {[2, 3, 4].map(seatNum => {
                          const isActive = editingRide.activeSeats
                            ? editingRide.activeSeats.includes(seatNum)
                            : (editingRide.totalSeats >= seatNum || (editingRide.activeSeats === undefined && seatNum <= editingRide.totalSeats)); // Basic Fallback
                          const isBooked = editingRide.bookedSeats && editingRide.bookedSeats.includes(seatNum);

                          return (
                            <div key={seatNum} className="flex flex-col items-center gap-1">
                              <button
                                disabled={isBooked}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-all ${isBooked ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-600' :
                                  isActive ? 'bg-green-500 text-white shadow-green-200' : 'bg-orange-100 text-orange-300'
                                  }`}
                                onClick={() => {
                                  const current = editingRide.activeSeats || Array.from({ length: editingRide.totalSeats }, (_, i) => i + 1);
                                  const updated = current.includes(seatNum)
                                    ? current.filter((s: any) => s !== seatNum)
                                    : [...current, seatNum];
                                  setEditingRide({ ...editingRide, activeSeats: updated, totalSeats: updated.length });
                                }}
                              >
                                {isBooked ? 'B' : (isActive ? <Check size={14} /> : seatNum)}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Back Row */}
                      <div className="flex gap-2 w-full justify-center">
                        {[5, 6, 7].map(seatNum => {
                          // Complex logic to guess if seat is active when activeSeats is missing
                          // If totalSeats=5, we assume 1,2,3,4,5 are active.
                          const isActive = editingRide.activeSeats
                            ? editingRide.activeSeats.includes(seatNum)
                            : (editingRide.totalSeats >= seatNum);
                          const isBooked = editingRide.bookedSeats && editingRide.bookedSeats.includes(seatNum);

                          return (
                            <div key={seatNum} className="flex flex-col items-center gap-1">
                              <button
                                disabled={isBooked}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-all ${isBooked ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-600' :
                                  isActive ? 'bg-green-500 text-white shadow-green-200' : 'bg-orange-100 text-orange-300'
                                  }`}
                                onClick={() => {
                                  const current = editingRide.activeSeats || Array.from({ length: editingRide.totalSeats }, (_, i) => i + 1);
                                  const updated = current.includes(seatNum)
                                    ? current.filter((s: any) => s !== seatNum)
                                    : [...current, seatNum];
                                  setEditingRide({ ...editingRide, activeSeats: updated, totalSeats: updated.length });
                                }}
                              >
                                {isBooked ? 'B' : (isActive ? <Check size={14} /> : seatNum)}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-white font-bold">Total Capacity: <span className="text-[var(--driver-primary)] text-xl">{editingRide.totalSeats}</span></p>
                  </div>
                </div>


                <button
                  onClick={handleUpdateRide}
                  className="w-full bg-[var(--driver-primary)] text-[var(--login-btn-text)] py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 flex-shrink-0"
                >
                  Save Changes <CheckCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal - DISABLED 
      <PaymentModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        type="withdraw"
        balance={driverBalance}
        onConfirm={handleWithdraw}
      /> */}
      </div>
      );
};