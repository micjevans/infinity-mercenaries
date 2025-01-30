import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange, logOut as firebaseLogOut } from "./auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser); // Set user state from Firebase Auth
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Define the logOut function in context
  const logOut = async () => {
    try {
      await firebaseLogOut(); // Call the logOut function from auth.js
      setUser(null); // Clear the user state
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
