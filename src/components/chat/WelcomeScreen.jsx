import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function WelcomeScreen({
  currentUser,
  darkMode = true,
}) {
  const firstName =
    currentUser?.displayName?.split(" ")[0] ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const waveTransition = {
    rotate: [0, 14, -8, 14, -4, 10, 0],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      repeatDelay: 1.5,
      ease: "easeInOut",
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "visible",
        flex: 1,
        mt: -4, // shift slightly upward to balance screen layout
      }}
    >
      {/* Floating Sparkle Icon Badge */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ marginBottom: 28, zIndex: 1 }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: darkMode ? "rgba(121, 248, 255, 0.06)" : "rgba(37, 99, 235, 0.06)",
            border: darkMode ? "1px solid rgba(121, 248, 255, 0.15)" : "1px solid rgba(37, 99, 235, 0.15)",
            boxShadow: darkMode ? "0 8px 32px rgba(121, 248, 255, 0.1)" : "0 8px 32px rgba(37, 99, 235, 0.1)",
          }}
        >
          <AutoAwesomeIcon
            sx={{
              fontSize: 20,
              color: darkMode ? "#79f8ff" : "#2563eb",
            }}
          />
        </Box>
      </motion.div>

      {/* Greeting Title Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
          delay: 0.1,
        }}
        style={{ zIndex: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Outfit, "Inter", sans-serif',
              fontWeight: 700,
              background: darkMode
                ? "linear-gradient(to right, #79f8ff 20%, #b892ff 80%)"
                : "linear-gradient(to right, #0f172a 20%, #2563eb 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
              letterSpacing: "-0.035em",
              fontSize: { xs: "2.4rem", sm: "3.2rem", md: "3.6rem" },
            }}
          >
            Hello, {firstName}
          </Typography>
          <motion.span
            animate={waveTransition}
            style={{
              display: "inline-block",
              transformOrigin: "bottom right",
              fontSize: "2.5rem",
              lineHeight: 1,
            }}
          >
            👋
          </motion.span>
        </Box>
      </motion.div>

      {/* Subtitle text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
          delay: 0.25,
        }}
        style={{ zIndex: 1 }}
      >
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
            fontWeight: 500,
            color: darkMode ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          How can I help you today?
        </Typography>
      </motion.div>
    </Box>
  );
}