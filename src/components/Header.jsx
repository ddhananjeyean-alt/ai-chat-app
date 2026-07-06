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
  : "1px solid rgba(15,23,42,0.08)",
        background: darkMode
  ? "#111827"
  : "#ffffff",
        backdropFilter: "blur(10px)",
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
        color: darkMode ? "#ffffff" : "#0f172a",
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      {chatTitle}
    </Typography>

    <Typography
      sx={{
        color: darkMode ? "#94a3b8" : "#64748b",
        fontSize: 13,
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
          gap: 1,
        }}
      >
        {/* Share Chat */}
        <Tooltip title="Share Chat">
          <IconButton
            onClick={handleShareChat}
            sx={{
              color: darkMode ? "white" : "#1e293b",
              background: darkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
              "&:hover": {
                background: darkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.1)",
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
              color: darkMode ? "#fbbf24" : "#1e293b",
              background: darkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
              "&:hover": {
                background: darkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.1)",
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