import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

const seedDriver = async () => {
    try {
        const email = "driver@test.com";
        const password = "TestDriver123";
        const mobile = "9876543211";

        console.log("Creating Driver Auth User...");
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                console.log("User already exists, signing in...");
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                throw e;
            }
        }

        const uid = userCredential.user.uid;
        console.log(`Driver Auth Created. UID: ${uid}`);

        const driverData = {
            uid: uid,
            name: "Test Driver",
            mobile: mobile,
            role: "owner",
            email: email,
            vehicleNo: "JK-01-AB-1234",
            vehicleType: "Toyota Innova",
            verificationStatus: "verified", // Auto-verify for testing
            walletBalance: 0,
            escrowBalance: 0,
            documents: {
                dl: "https://via.placeholder.com/150",
                rc: "https://via.placeholder.com/150",
                insurance: "https://via.placeholder.com/150",
                vehicleFront: "https://via.placeholder.com/150"
            }
        };

        console.log("Creating Driver Firestore Document...");
        await setDoc(doc(db, 'users', uid), driverData);
        console.log("Driver Firestore Document Created.");

        console.log("SUCCESS: Driver Account Seeded.");
        process.exit(0);
    } catch (error) {
        console.error("ERROR Seeding Driver:", error);
        process.exit(1);
    }
};

seedDriver();
