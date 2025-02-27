import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, update, increment, serverTimestamp, onValue, push, set } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import axios from "axios";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "jkeroro-website.firebaseapp.com",
  projectId: "jkeroro-website",
  storageBucket: "jkeroro-website.appspot.com",
  messagingSenderId: "518841981397",
  appId: "1:518841981397:web:ac6b8202d7c29dc45ec55c",
  databaseURL: "https://jkeroro-website-default-rtdb.firebaseio.com/"
};

// ✅ Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);
const firestore = getFirestore(app); // Still included for potential future use
const auth = getAuth(app);

// ✅ Function to Increment Viewer Count (Realtime Database)
const incrementViewCount = async () => {
  try {
    const countRef = ref(database, "viewCount");
    await update(countRef, {
      count: increment(1),
      lastUpdated: serverTimestamp(),
    });
    console.log("Viewer count updated successfully!");
  } catch (error) {
    console.error("Error updating viewer count:", error);
    throw error; // Propagate error to caller
  }
};

// ✅ Function to Track Visitor Location (Realtime Database)
const trackVisitorLocation = async () => {
  try {
    const cachedCountry = localStorage.getItem("visitorCountry");
    if (cachedCountry) return; // Skip API call if data is already stored

    const response = await axios.get("https://ipapi.co/json/");
    const country = response.data.country || "Unknown";

    localStorage.setItem("visitorCountry", country); // Store to prevent re-calls

    if (!country) return;

    const countryRef = ref(database, `countries/${country}`);
    await update(countryRef, {
      count: increment(1),
      lastUpdated: serverTimestamp(),
    });

    console.log(`Visitor from ${country} recorded.`);
  } catch (error) {
    console.error("Error fetching visitor location:", error.message);
  }
};


// ✅ Function to Add a Comment (Realtime Database)
const addComment = async (comment) => {
  if (!comment.trim()) return;

  try {
    const commentsRef = ref(database, "comments");
    const newCommentRef = push(commentsRef); // Generate a unique key
    await set(newCommentRef, {
      text: comment,
      timestamp: serverTimestamp(),
    });
    console.log("Comment added to Realtime Database successfully!");
  } catch (error) {
    console.error("Error adding comment to Realtime Database:", error);
    throw error; // Propagate error to caller
  }
};

// ✅ Export Firebase functionalities
export { 
  app,
  auth,
  database,
  firestore,
  ref,
  update,
  increment,
  onValue,
  serverTimestamp,
  addComment,
  incrementViewCount,
  trackVisitorLocation,
  onAuthStateChanged,
  set // Added set to exports
};