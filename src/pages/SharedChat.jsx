import React from "react";
import { useParams, Link } from "react-router-dom";
import ChatWindow from "../components/chat/ChatWindow";
import { useThemeContext } from "../theme/ThemeContext";

import {
  Box,
  Paper,
  Typography,
  Button,
} from "@mui/material";

function SharedChat() {
  const { id } = useParams();
  const { currentTheme } = useThemeContext();
  const darkMode = currentTheme?.palette?.mode === "dark";

  const sharedChats =
    JSON.parse(localStorage.getItem("sharedChats")) || {};

  const chat = sharedChats[id];

  if (!chat) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5">
          Shared chat not found.
        </Typography>

        <Button
          component={Link}
          to="/"
          variant="contained"
        >
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: currentTheme?.palette?.background?.default || "#f5f5f5",
        color: currentTheme?.palette?.text?.primary,
        p: 4,
      }}
    >
      <Paper
        sx={{
          maxWidth: 900,
          margin: "auto",
          p: 3,
          display: "flex",
          flexDirection: "column",
          height: "90vh",
          backgroundColor: currentTheme?.palette?.background?.paper,
          color: currentTheme?.palette?.text?.primary,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={2}
        >
          {chat.title}
        </Typography>

        <ChatWindow
  messages={chat.messages}
  darkMode={darkMode}
  isTyping={false}
  imageCache={{}}
  handleRegenerate={() => {}}
  handleEdit={() => {}}
  handleImageClick={() => {}}
  readOnly={true}
/>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            component={Link}
            to="/"
            variant="contained"
          >
            Open AI Assistant
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default SharedChat;