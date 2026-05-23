import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query,
  serverTimestamp
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { Volunteer } from '../types';

// ============================================================================
// 1. FIREBASE INITIALIZATION
// ============================================================================

// Pull config from Vite environment variables (.env file)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App and Firestore
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ============================================================================
// 2. REAL-TIME REACT HOOK
// ============================================================================

/**
 * A ready-to-use React Hook that manages the Volunteers collection.
 * 
 * Features:
 * - Automatically listens to the 'volunteers' Firestore collection in real-time.
 * - Provides an `addVolunteer` function to save the parsed Gemini JSON.
 * - Manages loading state automatically.
 */
export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for the volunteers collection
  useEffect(() => {
    const volunteersRef = collection(db, 'volunteers');
    const q = query(volunteersRef);

    // onSnapshot sets up a live WebSocket connection to Firestore.
    // Any time a document is added/updated/deleted, this runs instantly.
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const liveData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Volunteer[];
        
        setVolunteers(liveData);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to listen to the volunteers collection:", error);
        setLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  /**
   * Saves a newly parsed volunteer object to Firestore.
   * 
   * @param volunteerData - The structured JSON extracted by Gemini (without an ID)
   * @returns The newly generated Firestore Document ID
   */
  const addVolunteer = async (volunteerData: Omit<Volunteer, 'id'>) => {
    try {
      const volunteersRef = collection(db, 'volunteers');
      
      // We append a serverTimestamp so we can sort them chronologically in the dashboard
      const docRef = await addDoc(volunteersRef, {
        ...volunteerData,
        createdAt: serverTimestamp() 
      });
      
      console.log(`Successfully added volunteer with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Error saving volunteer to Firestore:", error);
      throw error;
    }
  };

  return { 
    volunteers, 
    loading, 
    addVolunteer 
  };
}