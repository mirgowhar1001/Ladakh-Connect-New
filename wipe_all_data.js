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

const wipeCollection = async (collectionName) => {
    try {
        console.log(`Fetching ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));

        if (querySnapshot.empty) {
            console.log(`No documents found in ${collectionName}.`);
            return;
        }

        console.log(`Found ${querySnapshot.size} documents in ${collectionName}. Deleting...`);

        const deletePromises = querySnapshot.docs.map(document => {
            return deleteDoc(doc(db, collectionName, document.id));
        });

        await Promise.all(deletePromises);
        console.log(`SUCCESS: All documents deleted from ${collectionName}.`);
    } catch (error) {
        console.error(`ERROR Clearing ${collectionName}:`, error);
    }
};

const wipeAllData = async () => {
    // Parallel execution for speed
    await Promise.all([
        wipeCollection("users"),
        wipeCollection("trips"),
        wipeCollection("rideOffers")
    ]);
    console.log("-----------------------------------");
    console.log("FULL DATABASE WIPE COMPLETE.");
    process.exit(0);
};

wipeAllData();
