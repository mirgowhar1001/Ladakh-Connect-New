import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchParams, VehicleDef, RideOffer, Trip } from '../../types';
import { VEHICLES, BASE_RATES, CITIES, DESTINATION_IMAGES } from '../../constants';
import { Header } from '../common/Header';
import { SOSButton } from '../common/SOSButton';
import { ChatScreen } from '../common/ChatScreen';
import { DatePicker } from '../common/DatePicker';
import { SideMenu } from '../common/SideMenu';
import { BookingHistory } from './BookingHistory';
import { PassengerProfile } from './PassengerProfile';
import { EditProfile } from './EditProfile';
import { GeminiChat } from '../common/GeminiChat';
// import { PaymentConfirmationModal } from '../payment/PaymentConfirmationModal';
import {
  Navigation, Calendar, Search, Wallet, User,
  Car, ShieldCheck, MapPin, CheckCircle, LogOut, Info,
  MessageCircle, ArrowRightLeft, Star, Fuel, CreditCard, Plus, X,
  Filter, SlidersHorizontal, Download, FileText, Clock, ChevronDown, ChevronUp, Gift, Briefcase, Heart, Key, Mail, Phone, Edit3, ChevronRight, Camera, Palmtree, Menu, Home, CarFront
} from 'lucide-react';

type ViewState = 'search' | 'results' | 'seats' | 'history' | 'chat' | 'profile' | 'wallet' | 'gemini-chat' | 'edit-profile';

// --- VISUAL ASSETS & SUB-COMPONENTS ---

