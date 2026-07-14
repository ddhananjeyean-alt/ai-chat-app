import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Stack, IconButton, Divider, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RestoreIcon from "@mui/icons-material/Restore";
import { motion, AnimatePresence } from "framer-motion";

import { COLORS } from "./SidebarConstants";
import { panelVariants } from "./SidebarAnimations";
import SearchPanel from "./SearchPanel";
import RecentChatsPanel from "./RecentChatsPanel";
import ChatItem from "./ChatItem";

export default function SidebarPanel({
  activeSection = "search",
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onArchiveChat,
  onRestoreChat,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenProfile,
  onOpenSettings,
  onOpenMenu,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [sharedChats, setSharedChats] = useState([]);

  // Load shared chats from localStorage when shared section becomes active
  useEffect(() => {
    if (activeSection === "shared") {
      try {
        const stored = JSON.parse(localStorage.getItem("sharedChats")) || {};
        const list = Object.entries(stored).map(([shareId, chat]) => ({
          shareId,
          id: chat.id,
          title: chat.title || "Shared Chat",
        }));
        setSharedChats(list);
      } catch (e) {
        setSharedChats([]);
      }
    }
  }, [activeSection]);

  const handleCopyShareLink = (shareId) => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Share link copied!\n\n${shareUrl}`);
  };

  // Renders the welcome view for the "New Chat" wheel section
  const renderWelcomePanel = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: isLight ? "rgba(59, 130, 246, 0.06)" : "rgba(116, 220, 255, 0.06)",
          border: isLight ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(116, 220, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2.5,
          boxShadow: isLight ? "0 0 15px rgba(59, 130, 246, 0.1)" : "0 0 15px rgba(116, 220, 255, 0.15)",
        }}
      >
        <AddIcon sx={{ color: isLight ? theme.palette.primary.main : COLORS.active, fontSize: 28 }} />
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: COLORS.text,
          fontWeight: 700,
          mb: 1.5,
          fontFamily: "Inter, sans-serif",
        }}
      >
        New Session
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: COLORS.subText,
          lineHeight: 1.5,
          mb: 4,
          fontSize: 13,
        }}
      >
        Start a fresh thread with your AI companion to analyze images, generate art, or chat.
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onNewChat}
        sx={{
          background: isLight ? theme.palette.primary.main : COLORS.active,
          color: isLight ? "#ffffff" : "#0f0f10",
          fontWeight: 600,
          px: 3,
          py: 1.2,
          borderRadius: "12px",
          textTransform: "none",
          boxShadow: isLight ? "0 4px 15px rgba(59, 130, 246, 0.2)" : "0 4px 15px rgba(116, 220, 255, 0.3)",
          "&:hover": {
            background: isLight ? theme.palette.primary.dark : "#5ecae6",
            boxShadow: isLight ? "0 6px 20px rgba(59, 130, 246, 0.3)" : "0 6px 20px rgba(116, 220, 255, 0.4)",
          },
        }}
      >
        Create New Chat
      </Button>
    </Box>
  );

  // Renders the Archived Chats Panel
  const renderArchivedPanel = () => {
    const archivedChats = chats.filter((chat) => chat.archived);
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography
          sx={{
            color: COLORS.text,
            fontSize: 20,
            fontWeight: 700,
            mb: 2,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Archived Chats
        </Typography>
        <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
          <AnimatePresence initial={false}>
            {archivedChats.length === 0 ? (
              <Typography
                sx={{
                  mt: 4,
                  color: COLORS.subText,
                  textAlign: "center",
                  fontSize: 13,
                }}
              >
                No archived chats
              </Typography>
            ) : (
              archivedChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  selected={currentChatId === chat.id}
                  onClick={() => onSelectChat?.(chat.id)}
                  onMenu={onOpenMenu}
                />
              ))
            )}
          </AnimatePresence>
        </Box>
      </Box>
    );
  };

  // Renders the Shared Chats Panel
  const renderSharedPanel = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography
        sx={{
          color: COLORS.text,
          fontSize: 20,
          fontWeight: 700,
          mb: 2,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Shared Chats
      </Typography>
      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
        {sharedChats.length === 0 ? (
          <Typography
            sx={{
              mt: 4,
              color: COLORS.subText,
              textAlign: "center",
              fontSize: 13,
            }}
          >
            No shared links created
          </Typography>
        ) : (
          sharedChats.map((chat) => (
            <Box
              key={chat.shareId}
              sx={{
                p: 1.5,
                mb: 1.5,
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: COLORS.text,
                    mb: 0.25,
                  }}
                >
                  {chat.title}
                </Typography>
                <Typography noWrap sx={{ fontSize: 10.5, color: COLORS.subText }}>
                  ID: {chat.shareId.substring(0, 8)}...
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => handleCopyShareLink(chat.shareId)}
                  sx={{
                    color: COLORS.subText,
                    "&:hover": { color: COLORS.text, bgcolor: "rgba(255,255,255,0.04)" },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {chats.some((c) => c.id === chat.id) && (
                  <IconButton
                    size="small"
                    onClick={() => onSelectChat?.(chat.id)}
                    sx={{
                      color: COLORS.active,
                      "&:hover": { bgcolor: "rgba(116,220,255,0.06)" },
                    }}
                  >
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );

  // Renders Settings Options
  const renderSettingsPanel = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography
        sx={{
          color: COLORS.text,
          fontSize: 20,
          fontWeight: 700,
          mb: 3,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Settings
      </Typography>

      <Stack spacing={2}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsOutlinedIcon />}
          onClick={onOpenSettings}
          sx={{
            borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            color: COLORS.text,
            textTransform: "none",
            borderRadius: "12px",
            py: 1.2,
            justifyContent: "flex-start",
            px: 2,
            "&:hover": {
              borderColor: isLight ? theme.palette.primary.main : COLORS.active,
              background: isLight ? "rgba(59, 130, 246, 0.04)" : "rgba(116, 220, 255, 0.04)",
            },
          }}
        >
          Open App Settings
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<AccountCircleOutlinedIcon />}
          onClick={onOpenProfile}
          sx={{
            borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            color: COLORS.text,
            textTransform: "none",
            borderRadius: "12px",
            py: 1.2,
            justifyContent: "flex-start",
            px: 2,
            "&:hover": {
              borderColor: isLight ? theme.palette.primary.main : COLORS.active,
              background: isLight ? "rgba(59, 130, 246, 0.04)" : "rgba(116, 220, 255, 0.04)",
            },
          }}
        >
          View Profile Details
        </Button>
      </Stack>

      <Box sx={{ mt: "auto", textAlign: "center", pb: 2 }}>
        <Typography sx={{ fontSize: 11, color: COLORS.subText }}>
          AI Chat Assistant v1.2.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      className="ai-sidebar-panel"
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Dynamic Content Panel Area */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {activeSection === "new_chat" && renderWelcomePanel()}
        {activeSection === "search" && (
          <SearchPanel
            chats={chats}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentChatId={currentChatId}
            onSelectChat={onSelectChat}
            onOpenMenu={onOpenMenu}
          />
        )}
        {activeSection === "recent" && (
          <RecentChatsPanel
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={onSelectChat}
            onOpenMenu={onOpenMenu}
          />
        )}
        {activeSection === "archived" && renderArchivedPanel()}
        {activeSection === "shared" && renderSharedPanel()}
        {activeSection === "settings" && renderSettingsPanel()}
      </Box>
    </Box>
  );
}