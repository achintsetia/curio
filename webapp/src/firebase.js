// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCVTAaWsZSfn3GMbxr_tgxLaZQzxYKql1k",
    authDomain: "curio-6b4c5.firebaseapp.com",
    projectId: "curio-6b4c5",
    storageBucket: "curio-6b4c5.firebasestorage.app",
    messagingSenderId: "630592712649",
    appId: "1:630592712649:web:6a85ea77c0338b68eb8218",
    measurementId: "G-S54W1PGMC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "asia-south1"); // Setting region as per previous requests

export { app, analytics, auth, db, functions };