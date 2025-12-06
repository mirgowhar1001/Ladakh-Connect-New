export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Booking {
    id: string;
    rideId: string;
    passengerName: string;
    status: BookingStatus;
    seats: number;
}

export type RideStatus = 'OPEN' | 'COMPLETED';

export type UserRole = 'DRIVER' | 'PASSENGER';
