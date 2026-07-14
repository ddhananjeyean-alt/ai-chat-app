import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";

import ShareIcon from "@mui/icons-material/Share";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

function Header({
  darkMode,
  toggleTheme,
  exportChatPDF,
  handleShareChat,
  currentConversation,
}) {
  const chatTitle =
  currentConversation?.title || "New Conversation";
  
  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        borderBottom: darkMode
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(0, 0, 0, 0.05)",
        background: darkMode
          ? "rgba(17, 24, 39, 0.95)"
          : "rgba(255, 255, 255, 0.75)",
        backdropFilter: darkMode ? "blur(16px)" : "blur(20px)",
        WebkitBackdropFilter: darkMode ? "blur(16px)" : "blur(20px)",
        boxShadow: darkMode
          ? "none"
          : "0 4px 20px rgba(0, 0, 0, 0.01)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left Side */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SmartToyIcon
            sx={{
              color: "#fff",
              fontSize: 24,
            }}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              color: darkMode ? "#ffffff" : "#1f2937",
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.2,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {chatTitle}
          </Typography>

          <Typography
            sx={{
              color: darkMode ? "#94a3b8" : "#5b6472",
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
            }}
          >
            AI Assistant
          </Typography>
        </Box>
      </Box>

      {/* Right Side */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {/* Share Chat */}
        <Tooltip title="Share Chat">
          <IconButton
            onClick={handleShareChat}
            sx={{
              color: darkMode ? "white" : "#3B3B3B",
              background: darkMode
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.03)",
              "&:hover": {
                color: darkMode ? "white" : "#0EA5FF",
                background: darkMode
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(14, 165, 255, 0.08)",
              },
            }}
          >
            <ShareIcon />
          </IconButton>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: darkMode ? "#fbbf24" : "#3B3B3B",
              background: darkMode
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.03)",
              "&:hover": {
                color: darkMode ? "#fbbf24" : "#0EA5FF",
                background: darkMode
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(14, 165, 255, 0.08)",
              },
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default Header;