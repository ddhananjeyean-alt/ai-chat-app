import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

const blobTransition = (duration, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
});

const stars = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1.2,
  top: Math.random() * 100,
  left: Math.random() * 100,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 5,
}));

export default function AuthBackground({ children, customByte }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflowY: "auto", // Root container handles vertical scrolling
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        // Responsive padding to clear fixed Byte on mobile and prevent sticking to screen edges
        pt: { xs: "280px", md: 6 },
        pb: 6,
        px: 2,
      }}
    >
      {/* 1. FIXED GALAXY BACKGROUND */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at bottom, #090a16 0%, #030308 100%)",
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {/* Drifting Nebula 1 (Cyan) */}
        <motion.div
          animate={{
            x: [-50, 50, -50],
            y: [-30, 30, -30],
            scale: [1, 1.15, 1],
          }}
          transition={blobTransition(22)}
          style={{
            position: "absolute",
            top: "10%",
            left: "15%",
            width: "50vw",
            height: "50vw",
            maxWidth: 600,
            maxHeight: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(6, 182, 212, 0) 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Drifting Nebula 2 (Purple) */}
        <motion.div
          animate={{
            x: [50, -50, 50],
            y: [30, -30, 30],
            scale: [1.1, 0.95, 1.1],
          }}
          transition={blobTransition(26, 2)}
          style={{
            position: "absolute",
            bottom: "15%",
            right: "10%",
            width: "55vw",
            height: "55vw",
            maxWidth: 650,
            maxHeight: 650,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, rgba(139, 92, 246, 0) 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        {/* Drifting Nebula 3 (Pink Glow Accent) */}
        <motion.div
          animate={{
            x: [-20, 40, -20],
            y: [40, -20, 40],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={blobTransition(18, 4)}
          style={{
            position: "absolute",
            top: "45%",
            left: "40%",
            width: "35vw",
            height: "35vw",
            maxWidth: 400,
            maxHeight: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0) 70%)",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />

        {/* Soft Floating Twinkling Stars */}
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 0.1, scale: 0.8 }}
            animate={{
              opacity: [0.15, 0.85, 0.15],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: star.size,
              height: star.size,
              borderRadius: "50%",
              backgroundColor: "#fff",
              boxShadow: "0 0 8px 1px rgba(255, 255, 255, 0.8)",
              pointerEvents: "none",
            }}
          />
        ))}
      </Box>

      {/* 2. FIXED / FLOATING BYTE ASSISTANT */}
      {customByte && (
        <Box
          sx={{
            position: "fixed",
            zIndex: 10,
            pointerEvents: "none",
            "& *": {
              pointerEvents: "auto",
            },
            // Fixed relative to viewport, does not scroll with form content
            bottom: { xs: "auto", md: "auto" },
            top: { xs: "12px", md: "15vh" },
            left: { xs: "50%", md: "auto" },
            right: { xs: "auto", md: "calc(50% + 230px)" },
            transform: { xs: "translateX(-50%)", md: "none" },
          }}
        >
          {customByte}
        </Box>
      )}

      {/* 3. CARD CONTENT */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
