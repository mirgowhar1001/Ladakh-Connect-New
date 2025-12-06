import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const clearUsers = async () => {
    try {
        console.log("Fetching users...");
        const querySnapshot = await getDocs(collection(db, "users"));

        if (querySnapshot.empty) {
            console.log("No users found to delete.");
            process.exit(0);
        }

        console.log(`Found ${querySnapshot.size} users. Deleting...`);

        const deletePromises = querySnapshot.docs.map(document => {
            console.log(`Deleting user: ${document.id}`);
            return deleteDoc(doc(db, "users", document.id));
        });

        await Promise.all(deletePromises);

        console.log("SUCCESS: All users deleted from Firestore.");
        process.exit(0);
    } catch (error) {
        console.error("ERROR Clearing Users:", error);
        process.exit(1);
    }
};

clearUsers();
