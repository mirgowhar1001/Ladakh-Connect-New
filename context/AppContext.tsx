import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Trip, TripStatus, UserRole, ChatMessage, RideOffer } from '../types';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

interface AppContextType {
  user: User | null;
  passengerBalance: number;
  driverBalance: number;
  appVault: number;
  trips: Trip[];
  rideOffers: RideOffer[];
  login: (role: UserRole, data: Omit<User, 'role'>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  bookTrip: (tripDetails: Omit<Trip, 'id' | 'status' | 'passengerId' | 'driverName' | 'vehicleNo' | 'messages'> & { driverName?: string; vehicleNo?: string }, cost: number, offerId?: string) => Promise<boolean>;
  publishRide: (offer: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => Promise<void>;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
  releaseFunds: (tripId: string, cost: number) => Promise<void>;
  depositToWallet: (amount: number, paymentId?: string) => void;
  sendMessage: (tripId: string, text: string) => Promise<void>;
  rateTrip: (tripId: string, rating: number) => Promise<void>;
  requestPayment: (tripId: string) => Promise<void>;
  cancelRideOffer: (offerId: string) => Promise<void>;
  updateRideOfferPrice: (offerId: string, newPrice: number, seatPrices: { [key: number]: number }) => Promise<void>;
  updateRideOffer: (offerId: string, data: Partial<RideOffer>) => Promise<void>;
  completeRide: (tripId: string) => Promise<void>;
  confirmRideCompletion: (tripId: string, confirmed: boolean) => Promise<void>;
  loginWithPassword: (mobile: string, pass: string) => Promise<void>;
  setupPassword: (mobile: string, pass: string) => Promise<void>;
  resetPassword: (newPass: string) => Promise<void>;
  withdrawFromWallet: (amount: number) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appVault, setAppVault] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);

