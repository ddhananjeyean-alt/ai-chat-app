import { useState, useEffect, useRef } from "react";
import { Box, Typography, useTheme, InputBase } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import WelcomeScreen from "./WelcomeScreen";
import { useByte, BYTE_STATES } from "../../context/ByteContext";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function ChatWindow({
  darkMode,
  messages = [],
  isTyping,
  handleRegenerate,
  handleEdit,
  handleImageClick,
  _setMessage,
  currentUser,
  _onSelectPrompt,
  fontSize,
  activeChatId,
  searchQuery,
  conversations = [],
  onSelectChat,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  const [localSearchQuery, setLocalSearchQuery] = useState("");

  useEffect(() => {
    if (activeChatId === "search") {
      setLocalSearchQuery("");
    }
  }, [activeChatId]);

  const typing = Boolean(isTyping);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "auto",
    });
  }, [messages, typing]);

  const hasMessages = messages && messages.length > 0;

  const renderSearchView = () => {
    const query = localSearchQuery.toLowerCase().trim();
    const filtered = (conversations || []).filter(c => !c.archived).filter(c => {
      if (!query) return true;
      const titleMatch = (c.title || "").toLowerCase().includes(query);
      const messageMatch = Array.isArray(c.messages) && c.messages.some(
        (m) => (m.text || "").toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });

    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pt: 8,
          px: { xs: 2, sm: 4, md: 6 },
          overflowY: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 800,
            color: darkMode ? "#ffffff" : "#1F2937",
            mb: 2,
            fontFamily: "Inter, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Search Conversations
        </Typography>

        <Box
          sx={{
            width: "100%",
            maxWidth: 680,
            height: 56,
            display: "flex",
            alignItems: "center",
            borderRadius: "99px",
            background: darkMode ? "rgba(20, 24, 34, 0.45)" : "rgba(255, 255, 255, 0.88)",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(220, 228, 240, 0.9)",
            boxShadow: darkMode
              ? "0 12px 40px rgba(0, 0, 0, 0.45), 0 0 30px rgba(0, 180, 255, 0.08)"
              : "0 8px 30px rgba(31, 41, 55, 0.05)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            px: 2.5,
            mb: 4,
            boxSizing: "border-box",
          }}
        >
          <SearchOutlinedIcon
            sx={{
              fontSize: 20,
              color: darkMode ? "#79f8ff" : "#2563EB",
              mr: 2,
              filter: darkMode ? "drop-shadow(0 0 8px rgba(121, 248, 255, 0.4))" : "none"
            }}
          />
          <InputBase
            placeholder="Search conversations..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              fontSize: 15,
              color: darkMode ? "#ffffff" : "#1F2937",
              fontFamily: "Inter, sans-serif",
              "& .MuiInputBase-input": {
                padding: 0,
                "&::placeholder": {
                  color: darkMode ? "rgba(255, 255, 255, 0.5)" : "#8A94A6",
                  opacity: 1,
                },
              },
            }}
          />
        </Box>

        <Typography
          sx={{
            alignSelf: "flex-start",
            width: "100%",
            maxWidth: 680,
            fontSize: 18,
            fontWeight: 700,
            color: darkMode ? "#ffffff" : "#1F2937",
            mb: 2,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Recent Conversations
        </Typography>

        {filtered.length === 0 ? (
          <Box
            sx={{
              width: "100%",
              maxWidth: 680,
              borderRadius: "22px",
              background: darkMode ? "rgba(20, 24, 34, 0.45)" : "rgba(255, 255, 255, 0.82)",
              border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(220, 228, 240, 0.8)",
              boxShadow: darkMode
                ? "0 12px 40px rgba(0, 0, 0, 0.45), 0 0 30px rgba(0, 180, 255, 0.08)"
                : "0 12px 30px rgba(31, 41, 55, 0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
              px: 3,
              boxSizing: "border-box",
            }}
          >
            <AutoAwesomeIcon
              sx={{
                fontSize: 36,
                color: darkMode ? "#79f8ff" : "#2563EB",
                opacity: 0.6,
                mb: 2
              }}
            />
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: darkMode ? "#ffffff" : "#1F2937", mb: 1 }}>
              No conversations found
            </Typography>
            <Typography sx={{ fontSize: 13, color: darkMode ? "rgba(255, 255, 255, 0.72)" : "#667085" }}>
              Try another keyword.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", maxWidth: 680 }}>
            {filtered.map((chat, idx) => (
              <SearchCard
                key={chat.id}
                chat={chat}
                index={idx}
                onSelectChat={onSelectChat}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <AnimatePresence mode="wait">
        {activeChatId === "search" ? (
          renderSearchView()
        ) : !hasMessages ? (
          /* Welcome Screen empty state card */
          <Box
            component={motion.div}
            key="empty-welcome-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflowY: "auto",
              zIndex: 1,
              position: "relative",
              pl: { xs: 2, sm: 3, md: "24px" },
              pr: { xs: 2, sm: 3, md: "24px" },
              background: "transparent !important",
              backgroundColor: "transparent !important",
              boxShadow: "none !important",
              border: "none !important",
              outline: "none !important",
            }}
          >
            <WelcomeScreen
              currentUser={currentUser}
              darkMode={darkMode}
              onSelectPrompt={_onSelectPrompt}
            />
          </Box>
        ) : (
          /* Active messages view scroll pane */
          <Box
            component={motion.div}
            key="active-chat-view"
            ref={scrollContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              justifyContent: "flex-start",
              pl: { xs: 2, sm: 3, md: "24px" },
              pr: { xs: 2, sm: 3, md: "24px" },
              pb: "180px",
              zIndex: 1,
              position: "relative",

              // Symmetrical gradient mask fading top & bottom content
              maskImage: "linear-gradient(to bottom, transparent 0%, black 48px, black calc(100% - 64px), transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 48px, black calc(100% - 64px), transparent 100%)",

              // Custom modern scrollbars
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
                borderRadius: 10,
              },
              "&::hover::-webkit-scrollbar-thumb": {
                background: isLight ? "rgba(0, 0, 0, 0.16)" : "rgba(255, 255, 255, 0.16)",
              },
              scrollbarWidth: "thin",
              scrollbarColor: isLight 
                ? "rgba(0, 0, 0, 0.08) transparent" 
                : "rgba(255, 255, 255, 0.08) transparent",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: "100%",
                px: 0,
                pt: 6, // spacing below top fade margin
                pb: "180px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <AnimatePresence initial={false}>
                {/* Chat message bubbles */}
                {messages.map((message, index) => {
                  const isUser = message.role === "user" || message.sender === "user";
                  return (
                    <motion.div
                      key={message.id || `msg-${message.sender}-${message.text?.substring(0, 16)}`}
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
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

                {/* Unified AnimatePresence-enabled Thinking Animation */}
                {typing && (
                  <motion.div
                    key="thinking-indicator"
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
                    transition={{ 
                      duration: 0.5, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      marginBottom: 28,
                      width: "100%",
                      paddingLeft: "52px",
                    }}
                  >
                    <PremiumThinkingAnimation isLight={isLight} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Custom Premium Thinking / Loading Animation Component
function PremiumThinkingAnimation({ isLight }) {
  const { byteState } = useByte();

  let text = "Analyzing Neural Nodes";
  let desc = "Connecting streaming endpoints...";
  if (byteState === BYTE_STATES.ANALYZING) {
    text = "Scanning Image Data";
    desc = "Parsing visual raster fields...";
  } else if (byteState === BYTE_STATES.GENERATING) {
    text = "Synthesizing Image Canvas";
    desc = "Rendering noise to diffusion cells...";
  } else if (byteState === BYTE_STATES.SEARCHING) {
    text = "Executing Query Router";
    desc = "Retrieving google search indexes...";
  } else if (byteState === BYTE_STATES.UPLOADING) {
    text = "Uploading Image Buffer";
    desc = "Streaming bytes to firestore storage...";
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 3,
        py: 1.5,
        px: 2.2,
        background: isLight ? "rgba(255, 255, 255, 0.65)" : "rgba(13, 15, 23, 0.45)",
        border: isLight ? "1px solid rgba(59, 130, 246, 0.12)" : "1px solid rgba(121, 248, 255, 0.08)",
        borderRadius: "24px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: isLight
          ? "0 8px 24px rgba(59, 130, 246, 0.04)"
          : "0 8px 30px rgba(0, 0, 0, 0.35)",
        maxWidth: "fit-content",
      }}
    >
      {/* Premium Orb Visual Container */}
      <Box
        sx={{
          position: "relative",
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* Soft breathing backlight glow */}
        <motion.div
          animate={{
            scale: [1, 1.22, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: isLight 
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 70%)" 
              : "radial-gradient(circle, rgba(121, 248, 255, 0.3) 0%, rgba(121, 248, 255, 0) 70%)",
            filter: "blur(6px)",
          }}
        />

        {/* Counter-rotating Outer Dashed Orb Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            width: "82%",
            height: "82%",
            borderRadius: "50%",
            border: isLight ? "2px dashed rgba(37, 99, 235, 0.45)" : "2px dashed rgba(121, 248, 255, 0.45)",
          }}
        />

        {/* Counter-rotating Inner Dashed Orb Ring */}
        <motion.div
          animate={{ rotate: -360, scale: [0.92, 1.04, 0.92] }}
          transition={{
            rotate: { duration: 7, repeat: Infinity, ease: "linear" },
            scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            position: "absolute",
            width: "60%",
            height: "60%",
            borderRadius: "50%",
            border: isLight ? "1.5px dashed rgba(147, 51, 234, 0.35)" : "1.5px dashed rgba(192, 132, 252, 0.35)",
          }}
        />

        {/* Center Glowing Particle Core */}
        <motion.div
          animate={{
            scale: [0.85, 1.15, 0.85],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isLight ? "#2563EB" : "#79f8ff",
            boxShadow: isLight
              ? "0 0 10px rgba(37, 99, 235, 0.7)"
              : "0 0 12px rgba(121, 248, 255, 0.85)",
            zIndex: 1,
          }}
        />
      </Box>

      {/* Typographic details block */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, pr: 1 }}>
        <Box sx={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              color: isLight ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.85)",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {text}
          </Typography>
          <Box sx={{ display: "flex", gap: "2.5px" }}>
            {[0, 0.22, 0.44].map((d) => (
              <motion.span
                key={d}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                style={{
                  width: 3.5,
                  height: 3.5,
                  borderRadius: "50%",
                  backgroundColor: isLight ? "#2563EB" : "#79f8ff",
                  display: "inline-block",
                }}
              />
            ))}
          </Box>
        </Box>
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 400,
            color: isLight ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.45)",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {desc}
        </Typography>
      </Box>
    </Box>
  );
}

function SearchCard({ chat, index, onSelectChat }) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === "dark";
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : "";
  const preview = lastMsg || "No messages";
  const truncatedPreview = preview.length > 120 ? preview.substring(0, 120) + "..." : preview;

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: {
            delay: i * 0.04,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1]
          }
        })
      }}
      style={{ width: "100%" }}
    >
      <Box
        onClick={() => onSelectChat?.(chat.id)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          p: 3,
          borderRadius: "22px",
          cursor: "pointer",
          background: darkMode
            ? (hovered
              ? `radial-gradient(circle at ${coords.x}px ${coords.y}px, rgba(80, 180, 255, 0.18), transparent 65%), rgba(20, 24, 34, 0.45)`
              : "rgba(20, 24, 34, 0.45)")
            : "rgba(255, 255, 255, 0.82)",
          border: darkMode
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(220, 228, 240, 0.8)",
          backdropFilter: darkMode ? "blur(22px) saturate(180%)" : "blur(20px)",
          WebkitBackdropFilter: darkMode ? "blur(22px) saturate(180%)" : "blur(20px)",
          boxShadow: darkMode
            ? (hovered
              ? "0 18px 45px rgba(0, 0, 0, 0.45), 0 0 45px rgba(0, 180, 255, 0.18)"
              : "0 12px 40px rgba(0, 0, 0, 0.45), 0 0 30px rgba(0, 180, 255, 0.08)")
            : (hovered
              ? "0 18px 40px rgba(31, 41, 55, 0.12)"
              : "0 12px 30px rgba(31, 41, 55, 0.08)"),
          transition: "transform 300ms cubic-bezier(.22,1,.36,1), box-shadow 300ms cubic-bezier(.22,1,.36,1)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          boxSizing: "border-box",
          "&:hover": {
            transform: "translateY(-4px) scale(1.005)",
          }
        }}
      >
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 700,
            color: darkMode ? "#ffffff" : "#1F2937",
            fontFamily: "Inter, sans-serif"
          }}
        >
          {chat.title || "Untitled Conversation"}
        </Typography>

        <Typography
          sx={{
            fontSize: "15px",
            color: darkMode ? "rgba(255, 255, 255, 0.72)" : "#667085",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "Inter, sans-serif"
          }}
        >
          {truncatedPreview}
        </Typography>

        <Box sx={{ alignSelf: "flex-end", mt: 0.5 }}>
          <Typography
            sx={{
              fontSize: 12,
              color: darkMode ? "rgba(255, 255, 255, 0.45)" : "#98A2B3",
              fontFamily: "Inter, sans-serif"
            }}
          >
            {formatDate(chat.updatedAt || chat.createdAt) || "Jul 14"} • AI Description
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}
