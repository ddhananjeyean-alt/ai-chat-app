import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  InputBase,
  List,
  ListItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

export default function ArchivedChatsDialog({
  open,
  onClose,
  chats = [],
  onRestore,
  onDeletePermanently,
}) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === "dark";
  const [searchQuery, setSearchQuery] = useState("");

  const archivedChats = useMemo(() => {
    return chats.filter((chat) => chat.archived);
  }, [chats]);

  const filteredChats = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return archivedChats;
    return archivedChats.filter((chat) =>
      (chat.title || "Untitled Conversation").toLowerCase().includes(query)
    );
  }, [archivedChats, searchQuery]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          background: darkMode ? "rgba(18, 20, 29, 0.75)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: darkMode 
            ? "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(121, 248, 255, 0.05)" 
            : "0 20px 50px rgba(0, 0, 0, 0.06), 0 0 30px rgba(37, 99, 235, 0.02)",
          color: theme.palette.text.primary,
          overflow: "hidden",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ m: 0, p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Inventory2OutlinedIcon sx={{ color: darkMode ? "#79f8ff" : theme.palette.primary.main }} />
          <Typography sx={{ fontWeight: 700, fontSize: 17, fontFamily: "Inter, sans-serif" }}>
            Archived Conversations
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            borderRadius: "10px",
            background: darkMode ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
            "&:hover": {
              background: darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 2.5, pt: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Search Bar (frosted glass) */}
        {archivedChats.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: 48,
              borderRadius: "14px",
              background: darkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              border: darkMode ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
              px: 2,
              boxSizing: "border-box",
            }}
          >
            <SearchOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1.5 }} />
            <InputBase
              placeholder="Search archived chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                fontSize: 14,
                color: theme.palette.text.primary,
                "& .MuiInputBase-input": {
                  padding: 0,
                  "&::placeholder": {
                    color: theme.palette.text.secondary,
                    opacity: 0.7,
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Scrollable List */}
        <Box sx={{ maxHeight: 340, minHeight: 180, overflowY: "auto", pr: 0.5 }}>
          {filteredChats.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                gap: 1.5,
              }}
            >
              <Inventory2OutlinedIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.text.secondary,
                  opacity: 0.25,
                }}
              />
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: theme.palette.text.secondary }}>
                {searchQuery.trim() ? "No matching conversations" : "No archived conversations"}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              <AnimatePresence initial={false}>
                {filteredChats.map((chat) => (
                  <ListItem
                    key={chat.id}
                    component={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1.5,
                      px: 2,
                      mb: 1,
                      borderRadius: "14px",
                      background: darkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.01)",
                      border: darkMode ? "1px solid rgba(255, 255, 255, 0.03)" : "1px solid rgba(0, 0, 0, 0.02)",
                      "&:hover": {
                        background: darkMode ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1, pr: 2 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {chat.title || "Untitled Conversation"}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 11,
                          color: theme.palette.text.secondary,
                          opacity: 0.8,
                          mt: 0.25,
                        }}
                      >
                        {chat.messages?.length || 0} messages
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Tooltip title="Restore Conversation">
                        <IconButton
                          onClick={() => onRestore?.(chat.id)}
                          sx={{
                            color: darkMode ? "#79f8ff" : theme.palette.primary.main,
                            borderRadius: "10px",
                            background: darkMode ? "rgba(121, 248, 255, 0.05)" : "rgba(37, 99, 235, 0.05)",
                            "&:hover": {
                              background: darkMode ? "rgba(121, 248, 255, 0.12)" : "rgba(37, 99, 235, 0.12)",
                            },
                          }}
                        >
                          <SettingsBackupRestoreRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Permanently">
                        <IconButton
                          onClick={() => {
                            if (window.confirm("Are you sure you want to permanently delete this conversation? This cannot be undone.")) {
                              onDeletePermanently?.(chat.id);
                            }
                          }}
                          sx={{
                            color: "#ff6b6b",
                            borderRadius: "10px",
                            background: "rgba(255, 107, 107, 0.05)",
                            "&:hover": {
                              background: "rgba(255, 107, 107, 0.12)",
                            },
                          }}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
