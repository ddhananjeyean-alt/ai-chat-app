import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const updateUsername = async (displayName) => {
    if (!auth.currentUser) return;

    await updateProfile(auth.currentUser, {
      displayName,
    });

    // Refresh the user object immediately
    setCurrentUser({
      ...auth.currentUser,
      displayName,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        logout,
        updateUsername,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}