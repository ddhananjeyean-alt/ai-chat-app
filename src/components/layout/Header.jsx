import React from "react";
import { Box, IconButton, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";

export default function Header({
  onToggleSidebar,
  chatTitle,
  onShare,
  darkMode,
  onToggleTheme,
  sidebarOpen,
}) {
  const theme = useTheme();
  const resolvedDarkMode = theme.palette.mode === "dark";
  const bg = theme.palette.background.paper;
  const borderColor = theme.palette.divider;
  const textColor = theme.palette.text.primary;
  const iconColor = theme.palette.text.secondary;
  const hoverBg = theme.palette.action.hover;

  return (
    <Box
      component="header"
      sx={{
        height: "56px",
        minHeight: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1, sm: 1.5 },
        background: bg,
        borderBottom: `1px solid ${borderColor}`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
          <Tooltip title={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
            <IconButton
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                color: iconColor,
                transition: "background 0.15s ease",
                "&:hover": { background: hoverBg },
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </motion.div>

        <Typography
          noWrap
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            fontWeight: 500,
            color: textColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {chatTitle}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end", flex: 1 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
          <Tooltip title="Share chat">
            <IconButton
              onClick={onShare}
              aria-label="Share chat"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                color: iconColor,
                transition: "background 0.15s ease",
                "&:hover": { background: hoverBg },
              }}
            >
              <IosShareRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                color: iconColor,
                transition: "background 0.15s ease",
                "&:hover": { background: hoverBg },
              }}
            >
              {darkMode ? (
                <LightModeRoundedIcon sx={{ fontSize: 19 }} />
              ) : (
                <DarkModeRoundedIcon sx={{ fontSize: 19 }} />
              )}
            </IconButton>
          </Tooltip>
        </motion.div>
      </Box>
    </Box>
  );
}
