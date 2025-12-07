import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCdarhgeDVba6Dz5xNGcyvkBFK7Vp8XMSg",
    authDomain: "ladakh-connect1.firebaseapp.com",
    projectId: "ladakh-connect1",
    storageBucket: "ladakh-connect1.firebasestorage.app",
    messagingSenderId: "665150606046",
    appId: "1:665150606046:web:a3f2ce2cdf7b460987904f",
    measurementId: "G-WS5L3SL28C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedRide = async () => {
    try {
        const driverUid = "x8hSQTW5I0Of9QPTZHzYUMBd6Cg1"; // From previous seed
        const driverName = "Test Driver";

        // Date: Tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

        const rideData = {
            driverId: driverUid,
            driverName: driverName,
            from: "Leh",
            to: "Kargil",
            date: dateStr,
            time: "10:00 AM",
            price: 1000,
            seats: 3,
            vehicle: "Toyota Innova",
            rating: 4.5, // Mock rating
            status: "active",
            createdAt: Date.now()
        };

        console.log("Creating Ride Offer...");
        const docRef = await addDoc(collection(db, 'rides'), rideData);
        console.log(`Ride Offer Created. ID: ${docRef.id}`);

        console.log("SUCCESS: Ride Seeded.");
        process.exit(0);
    } catch (error) {
        console.error("ERROR Seeding Ride:", error);
        process.exit(1);
    }
};

seedRide();
