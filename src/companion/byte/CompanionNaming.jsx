import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useByte } from "../../context/ByteContext";

// Background configuration matching AuthBackground
const blobTransition = (duration, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
});

const starsList = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1.2,
  top: Math.random() * 100,
  left: Math.random() * 100,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 5,
}));

export default function CompanionNaming({
  isDialog = false,
  onComplete,
  onCancel,
  onClose,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [name, setName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Byte robot state machine states
  const [robotState, setRobotState] = useState("float");
  const [expression, setExpression] = useState("happy");
  const [gesture, setGesture] = useState("none");
  const [tilt, setTilt] = useState(0);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });

  // Bubble speech states
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);

  // Celebration states
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [glowActive, setGlowActive] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [jumpActive, setJumpActive] = useState(false);

  const {
    setNamingActive,
    setNamingPlaceholderPos,
    setNamingRobotState,
    setNamingExpression,
    setNamingGesture,
    setNamingTilt,
    setNamingLookOffset,
    setNamingJumpActive,
  } = useByte();

  const dialogPlaceholderRef = useRef(null);
  const loginPlaceholderRef = useRef(null);
  
  const [isStartingFromLogin, setIsStartingFromLogin] = useState(!isDialog);
  const [isReturningToLogin, setIsReturningToLogin] = useState(false);
  
  const bubbleRef = useRef(null);
  const [bubblePosition, setBubblePosition] = useState({ left: 0, top: 0, arrowLeft: 0, placement: "top" });

  const updateBubblePosition = useCallback(() => {
    if (!dialogPlaceholderRef.current) return;
    
    let targetRef = dialogPlaceholderRef;
    if (!isDialog && (isReturningToLogin || isStartingFromLogin)) {
      targetRef = loginPlaceholderRef;
    }

    if (targetRef && targetRef.current) {
      const robotRect = targetRef.current.getBoundingClientRect();
      const robotCenterX = robotRect.left + robotRect.width / 2;
      
      const bubbleWidth = bubbleRef.current ? bubbleRef.current.offsetWidth : 220;
      const bubbleHeight = bubbleRef.current ? bubbleRef.current.offsetHeight : 60;
      
      const padding = 12;
      
      const minLeft = padding;
      const maxLeft = window.innerWidth - bubbleWidth - padding;
      const targetLeft = robotCenterX - bubbleWidth / 2;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));
      
      const targetArrowLeft = robotCenterX - clampedLeft;
      const clampedArrowLeft = Math.max(16, Math.min(bubbleWidth - 16, targetArrowLeft));
      
      let placement = "top";
      let targetTop = robotRect.top - bubbleHeight - 12;
      
      if (targetTop < padding) {
        placement = "bottom";
        targetTop = robotRect.bottom + 12;
      }
      
      setBubblePosition({
        left: clampedLeft,
        top: targetTop,
        arrowLeft: clampedArrowLeft,
        placement,
      });
    }
  }, [isDialog, isStartingFromLogin, isReturningToLogin]);

  useEffect(() => {
    if (bubbleVisible && bubbleText) {
      updateBubblePosition();
      window.addEventListener("resize", updateBubblePosition);
      window.addEventListener("scroll", updateBubblePosition);
      
      let frameId;
      const tick = () => {
        updateBubblePosition();
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);

      return () => {
        window.removeEventListener("resize", updateBubblePosition);
        window.removeEventListener("scroll", updateBubblePosition);
        cancelAnimationFrame(frameId);
      };
    }
  }, [bubbleVisible, bubbleText, updateBubblePosition]);

  const updatePlaceholderPosition = useCallback(() => {
    let targetRef = dialogPlaceholderRef;
    if (!isDialog && (isReturningToLogin || isStartingFromLogin)) {
      targetRef = loginPlaceholderRef;
    }
    
    if (targetRef && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setNamingPlaceholderPos({
        x: rect.left,
        y: rect.top,
      });
    }
  }, [isDialog, isStartingFromLogin, isReturningToLogin, setNamingPlaceholderPos]);

  useEffect(() => {
    updatePlaceholderPosition();
    window.addEventListener("resize", updatePlaceholderPosition);
    
    let frameId;
    const tick = () => {
      updatePlaceholderPosition();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", updatePlaceholderPosition);
      cancelAnimationFrame(frameId);
    };
  }, [updatePlaceholderPosition]);

  useEffect(() => {
    setNamingActive(true);
    if (!isDialog) {
      setIsStartingFromLogin(true);
      const timer = setTimeout(() => {
        setIsStartingFromLogin(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsStartingFromLogin(false);
    }
  }, [isDialog, setNamingActive]);

  useEffect(() => {
    setNamingRobotState(robotState);
  }, [robotState, setNamingRobotState]);

  useEffect(() => {
    setNamingExpression(expression);
  }, [expression, setNamingExpression]);

  useEffect(() => {
    setNamingGesture(gesture);
  }, [gesture, setNamingGesture]);

  useEffect(() => {
    setNamingTilt(tilt);
  }, [tilt, setNamingTilt]);

  useEffect(() => {
    setNamingLookOffset(lookOffset);
  }, [lookOffset, setNamingLookOffset]);

  useEffect(() => {
    setNamingJumpActive(jumpActive);
  }, [jumpActive, setNamingJumpActive]);

  // Entrance & Idle Loop
  useEffect(() => {
    // 1. Entrance Wave & speech
    setRobotState("float");
    setExpression("happy");
    setGesture("wave");
    setBubbleText("I've been waiting for my new name!");
    setBubbleVisible(true);

    const waveTimer = setTimeout(() => {
      setGesture("none");
    }, 2000);

    // 2. Head tilt and blink loop (idle animation every few seconds)
    const idleInterval = setInterval(() => {
      if (isCelebrating || isTyping) return;

      const rand = Math.random();
      if (rand < 0.4) {
        // Head tilt
        setTilt((prev) => (prev === 0 ? (Math.random() > 0.5 ? 8 : -8) : 0));
        setTimeout(() => setTilt(0), 1500);
      } else {
        // Blink
        setExpression("blink");
        setTimeout(() => {
          if (!isCelebrating && !isTyping) setExpression("happy");
        }, 150);
      }
    }, 3500);

    return () => {
      clearTimeout(waveTimer);
      clearInterval(idleInterval);
    };
  }, [isCelebrating, isTyping]);

  // Handle typing input
  const handleInputChange = (e) => {
    const val = e.target.value.slice(0, 20); // strict 20 characters limit
    setName(val);

    // Close the initial greeting bubble once typing starts
    if (bubbleVisible && bubbleText === "I've been waiting for my new name!") {
      setBubbleVisible(false);
    }

    // Byte watches input
    setIsTyping(true);
    setExpression("focused");
    setLookOffset({ x: 0, y: 8 }); // Look down towards the input box

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Typing stops, Byte smiles
      setIsTyping(false);
      setExpression("happy");
      setLookOffset({ x: 0, y: 0 });
    }, 850);
  };

  const handleInputBlur = () => {
    setIsTyping(false);
    setExpression("happy");
    setLookOffset({ x: 0, y: 0 });
  };

  // Launch celebration confetti and eye sparkles
  const launchCelebrationParticles = () => {
    const colors = ["#79f8ff", "#00d8ff", "#a78bfa", "#f472b6", "#60a5fa", "#10B981"];
    
    // Confetti spray
    const confList = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: 0,
      y: -30,
      color: colors[Math.floor(Math.random() * colors.length)],
      dx: (Math.random() - 0.5) * 280,
      dy: -120 - Math.random() * 220,
      scale: 0.4 + Math.random() * 0.9,
      rotate: Math.random() * 360,
    }));
    setConfetti(confList);

    // Eye sparkles
    const sparkList = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 60,
      y: -60 + (Math.random() - 0.5) * 20,
      dx: (Math.random() - 0.5) * 80,
      dy: -40 - Math.random() * 60,
      scale: 0.6 + Math.random() * 0.8,
    }));
    setSparkles(sparkList);
  };

  // Save Name Flow
  const handleSave = async (finalName) => {
    if (isCelebrating) return;
    setIsCelebrating(true);

    const companionName = finalName.trim() || "My Companion";

    // Jump, confetti, sparkles, and blue pulse glow
    setJumpActive(true);
    launchCelebrationParticles();
    setGlowActive(true);
    setRobotState("happy");
    setExpression("happy");
    setGesture("none");

    // Speech: "I love it!"
    setBubbleText("I love it!");
    setBubbleVisible(true);

    // Timed sequence
    await new Promise((res) => setTimeout(res, 1300));
    setJumpActive(false);
    setBubbleText(`My new name is ${companionName}!`);

    await new Promise((res) => setTimeout(res, 1500));
    setBubbleText("Let's get started!");

    await new Promise((res) => setTimeout(res, 1300));
    setBubbleVisible(false);
    setGlowActive(false);

    // Slide-out/Return to Login page animation before completing (only for onboarding naming dialog)
    if (!isDialog) {
      setIsReturningToLogin(true);
      await new Promise((res) => setTimeout(res, 600)); // wait for slide transition to finish
    }

    setNamingActive(false);
    setNamingPlaceholderPos(null);

    // Fade out transition and complete
    if (onComplete) {
      onComplete(companionName);
    }
  };

  const handleSkip = () => {
    handleSave("My Companion");
  };

  const handleCancelAction = () => {
    setNamingActive(false);
    setNamingPlaceholderPos(null);
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  // Render Inner Card Form Elements
  const renderCardContent = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Robot overlapping container */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: "-100px", md: "50%" }, // Center vertically on desktop (md and up), top overlap on mobile
          left: { xs: "50%", md: "calc(100% + 24px)" }, // Center horizontally on mobile, right side on desktop
          transform: { xs: "translateX(-50%)", md: "translateY(-50%)" },
          width: 110,
          height: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* Holographic Glowing Pulse Base behind robot */}
        <AnimatePresence>
          {glowActive && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.8, 1.5, 1.2], opacity: [0.2, 0.85, 0.35] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, repeatType: "mirror" }}
              style={{
                position: "absolute",
                width: 120, // Reduced from 200
                height: 120, // Reduced from 200
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(121, 248, 255, 0.45) 0%, rgba(59, 130, 246, 0) 70%)",
                filter: "blur(22px)",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>

        {/* Confetti Particles */}
        {confetti.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 0.1, rotate: 0 }}
            animate={{
              x: p.x + p.dx,
              y: p.y + p.dy + 380,
              opacity: [1, 1, 0],
              scale: p.scale,
              rotate: p.rotate + 360,
            }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              background: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              boxShadow: `0 0 6px ${p.color}`,
              zIndex: 15,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Eye Sparkles */}
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            initial={{ x: s.x, y: s.y, opacity: 1, scale: 0.1 }}
            animate={{
              x: s.x + s.dx,
              y: s.y + s.dy,
              opacity: [1, 0.9, 0],
              scale: s.scale,
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: "absolute",
              fontSize: "14px",
              color: "#79f8ff",
              textShadow: "0 0 8px #79f8ff",
              zIndex: 16,
              pointerEvents: "none",
            }}
          >
            ✦
          </motion.div>
        ))}

        {/* Tracking Placeholder for the dialog position (where the robot should sit) */}
        <Box
          ref={dialogPlaceholderRef}
          sx={{
            width: 95,
            height: 95,
            zIndex: 5,
            visibility: "hidden",
            pointerEvents: "none",
          }}
        />

        {/* Speech Bubble */}
        <AnimatePresence>
          {bubbleVisible && bubbleText && (
            <motion.div
              ref={bubbleRef}
              initial={{ scale: 0.85, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 350, damping: 15 }}
              style={{
                position: "fixed",
                left: bubblePosition.left,
                top: bubblePosition.top,
                width: "max-content",
                maxWidth: "240px",
                background: "rgba(10, 15, 30, 0.85)",
                border: "1px solid rgba(121, 248, 255, 0.25)",
                borderRadius: "18px",
                padding: "10px 16px",
                boxShadow: "0 8px 32px rgba(0, 242, 254, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                color: "#ffffff",
                textAlign: "center",
                zIndex: 2000001,
                backdropFilter: "blur(8px)",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                pointerEvents: "none",
              }}
            >
              {bubbleText}
              <Box
                sx={{
                  position: "absolute",
                  left: bubblePosition.arrowLeft,
                  transform: "translateX(-50%) rotate(45deg)",
                  width: 10,
                  height: 10,
                  background: "rgba(10, 15, 30, 0.85)",
                  ...(bubblePosition.placement === "top"
                    ? {
                        bottom: -5,
                        borderRight: "1px solid rgba(121, 248, 255, 0.25)",
                        borderBottom: "1px solid rgba(121, 248, 255, 0.25)",
                      }
                    : {
                        top: -5,
                        borderLeft: "1px solid rgba(121, 248, 255, 0.25)",
                        borderTop: "1px solid rgba(121, 248, 255, 0.25)",
                      }),
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Title */}
      <Typography
        variant="h4"
        component={motion.h4}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        sx={{
          fontWeight: 800,
          fontFamily: "Outfit, sans-serif",
          letterSpacing: "-0.03em",
          background: "linear-gradient(90deg, #ffffff 0%, #d8b4fe 50%, #818cf8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          mb: 1.5,
          textAlign: "center",
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "1.9rem" },
        }}
      >
        Give your AI Companion a Name
      </Typography>

      {/* Subtitle */}
      <Typography
        component={motion.p}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        sx={{
          color: "rgba(255, 255, 255, 0.55)",
          fontFamily: "Inter, sans-serif",
          fontSize: "13.5px",
          mb: 2.5, // Reduced from 4
          textAlign: "center",
          maxWidth: "380px",
          lineHeight: 1.5,
        }}
      >
        This is the name your AI companion will use when talking with you.
      </Typography>

      {/* Premium Input */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        sx={{ width: "100%", mb: 2.5 }} // Reduced from 4
      >
        <TextField
          fullWidth
          value={name}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={isCelebrating}
          placeholder="Enter your companion's name"
          inputProps={{ maxLength: 20 }}
          autoComplete="off"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              color: "#ffffff",
              background: "rgba(255, 255, 255, 0.03)",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              py: 0.5,
              "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.08)",
                transition: "all 0.3s ease",
              },
              "&:hover fieldset": {
                borderColor: "rgba(121, 248, 255, 0.25)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#79f8ff",
                boxShadow: "0 0 12px rgba(121, 248, 255, 0.2)",
              },
            },
            "& input::placeholder": {
              color: "rgba(255, 255, 255, 0.35)",
              opacity: 1,
            },
          }}
        />
        <Typography
          sx={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.35)",
            textAlign: "right",
            mt: 0.75,
            mr: 0.5,
            fontFamily: "monospace",
          }}
        >
          {name.length} / 20
        </Typography>
      </Box>

      {/* Buttons */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: "100%",
          mb: 2, // Reduced from 4
          flexDirection: isMobile && !isDialog ? "column-reverse" : "row",
        }}
      >
        {isDialog ? (
          <Button
            fullWidth
            onClick={handleCancelAction}
            disabled={isCelebrating}
            sx={{
              py: "clamp(10px, 1.6vh, 14px)",
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              color: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.05)",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            Cancel
          </Button>
        ) : (
          <Button
            fullWidth
            onClick={handleSkip}
            disabled={isCelebrating}
            sx={{
              py: "clamp(10px, 1.6vh, 14px)",
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              color: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.05)",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            Skip
          </Button>
        )}

        <Button
          fullWidth
          onClick={() => handleSave(name)}
          disabled={isCelebrating || name.trim().length === 0}
          sx={{
            py: "clamp(10px, 1.6vh, 14px)",
            borderRadius: "14px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            background: "linear-gradient(90deg, #06b6d4 0%, #7c3aed 100%)",
            boxShadow: "0 4px 20px rgba(6, 182, 212, 0.35)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(90deg, #06b6d4 20%, #7c3aed 80%)",
              boxShadow: "0 6px 28px rgba(6, 182, 212, 0.5)",
            },
            "&.Mui-disabled": {
              background: "rgba(255, 255, 255, 0.05)",
              color: "rgba(255, 255, 255, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.03)",
              boxShadow: "none",
            },
          }}
        >
          {isDialog ? "Save" : "Save & Continue"}
        </Button>
      </Box>

      {/* Footer Text */}
      <Typography
        sx={{
          fontSize: "11px",
          color: "rgba(255, 255, 255, 0.35)",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        You can rename your companion anytime in Settings.
      </Typography>
    </Box>
  );

  // If rendering inside a dialog (Settings page rename)
  if (isDialog) {
    return (
      <Dialog
        open={true}
        onClose={handleCancelAction}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "32px",
            background: "linear-gradient(135deg, rgba(20, 24, 48, 0.95) 0%, rgba(10, 12, 24, 0.95) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 216, 255, 0.05)",
            overflow: "visible",
            position: "relative",
            p: 0, // Reduced from 1
          },
        }}
      >
        <IconButton
          onClick={handleCancelAction}
          disabled={isCelebrating}
          sx={{
            position: "absolute",
            top: 16, // Reduced from 20
            right: 16, // Reduced from 20
            color: "rgba(255, 255, 255, 0.4)",
            background: "rgba(255, 255, 255, 0.03)",
            "&:hover": {
              color: "#ffffff",
              background: "rgba(255, 255, 255, 0.08)",
            },
            zIndex: 110,
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        <DialogContent sx={{ p: 3, pt: 11, overflow: "visible" }}> {/* Reduced from p: 4, pt: 17 */}
          {renderCardContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Full onboarding screen centered layout
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999999,
        overflow: "hidden",
      }}
    >
      {/* 1. FIXED GALAXY BACKGROUND (reused from AuthBackground) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at bottom, #090a16 0%, #030308 100%)",
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {/* Nebula 1 */}
        <motion.div
          animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.15, 1] }}
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
          }}
        />

        {/* Nebula 2 */}
        <motion.div
          animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.1, 0.95, 1.1] }}
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
          }}
        />

        {/* Twinkling Stars */}
        {starsList.map((star) => (
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
            }}
          />
        ))}
      </Box>

      {/* 2. CARD CONTENT CONTAINER */}
      {/* Login page position placeholder (visible only when isDialog is false for onboarding) */}
      {!isDialog && (
        <Box
          sx={{
            position: "fixed",
            zIndex: 10,
            pointerEvents: "none",
            bottom: { xs: "auto", md: "auto" },
            top: { xs: "12px", md: "15vh" },
            left: { xs: "50%", md: "auto" },
            right: { xs: "auto", md: "calc(50% + 230px)" },
            transform: { xs: "translateX(-50%)", md: "none" },
            width: 280,
            height: 260,
            visibility: "hidden",
          }}
        >
          <Box
            ref={loginPlaceholderRef}
            sx={{
              position: "absolute",
              bottom: 10,
              width: 95,
              height: 95,
            }}
          />
        </Box>
      )}

      {/* 2. CARD CONTENT CONTAINER */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{
          width: isMobile ? "92%" : "440px", // Reduced from 520px
          padding: isMobile ? "20px" : "32px", // Reduced from clamp(24px, 4.5vh, 40px)
          paddingTop: "90px", // Reduced from 140px (space for robot overlapping)
          borderRadius: "32px",
          background: "linear-gradient(135deg, rgba(15, 18, 36, 0.6) 0%, rgba(8, 10, 20, 0.45) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow:
            "0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 30px rgba(121, 248, 255, 0.04)",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Top Decorative light strip accent */}
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

        {renderCardContent()}
      </motion.div>
    </Box>
  );
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};
