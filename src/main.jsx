import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Fonts
import "@fontsource/inter";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

// Material UI Theme
import {
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
} from "@mui/material";

import { ThemeProvider, useThemeContext } from "./theme/ThemeContext";

// Authentication
import { AuthProvider } from "./context/AuthContext";
import { ByteProvider } from "./context/ByteContext";
import { msalInstance } from "./auth/msalInstance";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import App from "./App";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./auth/Register";
import SharedChat from "./pages/SharedChat";

function AppWithTheme() {
  const { currentTheme } = useThemeContext();

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline />

      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected AI Chat */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Public Shared Chat */}
        <Route path="/share/:id" element={<SharedChat />} />
      </Routes>
    </MuiThemeProvider>
  );
}

// Initialize MSAL before rendering the application (Required by MSAL Browser v3)
msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <ByteProvider>
              <ThemeProvider>
                <AppWithTheme />
              </ThemeProvider>
            </ByteProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}).catch((error) => {
  console.error("Failed to initialize MSAL instance:", error);
});
