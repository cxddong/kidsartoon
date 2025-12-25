import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
    apiKey: "AIzaSyAPiovapSN9I5o56rJRrDwKiY-wWeHdY7I",
    authDomain: "kat-antigravity.firebaseapp.com",
    projectId: "kat-antigravity",
    storageBucket: "kat-antigravity.firebasestorage.app",
    messagingSenderId: "1045560094198",
    appId: "1:1045560094198:web:8c0186f65ab1ddbab3ebd7",
    measurementId: "G-Y4M4VX7B5Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const logFile = 'debug_rez.txt';
fs.writeFileSync(logFile, '');

const log = (m: string) => {
    console.log(m);
    fs.appendFileSync(logFile, m + '\n');
};

async function check() {
    log(`Connecting to ${firebaseConfig.projectId}`);
    log("--- IMAGES COLLECTION ---");
    const snap = await getDocs(collection(db, 'images'));
    log(`Total Docs: ${snap.size}`);

    const userCounts: Record<string, number> = {};
    const samples: string[] = [];

    snap.forEach(d => {
        const data = d.data();
        const uid = data.userId || 'undefined';
        userCounts[uid] = (userCounts[uid] || 0) + 1;
        if (samples.length < 5) samples.push(`${d.id} (${uid})`);
    });

    log("Counts by User: " + JSON.stringify(userCounts));
    log("Sample IDs: " + JSON.stringify(samples));

    log("\n--- USERS COLLECTION ---");
    const snapUsers = await getDocs(collection(db, 'users'));
    log(`Total Users: ${snapUsers.size}`);
    snapUsers.forEach(d => {
        const data = d.data();
        log(`User: ${d.id} | Name: ${data.name} | Points: ${data.points}`);
    });
}

check().then(() => process.exit(0)).catch(e => log(String(e)));
