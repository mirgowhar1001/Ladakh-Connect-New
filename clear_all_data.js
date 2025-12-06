import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";

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

const COLLECTIONS = ["users", "trips", "rideOffers", "payments"];

const clearCollection = async (collectionName) => {
    try {
        console.log(`Fetching ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));

        if (querySnapshot.empty) {
            console.log(`No documents found in ${collectionName}.`);
            return;
        }

        console.log(`Found ${querySnapshot.size} documents in ${collectionName}. Deleting...`);

        // Use batches for better performance and atomicity (limit 500 per batch)
        const batchSize = 400;
        const chunks = [];
        let currentChunk = [];

        querySnapshot.docs.forEach((doc) => {
            currentChunk.push(doc);
            if (currentChunk.length >= batchSize) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
        });
        if (currentChunk.length > 0) chunks.push(currentChunk);

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(document => {
                batch.delete(doc(db, collectionName, document.id));
            });
            await batch.commit();
            console.log(`Deleted batch of ${chunk.length} documents from ${collectionName}.`);
        }

        console.log(`SUCCESS: All documents deleted from ${collectionName}.`);
    } catch (error) {
        console.error(`ERROR clearing ${collectionName}:`, error);
    }
};

const clearAllData = async () => {
    console.log("STARTING FULL DATABASE WIPE...");

    for (const col of COLLECTIONS) {
        await clearCollection(col);
    }

    console.log("DATABASE WIPE COMPLETE.");
    process.exit(0);
};

clearAllData();