  // Simulated Wallets (In a real app, these would be in Firestore 'wallets' collection)
  const [passengerBalance, setPassengerBalance] = useState(0);
  const [driverBalance, setDriverBalance] = useState(0);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user details from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, uid: firebaseUser.uid });

            // Sync local wallet state from Firestore
            if (userData.role === 'passenger') {
              setPassengerBalance(userData.walletBalance || 0);
            } else if (userData.role === 'owner') {
              setDriverBalance(userData.walletBalance || 0);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setTrips([]);
        setRideOffers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Listeners
  useEffect(() => {
    // Only subscribe to data if user is logged in to avoid Permission Denied errors 
    // when security rules require authentication.
    if (!user) return;

    // Listen to Ride Offers
    const offersQuery = query(collection(db, 'rideOffers'));
    const unsubOffers = onSnapshot(offersQuery,
      (snapshot) => {
        const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RideOffer));
        setRideOffers(offers);
      },
      (error) => {
        console.warn("Permission denied for RideOffers. Check Firestore Rules in Console.", error.message);
      }
    );

    // Listen to Trips (ISOLATED QUERY)
    let tripsQuery;

    if (user.role === 'passenger') {
      tripsQuery = query(collection(db, 'trips'), where('passengerUid', '==', user.uid));
    } else if (user.role === 'owner') {
      tripsQuery = query(collection(db, 'trips'), where('driverId', '==', user.uid));
    } else {
      // Admin or unknown: fetch all (or none, strictly speaking)
      tripsQuery = query(collection(db, 'trips'));
    }

    const unsubTrips = onSnapshot(tripsQuery,
      (snapshot) => {
        const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setTrips(tripsData);
      },
      (error) => {
        console.warn("Permission denied for Trips. Check Firestore Rules in Console.", error.message);
      }
    );

    return () => {
      unsubOffers();
      unsubTrips();
    };
  }, [user]); // Re-run when user logs in/out

  const login = useCallback(async (role: UserRole, data: Omit<User, 'role'>) => {
    let uid = auth.currentUser?.uid;

    // Allow mock admin/owner login
    if (!uid) {
      if (role === 'admin') {
        uid = 'admin-mock-uid';
      } else if (role === 'owner' && data.mobile === '9999999999') {
        uid = 'owner-mock-uid';
      } else {
        return;
      }
    }

    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const existingRole = userDoc.data().role;
      if (existingRole === 'passenger' && role === 'owner') {
        throw new Error("User already registered as passenger. Please login or use 'Forgot password'.");
      } else if (existingRole === 'owner' && role === 'passenger') {
        throw new Error("User already registered as driver. Please login or use 'Forgot password'.");
      } else {
        throw new Error("User already registered. Please login or use 'Forgot password'.");
      }
    }

    const newUser: User = {
      ...data,
      role,
      uid,
      verificationStatus: (data as any).verificationStatus || 'none',
      walletBalance: (data as any).walletBalance || 0,
      escrowBalance: (data as any).escrowBalance || 0,
      documents: (data as any).documents || {}
    };

    // Save user to Firestore
    await setDoc(userDocRef, newUser);
    setUser(newUser);
  }, []);

  const loginWithPassword = useCallback(async (mobile: string, pass: string) => {
    const email = `${mobile}@ladakhconnect.com`;
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User not registered. Please register first.");
    }
  }, []);

  const setupPassword = useCallback(async (mobile: string, pass: string) => {
    if (!auth.currentUser) throw new Error("No user logged in to set password");
    const email = `${mobile}@ladakhconnect.com`;
    const credential = EmailAuthProvider.credential(email, pass);
    try {
      await linkWithCredential(auth.currentUser, credential);
    } catch (error: any) {
      console.error("Link Credential Error:", error);
      if (error.code === 'auth/provider-already-linked') {
        // User already has a password set, just update it
        await updatePassword(auth.currentUser, pass);
      } else if (error.code === 'auth/credential-already-in-use') {
        throw new Error("Account already exists. Please Login with Password.");
      } else {
        throw error;
      }
    }
  }, []);

  const resetPassword = useCallback(async (newPass: string) => {
    if (!auth.currentUser) throw new Error("No user logged in to reset password");
    await updatePassword(auth.currentUser, newPass);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user || !user.uid) return;

    await updateDoc(doc(db, 'users', user.uid), data);
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, [user]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user || !user.uid || !auth.currentUser) return;

    try {
      const { deleteDoc, writeBatch, getDocs } = await import('firebase/firestore');
      const batch = writeBatch(db);

      // 1. Gather all documents to delete
      const deletions_promises = [];

      // A. Active/Past Trips
      // If Driver: Delete trips where driverId == uid
      // If Passenger: Delete trips where passengerUid == uid
      const tripField = user.role === 'owner' ? 'driverId' : 'passengerUid';
      const tripsQ = query(collection(db, 'trips'), where(tripField, '==', user.uid));
      const tripsSnap = await getDocs(tripsQ);
      tripsSnap.forEach(doc => batch.delete(doc.ref));

      // B. If Driver: Delete Posted Ride Offers
      if (user.role === 'owner') {
        const offersQ = query(collection(db, 'rideOffers'), where('driverId', '==', user.uid));
        const offersSnap = await getDocs(offersQ);
        offersSnap.forEach(doc => batch.delete(doc.ref));
      }

      // C. The User Document
      const userRef = doc(db, 'users', user.uid);
      batch.delete(userRef);

      // 2. Commit Batch Delete
      await batch.commit();

      // 3. Delete from Auth
      const { deleteUser } = await import('firebase/auth');
      await deleteUser(auth.currentUser);

      // 4. Clear Local State
      setUser(null);
      setTrips([]);
      setRideOffers([]);
      setPassengerBalance(0);
      setDriverBalance(0);

      alert("Account and all associated data deleted successfully.");

    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security, please logout and login again before deleting your account.");
      } else {
        alert("Error deleting account: " + error.message);
      }
    }
  }, [user]);

  const depositToWallet = useCallback(async (amount: number, paymentId?: string) => {
    if (!user || !user.uid) return;

    // Update local state
    setPassengerBalance(prev => prev + amount);

    // Update Firestore User Balance
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      walletBalance: (user.walletBalance || 0) + amount
    });

    // Log Transaction to 'payments' collection
    if (paymentId) {
      try {
        await addDoc(collection(db, 'payments'), {
          userId: user.uid,
          userName: user.name,
          amount: amount,
          type: 'DEPOSIT',
          paymentId: paymentId,
          status: 'success',
          timestamp: Date.now()
        });
      } catch (e) {
        console.error("Error logging payment:", e);
      }
    }

    // Update user state
    setUser(prev => prev ? { ...prev, walletBalance: (prev.walletBalance || 0) + amount } : null);
  }, [user]);

  const withdrawFromWallet = useCallback(async (amount: number) => {
    if (!user || !user.uid) return false;

    // Use the state balance (what the user sees) as the source of truth for the check
    // This handles the case where we show a simulated "Signup Bonus" (2500) that hasn't been persisted to Firestore yet.
    const currentBalance = user.role === 'owner' ? driverBalance : passengerBalance;

    if (currentBalance < amount) {
      alert("Insufficient balance!");
      return false;
    }

    // Update Firestore
    // We persist the new balance (realizing the bonus if it was virtual)
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      walletBalance: currentBalance - amount
    });

    // Update local state
    if (user.role === 'owner') {
      setDriverBalance(prev => prev - amount);
    } else {
      setPassengerBalance(prev => prev - amount);
    }

    // Update user state
    setUser(prev => prev ? { ...prev, walletBalance: currentBalance - amount } : null);
    return true;
  }, [user, driverBalance, passengerBalance]);

  const bookTrip = useCallback(async (tripDetails: any, cost: number, offerId?: string) => {
    if (!user) return false;

    // 1. Check Balance (Passenger) - BYPASSED FOR TESTING/CASH FLOW
    // const walletBalance = user.walletBalance || 0;
    // if (walletBalance < cost) {
    //   alert("Insufficient wallet balance!");
    //   return false;
    // }

    // 2. Check Seat Availability (if offerId provided)
    if (offerId) {
      const offerRef = doc(db, 'rideOffers', offerId);
      const offerSnap = await getDoc(offerRef);
      if (offerSnap.exists()) {
        const offer = offerSnap.data() as RideOffer;
        const available = offer.totalSeats - (offer.bookedSeats?.length || 0);
        if (available <= 0) {
          alert("Sorry, seats are no longer available.");
          return false;
        }
      }
    }

    // 3. Create Trip Document
    await addDoc(collection(db, 'trips'), {
      passengerUid: user.uid,
      passengerName: user.name,
      passengerMobile: user.mobile,
      driverName: tripDetails.driverName || 'Unknown', // Fallback
      vehicleNo: tripDetails.vehicleNo || 'Unknown',
      from: tripDetails.from,
      to: tripDetails.to,
      date: tripDetails.date,
      time: tripDetails.time,
      cost: cost,
      status: 'WAITING_CONFIRMATION', // Restored confirmation flow
      createdAt: Date.now(),
      offerId: offerId || null,
      seats: tripDetails.seats || [], // Store seat numbers if provided
      paymentRequested: false,
      driverId: tripDetails.driverId || null, // CRITICAL FIX: Save driverId so they receive the booking
      messages: []
    });

    // 4. Deduct Balance (Move to Escrow/Vault) - DISABLED FOR CASH FLOW
    // const userRef = doc(db, 'users', user.uid);
    // await updateDoc(userRef, {
    //   walletBalance: walletBalance - cost,
    //   escrowBalance: (user.escrowBalance || 0) + cost
    // });
    // setPassengerBalance(prev => prev - cost);
    // setAppVault(prev => prev + cost);

    // 5. Update Ride Offer (Book Seats)
    if (offerId && tripDetails.seats) {
      const offerRef = doc(db, 'rideOffers', offerId);
      await updateDoc(offerRef, {
        bookedSeats: arrayUnion(...tripDetails.seats)
      });
    }

    alert("Trip Booked Successfully!");
    return true;
  }, [user]);

  const publishRide = useCallback(async (offerData: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => {
    if (!user || user.role !== 'owner') return;

    // 60-Day Horizon Rule
    const rideDate = new Date(offerData.date);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);

    if (rideDate > maxDate) {
      alert("Cannot post rides more than 60 days in advance.");
      return;
    }

    const newOffer = {
      driverName: user.name,
      driverId: user.uid || user.mobile,
      driverMobile: user.mobile, // Save mobile directly
      vehicleImage: user.documents?.vehicleSide || null, // Include vehicle image from profile
      bookedSeats: [],
      rating: 5.0,
      createdAt: Date.now(),
      activeSeats: offerData.activeSeats || [],
      ...offerData
    };

    await addDoc(collection(db, 'rideOffers'), newOffer);
  }, [user]);

  const updateTripStatus = useCallback(async (tripId: string, status: TripStatus) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    // Prevent cancelling if already completed
    if (status === 'CANCELLED') {
      if (trip.status === 'COMPLETED') {
        alert("Cannot cancel a completed ride!");
        return;
      }
      if (trip.status === 'CONFIRMED') {
        alert("Confirmed rides cannot be cancelled. Please contact support.");
        return;
      }

      // Tiered Penalty Logic
      // 1. Calculate hours until departure
      let hoursUntilDeparture = 0;
      try {
        // Parse Trip Date & Time
        // trip.date is YYYY-MM-DD, trip.time is HH:MM AM/PM
        if (trip.date && trip.time) {
          const [tTime, tAmpm] = trip.time.split(' ');
          const [tHours, tMinutes] = tTime.split(':');
          let th = parseInt(tHours);
          if (tAmpm === 'PM' && th !== 12) th += 12;
          if (tAmpm === 'AM' && th === 12) th = 0;

          const departureTime = new Date(trip.date);
          departureTime.setHours(th, parseInt(tMinutes), 0, 0);

          const now = new Date();
          const diffMs = departureTime.getTime() - now.getTime();
          hoursUntilDeparture = diffMs / (1000 * 60 * 60);
        }
      } catch (e) {
        console.error("Error parsing date/time for cancellation", e);
        // Fallback to 50% if date parsing fails
        hoursUntilDeparture = 12;
      }

      let refundPercentage = 0;
      let policyText = "";

      if (hoursUntilDeparture > 24) {
        refundPercentage = 1.0; // 100% Refund
        policyText = "Full Refund (> 24h notice)";
      } else if (hoursUntilDeparture > 2) {
        refundPercentage = 0.5; // 50% Refund
        policyText = "50% Refund (< 24h notice)";
      } else {
        refundPercentage = 0.0; // 0% Refund
        policyText = "No Refund (< 2h notice)";
      }

      const refundAmount = trip.cost * refundPercentage;
      const driverCompensation = trip.cost * (1 - refundPercentage);

      // 1. Deduct from Escrow
      setAppVault(prev => prev - trip.cost);

      // 2. Refund Passenger
      if (refundAmount > 0) {
        setPassengerBalance(prev => prev + refundAmount);
        if (trip.passengerUid) {
          const passRef = doc(db, 'users', trip.passengerUid);
          const passDoc = await getDoc(passRef);
          if (passDoc.exists()) {
            await updateDoc(passRef, {
              walletBalance: (passDoc.data().walletBalance || 0) + refundAmount,
              escrowBalance: (passDoc.data().escrowBalance || 0) - trip.cost
            });
          }
        }
      } else {
        // If no refund, just remove from escrow tracking for passenger
        if (trip.passengerUid) {
          const passRef = doc(db, 'users', trip.passengerUid);
          const passDoc = await getDoc(passRef);
          if (passDoc.exists()) {
            await updateDoc(passRef, {
              escrowBalance: (passDoc.data().escrowBalance || 0) - trip.cost
            });
          }
        }
      }

      // 3. Compensate Driver
      if (driverCompensation > 0) {
        if (trip.driverId && trip.driverId !== 'admin') {
          try {
            const driverRef = doc(db, 'users', trip.driverId);
            const driverDoc = await getDoc(driverRef);
            if (driverDoc.exists()) {
              await updateDoc(driverRef, {
                walletBalance: (driverDoc.data().walletBalance || 0) + driverCompensation
              });
            }
          } catch (e) {
            console.warn("Could not update driver wallet directly", e);
          }
        }
      }

      // 4. Free up seats in RideOffer
      if (trip.offerId && trip.seats && trip.seats.length > 0) {
        try {
          const offerRef = doc(db, 'rideOffers', trip.offerId);
          await updateDoc(offerRef, {
            bookedSeats: arrayRemove(...trip.seats)
          });
        } catch (error) {
          console.error("Error freeing up seats:", error);
        }
      }

      alert(`Ride Cancelled. ${policyText}. Refund: ₹${refundAmount}. Driver Compensation: ₹${driverCompensation}.`);
    }

    const tripRef = doc(db, 'trips', tripId);
    // If status is COMPLETED, set completedAt
    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = Date.now();
      updateData.paymentRequested = false;
    }

    await updateDoc(tripRef, updateData);

    // NEW: Send Confirmation Message to Passenger (Logic from Remote)
    if (status === 'EN_ROUTE' || status === 'ARRIVED') {
      const messageText = status === 'EN_ROUTE'
        ? "Your ride has started! The driver is en route."
        : "The driver has arrived at the pickup location.";

      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'system',
        text: messageText,
        timestamp: Date.now()
      };

      await updateDoc(tripRef, {
        messages: arrayUnion(message)
      });
    }
  }, [trips]);

  const rateTrip = useCallback(async (tripId: string, rating: number) => {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, { userRating: rating });
  }, []);

  const requestPayment = useCallback(async (tripId: string) => {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, { paymentRequested: true });
  }, []);

  const completeRide = useCallback(async (tripId: string) => {
    // Driver triggers this. Sets status to COMPLETED immediately.
    // "No Money Business" -> No permission required from passenger.
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      status: 'COMPLETED',
      paymentRequested: false,
      completedAt: Date.now()
    });
  }, []);

  const confirmRideCompletion = useCallback(async (tripId: string, confirmed: boolean) => {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) return;
    const trip = tripSnap.data() as Trip;

    if (confirmed) {
      // Release funds from Escrow to Driver
      setAppVault(prev => prev - trip.cost);
      setDriverBalance(prev => prev + trip.cost);

      // Update Driver's Wallet in Firestore
      // Assuming we have the driver's UID or can query it. 
      // For now, updating local state simulation.

      await updateDoc(tripRef, {
        status: 'COMPLETED',
        paymentRequested: false,
        completedAt: Date.now()
      });
    } else {
      // Dispute raised
      await updateDoc(tripRef, {
        status: 'DISPUTED',
        paymentRequested: false
      });
      alert("Ride marked as Disputed. Support will contact you.");
    }
  }, []);

  // Deprecated: releaseFunds (kept for backward compatibility if needed, but replaced by confirmRideCompletion)
  const releaseFunds = useCallback(async (tripId: string, cost: number) => {
    await confirmRideCompletion(tripId, true);
  }, [confirmRideCompletion]);

  const sendMessage = useCallback(async (tripId: string, text: string) => {
    if (!user) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.name,
      text,
      timestamp: Date.now()
    };

    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      messages: arrayUnion(newMessage)
    });
  }, [user]);

  const cancelRideOffer = useCallback(async (offerId: string) => {
    const offerRef = doc(db, 'rideOffers', offerId);
    const offerSnap = await getDoc(offerRef);

    if (offerSnap.exists()) {
      const offerData = offerSnap.data() as RideOffer;
      // MORE ROBUST CHECK: Query active trips for this offer
      const tripsQuery = query(collection(db, 'trips'), where('offerId', '==', offerId));
      const { getDocs } = await import('firebase/firestore');
      const tripsSnap = await getDocs(tripsQuery);

      const hasActiveBookings = tripsSnap.docs.some(doc => {
        const status = doc.data().status;
        return status === 'BOOKED' || status === 'WAITING_CONFIRMATION' || status === 'CONFIRMED' || status === 'EN_ROUTE' || status === 'ARRIVED';
      });

      if (hasActiveBookings) {
        alert("Cannot cancel ride with active bookings. Please contact support.");
        return;
      }
    }

    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(offerRef);
  }, []);

  const updateRideOfferPrice = useCallback(async (offerId: string, newPrice: number, seatPrices: { [key: number]: number }) => {
    const offerRef = doc(db, 'rideOffers', offerId);
    await updateDoc(offerRef, { pricePerSeat: newPrice, seatPrices });
  }, []);

  const updateRideOffer = useCallback(async (offerId: string, data: Partial<RideOffer>) => {
    const offerRef = doc(db, 'rideOffers', offerId);
    const offerSnap = await getDoc(offerRef);

    if (!offerSnap.exists()) return;
    const currentOffer = offerSnap.data() as RideOffer;
    const bookedCount = currentOffer.bookedSeats?.length || 0;

    // Golden Rule: 0 Bookings = Full Edit
    if (bookedCount === 0) {
      await updateDoc(offerRef, data);
      return;
    }

    // Iron Rule: >0 Bookings = Restricted Edit
    // 1. Cannot increase price
    if (data.pricePerSeat && data.pricePerSeat > currentOffer.pricePerSeat) {
      alert("Cannot increase price for a ride with active bookings.");
      return;
    }

    // 2. Cannot change vehicle type
    if (data.vehicleType && data.vehicleType !== currentOffer.vehicleType) {
      alert("Cannot change vehicle type for a ride with active bookings.");
      return;
    }

    // 3. Cannot reduce capacity below booked count
    if (data.totalSeats && data.totalSeats < bookedCount) {
      alert(`Cannot reduce seats below currently booked count (${bookedCount}).`);
      return;
    }

    await updateDoc(offerRef, data);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, updateUser, logout,
      passengerBalance, driverBalance, appVault,
      trips, rideOffers, bookTrip, publishRide, updateTripStatus, releaseFunds, depositToWallet,
      sendMessage, rateTrip, requestPayment, cancelRideOffer, updateRideOfferPrice, updateRideOffer,
      completeRide, confirmRideCompletion,

      loginWithPassword, setupPassword, resetPassword, withdrawFromWallet,
      deleteAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};