// 1. Realistic Seat Component (SVG)
const RealSeat = ({ status, seatNum, onClick }: { status: 'available' | 'selected' | 'driver' | 'booked' | 'unavailable', seatNum?: number, onClick?: () => void }) => {
  const isDriver = status === 'driver';
  const isBooked = status === 'booked';
  const isSelected = status === 'selected';

  // Colors for Beige Leather Look
  const baseColor = isDriver ? '#4a4a4a' : isBooked ? '#d1d5db' : isSelected ? '#22c55e' : 'url(#leatherGradient)';
  const strokeColor = isDriver ? '#2d2d2d' : isBooked ? '#9ca3af' : isSelected ? '#16a34a' : '#C7B299';
  const textColor = isSelected ? 'white' : isBooked ? '#9ca3af' : '#8B735B';

  return (
    <div
      onClick={!isDriver && !isBooked ? onClick : undefined}
      className={`relative w-16 h-20 flex flex-col items-center justify-center transition-transform duration-200 
        ${!isDriver && !isBooked && status !== 'unavailable' ? 'cursor-pointer active:scale-95' : ''} 
        ${isSelected ? 'scale-105' : ''}
        ${isBooked || status === 'unavailable' ? 'opacity-40 cursor-not-allowed grayscale' : ''}
      `}
    >
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="leatherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F5E6D3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#DBC3A3', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="insetShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Headrest */}
        <path d="M20 15 Q20 5 50 5 Q80 5 80 15 L80 25 Q80 32 50 32 Q20 32 20 25 Z" fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />

        {/* Main Body */}
        <path d="M10 40 Q10 30 20 30 L80 30 Q90 30 90 40 L95 100 Q95 110 85 110 L15 110 Q5 110 5 100 Z" fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />

        {/* Center Stitching/Pattern */}
        {!isDriver && !isBooked && !isSelected && (
          <>
            <path d="M30 30 L30 110" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
            <path d="M70 30 L70 110" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
            <path d="M10 70 Q50 80 90 70" stroke={strokeColor} strokeWidth="1" opacity="0.3" fill="none" />
          </>
        )}

        {/* Armrests Hint */}
        {!isDriver && (
          <>
            <path d="M5 50 L2 80" stroke={strokeColor} strokeWidth="2" opacity="0.4" fill="none" />
            <path d="M95 50 L98 80" stroke={strokeColor} strokeWidth="2" opacity="0.4" fill="none" />
          </>
        )}

        {/* Steering Wheel for Driver */}
        {isDriver && (
          <circle cx="50" cy="70" r="25" fill="none" stroke="#999" strokeWidth="4" />
        )}
        {isDriver && (
          <path d="M50 70 L28 85 M50 70 L72 85 M50 70 L50 45" stroke="#999" strokeWidth="4" />
        )}

      </svg>

      {/* Seat Number Overlay */}
      {!isDriver && (
        <span className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-sm ${textColor}`}>
          {isBooked ? <span className="text-[10px] uppercase">Booked</span> : seatNum}
        </span>
      )}
    </div>
  );
};

// 2. Filter Modal Component
const FilterModal = ({
  isOpen, onClose, filters, setFilters, maxPriceLimit
}: {
  isOpen: boolean,
  onClose: () => void,
  filters: any,
  setFilters: any,
  maxPriceLimit: number
}) => {
  if (!isOpen) return null;

  const toggleList = (list: string[], item: string) => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">Filter & Sort</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">


          {/* Vehicle Type */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Vehicle Type</h4>
            <div className="flex flex-wrap gap-2">
              {['Innova Crysta', 'Mahindra Xylo', 'Toyota Innova', 'Tempo Traveler'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilters({ ...filters, vehicleTypes: toggleList(filters.vehicleTypes, type) })}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition
                    ${filters.vehicleTypes.includes(type) ? 'bg-mmt-blue text-white border-mmt-blue' : 'bg-white text-gray-600 border-gray-200'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Departure Time */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Departure Time</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Morning', icon: <Clock size={14} />, sub: '6AM - 12PM' },
                { label: 'Afternoon', icon: <Clock size={14} />, sub: '12PM - 6PM' },
                { label: 'Evening', icon: <Clock size={14} />, sub: 'After 6PM' },
              ].map(time => (
                <button
                  key={time.label}
                  onClick={() => setFilters({ ...filters, timeOfDay: toggleList(filters.timeOfDay, time.label) })}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition
                    ${filters.timeOfDay.includes(time.label) ? 'bg-red-50 border-mmt-red text-mmt-red' : 'bg-white border-gray-200 text-gray-500'}
                  `}
                >
                  {time.icon}
                  <span className="font-bold text-xs">{time.label}</span>
                  <span className="text-[9px] opacity-70">{time.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Driver Rating */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Driver Rating</h4>
            <button
              onClick={() => setFilters({ ...filters, minRating4Plus: !filters.minRating4Plus })}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition
                  ${filters.minRating4Plus ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-white border-gray-200 text-gray-500'}
                `}
            >
              <div className="flex items-center gap-2">
                <Star size={16} className={filters.minRating4Plus ? "fill-yellow-500 text-yellow-500" : ""} />
                <span className="font-bold text-sm">4+ Stars Only</span>
              </div>
              {filters.minRating4Plus && <CheckCircle size={16} />}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => setFilters({ maxPrice: maxPriceLimit, vehicleTypes: [], timeOfDay: [], minRating4Plus: false, sortBy: 'time' })}
            className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white font-bold rounded-xl shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};


export const PassengerFlow: React.FC = () => {
  const { passengerBalance, trips, bookTrip, user, logout, updateTripStatus, releaseFunds, rideOffers, depositToWallet, rateTrip, updateUser, confirmRideCompletion } = useApp();
  const [view, setView] = useState<ViewState>('search');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    from: 'Leh', to: 'Srinagar', date: new Date().toISOString().split('T')[0]
  });

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 10000,
    vehicleTypes: [] as string[],
    timeOfDay: [] as string[],
    minRating4Plus: false,
    sortBy: 'time' as 'time' | 'price' | 'rating'
  });

  // Now supports both generic VehicleDef and specific RideOffer
  const [selectedRide, setSelectedRide] = useState<(VehicleDef & Partial<RideOffer> & { price: number, driver?: any, seatPrices?: { [key: number]: number } }) | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [chatTripId, setChatTripId] = useState<string | null>(null);

  // Rating State
  const [ratingModal, setRatingModal] = useState<{ tripId: string, driverName: string } | null>(null);

  // Booking Success State
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Payment Confirmation State
  const paymentConfirmationTrip = trips.find(t => t.status === 'WAITING_CONFIRMATION' && t.passengerUid === user?.uid);

  const swapLocations = () => {
    setSearchParams(prev => ({ ...prev, from: prev.to, to: prev.from }));
  };

  // --- SCREENS ---

  const SearchWidget = () => {
    // Filter rides for Marketplace (Future dates only)
    // Filter rides for Marketplace (Future dates only)
    // Use local date to avoid timezone issues where 'today' in UTC is 'yesterday' in local time
    const today = new Date();
    const localToday = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const POPULAR_ROUTES = [
      { from: 'Kargil', to: 'Srinagar' },
      { from: 'Srinagar', to: 'Kargil' },
      { from: 'Leh', to: 'Srinagar' },
      { from: 'Srinagar', to: 'Leh' },
      { from: 'Kargil', to: 'Jammu' },
      { from: 'Jammu', to: 'Kargil' },
      { from: 'Leh', to: 'Jammu' },
      { from: 'Jammu', to: 'Leh' },
    ];

    const getGroupedOffers = () => {
      // 1. Identify all unique routes with available rides
      const uniqueRoutes = new Set<string>();
      rideOffers.forEach(r => {
        if (r.date >= localToday && (r.totalSeats - (r.bookedSeats?.length || 0)) > 0) {
          uniqueRoutes.add(`${r.from}|${r.to}`);
        }
      });

      // 2. Group and Sort
      return Array.from(uniqueRoutes).map(routeKey => {
        const [from, to] = routeKey.split('|');
        const routeOffers = rideOffers
          .filter(r =>
            r.from === from &&
            r.to === to &&
            r.date >= localToday &&
            (r.totalSeats - (r.bookedSeats?.length || 0)) > 0
          )
          .sort((a, b) => {
            // Priority: Lowest Seats Available first
            const seatsA = a.totalSeats - (a.bookedSeats?.length || 0);
            const seatsB = b.totalSeats - (b.bookedSeats?.length || 0);
            return seatsA - seatsB;
          })
          .slice(0, 3); // Max 3 rides

        return { route: { from, to }, offers: routeOffers };
      });
    };

    const groupedOffers = getGroupedOffers();

    return (
      <div className="bg-pass-bg min-h-screen pb-20">
        {/* Header with Passenger Branding */}
        <div className="bg-[var(--pass-primary)] pb-16 pt-6 px-4 rounded-b-[2rem] relative shadow-lg overflow-hidden">
          {/* Abstract geometric shapes for visual interest */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 pointer-events-none blur-2xl"></div>

          <div className="flex justify-between items-center mb-6 text-white relative z-10">
            <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition">
              <Menu className="text-white" size={24} />
            </button>

            <div className="text-right">
              <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Welcome</p>
              <span className="font-bold text-lg leading-none">{user?.name.split(' ')[0]}</span>
            </div>
          </div>

          {/* Navigation Tabs - Simplified */}
          <div className="flex justify-center gap-4 mb-6 relative z-10">
            <button
              onClick={() => setView('search')}
              style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}
              className={`flex items-center justify-center px-8 py-4 rounded-full font-black text-xl transition-all text-white shadow-2xl border-none w-full max-w-md mx-auto hover:scale-105 active:scale-95`}
            >
              <span className="uppercase tracking-[0.2em] drop-shadow-sm">TAXI BOOKING LADAKH</span>
            </button>
          </div>

          <div className="text-white mb-6 relative z-10">
            <h1 className="text-3xl font-black drop-shadow-md">Where to next?</h1>
            <p className="text-white/80 text-sm mt-1">Explore the Himalayas safely.</p>
          </div>
        </div>

        {/* Floating Search Card */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-[var(--pass-card)] rounded-2xl shadow-floating p-6 border border-gray-200">

            {/* Location Input Group */}
            <div className="flex flex-col gap-5">
              {/* FROM */}
              <div className="relative border-b border-gray-100 pb-2 hover:border-pass-primary transition-colors">
                <span className="text-xs text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><MapPin size={12} /> From</span>
                <div className="flex items-center justify-between mt-1">
                  <select
                    className="w-full font-black text-xl bg-transparent outline-none text-gray-800 py-1 appearance-none cursor-pointer"
                    value={searchParams.from}
                    onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                  >
                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">Pick-up Location</p>
              </div>

              {/* Swap Button */}
              <div className="absolute top-[32%] right-6 z-20">
                <button onClick={swapLocations} className="w-10 h-10 bg-pass-card rounded-full flex items-center justify-center text-pass-primary shadow-lg border border-gray-200 hover:scale-110 transition hover:bg-gray-50">
                  <ArrowRightLeft size={16} className="rotate-90" />
                </button>
              </div>

              {/* TO */}
              <div className="relative border-b border-gray-100 pb-2 hover:border-pass-primary transition-colors">
                <span className="text-xs text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><MapPin size={12} /> To</span>
                <select
                  className="w-full font-black text-xl bg-transparent outline-none text-gray-800 py-1 appearance-none cursor-pointer mt-1"
                  value={searchParams.to}
                  onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                >
                  {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <p className="text-xs text-gray-400 truncate mt-1">Drop-off Location</p>
              </div>

              {/* Date */}
              <div className="relative pb-2 hover:border-pass-primary transition-colors border-b border-transparent">
                <DatePicker
                  label="DEPARTURE DATE"
                  selectedDate={searchParams.date}
                  onDateSelect={(d) => setSearchParams({ ...searchParams, date: d })}
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={() => setView('results')}
              className="w-full bg-[var(--pass-cta)] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6 text-lg uppercase tracking-wide flex items-center justify-center gap-2"
            >
              <Search size={20} /> Search Cabs
            </button>
          </div>
        </div>
      </div >
    );
  };


  const RatingModal = ({ tripId, driverName, onClose }: { tripId: string, driverName: string, onClose: () => void }) => {
    const [stars, setStars] = useState(0);

    const submitRating = () => {
      rateTrip(tripId, stars);
      onClose();
    };

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Rate your trip</h3>
          <p className="text-sm text-gray-500 mb-6">How was your ride with <span className="font-bold text-gray-700">{driverName}</span>?</p>

          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setStars(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`${star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Skip</button>
            <button
              onClick={submitRating}
              disabled={stars === 0}
              className="flex-1 py-3 bg-mmt-red text-white font-bold rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ResultsList = () => {
    // 1. Filter by Route & Date
    const today = new Date().toISOString().split('T')[0];
    let matchedOffers = rideOffers.filter(
      r => r.from === searchParams.from &&
        r.to === searchParams.to &&
        r.date === searchParams.date &&
        r.date >= today &&
        (!r.status || r.status === 'OPEN') // Only show OPEN rides
    );



    // 3. Filter out Full Rides
    matchedOffers = matchedOffers.filter(r => (r.totalSeats - (r.bookedSeats?.length || 0)) > 0);

    // 3. Filter by Vehicle Type
    if (filters.vehicleTypes.length > 0) {
      matchedOffers = matchedOffers.filter(r => filters.vehicleTypes.includes(r.vehicleType));
    }

    // 4. Filter by Departure Time
    if (filters.timeOfDay.length > 0) {
      matchedOffers = matchedOffers.filter(r => {
        const hour = parseInt(r.time.split(':')[0]); // Simplified parsing
        const ampm = r.time.includes('PM') ? 'PM' : 'AM';

        let actualHour = hour;
        if (ampm === 'PM' && hour !== 12) actualHour += 12;
        if (ampm === 'AM' && hour === 12) actualHour = 0;

        const isMorning = actualHour >= 6 && actualHour < 12;
        const isAfternoon = actualHour >= 12 && actualHour < 18;
        const isEvening = actualHour >= 18;

        if (filters.timeOfDay.includes('Morning') && isMorning) return true;
        if (filters.timeOfDay.includes('Afternoon') && isAfternoon) return true;
        if (filters.timeOfDay.includes('Evening') && isEvening) return true;
        return false;
      });
    }

    // 5. Filter by Rating
    if (filters.minRating4Plus) {
      matchedOffers = matchedOffers.filter(r => r.rating >= 4);
    }

    // 6. Sorting
    matchedOffers.sort((a, b) => {
      // Priority 1: Scarcity (1 seat left -> Top)
      const seatsA = a.totalSeats - (a.bookedSeats?.length || 0);
      const seatsB = b.totalSeats - (b.bookedSeats?.length || 0);

      // If one has 1 seat and the other has more, prioritize the one with 1 seat
      if (seatsA === 1 && seatsB > 1) return -1;
      if (seatsB === 1 && seatsA > 1) return 1;

      // Secondary Sorts
      if (filters.sortBy === 'rating') return b.rating - a.rating;

      // Default: Time
      const timeA = new Date(`${a.date} ${a.time}`).getTime();
      const timeB = new Date(`${b.date} ${b.time}`).getTime();
      return timeA - timeB;
    });

    const dateDisplay = new Date(searchParams.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const maxPriceLimit = Math.max(...rideOffers.map(r => r.pricePerSeat), 10000);

    const activeTrip = trips.find(t => t.status === 'EN_ROUTE');

    return (
      <div className="bg-mmt-bg min-h-screen pb-24">
        {activeTrip && <SOSButton />}
        <Header
          title={`${searchParams.from} → ${searchParams.to}`}
          subtitle={`${dateDisplay} | ${matchedOffers.length} Cabs Available`}
          showBack
          onBack={() => setView('search')}
          onProfileClick={() => setView('profile')}
        />

        {/* Date Filter Strip */}
        <div className="bg-white py-2 px-4 shadow-sm mb-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {[-1, 0, 1, 2].map(offset => {
              const d = new Date(searchParams.date);
              d.setDate(d.getDate() + offset);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = d.getDate();
              const isSelected = offset === 0;

              return (
                <button
                  key={offset}
                  onClick={() => setSearchParams({ ...searchParams, date: d.toISOString().split('T')[0] })}
                  className={`flex flex-col items-center min-w-[3rem] ${isSelected ? 'text-[var(--pass-primary)]' : 'text-gray-500'} hover:bg-gray-50 rounded-lg transition p-1`}
                >
                  <span className="text-xs font-bold uppercase">{dayName}</span>
                  <span className={`text-lg font-bold ${isSelected ? 'border-b-2 border-[var(--pass-primary)]' : ''}`}>{dayNum}</span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setFilters({ ...filters, sortBy: 'time' })} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${filters.sortBy === 'time' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>Earliest First</button>
            <button onClick={() => setFilters({ ...filters, sortBy: 'rating' })} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${filters.sortBy === 'rating' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>Top Rated</button>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {matchedOffers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No cabs found matching your filters.</p>
              <button onClick={() => setShowFilters(true)} className="text-mmt-blue font-bold text-sm mt-2">Modify Filters</button>
            </div>
          )}

          {matchedOffers.map((offer) => {
            const vehicleInfo = VEHICLES.find(v => v.type === offer.vehicleType) || VEHICLES[0];
            const availableSeatsCount = offer.totalSeats - (offer.bookedSeats ? offer.bookedSeats.length : 0);

            return (
              <div key={offer.id} className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="p-4 flex gap-4">
                  {/* Car Image */}
                  <div className="w-24 h-20 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden relative">
                    <img src={offer.vehicleImage || vehicleInfo.image} alt={offer.vehicleType} className="w-full h-full object-cover" />
                    <div className={`absolute bottom-0 w-full text-white text-[9px] text-center py-0.5 font-bold
                      ${availableSeatsCount > 1 ? 'bg-green-600' : availableSeatsCount === 1 ? 'bg-yellow-500' : 'bg-red-600'}
                    `}>
                      {availableSeatsCount} Seats Left
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800 text-base">
                          {offer.vehicleType} <span className="font-black text-black uppercase">{offer.vehicleNo}</span>
                        </h3>
                        <p className="text-xs text-gray-500">{offer.driverName} • <span className="text-green-600 font-bold">★ {offer.rating}</span></p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5"><span className="font-bold">Mob:</span> {offer.driverMobile || offer.driverId}</p>
                      </div>
                      {/* <h3 className="font-bold text-xl text-black">₹{offer.pricePerSeat.toLocaleString()}</h3> */}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-bold whitespace-nowrap">{offer.time}</span>
                        <div className="w-4 h-[1px] bg-gray-300 mx-1"></div>
                        <span className="font-bold text-gray-800 whitespace-nowrap">{offer.from} <span className="text-gray-400">→</span> {offer.to}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-gray-100 flex">
                  {/* <div className="flex-1 px-4 py-3 text-xs text-gray-500 flex items-center gap-1 bg-gray-50">
                    <ShieldCheck size={14} className="text-green-600" /> Safety Verified
                  </div> */}
                  <button
                    disabled={availableSeatsCount === 0}
                    onClick={() => {
                      setSelectedRide({ ...vehicleInfo, ...offer, price: offer.pricePerSeat });
                      setSelectedSeats([]);
                      setView('seats');
                    }}
                    className={`w-full font-bold text-sm py-3 transition ${availableSeatsCount === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  >
                    {availableSeatsCount === 0 ? 'SOLD OUT' : 'SELECT SEATS'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Filter Bar */}
        <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-3 flex justify-center shadow-2xl z-40">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full font-bold shadow-lg"
          >
            <SlidersHorizontal size={18} /> Filter & Sort
            {(filters.vehicleTypes.length > 0 || filters.timeOfDay.length > 0) && (
              <span className="w-2 h-2 bg-mmt-red rounded-full"></span>
            )}
          </button>
        </div>

        <FilterModal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          setFilters={setFilters}
          maxPriceLimit={maxPriceLimit}
        />
      </div>
    );
  };

  const SeatMap = () => {
    if (!selectedRide) return null;
    const { price, layout, seatPrices } = selectedRide;
    const bookedSeats = selectedRide.bookedSeats || [];

    const toggleSeat = (seatNum: number) => {
      if (bookedSeats.includes(seatNum)) return;
      if (selectedRide.activeSeats && !selectedRide.activeSeats.includes(seatNum)) return; // Prevent clicking unavailable seats

      const availableCount = selectedRide.totalSeats - bookedSeats.length;

      // Unselect if already selected
      if (selectedSeats.includes(seatNum)) {
        setSelectedSeats(prev => prev.filter(s => s !== seatNum));
        return;
      }

      // Check limit
      if (selectedSeats.length >= availableCount) {
        alert(`This ride has only ${availableCount} seats available.`);
        return;
      }

      setSelectedSeats(prev => [...prev, seatNum]);
    };

    const renderRow = (count: number, startIndex: number, rowIndex: number) => (
      <div className="flex justify-center gap-8 mb-2">
        {Array.from({ length: count }).map((_, i) => {
          const seatNum = startIndex + i;
          const isBooked = bookedSeats.includes(seatNum);
          const isSelected = selectedSeats.includes(seatNum);
          const isUnavailable = selectedRide.activeSeats ? !selectedRide.activeSeats.includes(seatNum) : false;

          return (
            <div key={seatNum} className="relative">
              <RealSeat
                seatNum={seatNum}
                status={isBooked ? 'booked' : isUnavailable ? 'unavailable' : isSelected ? 'selected' : 'available'}
                onClick={() => toggleSeat(seatNum)}
              />
              {/* {!isBooked && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500 whitespace-nowrap">
                  ₹{seatPrices?.[seatNum] || price}
                </span>
              )} */}
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="bg-mmt-bg min-h-screen flex flex-col">
        <Header
          title={selectedRide.type}
          subtitle={`${selectedRide.seats} Seater • AC`}
          showBack onBack={() => setView('results')}
        />

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">

          {/* Car Chassis Container */}
          <div className="bg-white rounded-[3rem] shadow-xl border-4 border-gray-300 px-6 py-10 w-full max-w-[320px] relative mt-4">
            {/* Front Windshield Hint */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-blue-100/50 rounded-b-xl"></div>

            {/* Driver Row (Fixed) */}
            <div className="flex justify-between gap-8 mb-6 border-b border-dashed border-gray-200 pb-4">
              {/* Front Passenger Seat (Seat 1) */}
              {layout[0] === 1 && (
                <div className="relative">
                  <RealSeat
                    seatNum={1}
                    status={bookedSeats.includes(1) ? 'booked' : (selectedRide.activeSeats && !selectedRide.activeSeats.includes(1)) ? 'unavailable' : selectedSeats.includes(1) ? 'selected' : 'available'}
                    onClick={() => toggleSeat(1)}
                  />
                  {/* {!bookedSeats.includes(1) && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500 whitespace-nowrap">
                      ₹{seatPrices?.[1] || price}
                    </span>
                  )} */}
                </div>
              )}
              {/* Driver Seat (Always Right in India) */}
              <RealSeat status="driver" />
            </div>

            {/* Passenger Rows */}
            <div className="space-y-4">
              {/* Skip first row in layout map if it was the front passenger */}
              {layout.slice(1).map((seatsInRow, idx) => {
                const previousSeats = layout.slice(0, idx + 1).reduce((a, b) => a + b, 0);
                return <div key={idx}>{renderRow(seatsInRow, 1 + previousSeats, idx + 1)}</div>;
              })}
            </div>

            {/* Rear of Car Hint */}
            <div className="mt-8 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rear</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#E8DCCA] border border-[#C7B299]"></div>
              <span className="text-xs text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-xs text-gray-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300"></div>
              <span className="text-xs text-gray-600">Booked</span>
            </div>
          </div>
        </div>

        {/* Sticky Payment Footer */}
        <div className="bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              {/* <span className="text-xs text-gray-500 font-bold uppercase">Total Fare</span>
              <span className="text-2xl font-black text-black">₹ {selectedSeats.reduce((acc, seat) => acc + (seatPrices?.[seat] || price), 0).toLocaleString()}</span> */}
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-bold uppercase block">{selectedSeats.length} Seats</span>
              <span className="font-bold text-mmt-red text-sm">{selectedSeats.join(', ')}</span>
            </div>
          </div>
          <button
            disabled={selectedSeats.length === 0}
            onClick={async () => {
              if (selectedSeats.length > 4) {
                alert("Maximum 4 seats allowed per booking.");
                return;
              }

              const totalCost = selectedSeats.reduce((acc, seat) => acc + (seatPrices?.[seat] || price), 0);

              const confirmBooking = window.confirm(`Confirm booking for ${selectedSeats.length} seats?`);
              if (!confirmBooking) return;

              const success = await bookTrip({
                date: searchParams.date || new Date().toISOString().split('T')[0],
                time: selectedRide.time || '00:00',
                from: searchParams.from || 'Unknown',
                to: searchParams.to || 'Unknown',
                seats: selectedSeats,
                vehicleType: selectedRide.type || selectedRide.vehicleType || 'Taxi',
                driverName: selectedRide.driverName || 'Driver',
                driverId: selectedRide.driverId,
                driverMobile: selectedRide.driverMobile || '',
                vehicleNo: selectedRide.vehicleNo || 'Unknown',
                cost: totalCost
              }, totalCost, selectedRide.id); // Passing totalCost but payment logic is bypassed in backend/context if needed, or we just ignore it.

              if (success) {
                setShowBookingSuccess(true);
                setTimeout(() => {
                  setShowBookingSuccess(false);
                  setView('history');
                }, 2000);
              }
            }}
            className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg
              ${selectedSeats.length > 0 ? 'bg-[var(--pass-cta)] text-white hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {selectedSeats.length === 0 ? 'SELECT SEATS' : 'BOOK NOW'}
          </button>
        </div>
      </div >
    );
  };

  /* VaultPayment Component Removed */

  return (
    <>
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(v) => setView(v as ViewState)}
      />

      {(() => {
        switch (view) {
          case 'search': return <SearchWidget />;
          case 'results': return <ResultsList />;
          case 'seats': return <SeatMap />;
          // case 'vault_pay': return <VaultPayment />;
          case 'history': return (
            <div className="bg-gray-50 min-h-screen pb-24">
              <Header title="My Trips" onProfileClick={() => setView('profile')} />
              <div className="p-4">
                <BookingHistory trips={trips} onChat={(id) => { setChatTripId(id); setView('chat'); }} />
              </div>
            </div>
          );
          case 'chat': return chatTripId ? <ChatScreen tripId={chatTripId} onBack={() => { setChatTripId(null); setView('history'); }} /> : <SearchWidget />;
          case 'gemini-chat': return <GeminiChat onBack={() => setView('profile')} />;
          case 'edit-profile': return <EditProfile onBack={() => setView('profile')} />;
          case 'profile': return <PassengerProfile onBack={() => setView('search')} onNavigate={(v) => setView(v as ViewState)} />;
          case 'wallet': return <PassengerProfile onBack={() => setView('search')} onNavigate={(v) => setView(v as ViewState)} />; // Reusing profile for wallet for now
          default: return <SearchWidget />;
        }
      })()}

      {/* Bottom Navigation */}
      {(view === 'search' || view === 'history' || view === 'profile' || view === 'wallet') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-around items-center z-[100] pb-6 rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setView('search')}
            className={`flex flex-col items-center gap-1 ${view === 'search' ? 'text-pass-primary' : 'text-gray-400'}`}
          >
            <Home size={24} fill={view === 'search' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-pass-primary' : 'text-gray-400'}`}
          >
            <Briefcase size={24} fill={view === 'history' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">My Trips</span>
          </button>
          <button
            onClick={() => setView('profile')}
            className={`flex flex-col items-center gap-1 ${view === 'profile' || view === 'wallet' ? 'text-pass-primary' : 'text-gray-400'}`}
          >
            <User size={24} fill={view === 'profile' || view === 'wallet' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {/* Payment Confirmation Modal */}
      {/* Payment Confirmation Modal - DISABLED */}
      {/* {paymentConfirmationTrip && ( ... )} */}

      {/* Booking Success Modal */}
      {showBookingSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Booking Awaited</h2>
            <p className="text-gray-500 font-medium">Waiting for driver confirmation...</p>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          tripId={ratingModal.tripId}
          driverName={ratingModal.driverName}
          onClose={() => setRatingModal(null)}
        />
      )}
    </>
  );
};