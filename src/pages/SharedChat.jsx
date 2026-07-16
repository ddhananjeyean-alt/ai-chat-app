import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MessageBubble from "../components/chat/MessageBubble";
import ByteWelcomeGuide from "../companion/byte/ByteWelcomeGuide";
import ShareAnimationController from "../companion/byte/ShareAnimationController";
import { useThemeContext } from "../theme/ThemeContext";

import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Avatar,
  Divider,
  CircularProgress,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

function SharedChat() {
  const { id } = useParams();
  const { currentTheme } = useThemeContext();
  const darkMode = currentTheme?.palette?.mode === "dark";

  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [unfolded, setUnfolded] = useState(false);

  useEffect(() => {
    async function loadChat() {
      // 1. Try local storage first
      let localChat = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === "sharedChats" || key.startsWith("sharedChats_")) {
          try {
            const stored = JSON.parse(localStorage.getItem(key)) || {};
            if (stored[id]) {
              localChat = stored[id];
              break;
            }
          } catch (e) {
            // Ignore
          }
        }
      }

      if (localChat) {
        setChat(localChat);
        setLoading(false);
        return;
      }

      // 2. Fetch from Firestore
      try {
        const docRef = doc(db, "sharedChats", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setChat(docSnap.data());
        }
      } catch (err) {
        console.error("Error loading shared chat from Firestore:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChat();
  }, [id]);

  const handleUnfoldComplete = () => {
    setUnfolded(true);
    if (!chat || !chat.messages) return;
    let index = 0;
    const interval = setInterval(() => {
      if (chat && chat.messages && index < chat.messages.length) {
        setVisibleMessages((prev) => [...prev, chat.messages[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 250); // Stagger message cascade by 250ms for unfolding effect
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: darkMode
            ? "radial-gradient(circle at 10% 20%, rgba(20, 24, 38, 1) 0%, rgba(13, 15, 23, 1) 90%)"
            : "radial-gradient(circle at 10% 20%, rgba(240, 245, 251, 1) 0%, rgba(248, 250, 252, 1) 90%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ color: darkMode ? "#2563EB" : "#1D4ED8" }} />
      </Box>
    );
  }

  // If conversation is not found, return empty card state
  if (!chat) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: darkMode
            ? "radial-gradient(circle at 10% 20%, rgba(20, 24, 38, 1) 0%, rgba(13, 15, 23, 1) 90%)"
            : "radial-gradient(circle at 10% 20%, rgba(240, 245, 251, 1) 0%, rgba(248, 250, 252, 1) 90%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 3,
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 450,
            width: "100%",
            borderRadius: "20px",
            textAlign: "center",
            backdropFilter: "blur(20px)",
            backgroundColor: darkMode ? "rgba(20, 24, 38, 0.65)" : "rgba(255, 255, 255, 0.75)",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Typography variant="h5" fontWeight="700" color="text.primary" mb={2}>
            Shared Chat Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            The shared conversation link might be invalid, or it could have been removed by the owner.
          </Typography>
          <Button
            component={Link}
            to="/"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              backgroundColor: darkMode ? "#2563EB" : "#1D4ED8",
              "&:hover": {
                backgroundColor: darkMode ? "#1D4ED8" : "#1e40af",
              },
            }}
          >
            Back to AI Assistant
          </Button>
        </Paper>
      </Box>
    );
  }

  const sharedUserName = chat.sharedBy || "AI Companion User";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: darkMode
          ? "radial-gradient(circle at 10% 20%, rgba(20, 24, 38, 1) 0%, rgba(13, 15, 23, 1) 90%)"
          : "radial-gradient(circle at 10% 20%, rgba(240, 245, 251, 1) 0%, rgba(248, 250, 252, 1) 90%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4 },
        boxSizing: "border-box",
      }}
    >
      {/* Landing Courier Animation Layer */}
      <ShareAnimationController
        isLanding={true}
        conversation={chat}
        onUnfoldComplete={handleUnfoldComplete}
      />

      {/* Floating Byte Companion */}
      <ByteWelcomeGuide
        isSharedRoute={true}
        byteState="idle"
        setByteState={() => {}}
        isTyping={false}
        isGenerating={false}
        message=""
        currentUser={null}
        activeChatId={id}
        hasMessages={visibleMessages.length > 0}
      />

      <Container maxWidth="md" disableGutters>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: "24px",
            backdropFilter: "blur(25px)",
            backgroundColor: darkMode ? "rgba(20, 24, 38, 0.65)" : "rgba(255, 255, 255, 0.75)",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.10)",
            boxShadow: darkMode
              ? "0 20px 50px rgba(0, 0, 0, 0.4)"
              : "0 20px 50px rgba(0, 0, 0, 0.06)",
            display: "flex",
            flexDirection: "column",
            height: { xs: "85vh", md: "80vh" },
            minHeight: 500,
            overflow: "hidden",
          }}
        >
          {/* Shared Conversation Header Card */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexShrink: 0 }}>
            <Box>
              <Typography
                variant="h5"
                fontWeight="800"
                sx={{
                  color: darkMode ? "#FFFFFF" : "#111827",
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                  mb: 0.5,
                }}
              >
                {chat.title || "Untitled Conversation"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: darkMode ? "rgba(255, 255, 255, 0.6)" : "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: darkMode ? "#3b82f6" : "#2563eb",
                    color: "#ffffff",
                  }}
                >
                  {sharedUserName.charAt(0).toUpperCase()}
                </Avatar>
                Shared by {sharedUserName}
              </Typography>
            </Box>
            <ChatBubbleOutlineRoundedIcon
              sx={{
                fontSize: 32,
                color: darkMode ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)",
                display: { xs: "none", sm: "block" },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)", mb: 2 }} />

          {/* Messages viewport - scrolling natively */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              pr: { xs: 0, sm: 1.5 },
              mr: { xs: 0, sm: -1.5 },
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: darkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: darkMode ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.24)",
              },
            }}
          >
            {visibleMessages.length === 0 && !unfolded ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  opacity: 0.45,
                  gap: 1.5,
                }}
              >
                <Typography variant="body2">Waiting for delivery...</Typography>
              </Box>
            ) : (
              visibleMessages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    width: "100%",
                  }}
                >
                  <MessageBubble
                    message={msg}
                    isUser={msg.role === "user"}
                    darkMode={darkMode}
                    readOnly={true}
                  />
                </Box>
              ))
            )}
          </Box>

          {/* Action Footer card */}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Button
              component={Link}
              to="/"
              variant="contained"
              sx={{
                borderRadius: "14px",
                px: 4,
                py: 1.25,
                fontWeight: 700,
                fontSize: "0.95rem",
                textTransform: "none",
                backgroundColor: darkMode ? "#2563EB" : "#1D4ED8",
                boxShadow: darkMode ? "0 4px 14px rgba(37, 99, 235, 0.35)" : "0 4px 14px rgba(37, 99, 235, 0.2)",
                "&:hover": {
                  backgroundColor: darkMode ? "#1D4ED8" : "#1e40af",
                },
              }}
            >
              Open in AI Assistant
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SharedChat;