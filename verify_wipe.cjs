const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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

const verifyWipe = async () => {
    console.log("VERIFYING WIPE...");
    const users = await getDocs(collection(db, "users"));
    console.log(`Users count: ${users.size}`);

    const trips = await getDocs(collection(db, "trips"));
    console.log(`Trips count: ${trips.size}`);

    const offers = await getDocs(collection(db, "rideOffers"));
    console.log(`RideOffers count: ${offers.size}`);
    
    process.exit(0);
};

verifyWipe();
