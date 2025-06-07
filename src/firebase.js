// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA",
    authDomain: "bunk-mates-beccc.firebaseapp.com",
    projectId: "bunk-mates-beccc",
    storageBucket: "bunk-mates-beccc.firebasestorage.app",
    messagingSenderId: "37810808180",
    appId: "1:37810808180:web:94ca726e3c8f195a26f821",
    measurementId: "G-Y78WBDGF5Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const firestore = getFirestore(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

export { auth, googleProvider, db, firestore, messaging };
