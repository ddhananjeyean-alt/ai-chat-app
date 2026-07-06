import React, { useEffect, useRef } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import WelcomeScreen from "./WelcomeScreen";

export default function ChatWindow({
  darkMode,
  messages = [],
  isTyping,
  handleRegenerate,
  handleEdit,
  handleImageClick,
  setMessage,
  currentUser,
  onSelectPrompt,
  fontSize,
}) {
  const theme = useTheme();
  const resolvedDarkMode = typeof darkMode === "boolean" ? darkMode : theme.palette.mode === "dark";
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  const typing = Boolean(isTyping);

useEffect(() => {
  if (!scrollContainerRef.current) return;

  scrollContainerRef.current.scrollTo({
    top: scrollContainerRef.current.scrollHeight,
    behavior: "smooth",
  });
}, [messages, typing]);

  const hasMessages = messages && messages.length > 0;

  return (
    <Box
      sx={{
        minHeight: "100%",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: theme.palette.background.default,
        overflow: "hidden",
      }}
    >
      {hasMessages ? (
        <Box
          ref={scrollContainerRef}
          sx={{
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  scrollBehavior: "smooth",

  display: "flex",
  justifyContent: "center",

  pb: "180px",

  "&::-webkit-scrollbar": {
    width: 6,
  },
  "&::-webkit-scrollbar-thumb": {
    background: "transparent",
    borderRadius: 10,
  },
  "&:hover::-webkit-scrollbar-thumb": {
    background: theme.palette.action.hover,
  },

  scrollbarWidth: "thin",
  scrollbarColor: "transparent transparent",
}}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "880px",
              px: { xs: 2, sm: 3 },
              pt: 4,
              pb: "180px"  ,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isUser = message.role === "user" || message.sender === "user";
                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: 28,
                      width: "100%",
                    }}
                  >
                    <MessageBubble
  message={message}
  isUser={isUser}
  darkMode={darkMode}
  fontSize={fontSize}
  messageIndex={index}
  onRegenerate={handleRegenerate}
  onEdit={handleEdit}
  onImageClick={handleImageClick}
/>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 28,
                  width: "100%",
                }}
              >
                <TypingIndicator />
              </motion.div>
            )}

            <div ref={bottomRef} />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
            px: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ width: "100%", maxWidth: 880 }}
          >
            <WelcomeScreen
              currentUser={currentUser}
              darkMode={darkMode}
              onSelectPrompt={onSelectPrompt}
            />
          </motion.div>
        </Box>
      )}


    </Box>
  );
}

function TypingIndicator({ dotColor }) {
  const dotTransition = (delay) => ({
    duration: 1,
    repeat: Infinity,
    ease: "easeInOut",
    delay,
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        height: 24,
        px: 0.5,
      }}
      aria-label="Assistant is typing"
      role="status"
    >
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={dotTransition(delay)}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#ECECEC",
            display: "inline-block",
          }}
        />
      ))}
    </Box>
  );
}
