import React, { createContext, useContext, useState, useEffect } from "react";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { msalInstance } from "../auth/msalInstance";
import { loginRequest } from "../auth/authConfig";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthInnerProvider>{children}</AuthInnerProvider>
    </MsalProvider>
  );
}

function AuthInnerProvider({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync MSAL accounts to Context State
  useEffect(() => {
    console.log("[AuthContext] inProgress status:", inProgress, "accounts count:", accounts.length);
    const activeAccount = instance.getActiveAccount() || accounts[0];
    if (activeAccount) {
      setCurrentUser({
        uid: activeAccount.localAccountId || activeAccount.homeAccountId,
        email: activeAccount.username,
        displayName: activeAccount.name || activeAccount.username?.split("@")[0] || "Microsoft User",
      });
    } else {
      setCurrentUser(null);
    }

    if (inProgress === "none") {
      setLoading(false);
    }
  }, [accounts, instance, inProgress]);

  // Sync user profile to Firestore database
  useEffect(() => {
    const syncUserToFirestore = async () => {
      if (currentUser) {
        try {
          console.log("[AuthContext] Syncing user profile to Firestore for:", currentUser.email);
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              createdAt: serverTimestamp(),
            });
          } else {
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
          console.log("[AuthContext] Firestore sync successful.");
        } catch (error) {
          console.error("[AuthContext] Firestore sync error:", error);
        }
      }
    };
    syncUserToFirestore();
  }, [currentUser]);

  const login = async () => {
    try {
      console.log("[AuthContext] Triggering loginRedirect()");
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("[AuthContext] loginRedirect failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Triggering logoutRedirect()");
      setCurrentUser(null);
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      });
    } catch (error) {
      console.error("[AuthContext] logoutRedirect error:", error);
    }
  };

  const updateUsername = async (displayName) => {
    // Locally adjust display name in current state if needed
    setCurrentUser((prev) => (prev ? { ...prev, displayName } : null));
    
    // Also save it to Firestore if the user exists
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { displayName, updatedAt: serverTimestamp() }, { merge: true });
        console.log("[AuthContext] Local username updated in Firestore successfully.");
      } catch (error) {
        console.error("[AuthContext] Failed to update username in Firestore:", error);
      }
    }
  };

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading: loading || inProgress !== "none",
        isAuthenticated,
        login,
        logout,
        updateUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}