import React, { useRef, useState } from "react";
import { Box, IconButton, Typography, Tooltip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, ClickAwayListener } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import { getAvatarColor } from "../../utils/avatarColor";
import ArchiveBox from "./ArchiveBox";

export default function Header({
  chatTitle,
  onShare,
  darkMode,
  onToggleTheme,
  currentUser,
  onLogout,
  onOpenProfile,
  onNewChat,
  onOpenSettings,
  onOpenArchive,
  chats = [],
  currentChatId,
  onSelectChat,
  onRestoreChat,
  onDeleteChat,
}) {
  const theme = useTheme();
  const resolvedDarkMode = theme.palette.mode === "dark";
  const bg = theme.palette.background.paper;
  const borderColor = theme.palette.divider;
  const textColor = theme.palette.text.primary;
  const iconColor = theme.palette.text.secondary;
  const hoverBg = theme.palette.action.hover;
  
  const themeButtonRef = useRef(null);
  
  // Archived Chats Panel State
  const [archivePanelOpen, setArchivePanelOpen] = useState(false);
  const archivedChats = chats.filter((chat) => chat.archived);

  const handleToggleArchivePanel = () => {
    setArchivePanelOpen((prev) => !prev);
  };

  const handleCloseArchivePanel = (event) => {
    const button = document.getElementById("archive-box-button");
    if (button && button.contains(event.target)) {
      return;
    }
    setArchivePanelOpen(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  };

  // User Menu State
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const handleUserMenuOpen = (e) => setUserMenuAnchor(e.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const displayName =
    currentUser?.displayName?.trim() ||
    currentUser?.email?.split("@")[0] ||
    "User";
  const displayEmail = currentUser?.email || "";
  const avatarLetter = displayName.charAt(0).toUpperCase();

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
        background: "transparent",
        borderBottom: "none",
        boxShadow: "none",
        fontFamily: "Inter, sans-serif",
        zIndex: 10,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
        {/* ChatGPT Style New Chat Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
          <Tooltip title="New Chat">
            <IconButton
              onClick={onNewChat}
              aria-label="New Chat"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                color: iconColor,
                transition: "background 0.15s ease",
                "&:hover": { background: hoverBg },
              }}
            >
              <AddIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </motion.div>

        {/* Premium Archive Box & Dropdown Panel */}
        <ClickAwayListener onClickAway={handleCloseArchivePanel}>
          <Box sx={{ position: "relative" }}>
            <ArchiveBox onClick={handleToggleArchivePanel} darkMode={resolvedDarkMode} />
            
            <AnimatePresence>
              {archivePanelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    zIndex: 1000,
                  }}
                >
                  <Box
                    sx={{
                      width: 320,
                      borderRadius: "16px",
                      background: resolvedDarkMode ? "rgba(20, 24, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: resolvedDarkMode ? `1px solid ${borderColor}` : "1px solid rgba(0, 0, 0, 0.15)",
                      boxShadow: resolvedDarkMode
                        ? "0px 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(121, 248, 255, 0.05)"
                        : "0px 10px 30px rgba(0, 0, 0, 0.08), 0 0 15px rgba(37, 99, 235, 0.02)",
                      color: textColor,
                      overflow: "hidden",
                      py: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: iconColor,
                        px: 2,
                        pb: 1,
                      }}
                    >
                      Archived Chats
                    </Typography>
                    
                    <Divider sx={{ borderColor: borderColor, mb: 1 }} />
                    
                    <Box
                      sx={{
                        maxHeight: 280,
                        overflowY: "auto",
                        px: 1,
                        "&::-webkit-scrollbar": {
                          width: 4,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: resolvedDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                          borderRadius: 10,
                        },
                      }}
                    >
                      {archivedChats.length === 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            py: 4,
                            gap: 1,
                          }}
                        >
                          <Inventory2OutlinedIcon
                            sx={{
                              fontSize: 28,
                              color: iconColor,
                              opacity: 0.3,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: iconColor,
                              fontWeight: 500,
                            }}
                          >
                            No archived chats
                          </Typography>
                        </Box>
                      ) : (
                        archivedChats.map((chat) => {
                          const chatTime = chat.updatedAt || chat.id;
                          const formattedTime = formatTime(chatTime);
                          const isSelected = chat.id === currentChatId;
                          
                          return (
                            <Box
                              key={chat.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                px: 1.5,
                                py: 1.1,
                                mb: 0.5,
                                borderRadius: "12px",
                                cursor: "pointer",
                                background: isSelected
                                  ? (resolvedDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)")
                                  : "transparent",
                                transition: "all 0.18s ease",
                                "&:hover": {
                                  background: resolvedDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                                },
                                "&:hover .archive-actions": {
                                  opacity: 1,
                                },
                              }}
                            >
                              <Box
                                onClick={() => {
                                  onSelectChat?.(chat.id);
                                  setArchivePanelOpen(false);
                                }}
                                sx={{ flex: 1, minWidth: 0, mr: 1 }}
                              >
                                <Typography
                                  noWrap
                                  sx={{
                                    fontSize: 13.5,
                                    fontWeight: isSelected ? 600 : 500,
                                    color: isSelected
                                      ? (resolvedDarkMode ? "#74dcff" : theme.palette.primary.main)
                                      : textColor,
                                  }}
                                >
                                  {chat.title || "Untitled Chat"}
                                </Typography>
                                  {formattedTime && (
                                    <Typography
                                      noWrap
                                      sx={{
                                        fontSize: 11,
                                        color: resolvedDarkMode ? iconColor : "#4b5563",
                                        opacity: resolvedDarkMode ? 0.8 : 1,
                                        mt: 0.25,
                                      }}
                                    >
                                      {formattedTime}
                                    </Typography>
                                  )}
                              </Box>
                              
                              <Box
                                className="archive-actions"
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  opacity: { xs: 1, sm: 0 },
                                  transition: "opacity 0.18s ease",
                                }}
                              >
                                <Tooltip title="Restore">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRestoreChat?.(chat.id);
                                    }}
                                    sx={{
                                      color: resolvedDarkMode ? "#74dcff" : theme.palette.primary.main,
                                      "&:hover": {
                                        background: resolvedDarkMode ? "rgba(116, 220, 255, 0.12)" : "rgba(37, 99, 235, 0.08)",
                                      },
                                    }}
                                  >
                                    <SettingsBackupRestoreRoundedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Delete Permanently">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm("Are you sure you want to permanently delete this conversation? This cannot be undone.")) {
                                        onDeleteChat?.(chat.id);
                                      }
                                    }}
                                    sx={{
                                      color: "#ff6b6b",
                                      "&:hover": {
                                        background: "rgba(255, 107, 107, 0.12)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </ClickAwayListener>

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
            ml: 0.5,
          }}
        >
          {chatTitle}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "flex-end", flex: 1 }}>
        {/* Share Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
          <Tooltip title="Share chat">
            <IconButton
              id="header-share-button"
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

        {/* Theme Toggle Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              ref={themeButtonRef}
              onClick={() => {
                const rect = themeButtonRef.current.getBoundingClientRect();
                onToggleTheme({
                  x: rect.left + rect.width / 2,
                  y: rect.bottom,
                });
              }}
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

        {/* User Profile Area Beside Theme Toggle */}
        {currentUser && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 0.5,
                  pr: { xs: 0.5, sm: 1.5 },
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: `1px solid ${borderColor}`,
                  background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  transition: "background 0.2s",
                  "&:hover": {
                    background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                  },
                }}
              >
                <Avatar
                  src={currentUser?.photoURL || undefined}
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: currentUser?.photoURL
                      ? undefined
                      : getAvatarColor(currentUser?.displayName || currentUser?.email || ""),
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {!currentUser?.photoURL && avatarLetter}
                </Avatar>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: textColor,
                    display: { xs: "none", sm: "block" },
                    maxWidth: "120px",
                  }}
                >
                  {displayName}
                </Typography>
              </Box>
            </motion.div>

            {/* Dropdown User Menu */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                sx: {
                  mt: 1,
                  background: darkMode ? "#1f1f22" : "#ffffff",
                  color: textColor,
                  borderRadius: "16px",
                  border: darkMode ? `1px solid ${borderColor}` : "1px solid rgba(0, 0, 0, 0.15)",
                  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
                  minWidth: 200,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.2 }}>
                <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, color: textColor }}>
                  {displayName}
                </Typography>
                {displayEmail && (
                  <Typography noWrap sx={{ fontSize: 11.5, color: iconColor, mt: 0.25 }}>
                    {displayEmail}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ borderColor: borderColor }} />
              
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  onOpenProfile?.();
                }}
                sx={{ fontSize: 13.5, py: 1.1, gap: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <AccountCircleOutlinedIcon sx={{ fontSize: 18, color: iconColor }} />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>

              {/* Added Settings Option here */}
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  onOpenSettings?.();
                }}
                sx={{ fontSize: 13.5, py: 1.1, gap: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <SettingsOutlinedIcon sx={{ fontSize: 18, color: iconColor }} />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  onLogout?.();
                }}
                sx={{ fontSize: 13.5, py: 1.1, gap: 1, color: "#f87171" }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <LogoutIcon sx={{ fontSize: 18, color: "#f87171" }} />
                </ListItemIcon>
                <ListItemText primary="Log out" />
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
    </Box>
  );
}
