import React, { createContext, useContext, useState, useEffect } from "react";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
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
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Monitor MSAL events for authentication and interaction failures
  useEffect(() => {
    const callbackId = instance.addEventCallback((message) => {
      if (message.eventType === EventType.LOGIN_FAILURE || message.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
        const error = message.error;
        console.error("[AuthContext] MSAL failure event detected:", error);
        
        let friendlyMessage = "Microsoft authentication failed. Please try again.";
        if (error) {
          const errorCode = error.errorCode || error.code || "";
          const errorMessage = error.errorMessage || error.message || "";
          
          if (errorCode.includes("user_cancelled") || errorMessage.includes("user_cancelled") || errorMessage.includes("User cancelled")) {
            friendlyMessage = "Login cancelled by user.";
          } else if (errorCode.includes("popup_window_error") || errorMessage.includes("popup_window_error")) {
            friendlyMessage = "Popup blocked or closed. Please allow popups or wait for the redirect.";
          } else if (errorCode.includes("network_error") || errorMessage.includes("network")) {
            friendlyMessage = "Network error. Please check your internet connection and try again.";
          } else if (errorCode.includes("interaction_required") || errorCode.includes("login_required")) {
            friendlyMessage = "Session expired. Please log in again.";
          } else if (errorCode.includes("access_denied") || errorMessage.includes("access_denied")) {
            friendlyMessage = "Access denied. You do not have permissions to access this application.";
          } else {
            friendlyMessage = `Microsoft authentication failed: ${errorMessage || errorCode}`;
          }
        }
        setAuthError(friendlyMessage);
      } else if (message.eventType === EventType.LOGIN_SUCCESS || message.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
        setAuthError(null);
      }
    });
    
    return () => {
      if (callbackId) {
        instance.removeEventCallback(callbackId);
      }
    };
  }, [instance]);

  // Listen to Firebase Auth state transitions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[AuthContext] Firebase User detected:", firebaseUser.email);
        const uid = firebaseUser.uid;
        const email = firebaseUser.email;
        const displayName = firebaseUser.displayName || email?.split("@")[0] || "Google User";
        const photoURL = firebaseUser.photoURL || null;

        const googleUser = {
          uid,
          email,
          displayName,
          photoURL,
          provider: "google",
          companionDisplayName: localStorage.getItem("companionName_" + uid) || null,
        };

        // Fetch Firestore profile to resolve custom display name and photoURL
        try {
          const userDocRef = doc(db, "users", uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            googleUser.displayName = data.displayName || displayName;
            googleUser.photoURL = data.photoURL || photoURL;
            if (data.companionDisplayName) {
              googleUser.companionDisplayName = data.companionDisplayName;
              localStorage.setItem("companionName_" + uid, data.companionDisplayName);
            }
            
            console.log("[AuthContext] Google user document exists, updating lastLogin.");
            await setDoc(userDocRef, {
              lastLogin: serverTimestamp(),
            }, { merge: true });
          } else {
            console.log("[AuthContext] Creating new Firestore Google user document.");
            await setDoc(userDocRef, {
              displayName: googleUser.displayName,
              email: googleUser.email,
              photoURL: googleUser.photoURL,
              provider: "google",
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn("[AuthContext] Firestore Google profile load/create failed:", err);
        }

        setCurrentUser(googleUser);
      } else {
        // Only set to null if current active session is not Microsoft
        setCurrentUser((prev) => (prev && prev.provider === "microsoft" ? prev : null));
      }
      setFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync MSAL accounts to Context State and load details (custom display names, photos)
  useEffect(() => {
    const syncUser = async () => {
      const activeAccount = instance.getActiveAccount() || accounts[0];
      if (activeAccount) {
        const uid = activeAccount.localAccountId || activeAccount.homeAccountId;
        const email = activeAccount.username;
        const defaultName = activeAccount.name || email?.split("@")[0] || "Microsoft User";

        // 1. Establish initial state
        const initialUser = {
          uid,
          email,
          displayName: defaultName,
          photoURL: null,
          provider: "microsoft",
          companionDisplayName: localStorage.getItem("companionName_" + uid) || null,
        };

        // 2. Fetch from Firestore to resolve existing display name and profile image cache
        try {
          const userDocRef = doc(db, "users", uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            initialUser.displayName = data.displayName || defaultName;
            initialUser.photoURL = data.photoURL || null;
            if (data.companionDisplayName) {
              initialUser.companionDisplayName = data.companionDisplayName;
              localStorage.setItem("companionName_" + uid, data.companionDisplayName);
            }
            
            console.log("[AuthContext] Updating Microsoft user lastLogin.");
            await setDoc(userDocRef, {
              lastLogin: serverTimestamp(),
            }, { merge: true });
          }
        } catch (err) {
          console.warn("[AuthContext] Firestore profile load skipped/failed:", err);
        }

        // Set initial state immediately to avoid UI blocking
        setCurrentUser({ ...initialUser });

        // 3. Silently get token and try fetching profile photo from Microsoft Graph API
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: activeAccount,
          }).catch(async (silentError) => {
            console.warn("[AuthContext] Silent token acquisition failed. Photo fetch skipped.", silentError);
            return null;
          });

          if (tokenResponse && tokenResponse.accessToken) {
            console.log("[AuthContext] Fetching profile picture from Microsoft Graph...");
            const photoResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
              headers: {
                Authorization: `Bearer ${tokenResponse.accessToken}`,
              },
            });

            if (photoResponse.ok) {
              const blob = await photoResponse.blob();
              const base64Photo = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });

              if (base64Photo !== initialUser.photoURL) {
                console.log("[AuthContext] Microsoft Graph photo retrieved successfully.");
                initialUser.photoURL = base64Photo;
                setCurrentUser({ ...initialUser });
              }
            } else {
              console.log("[AuthContext] No photo found on Microsoft Graph (HTTP " + photoResponse.status + ")");
            }
          }
        } catch (graphError) {
          console.warn("[AuthContext] Microsoft Graph request error:", graphError);
        }
      } else {
        // Only set to null if current active session is not Google
        setCurrentUser((prev) => (prev && prev.provider === "google" ? prev : null));
      }

      if (inProgress === "none") {
        setLoading(false);
      }
    };

    syncUser();
  }, [accounts, instance, inProgress]);

  // Sync user profile changes back to Firestore (with change checks to optimize database writes)
  useEffect(() => {
    const syncUserToFirestore = async () => {
      // ONLY sync automatically for Microsoft users
      if (currentUser && currentUser.provider === "microsoft") {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          const profileData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            provider: "microsoft",
          };
          if (currentUser.photoURL) {
            profileData.photoURL = currentUser.photoURL;
          }

          if (!userDoc.exists()) {
            console.log("[AuthContext] Creating new Firestore user profile document.");
            await setDoc(userDocRef, {
              ...profileData,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          } else {
            const existingData = userDoc.data();
            const hasChanged =
              existingData.displayName !== profileData.displayName ||
              existingData.email !== profileData.email ||
              existingData.photoURL !== profileData.photoURL;

            if (hasChanged) {
              console.log("[AuthContext] Updating changed Firestore user profile properties.");
              await setDoc(userDocRef, {
                ...profileData,
                updatedAt: serverTimestamp(),
              }, { merge: true });
            }
          }
        } catch (error) {
          console.error("[AuthContext] Firestore sync error:", error);
        }
      }
    };
    syncUserToFirestore();
  }, [currentUser]);

  const login = async () => {
    try {
      setAuthError(null);
      console.log("[AuthContext] Triggering loginRedirect()");
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("[AuthContext] loginRedirect failed:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      console.log("[AuthContext] Triggering Google PopUp...");
      const result = await signInWithPopup(auth, provider);
      
      const user = result.user;
      console.log("[AuthContext] Google PopUp completed successfully, user:", user.email);
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let companionDisplayName = localStorage.getItem("companionName_" + user.uid) || null;
      if (userDoc.exists()) {
        console.log("[AuthContext] Google user document exists, updating lastLogin.");
        const data = userDoc.data();
        if (data.companionDisplayName) {
          companionDisplayName = data.companionDisplayName;
          localStorage.setItem("companionName_" + user.uid, data.companionDisplayName);
        }
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp(),
        }, { merge: true });
      } else {
        console.log("[AuthContext] Creating new Firestore Google user document.");
        await setDoc(userDocRef, {
          displayName: user.displayName || user.email?.split("@")[0] || "Google User",
          email: user.email || "",
          photoURL: user.photoURL || "",
          provider: "google",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      }
      
      setCurrentUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "Google User",
        photoURL: user.photoURL || null,
        provider: "google",
        companionDisplayName,
      });
    } catch (error) {
      console.error("[AuthContext] Google Auth error:", error);
      let friendlyMessage = "Google authentication failed. Please try again.";
      if (error) {
        const errorCode = error.code || "";
        const errorMessage = error.message || "";
        
        if (errorCode === "auth/popup-closed-by-user") {
          friendlyMessage = "Login cancelled: popup closed by user.";
        } else if (errorCode === "auth/cancelled-popup-request") {
          friendlyMessage = "Login request cancelled.";
        } else if (errorCode === "auth/popup-blocked") {
          friendlyMessage = "Popup blocked. Please allow popups for this site.";
        } else if (errorCode === "auth/network-request-failed") {
          friendlyMessage = "Network error. Please check your internet connection.";
        } else {
          friendlyMessage = `Google authentication failed: ${errorMessage || errorCode}`;
        }
      }
      setAuthError(friendlyMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (currentUser && currentUser.provider === "google") {
        console.log("[AuthContext] Triggering Firebase signOut()");
        setCurrentUser(null);
        await firebaseSignOut(auth);
      } else {
        console.log("[AuthContext] Triggering MSAL logoutRedirect()");
        setCurrentUser(null);
        await instance.logoutRedirect({
          postLogoutRedirectUri: window.location.origin,
        });
      }
    } catch (error) {
      console.error("[AuthContext] logout error:", error);
    }
  };

  const updateUsername = async (displayName) => {
    setCurrentUser((prev) => (prev ? { ...prev, displayName } : null));
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { displayName, updatedAt: serverTimestamp() }, { merge: true });
        console.log("[AuthContext] Display name updated in Firestore.");
      } catch (error) {
        console.error("[AuthContext] Failed to update display name in Firestore:", error);
      }
    }
  };

  const updateCompanionDisplayName = async (companionDisplayName) => {
    setCurrentUser((prev) => (prev ? { ...prev, companionDisplayName } : null));
    
    if (currentUser) {
      localStorage.setItem(`companionName_${currentUser.uid}`, companionDisplayName);
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { companionDisplayName, updatedAt: serverTimestamp() }, { merge: true });
        console.log("[AuthContext] Companion display name updated in Firestore.");
      } catch (error) {
        console.error("[AuthContext] Failed to update companion display name in Firestore:", error);
      }
    }
  };

  const devMockLogin = () => {
    const mockUser = {
      uid: "dev_mock_user_123",
      email: "developer@example.com",
      displayName: "Developer User",
      photoURL: null,
      provider: "google",
      companionDisplayName: localStorage.getItem("companionName_dev_mock_user_123") || null,
    };
    setCurrentUser(mockUser);
  };

  const clearAuthError = () => setAuthError(null);

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading: loading || firebaseLoading,
        isAuthenticated,
        authError,
        clearAuthError,
        login,
        loginWithGoogle,
        logout,
        updateUsername,
        updateCompanionDisplayName,
        devMockLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}