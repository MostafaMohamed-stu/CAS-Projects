// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIX2WjSxeAiHbEGev1u53DzGpZGmnExX0",
  authDomain: "attendance-28f89.firebaseapp.com",
  projectId: "attendance-28f89",
  storageBucket: "attendance-28f89.firebasestorage.app",
  messagingSenderId: "284330471098",
  appId: "1:284330471098:web:a85228865db3597cb71c83",
  measurementId: "G-KBNK5D32QX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, getMessaging, getToken, onMessage };
