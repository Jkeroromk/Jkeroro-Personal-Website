import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, update, increment, serverTimestamp, onValue, push, set, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import axios from "axios";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "jkeroro-website.firebaseapp.com",
  projectId: "jkeroro-website",
  storageBucket: "jkeroro-website.appspot.com",
  messagingSenderId: "518841981397",
  appId: "1:518841981397:web:ac6b8202d7c29dc45ec55c",
  databaseURL: "https://jkeroro-website-default-rtdb.firebaseio.com/"
};

// ✅ Initialize Firebase (with error handling)
let app, database, firestore, auth, storage;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  database = getDatabase(app);
  firestore = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  // 创建占位符对象以避免运行时错误
  app = null;
  database = null;
  firestore = null;
  auth = null;
  storage = null;
}

// ✅ Function to Increment Viewer Count (Realtime Database)
const incrementViewCount = async () => {
  if (!database) {
    return;
  }
  try {
    const countRef = ref(database, "viewCount");
    await update(countRef, {
      count: increment(1),
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

// ✅ Normalize to Full Country Name
const normalizeCountry = (countryCode, countryName) => {
  const codeToNameMap = {
    US: "United States",
    PH: "Philippines",
    UK: "United Kingdom",
    AU: "Australia",
    BR: "Brazil",
    CA: "Canada",
    CL: "Chile",
    FR: "France",
    DE: "Germany",
    IN: "India",
    KW: "Kuwait",
    LB: "Lebanon",
    KR: "South Korea",
    SE: "Sweden",
    CH: "Switzerland",
    TH: "Thailand",
    NL: "The Netherlands",
    // Add more mappings as needed
  };

  // Prefer countryName if available, otherwise map the code to full name
  return countryName && countryName.trim() !== ""
    ? countryName
    : codeToNameMap[countryCode.toUpperCase()] || "Unknown";
};

// ✅ Function to Track Visitor Location (Realtime Database)
const trackVisitorLocation = async () => {
  if (!database) {
    return;
  }
  try {
    const cachedCountry = localStorage.getItem("visitorCountry");
    if (cachedCountry) return; // Skip API call if data is already stored

    const response = await axios.get("https://ipapi.co/json/");
    const countryCode = response.data.country; // e.g., "US"
    const countryName = response.data.country_name; // e.g., "United States"
    const country = normalizeCountry(countryCode, countryName);

    localStorage.setItem("visitorCountry", country); // Store normalized full name

    if (country === "Unknown") return;

    const countryRef = ref(database, `countries/${country}`);
    await update(countryRef, {
      count: increment(1),
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    // 静默处理错误
  }
};

// ✅ Function to Add a Comment (Realtime Database)
const addComment = async (comment) => {
  if (!comment.trim()) return;
  if (!database) {
    return;
  }

  try {
    const commentsRef = ref(database, "comments");
    const newCommentRef = push(commentsRef); // Generate a unique key
    await set(newCommentRef, {
      text: comment,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

// ✅ Function to Cleanup Duplicate Countries (Merging Codes into Full Names)
const cleanupDuplicateCountries = async () => {
  if (!database) {
    return;
  }
  try {
    const countriesRef = ref(database, "countries");
    const snapshot = await get(countriesRef);

    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.val();
    const mergedData = {};
    const codeToNameMap = {
      US: "United States",
      PH: "Philippines",
      UK: "United Kingdom",
      AU: "Australia",
      BR: "Brazil",
      CA: "Canada",
      CL: "Chile",
      FR: "France",
      DE: "Germany",
      IN: "India",
      KW: "Kuwait",
      LB: "Lebanon",
      KR: "South Korea",
      SE: "Sweden",
      CH: "Switzerland",
      TH: "Thailand",
      NL: "The Netherlands",
    };

    // Step 1: Merge duplicates into full names
    for (const country in data) {
      const normalizedCountry = codeToNameMap[country.toUpperCase()] || country;
      const current = data[country];

      if (mergedData[normalizedCountry]) {
        mergedData[normalizedCountry].count += current.count;
        mergedData[normalizedCountry].lastUpdated = Math.max(
          mergedData[normalizedCountry].lastUpdated,
          current.lastUpdated
        );
      } else {
        mergedData[normalizedCountry] = {
          count: current.count,
          lastUpdated: current.lastUpdated,
        };
      }
    }

    // Step 2: Write merged data back to Firebase
    await update(countriesRef, mergedData);

    // Step 3: Remove old two-letter code entries
    for (const country in data) {
      const normalizedCountry = codeToNameMap[country.toUpperCase()];
      if (normalizedCountry && country !== normalizedCountry) {
        const oldCountryRef = ref(database, `countries/${country}`);
        await set(oldCountryRef, null); // Setting to null deletes the node
      }
    }
  } catch (error) {
    // 静默处理错误
  }
};

// ✅ Export Firebase functionalities
export { 
  app,
  auth,
  database,
  firestore,
  storage,
  ref,
  update,
  increment,
  onValue,
  serverTimestamp,
  addComment,
  incrementViewCount,
  trackVisitorLocation,
  onAuthStateChanged,
  set,
  get,
  cleanupDuplicateCountries,
};