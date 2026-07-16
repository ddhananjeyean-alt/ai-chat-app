import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ByteIntro from "../companion/byte/ByteIntro";
import AuthBackground from "../auth/AuthBackground";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
  Backdrop,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useAuth } from "../context/AuthContext";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px', display: 'block' }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authProvider, setAuthProvider] = useState("");
  const [loginSuccessful, setLoginSuccessful] = useState(false);

  // Transition States
  const [isExiting, setIsExiting] = useState(false);
  const [exitDest, setExitDest] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    currentUser,
    login,
    loginWithGoogle,
    loading: authLoading,
    isAuthenticated,
    authError,
    clearAuthError,
    devMockLogin,
  } = useAuth();

  // Sync authentication failures to local UI
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Redirection when authenticated
  useEffect(() => {
    console.log("[Login] Checking authentication state - isAuthenticated:", isAuthenticated);
    if (isAuthenticated && currentUser) {
      console.log("[Login] User authenticated. Playing greeting animation and exiting.");
      setLoginSuccessful(true);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setExitDest("/");
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser]);

  const handleMicrosoftLogin = async () => {
    console.log("[Login] handleMicrosoftLogin flow active");
    setError("");
    clearAuthError();
    setAuthProvider("Microsoft");
    setLoading(true);
    try {
      await login();
    } catch (err) {
      console.error("[Login] Microsoft login redirect error:", err);
      let friendlyMessage = "Microsoft login failed. Please try again.";
      if (err) {
        friendlyMessage = `Microsoft login failed: ${err.message || err.toString()}`;
      }
      setError(friendlyMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("[Login] handleGoogleLogin flow active");
    setError("");
    clearAuthError();
    setAuthProvider("Google");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("[Login] Google login popup error:", err);
      let friendlyMessage = "Google login failed. Please try again.";
      if (err) {
        // AuthContext maps standard errors, fallback to err.message / friendly representation
        friendlyMessage = err.message || err.toString();
        if (err.code === "auth/popup-closed-by-user") {
          friendlyMessage = "Login cancelled: popup closed by user.";
        } else if (err.code === "auth/popup-blocked") {
          friendlyMessage = "Popup blocked. Please allow popups for this site.";
        } else if (err.code === "auth/network-request-failed") {
          friendlyMessage = "Network error. Please check your internet connection.";
        }
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const direction = location.state?.direction || "forward";

  const cardVariants = {
    initial: {
      opacity: 0,
      x: direction === "backward" ? -120 : 120,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      x: 120,
      scale: 0.95,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const isFormLoading = loading || authLoading;
  const displayError = error || authError;

  return (
    <AuthBackground customByte={<ByteIntro mode={loginSuccessful ? "login_success" : "login"} />}>
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate={isExiting ? "exit" : "animate"}
        onAnimationComplete={() => {
          if (isExiting && exitDest) {
            console.log("[Login] Animation complete. Navigating to:", exitDest);
            navigate(exitDest, { state: { direction: "forward" } });
          }
        }}
        style={{
          width: "100%",
        }}
      >
        <Paper
          component="div"
          elevation={0}
          sx={{
            width: "100%",
            p: isMobile ? 3.5 : "clamp(24px, 4.5vh, 40px)",
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(15, 18, 36, 0.6) 0%, rgba(8, 10, 20, 0.45) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top Decorative Light Accent Glow */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), rgba(139, 92, 246, 0.5), transparent)",
              zIndex: 2,
            }}
          />

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: "clamp(20px, 3vh, 32px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              style={{
                width: "clamp(48px, 6vh, 60px)",
                height: "clamp(48px, 6vh, 60px)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #06b6d4 0%, #7c3aed 50%, #ec4899 100%)",
                boxShadow: "0 0 25px rgba(124, 58, 237, 0.5)",
                marginBottom: "clamp(12px, 1.8vh, 16px)",
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ color: "#fff", fontSize: "clamp(22px, 3vh, 28px)" }} />
            </motion.div>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                textAlign: "center",
                fontFamily: '"Inter", sans-serif',
                background:
                  "linear-gradient(90deg, #ffffff 0%, #d8b4fe 50%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                mb: 0.5,
                fontSize: "clamp(1.4rem, 2.5vh, 1.8rem)",
              }}
            >
              AI Chat Assistant
            </Typography>

            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontWeight: 600,
                fontSize: "clamp(0.85rem, 1.6vh, 0.95rem)",
                textAlign: "center",
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Welcome
            </Typography>
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: "clamp(0.75rem, 1.4vh, 0.825rem)",
                textAlign: "center",
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Sign in with your Microsoft or Google account.
            </Typography>
          </Box>

          {displayError && (
            <Box sx={{ mb: 2 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: "14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  fontFamily: '"Inter", sans-serif',
                  "& .MuiAlert-icon": { color: "#ef4444" },
                }}
              >
                {displayError}
              </Alert>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.8vh, 16px)" }}>
            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button
                fullWidth
                disabled={isFormLoading}
                onClick={handleMicrosoftLogin}
                disableElevation
                sx={{
                  mt: 0.5,
                  py: "clamp(10px, 1.6vh, 14px)",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "clamp(0.85rem, 1.6vh, 0.95rem)",
                  textTransform: "none",
                  color: "#fff",
                  fontFamily: '"Inter", sans-serif',
                  background:
                    "linear-gradient(90deg, #06b6d4 0%, #7c3aed 50%, #ec4899 100%)",
                  backgroundSize: "200% 100%",
                  boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
                  transition: "all 0.4s ease",
                  "&:hover": {
                    backgroundPosition: "100% 0",
                    boxShadow: "0 6px 28px rgba(124, 58, 237, 0.55)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,0.5)",
                    background:
                      "linear-gradient(90deg, rgba(6, 182, 212, 0.4) 0%, rgba(124, 58, 237, 0.4) 50%, rgba(236, 72, 153, 0.4) 100%)",
                  },
                }}
              >
                {isFormLoading && authProvider === "Microsoft" ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Continue with Microsoft"
                )}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button
                fullWidth
                disabled={isFormLoading}
                onClick={handleGoogleLogin}
                disableElevation
                startIcon={<GoogleIcon />}
                sx={{
                  py: "clamp(10px, 1.6vh, 14px)",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "clamp(0.85rem, 1.6vh, 0.95rem)",
                  textTransform: "none",
                  color: "#fff",
                  fontFamily: '"Inter", sans-serif',
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 6px 28px rgba(255, 255, 255, 0.12)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,0.3)",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                {isFormLoading && authProvider === "Google" ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Continue with Google"
                )}
              </Button>
            </motion.div>

            {new URLSearchParams(window.location.search).get("dev_login") === "true" && (
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                <Button
                  fullWidth
                  onClick={devMockLogin}
                  sx={{
                    py: "clamp(10px, 1.6vh, 14px)",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "clamp(0.85rem, 1.6vh, 0.95rem)",
                    textTransform: "none",
                    color: "#fff",
                    fontFamily: '"Inter", sans-serif',
                    background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "linear-gradient(90deg, #10b981 20%, #059669 80%)",
                      boxShadow: "0 6px 28px rgba(16, 185, 129, 0.45)",
                    },
                  }}
                >
                  Dev Mock Login
                </Button>
              </motion.div>
            )}
          </Box>


        </Paper>
      </motion.div>

      <Backdrop
        sx={(theme) => ({ 
          color: "#fff", 
          zIndex: theme.zIndex.drawer + 1,
          background: "rgba(9, 10, 15, 0.85)",
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
          gap: 2
        })}
        open={isFormLoading}
      >
        <CircularProgress sx={{ color: "#7c3aed" }} />
        <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.85)", fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
          {authProvider ? `Connecting to ${authProvider}...` : "Connecting..."}
        </Typography>
      </Backdrop>
    </AuthBackground>
  );
}

