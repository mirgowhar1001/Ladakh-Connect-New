import { VehicleDef } from './types';

export const CITIES = ['Leh', 'Kargil', 'Srinagar', 'Jammu', 'Nubra', 'Pangong'];

export const DESTINATION_IMAGES: Record<string, string> = {
  'Leh': 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=600&auto=format&fit=crop',
  'Srinagar': 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=600&auto=format&fit=crop',
  'Jammu': 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=600&auto=format&fit=crop',
  'Kargil': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600&auto=format&fit=crop',
  'Nubra': 'https://images.unsplash.com/photo-1562907550-096d3bf9b25c?q=80&w=600&auto=format&fit=crop',
  'Pangong': 'https://images.unsplash.com/photo-1615817342656-7492c7302f23?q=80&w=600&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop'
};

// Using generic reliable placeholder images for vehicles
export const VEHICLES: VehicleDef[] = [
  {
    type: 'Mahindra Xylo',
    rateMultiplier: 1.0,
    seats: 7,
    layout: [1, 3, 3],
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Mahindra_Xylo_E8_2009_%2814886518331%29.jpg'
  },
  {
    type: 'Toyota Innova',
    rateMultiplier: 1.2,
    seats: 7,
    layout: [1, 3, 3],
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/2005_Toyota_Innova_2.5_G_%282006-11-28%29.jpg'
  },
  {
    type: 'Toyota Innova Crysta',
    rateMultiplier: 1.4,
    seats: 6,
    layout: [1, 2, 3],
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/2016_Toyota_Kijang_Innova_2.4_V_wagon_%28GUN142R%3B_12-25-2019%29%2C_South_Tangerang.jpg'
  },
  {
    type: 'Innova Crysta', // Added alias for direct matching
    rateMultiplier: 1.4,
    seats: 6,
    layout: [1, 2, 3],
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/2016_Toyota_Kijang_Innova_2.4_V_wagon_%28GUN142R%3B_12-25-2019%29%2C_South_Tangerang.jpg'
  },
  {
    type: 'Tempo Traveler',
    rateMultiplier: 1.5,
    seats: 12,
    layout: [1, 3, 4, 4],
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Force_Motors_Traveller_minibus_in_Pune_01.jpg'
  }
];

export const BASE_RATES: Record<string, number> = {
  'Leh-Srinagar': 2500,
  'Leh-Jammu': 3500,
  'Leh-Kargil': 1200,
  'Kargil-Srinagar': 1500,
  'Kargil-Jammu': 2800,
  'Leh-Nubra': 1000,
  'Leh-Pangong': 1500,
};

export const MOCK_DRIVERS = [
  { name: 'Tenzin Norbu', vehicleNo: 'JK-10-B-1234', type: 'Innova Crysta', rating: 4.8 },
  { name: 'Stanzin Dorje', vehicleNo: 'JK-10-A-5678', type: 'Xylo', rating: 4.5 },
  { name: 'Rahul Sharma', vehicleNo: 'JK-02-C-9988', type: 'Innova', rating: 4.6 },
];

export const ROUTE_WHITELIST = [
  'Leh-Kargil', 'Kargil-Leh',
  'Leh-Srinagar', 'Srinagar-Leh',
  'Leh-Jammu', 'Jammu-Leh',
  'Kargil-Srinagar', 'Srinagar-Kargil',
  'Kargil-Jammu', 'Jammu-Kargil'
];

export const VEHICLE_WHITELIST = [
  'Mahindra Xylo',
  'Toyota Innova',
  'Toyota Innova Crysta'
];