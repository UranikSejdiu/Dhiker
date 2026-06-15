import { Platform } from 'react-native';
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace the placeholder values below with your actual Firebase project credentials.
// You can find these in the Firebase Console → Project Settings → General → Your apps → SDK setup and configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCU3uoe0ol_Bg8-QUh5ukPXwAszLNw2-i8",
  authDomain: "dhiker-aad00.firebaseapp.com",
  projectId: "dhiker-aad00",
  storageBucket: "dhiker-aad00.firebasestorage.app",
  messagingSenderId: "343490580041",
  appId: "1:343490580041:web:dc39e3ad376335288f3998",
};

const app = initializeApp(firebaseConfig);

// Use AsyncStorage for auth persistence on React Native, and browser storage on Web
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

// Enable offline persistence for web so the app works without internet
if (Platform.OS === 'web') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn('Firebase offline persistence error:', err.code);
  });
}

export default app;
