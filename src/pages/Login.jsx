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

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Transition States
  const [isExiting, setIsExiting] = useState(false);
  const [exitDest, setExitDest] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { currentUser, login, loading: authLoading, isAuthenticated } = useAuth();

  // Redirection when authenticated
  useEffect(() => {
    console.log("[Login] Checking authentication state - isAuthenticated:", isAuthenticated);
    if (isAuthenticated && currentUser) {
      console.log("[Login] User authenticated. Exiting and redirecting to home page.");
      setIsExiting(true);
      setExitDest("/");
    }
  }, [isAuthenticated, currentUser]);

  const handleMicrosoftLogin = async () => {
    console.log("[Login] handleMicrosoftLogin flow active");
    setError("");
    setLoading(true);
    try {
      await login();
    } catch (err) {
      console.error("[Login] Microsoft login error details:", err);
      let friendlyMessage = "Microsoft login failed. Please try again.";
      
      if (err && err.errorCode) {
        if (err.errorCode === "user_cancelled") {
          friendlyMessage = "Login cancelled (popup closed by user).";
        } else if (err.errorCode === "popup_window_error") {
          friendlyMessage = "Popup blocked or closed. Please allow popups or wait for the redirect.";
        } else {
          friendlyMessage = `Microsoft login failed: ${err.errorMessage || err.message || err.errorCode}`;
        }
        friendlyMessage += ` (${err.errorCode})`;
      } else if (err) {
        friendlyMessage = `Microsoft login failed: ${err.message || err.toString()}`;
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
      x: exitDest === "/register" ? -120 : 120,
      scale: 0.95,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const isFormLoading = loading || authLoading;

  return (
    <AuthBackground customByte={<ByteIntro mode="login" />}>
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
              Sign in with your Microsoft account.
            </Typography>
          </Box>

          {error && (
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
                {error}
              </Alert>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 2.2vh, 20px)" }}>
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
                    color: "rgba(255,255,255,0.5)",
                    background:
                      "linear-gradient(90deg, rgba(6, 182, 212, 0.4) 0%, rgba(124, 58, 237, 0.4) 50%, rgba(236, 72, 153, 0.4) 100%)",
                  },
                }}
              >
                {isFormLoading ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Continue with Microsoft"
                )}
              </Button>
            </motion.div>
          </Box>

          <Box sx={{ textAlign: "center", mt: "clamp(20px, 3vh, 32px)" }}>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "clamp(0.75rem, 1.4vh, 0.85rem)", mb: "clamp(8px, 1.5vh, 12px)", fontFamily: '"Inter", sans-serif' }}>
              Don&apos;t have an account?
            </Typography>
            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button
                fullWidth
                onClick={() => {
                  setIsExiting(true);
                  setExitDest("/register");
                }}
                sx={{
                  py: "clamp(9px, 1.4vh, 12px)",
                  borderRadius: "14px",
                  fontWeight: 600,
                  fontSize: "clamp(0.8rem, 1.4vh, 0.875rem)",
                  textTransform: "none",
                  color: "#f3e8ff",
                  fontFamily: '"Inter", sans-serif',
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(167, 139, 250, 0.4)",
                    boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)",
                  },
                }}
              >
                Create an account
              </Button>
            </motion.div>
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
          Connecting to Microsoft...
        </Typography>
      </Backdrop>
    </AuthBackground>
  );
}
