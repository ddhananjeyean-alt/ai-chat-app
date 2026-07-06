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
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import App from "./App";
import Home from "./pages/Home";
import Login from "./auth/Login";
import Register from "./auth/Register";
import SharedChat from "./pages/SharedChat";

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppWithTheme />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);