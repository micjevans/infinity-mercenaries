import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange, logOut as firebaseLogOut } from "./auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState({ isAdmin: false, isMod: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        // Set the basic user info from Firebase Auth
        setUser(currentUser);

        try {
          // Fetch additional user data from Firestore, including roles
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Set role flags based on user data in Firestore
            setUserRoles({
              isAdmin: userData.roles?.admin === true,
              isMod:
                userData.roles?.moderator === true ||
                userData.roles?.admin === true, // Admins are also moderators
            });
          } else {
            // No user document found - reset roles
            setUserRoles({ isAdmin: false, isMod: false });
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setUserRoles({ isAdmin: false, isMod: false });
        }
      } else {
        // No user signed in
        setUser(null);
        setUserRoles({ isAdmin: false, isMod: false });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Define the logOut function in context
  const logOut = async () => {
    try {
      await firebaseLogOut();
      setUser(null);
      setUserRoles({ isAdmin: false, isMod: false });
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  // Combine user data and roles into a single context value
  const contextValue = {
    user,
    loading,
    logOut,
    isAdmin: userRoles.isAdmin,
    isMod: userRoles.isMod,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
