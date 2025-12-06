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

export const MOCK_RIDES: Ride[] = [
    {
        id: '1',
        from: 'Leh',
        to: 'Srinagar',
        date: '2025-12-07',
        time: '06:00 AM',
        vehicle: 'Toyota Innova',
        vehicleNumber: 'JK-10-1234',
        driverName: 'Tashi Dorje',
        driverMobile: '+91 94191 12345',
        seatsTotal: 6,
        seatsBooked: 2,
        price: 2500
    },
    {
        id: '2',
        from: 'Leh',
        to: 'Nubra Valley',
        date: '2025-12-08',
        time: '08:00 AM',
        vehicle: 'Mahindra Scorpio',
        vehicleNumber: 'JK-10-5678',
        driverName: 'Stanzin Namgyal',
        driverMobile: '+91 94191 67890',
        seatsTotal: 7,
        seatsBooked: 0,
        price: 1500
    },
    {
        id: '3',
        from: 'Kargil',
        to: 'Leh',
        date: '2025-12-07',
        time: '07:30 AM',
        vehicle: 'Toyota Fortuner',
        vehicleNumber: 'JK-07-9012',
        driverName: 'Ali Mohammed',
        driverMobile: '+91 94191 11223',
        seatsTotal: 7,
        seatsBooked: 5,
        price: 1800
    },
    {
        id: '4',
        from: 'Srinagar',
        to: 'Leh',
        date: '2025-12-09',
        time: '05:00 AM',
        vehicle: 'Tempo Traveler',
        vehicleNumber: 'JK-01-3456',
        driverName: 'Ghulam Rasool',
        driverMobile: '+91 94191 44556',
        seatsTotal: 12,
        seatsBooked: 8,
        price: 2200
    },
    {
        id: '5',
        from: 'Leh',
        to: 'Pangong Lake',
        date: '2025-12-10',
        time: '07:00 AM',
        vehicle: 'Xylo',
        vehicleNumber: 'JK-10-7788',
        driverName: 'Rigzin Norbu',
        driverMobile: '+91 94191 99887',
        seatsTotal: 6,
        seatsBooked: 6, // Full
        price: 2000
    }
];
