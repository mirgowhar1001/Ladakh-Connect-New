export interface Ride {
    id: string;
    from: string;
    to: string;
    date: string;
    time: string;
    vehicle: string;
    vehicleNumber: string;
    driverName: string;
    driverMobile: string;
    seatsTotal: number;
    seatsBooked: number;
    price: number;
}

export const MOCK_RIDES: Ride[] = [];
