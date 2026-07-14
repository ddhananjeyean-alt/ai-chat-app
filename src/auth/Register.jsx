import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ByteIntro from "../companion/byte/ByteIntro";
import AuthBackground from "./AuthBackground";
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
import { motion, AnimatePresence } from "framer-motion";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { currentUser, login, loading: authLoading, isAuthenticated } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Transition States
  const [isExiting, setIsExiting] = useState(false);
  const [exitDest, setExitDest] = useState("");
  const registeredEmailRef = useRef("");

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      registeredEmailRef.current = currentUser.email || "";
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        setIsExiting(true);
        setExitDest("/login");
      }, 2000);
    }
  }, [isAuthenticated, currentUser]);

  const handleMicrosoftLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login();
    } catch (err) {
      console.error("[Register] Microsoft authentication login() error details:", err);
      if (err) {
        console.error("Firebase auth error code:", err.code);
        console.error("Firebase auth error message:", err.message);
        console.error("Firebase auth error customData:", err.customData);
        console.error("Firebase auth error stack:", err.stack);
      }

      let friendlyMessage = "Microsoft authentication failed. Please try again.";
      if (err && err.code) {
        if (err.code === "auth/popup-closed-by-user") {
          friendlyMessage = "Login cancelled (popup closed by user).";
        } else if (err.code === "auth/popup-blocked") {
          friendlyMessage = "Popup blocked by your browser. Please allow popups for this site.";
        } else if (err.code === "auth/invalid-credential") {
          friendlyMessage = "Authentication failed: Invalid credential. Please verify Azure App Registration Client Secret and configuration.";
        } else if (err.code === "auth/unauthorized-domain") {
          friendlyMessage = "Authentication failed: This domain is not authorized in Firebase Console settings.";
        } else if (err.code === "auth/network-request-failed") {
          friendlyMessage = "Network error. Please check your connection and try again.";
        } else if (err.code === "auth/operation-not-allowed") {
          friendlyMessage = "Authentication failed: Microsoft authentication is not enabled in Firebase Console.";
        } else if (err.code === "auth/account-exists-with-different-credential") {
          friendlyMessage = "Authentication failed: An account already exists with this email address using a different login method.";
        } else {
          friendlyMessage = `Microsoft authentication failed: ${err.message || "Unknown error"}`;
        }
        friendlyMessage += ` (${err.code})`;
      } else if (err) {
        friendlyMessage = `Microsoft authentication failed: ${err.message || err.toString()}`;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLoginClick = () => {
    setIsExiting(true);
    setExitDest("/login");
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
      x: exitDest === "/login" ? 120 : -120,
      scale: 0.95,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const isFormLoading = loading || authLoading;

  return (
    <AuthBackground customByte={<ByteIntro mode={success ? "success" : "register"} />}>
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate={isExiting ? "exit" : "animate"}
        onAnimationComplete={() => {
          if (isExiting && exitDest) {
            navigate(exitDest, {
              state: {
                email: success ? registeredEmailRef.current : "",
                direction: "backward",
              },
            });
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

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "clamp(10px, 2vh, 20px) 0",
                }}
              >
                {/* Beautiful Glowing SVG Checkmark */}
                <Box
                  sx={{
                    width: "clamp(56px, 8vh, 72px)",
                    height: "clamp(56px, 8vh, 72px)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "2px solid rgba(16, 185, 129, 0.4)",
                    boxShadow: "0 0 25px rgba(16, 185, 129, 0.3)",
                    mb: "clamp(16px, 2.5vh, 24px)",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: "clamp(32px, 4.5vh, 40px)", height: "clamp(32px, 4.5vh, 40px)" }}
                  >
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeDasharray="63"
                      initial={{ strokeDashoffset: 63 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M9 12l2 2 4-4"
                      strokeDasharray="15"
                      initial={{ strokeDashoffset: 15 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    fontFamily: '"Inter", sans-serif',
                    color: "#fff",
                    mb: 1.5,
                    fontSize: "clamp(1.2rem, 2.2vh, 1.5rem)",
                  }}
                >
                  Account Connected!
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255, 255, 255, 0.75)",
                    fontSize: "clamp(0.85rem, 1.5vh, 0.95rem)",
                    lineHeight: 1.6,
                    fontFamily: '"Inter", sans-serif',
                    maxWidth: 320,
                  }}
                >
                  Your Microsoft account was connected successfully.
                  <br />
                  Redirecting to login...
                </Typography>
              </motion.div>
            ) : (
              <motion.div key="form-screen">
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: "clamp(20px, 3vh, 32px)" }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                    style={{
                      width: "clamp(44px, 5.5vh, 54px)",
                      height: "clamp(44px, 5.5vh, 54px)",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg, #06b6d4 0%, #7c3aed 50%, #ec4899 100%)",
                      boxShadow: "0 0 25px rgba(124, 58, 237, 0.4)",
                      marginBottom: "clamp(10px, 1.5vh, 14px)",
                    }}
                  >
                    <AutoAwesomeRoundedIcon sx={{ color: "#fff", fontSize: "clamp(20px, 2.5vh, 24px)" }} />
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
                      fontSize: "clamp(1.3rem, 2.3vh, 1.7rem)",
                    }}
                  >
                    Create Account
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.45)",
                      fontSize: "clamp(0.75rem, 1.3vh, 0.85rem)",
                      textAlign: "center",
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Sign in with your Microsoft account.
                  </Typography>
                </Box>

                {error && (
                  <Box sx={{ mb: "clamp(12px, 1.8vh, 20px)" }}>
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

                <Box sx={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.6vh, 16px)" }}>
                  <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                    <Button
                      fullWidth
                      disabled={isFormLoading}
                      onClick={handleMicrosoftLogin}
                      disableElevation
                      sx={{
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

                <Box sx={{ textAlign: "center", mt: "clamp(14px, 2vh, 24px)" }}>
                  <Button
                    onClick={handleBackToLoginClick}
                    startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "clamp(16px, 1.8vh, 20px)" }} />}
                    sx={{
                      textTransform: "none",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "clamp(0.8rem, 1.4vh, 0.85rem)",
                      fontWeight: 500,
                      fontFamily: '"Inter", sans-serif',
                      transition: "all 0.2s",
                      "&:hover": {
                        color: "#c084fc",
                        background: "transparent",
                      },
                    }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
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