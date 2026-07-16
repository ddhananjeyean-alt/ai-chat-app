import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography } from "@mui/material";
import ByteRobot from "./ByteRobot";

export default function ByteIntro({ mode = "login" }) {
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleTitle, setBubbleTitle] = useState("");
  const [bubbleTitleColor, setBubbleTitleColor] = useState("#79F8FF");
  const [bubbleText, setBubbleText] = useState("");
  const [robotState, setRobotState] = useState("idle");

  useEffect(() => {
    const timers = [];

    if (mode === "login") {
      setRobotState("float");
      setShowBubble(false);

      // Wave starts after entrance is complete
      timers.push(
        setTimeout(() => {
          setRobotState("wave");
        }, 1500)
      );

      // Waving lasts 800ms, then speech bubble fades in smoothly
      timers.push(
        setTimeout(() => {
          setRobotState("float");
          setBubbleTitle("👋 Hi!");
          setBubbleTitleColor("#79F8FF");
          setBubbleText(
            "I am your AI chat assistant.\nI'm here to help you answer questions, create images, write code, and much more."
          );
          setShowBubble(true);
        }, 2500)
      );

      // Show the login prompt message after some time
      timers.push(
        setTimeout(() => {
          setBubbleTitle("🔐 Please Log In");
          setBubbleTitleColor("#ffc83b");
          setBubbleText(
            "Log in to interact with me. I'll be here waiting. Let's build something amazing!"
          );
        }, 6500)
      );
    } else if (mode === "register") {
      setRobotState("float");
      setShowBubble(false);

      timers.push(
        setTimeout(() => {
          setRobotState("wave"); // Small wave animation for movement
        }, 1000)
      );

      timers.push(
        setTimeout(() => {
          setRobotState("float");
          setBubbleTitle("✨ Join Us");
          setBubbleTitleColor("#a78bfa"); // Soft purple glow
          setBubbleText("Let's create your account!");
          setShowBubble(true);
        }, 2000)
      );
    } else if (mode === "success") {
      setRobotState("wave"); // Celebrate!
      setShowBubble(false);

      timers.push(
        setTimeout(() => {
          setBubbleTitle("🎉 Success!");
          setBubbleTitleColor("#10B981"); // Success green
          setBubbleText("Great! Your account is ready.\nPlease log in.");
          setShowBubble(true);
        }, 500)
      );
    } else if (mode === "login_success") {
      setRobotState("happy"); // Celebrate login!
      setShowBubble(false);

      timers.push(
        setTimeout(() => {
          setBubbleTitle("🎉 Logged In!");
          setBubbleTitleColor("#10B981"); // Success green
          setBubbleText("Let's get started!");
          setShowBubble(true);
        }, 300)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [mode]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        width: 280,
        height: 260, // Fixed height keeps layout stable
      }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: 165, // Positioned right above the floating robot
              width: 280,
              padding: "16px 20px",
              borderRadius: "20px",
              background: "rgba(10, 15, 30, 0.75)",
              border: "1px solid rgba(0, 242, 254, 0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.15)",
              color: "#fff",
              zIndex: 50,
            }}
          >
            {/* Speech bubble pointer arrow */}
            <Box
              sx={{
                position: "absolute",
                bottom: -8,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 14,
                height: 14,
                background: "rgba(10, 15, 30, 0.75)",
                borderRight: "1px solid rgba(0, 242, 254, 0.25)",
                borderBottom: "1px solid rgba(0, 242, 254, 0.25)",
                zIndex: -1,
              }}
            />

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: "1.05rem",
                mb: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: bubbleTitleColor,
              }}
            >
              {bubbleTitle}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.5,
                color: "rgba(255, 255, 255, 0.9)",
                whiteSpace: "pre-line",
              }}
            >
              {bubbleText}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Byte Robot Wrapper */}
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: 10,
          zIndex: 30,
        }}
      >
        <ByteRobot
          size={95}
          state={robotState}
          onHomeScreen={false}
        />
      </motion.div>
    </Box>
  );
}