"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, database, ref, onValue, set, onAuthStateChanged } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminStatusRef = ref(database, "adminStatus/lastActive");

    const unsubscribe = onValue(
      adminStatusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const lastActiveTime = snapshot.val();
          setLastActivity(new Date(lastActiveTime).toLocaleString());
        } else {
          setLastActivity(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Initial lastActivity fetch error:", error.code, error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser && currentUser.email === "zzou2000@gmail.com");
      if (currentUser && currentUser.email === "zzou2000@gmail.com") {
        setIsOnline(true); // Optimistically set Online on login
      } else if (!currentUser) {
        setIsOnline(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setIsOnline(false);
      return;
    }

    const adminStatusRef = ref(database, "adminStatus/lastActive");

    const unsubscribeAdminStatus = onValue(
      adminStatusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const lastActiveTime = snapshot.val();
          const now = Date.now();
          setIsOnline(now - lastActiveTime < 5 * 60 * 1000);
        } else {
          setIsOnline(false);
        }
      },
      (error) => {
        console.error("adminStatus listener error:", error.code, error.message);
      }
    );

    return () => unsubscribeAdminStatus();
  }, [isAdmin]);

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const adminStatusRef = ref(database, "adminStatus/lastActive");
    await set(adminStatusRef, Date.now());
    await signOut(auth);
    setIsOnline(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        auth,
        isAdmin,
        isOnline,
        lastActivity,
        loading,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);