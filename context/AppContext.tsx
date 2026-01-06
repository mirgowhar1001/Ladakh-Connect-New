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
  orderBy,
  getDocs,    // Added
  writeBatch  // Added
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

interface AppContextType {
  user: User | null;
  trips: Trip[];
  rideOffers: RideOffer[];
  login: (role: UserRole, data: Omit<User, 'role'>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  bookTrip: (tripDetails: Omit<Trip, 'id' | 'status' | 'passengerId' | 'driverName' | 'vehicleNo' | 'messages'> & { driverName?: string; vehicleNo?: string }, cost: number, offerId?: string) => Promise<boolean>;
  publishRide: (offer: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => Promise<void>;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
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
  deleteAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);

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

  // Automatic Cleanup of Expired Rides
  useEffect(() => {
    const cleanupExpiredRides = async () => {
      try {
        const now = new Date();
        const offersRef = collection(db, 'rideOffers');
        // Retrieve all OPEN offers to check expiry. 
        // Optimization: We could query where('date', '<', ...) but date is string "YYYY-MM-DD".
        // Fetching all is acceptable for prototype scale.
        const snapshot = await getDocs(offersRef);
        const batch = writeBatch(db);
        let updatesCount = 0;

        for (const docSnap of snapshot.docs) {
          const offer = docSnap.data() as RideOffer;
          if (offer.status === 'COMPLETED' || offer.status === 'CANCELLED') continue;

          try {
            // Parse timestamp
            const [timePart, ampm] = offer.time.split(' ');
            const [hours, minutes] = timePart.split(':');
            let h = parseInt(hours);
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;

            const rideDate = new Date(offer.date);
            rideDate.setHours(h, parseInt(minutes), 0, 0);

            if (rideDate < now) {
              // Ride is in the past
              // TEMPORARILY DISABLED CLEANUP TO PREVENT ACCIDENTAL DELETION
              // if (!offer.bookedSeats || offer.bookedSeats.length === 0) {
              //   // Rule 1: No bookings -> Delete
              //   console.log(`[Cleanup] Deleting expired empty offer: ${docSnap.id}`);
              //   batch.delete(doc(db, 'rideOffers', docSnap.id));
              //   updatesCount++;
              // }
            }
          } catch (e) {
            console.warn("Skipping offer with invalid date/time:", offer.id);
          }
        }

        if (updatesCount > 0) {
          await batch.commit();
          console.log(`[Cleanup] Committed ${updatesCount} updates.`);
        }
      } catch (error) {
        console.error("Cleanup failed:", error);
      }
    };

    cleanupExpiredRides();
  }, []); // Run once on mount

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

  const bookTrip = useCallback(async (tripDetails: any, cost: number, offerId?: string) => {
    if (!user) return false;

    try {
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
      console.log("Creating trip doc...", tripDetails);
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

      // 5. Update Ride Offer (Book Seats)
      if (offerId && tripDetails.seats) {
        console.log("Updating offer seats...", offerId);
        const offerRef = doc(db, 'rideOffers', offerId);
        await updateDoc(offerRef, {
          bookedSeats: arrayUnion(...tripDetails.seats)
        });
      }

      alert("Booking Request Sent! Waiting for driver confirmation.");
      return true;

    } catch (error: any) {
      console.error("Booking Error:", error);
      alert(`Booking Failed: ${error.message}`);
      return false;
    }
  }, [user]);

  const publishRide = useCallback(async (offerData: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => {
    if (!user) throw new Error("User not valid. Please log in again.");
    if (user.role !== 'owner') throw new Error(`Permission Denied. Role is '${user.role}', expected 'owner'.`);

    // 60-Day Horizon Rule
    const rideDate = new Date(offerData.date);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);

    if (rideDate > maxDate) {
      throw new Error("Cannot post rides more than 60 days in advance.");
    }

    const newOffer = {
      driverName: user.name,
      driverId: auth.currentUser?.uid || user.uid, // Force consistent UID
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

      alert(`Ride Cancelled.`);
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
      trips, rideOffers, bookTrip, publishRide, updateTripStatus,
      sendMessage, rateTrip, requestPayment, cancelRideOffer, updateRideOfferPrice, updateRideOffer,
      completeRide, confirmRideCompletion,
      loginWithPassword, setupPassword, resetPassword,
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
