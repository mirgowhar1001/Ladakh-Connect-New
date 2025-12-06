import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const seedDriver = async () => {
    try {
        const email = "driver@test.com";
        const password = "TestDriver123";
        const mobile = "9876543211";

        console.log("Creating Driver Auth User...");
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (e: any) {
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
