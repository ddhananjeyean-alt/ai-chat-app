import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const blobTransition = (duration, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
});

const particles = Array.from({ length: 22 }).map((_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  duration: Math.random() * 10 + 10,
  delay: Math.random() * 6,
}));

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #050914 0%, #0a1128 35%, #0d1b3e 65%, #060a18 100%)",
        px: 2,
      }}
    >
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 20%, rgba(56,132,255,0.25), transparent 60%)",
            "radial-gradient(circle at 80% 30%, rgba(94,88,255,0.25), transparent 60%)",
            "radial-gradient(circle at 40% 80%, rgba(56,199,255,0.22), transparent 60%)",
            "radial-gradient(circle at 20% 20%, rgba(56,132,255,0.25), transparent 60%)",
          ],
        }}
        transition={blobTransition(18)}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />

      <motion.div
        aria-hidden="true"
        initial={{ x: -100, y: -60, scale: 1 }}
        animate={{ x: [-100, 60, -100], y: [-60, 40, -60], scale: [1, 1.15, 1] }}
        transition={blobTransition(16)}
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(69,120,255,0.55) 0%, rgba(69,120,255,0) 70%)",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />

      <motion.div
        aria-hidden="true"
        initial={{ x: 80, y: 60, scale: 1 }}
        animate={{ x: [80, -40, 80], y: [60, -30, 60], scale: [1, 1.2, 1] }}
        transition={blobTransition(20, 1)}
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(101,89,255,0.5) 0%, rgba(101,89,255,0) 70%)",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />

      <motion.div
        aria-hidden="true"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
        transition={blobTransition(14, 2)}
        style={{
          position: "absolute",
          top: "40%",
          left: "55%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56,199,255,0.35) 0%, rgba(56,199,255,0) 70%)",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          aria-hidden="true"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -40, 0] }}
          transition={blobTransition(p.duration, p.delay)}
          style={{
            position: "absolute",
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.8)",
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
            zIndex: 0,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        whileHover={{ y: -4 }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
        }}
      >
        <Paper
          component="form"
          onSubmit={handleLogin}
          elevation={0}
          sx={{
            width: "100%",
            p: isMobile ? 3.5 : 5,
            borderRadius: "28px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
            "&:hover": {
              boxShadow:
                "0 12px 48px rgba(56,132,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              style={{
                width: 64,
                height: 64,
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #4f7dff 0%, #7b5cff 50%, #3ac6ff 100%)",
                boxShadow: "0 0 30px rgba(90,110,255,0.55)",
                marginBottom: 20,
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ color: "#fff", fontSize: 32 }} />
            </motion.div>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
                textAlign: "center",
                background:
                  "linear-gradient(90deg, #ffffff 0%, #b9c9ff 50%, #8fb8ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                mb: 1,
                fontSize: isMobile ? "1.6rem" : "2rem",
              }}
            >
              AI Chat Assistant
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                textAlign: "center",
              }}
            >
              Welcome back
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              Sign in to continue
            </Typography>
          </Box>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "14px",
                    background: "rgba(255,70,70,0.12)",
                    color: "#ffb4b4",
                    border: "1px solid rgba(255,70,70,0.3)",
                    "& .MuiAlert-icon": { color: "#ff8080" },
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineRoundedIcon sx={{ color: "rgba(255,255,255,0.45)" }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: "rgba(255,255,255,0.45)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      <motion.div
                        key={showPassword ? "visible" : "hidden"}
                        initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "flex" }}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </motion.div>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />

            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                disableElevation
                sx={{
                  mt: 0.5,
                  py: 1.5,
                  borderRadius: "16px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "none",
                  color: "#fff",
                  background:
                    "linear-gradient(90deg, #4f7dff 0%, #7b5cff 50%, #3ac6ff 100%)",
                  backgroundSize: "200% 100%",
                  boxShadow: "0 4px 24px rgba(90,110,255,0.45)",
                  transition: "background-position 0.5s ease, box-shadow 0.3s ease, transform 0.2s ease",
                  "&:hover": {
                    backgroundPosition: "100% 0",
                    boxShadow: "0 6px 32px rgba(90,110,255,0.65)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.7)",
                    background:
                      "linear-gradient(90deg, rgba(79,125,255,0.5) 0%, rgba(123,92,255,0.5) 50%, rgba(58,198,255,0.5) 100%)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Sign in"
                )}
              </Button>
            </motion.div>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 3.5 }}>
            <Divider sx={{ flex: 1, borderColor: "rgba(255,255,255,0.12)" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
              OR
            </Typography>
            <Divider sx={{ flex: 1, borderColor: "rgba(255,255,255,0.12)" }} />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", mb: 1.5 }}>
              Don&apos;t have an account?
            </Typography>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                onClick={() => navigate("/register")}
                sx={{
                  py: 1.3,
                  borderRadius: "16px",
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#e6ecff",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.04)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(120,150,255,0.5)",
                    boxShadow: "0 0 24px rgba(90,110,255,0.25)",
                  },
                }}
              >
                Create an account
              </Button>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    transition: "box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.14)",
      transition: "border-color 0.3s ease",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.28)",
    },
    "&:hover": {
      background: "rgba(255,255,255,0.07)",
    },
    "&.Mui-focused": {
      background: "rgba(255,255,255,0.08)",
      boxShadow: "0 0 0 4px rgba(90,130,255,0.18)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6d8dff",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.5)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#8fb0ff",
  },
  "& .MuiInputBase-input": {
    color: "#fff",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(255,255,255,0.35)",
    opacity: 1,
  },
};
