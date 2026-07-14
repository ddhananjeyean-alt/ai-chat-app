import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useTheme,
} from "@mui/material";

import SidebarWheel from "./SidebarWheel";
import ChatMenu from "./ChatMenu";
import "./sidebar.css";

export default function Sidebar({
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onArchiveChat,
  onRestoreChat,
  currentUser,
  onOpenProfile,
  onOpenSettings,
}) {
  const theme = useTheme();

  // Context menu state for individual chat settings
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeMenuChat, setActiveMenuChat] = useState(null);

  const handleOpenMenu = (anchorEl, chat) => {
    setMenuAnchor(anchorEl);
    setActiveMenuChat(chat);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveMenuChat(null);
  };

  // Rename Dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [chatToRename, setChatToRename] = useState(null);

  const handleOpenRenameDialog = (chat) => {
    setChatToRename(chat);
    setRenameTitle(chat.title || "New Chat");
    setRenameDialogOpen(true);
  };

  const handleCloseRenameDialog = () => {
    setRenameDialogOpen(false);
    setRenameTitle("");
    setChatToRename(null);
  };

  const handleSaveRename = () => {
    const trimmed = renameTitle.trim();
    if (trimmed && chatToRename && onRenameChat) {
      onRenameChat(chatToRename.id, trimmed);
    }
    handleCloseRenameDialog();
  };

  const sidebarWidth = 320;

  return (
    <Box
      className="ai-sidebar"
      sx={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        height: "100vh",
        position: "relative",
        boxSizing: "border-box",
        overflow: "visible", // Allows floating popovers inside nested boxes to overlap correctly
        flexShrink: 0,
        background: theme.palette.mode === "dark" ? "rgba(13, 15, 23, 0.22)" : "rgba(240, 245, 251, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "none",
        zIndex: 100,
      }}
    >
      {/* Dedicated Left Sidebar Region for the Semicircular Dial (zIndex: 10) */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          width: sidebarWidth,
          height: "100%",
          zIndex: 10,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <SidebarWheel
          selected={currentChatId || "search"}
          onChange={onSelectChat}
          chats={chats}
          onOpenMenu={handleOpenMenu}
        />
      </Box>

      {/* Action Popups & Overlays */}
      <ChatMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        chat={activeMenuChat}
        onRename={handleOpenRenameDialog}
        onArchive={(chat) => onArchiveChat?.(chat.id)}
        onRestore={(chat) => onRestoreChat?.(chat.id)}
        onDelete={(chat) => onDeleteChat?.(chat.id)}
      />

      {/* Premium MUI Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={handleCloseRenameDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: theme.palette.mode === "dark" ? "#1f1f22" : "#ffffff",
            border: theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
            color: theme.palette.text.primary,
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, fontSize: 16 }}>
          Rename Conversation
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            variant="outlined"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename();
              if (e.key === "Escape") handleCloseRenameDialog();
            }}
            InputLabelProps={{
              sx: {
                color: theme.palette.text.secondary,
                "&.Mui-focused": { color: "#74dcff" },
              },
            }}
            InputProps={{
              sx: {
                color: theme.palette.text.primary,
                borderRadius: "10px",
                bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#74dcff",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCloseRenameDialog}
            sx={{
              color: theme.palette.text.secondary,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRename}
            variant="contained"
            sx={{
              bgcolor: "#74dcff",
              color: "#0f0f10",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(116, 220, 255, 0.2)",
              "&:hover": {
                bgcolor: "#5ecae6",
                boxShadow: "0 6px 16px rgba(116, 220, 255, 0.3)",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
