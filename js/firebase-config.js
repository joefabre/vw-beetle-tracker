/**
 * Firebase Configuration
 * 
 * IMPORTANT: Replace the firebaseConfig object below with your actual
 * Firebase project configuration from the Firebase Console.
 * 
 * To get your config:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project
 * 3. Go to Project Settings (gear icon)
 * 4. Scroll down to "Your apps" and select your web app
 * 5. Copy the config object
 */

// Firebase configuration for VW Beetle Tracker
const firebaseConfig = {
    apiKey: "AIzaSyDGcwqNB9njH0ZumQXKJhvFzl-VLY1u6PQ",
    authDomain: "vw-beetle-tracker.firebaseapp.com",
    projectId: "vw-beetle-tracker",
    storageBucket: "vw-beetle-tracker.firebasestorage.app",
    messagingSenderId: "720165426241",
    appId: "1:720165426241:web:4a416dd4136c09f17aa2c0",
    measurementId: "G-Z6LEP6KY00"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firestore
    window.db = firebase.firestore();
    
    console.log('Firebase initialized successfully');
    // Test Firebase connection
    testFirebaseConnection();
} catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // Fallback to localStorage if Firebase fails
    console.warn('Falling back to localStorage for data persistence');
    window.db = null;
}

// Test Firebase connection
async function testFirebaseConnection() {
    if (!window.db) {
        console.log('🔴 Firebase not available - using localStorage only');
        return;
    }

    try {
        // Try to read from Firebase
        const testDoc = await db.collection('vehicles').doc('beetle-1969').get();

        if (testDoc.exists) {
            console.log('🟢 Firebase READ test: SUCCESS - Data found in cloud');
            console.log('📊 Cloud data preview:', Object.keys(testDoc.data() || {}));
        } else {
            console.log('🟡 Firebase READ test: SUCCESS - No data yet (this is normal for new setups)');
        }

        // Try to write a test timestamp
        await db.collection('vehicles').doc('beetle-1969').set({
            lastConnectionTest: new Date().toISOString()
        }, { merge: true });

        console.log('🟢 Firebase WRITE test: SUCCESS - Can save to cloud database');
        console.log('✅ Firebase is fully connected and working!');

    } catch (error) {
        console.error('🔴 Firebase connection test FAILED:', error);
        console.log('📍 Check your internet connection and Firebase project settings');
    }
}

// Make test function available globally for manual testing
window.testFirebase = testFirebaseConnection;

