import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeEvents } from "./ThemeEvents";
import { useThemeContext } from "../../theme/ThemeContext";

export default function ThemeTransitionOverlay() {
  const { changeTheme } = useThemeContext();
  const [animating, setAnimating] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [targetTheme, setTargetTheme] = useState("light");
  const [phase, setPhase] = useState("idle"); // "idle", "buttonGlow", "expanding", "fading"

  useEffect(() => {
    const unsubTrigger = ThemeEvents.subscribe(ThemeEvents.TRIGGER, (detail) => {
      // Pre-capture target theme so we know which color wave to render
      if (detail && detail.targetTheme) {
        setTargetTheme(detail.targetTheme);
      }
    });

    const unsubPulseReached = ThemeEvents.subscribe("theme-pull:pulse-reached-top", () => {
      // Find the exact coordinates of the theme toggle button
      const themeButton = document.querySelector('[aria-label="Toggle theme"]');
      let coords = { x: window.innerWidth - 80, y: 56 };
      if (themeButton) {
        const rect = themeButton.getBoundingClientRect();
        coords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      setCenter(coords);
      setPhase("buttonGlow");
      setAnimating(true);
    });

    return () => {
      unsubTrigger();
      unsubPulseReached();
    };
  }, []);

  if (!animating) return null;

  const isToLight = targetTheme === "light";
  const glowColor = isToLight ? "rgba(254, 240, 138, 0.95)" : "rgba(121, 248, 255, 0.95)";
  const waveGradient = isToLight
    ? "radial-gradient(circle, rgba(255, 252, 240, 1) 0%, rgba(250, 246, 228, 0.95) 40%, rgba(238, 243, 248, 0.8) 70%, rgba(238, 243, 248, 0) 100%)"
    : "radial-gradient(circle, rgba(121, 248, 255, 1) 0%, rgba(99, 102, 241, 0.95) 40%, rgba(13, 15, 23, 0.8) 75%, rgba(13, 15, 23, 0) 100%)";

  const flashBg = isToLight ? "#EEF3F8" : "#0d0f17";

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 999999, // Render on top of everything
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* 1. Glass Shimmer Ambient Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "expanding" ? 0.35 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              inset: 0,
              background: isToLight
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
            }}
          />

          {/* 2. Phase 1: Button Glow Pulsing Halo */}
          {phase === "buttonGlow" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.6, 2.2, 1.4], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                setPhase("expanding");
              }}
              style={{
                position: "absolute",
                top: center.y - 45,
                left: center.x - 45,
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: glowColor,
                filter: "blur(8px)",
                zIndex: 10,
              }}
            />
          )}

          {/* 3. Phase 2: Expanding radial sweep */}
          {phase === "expanding" && (
            <motion.div
              initial={{ scale: 0, opacity: 0.15 }}
              animate={{ scale: 28, opacity: 1 }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1], // easeOutExpo
              }}
              onAnimationComplete={() => {
                // Change theme under the hood at peak expansion (opaque state)
                changeTheme(targetTheme);
                ThemeEvents.publish(ThemeEvents.THEME_CHANGED);
                
                // Transition to fade-out phase
                setPhase("fading");
              }}
              style={{
                position: "absolute",
                top: center.y - 80,
                left: center.x - 80,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: waveGradient,
                transformOrigin: "center center",
                zIndex: 5,
                filter: "blur(6px)",
              }}
            />
          )}

          {/* 4. Fullscreen color wash for morph protection */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "fading" ? 1 : 0 }}
            style={{
              position: "absolute",
              inset: 0,
              background: flashBg,
              zIndex: 1,
            }}
          />

          {/* 5. Phase 3: Smooth fade-out */}
          {phase === "fading" && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                setPhase("idle");
                setAnimating(false);
              }}
              style={{
                position: "absolute",
                inset: 0,
                background: flashBg,
                zIndex: 3,
              }}
            />
          )}
        </Box>
      )}
    </AnimatePresence>
  );
}
