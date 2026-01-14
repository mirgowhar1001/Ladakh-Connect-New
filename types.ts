export type UserRole = 'passenger' | 'owner' | 'admin';

export type TripStatus = 'BOOKED' | 'WAITING_CONFIRMATION' | 'CONFIRMED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  uid?: string; // Firebase Auth UID
  name: string;
  mobile: string;
  role: UserRole;
  vehicleNo?: string;
  vehicleType?: string;
  profileImage?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'none';
  documents?: {
    dl?: string;
    rc?: string;
    insurance?: string;
    vehicleFront?: string;
    vehicleBack?: string;
  };
  walletBalance?: number;
  escrowBalance?: number;
}

export interface VehicleDef {
  type: string;
  rateMultiplier: number;
  seats: number;
  layout: number[]; // e.g., [1, 3, 3] for rows
  image: string;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface RideOffer {
  id: string; // Changed to string for Firestore
  driverName: string;
  driverId: string; // mobile or auth uid
  driverMobile?: string; // Added for direct access
  vehicleNo: string;
  vehicleType: string;
  from: string;
  to: string;
  date: string;
  time: string;
  pricePerSeat: number;
  totalSeats: number;
  activeSeats?: number[]; // indices of seats active for booking
  bookedSeats: number[]; // Indices of booked seats
  rating: number;
  seatPrices?: { [seatIndex: number]: number }; // Custom price per seat
  createdAt?: number; // Timestamp for sorting
  status?: 'OPEN' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED'; // Lifecycle status
}

export interface Trip {
  id: string; // Changed to string for Firestore
  from: string;
  to: string;
  date: string;
  cost: number;
  status: TripStatus;
  passengerId: string; // Passenger Name
  passengerUid?: string; // Auth UID
  passengerMobile?: string;
  driverName: string;
  driverMobile?: string; // Added for direct access
  vehicleNo: string;
  vehicleType: string;
  seats: number[];
  messages: ChatMessage[];
  offerId?: string; // Changed to string
  userRating?: number;
  paymentRequested?: boolean;
  completedAt?: number;
}

export interface RouteDef {
  id: number;
  from: string;
  to: string;
  dist: string;
}