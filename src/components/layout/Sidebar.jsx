import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { RenameEvents } from "../../companion/byte/RenameEvents";

export default function Sidebar({
  darkMode,
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onArchiveChat,
  searchQuery,
  setSearchQuery,
  currentUser,
  onLogout,
  onOpenSettings,
  onOpenProfile,
}) 
{ console.log("Sidebar currentUser:", currentUser);
  console.log("Sidebar onOpenProfile:", onOpenProfile);
  const [rowMenuAnchor, setRowMenuAnchor] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleRowMenuOpen = (e, chatId) => {
    e.stopPropagation();
    setRowMenuAnchor(e.currentTarget);
    setActiveChatId(chatId);
  };

  const handleRowMenuClose = () => {
    setRowMenuAnchor(null);
    setActiveChatId(null);
  };

  const handleUserMenuOpen = (e) => {
    setUserMenuAnchor(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const startRename = (chat) => {
    setRenamingId(chat.id);
    setRenameValue(chat.title || "");
    handleRowMenuClose();
    
    // Give a short tick for the input box to render in the DOM, then capture its coordinates
    setTimeout(() => {
      const container = document.querySelector(".active-rename-container");
      if (container) {
        const rect = container.getBoundingClientRect();
        const coords = { x: rect.left + rect.width - 50, y: rect.top + rect.height / 2 };
        RenameEvents.publish(RenameEvents.TRIGGER, { chatId: chat.id, coords });
      }
    }, 60);
  };

  const commitRename = (chatId) => {
    if (renameValue.trim() && onRenameChat) {
      onRenameChat(chatId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
    RenameEvents.publish(RenameEvents.CONFIRM, { chatId });
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
    RenameEvents.publish(RenameEvents.CANCEL);
  };

  const handleDelete = (chatId) => {
    if (onDeleteChat) onDeleteChat(chatId);
    handleRowMenuClose();
  };

  const handleArchive = (chatId) => {
    if (onArchiveChat) onArchiveChat(chatId);
    handleRowMenuClose();
  };

  const handleLogoutClick = () => {
    handleUserMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  const filteredChats = searchQuery
    ? chats.filter((c) =>
        (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

const displayName =
  currentUser?.displayName?.trim() ||
  currentUser?.email?.split("@")[0] ||
  "User";

const displayEmail = currentUser?.email || "";

const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <Box
      sx={{
        width: 280,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: darkMode ? "#171717" : "rgba(255, 255, 255, 0.65)",
        color: darkMode ? "#ECECEC" : "#1F2937",
        backdropFilter: darkMode ? "none" : "blur(24px)",
        WebkitBackdropFilter: darkMode ? "none" : "blur(24px)",
        boxShadow: darkMode ? "none" : "0 8px 32px rgba(31, 41, 55, 0.05)",
        fontFamily:
          '"Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        borderRight: darkMode
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(255, 255, 255, 0.7)",
      }}
    >
      <Box sx={{ px: 1, pt: 1.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: darkMode ? "#ffffff" : "#1F2937",
            }}
          >
            <ChatOutlinedIcon sx={{ fontSize: 16, color: darkMode ? "#171717" : "#ffffff" }} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: darkMode ? "#ECECEC" : "#1F2937" }}>
            Ai Chat Assistent
          </Typography>
        </Stack>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Box
            onClick={onNewChat}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onNewChat && onNewChat()}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: 40,
              px: 1,
              borderRadius: "14px",
              cursor: "pointer",
              transition: "background 0.15s ease",
              "&:hover": { background: darkMode ? "#2A2A2A" : "rgba(0,0,0,0.03)" },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                border: darkMode ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: darkMode ? "#ECECEC" : "#1F2937" }}>New chat</Typography>
          </Box>
        </motion.div>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            height: 40,
            px: 1,
            mt: 0.5,
            borderRadius: "14px",
            background: "transparent",
            transition: "background 0.15s ease",
            "&:hover": { background: darkMode ? "#2A2A2A" : "rgba(0,0,0,0.02)" },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)" }} />
          <InputBase
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filteredChats.length > 0) {
                  onSelectChat?.(filteredChats[0].id);
                }
              }
            }}
            sx={{
              fontSize: 14,
              color: darkMode ? "#ECECEC" : "#1F2937",
              flex: 1,
              "& input::placeholder": {
                color: darkMode ? "rgba(255,255,255,0.45)" : "#8A94A6",
                opacity: 1,
              },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", mx: 1 }} />

      <Box
        className="sidebar-scroll"
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1,
          py: 1,
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            background: "transparent",
            borderRadius: 10,
          },
          "&:hover::-webkit-scrollbar-thumb": {
            background: darkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "transparent transparent",
        }}
      >
        {filteredChats.length === 0 && (
          <Typography
            sx={{
              fontSize: 13,
              color: darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              px: 1,
              py: 2,
              textAlign: "center",
            }}
          >
            No chats found
          </Typography>
        )}

        <AnimatePresence initial={false}>
          {filteredChats.map((chat) => {
            const isSelected = chat.id === currentChatId;
            const isRenaming = renamingId === chat.id;
            return (
              <motion.div
                key={chat.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Box
                  onClick={() => !isRenaming && onSelectChat && onSelectChat(chat.id)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    minHeight: 40,
                    py: 1,
                    px: 1,
                    mb: 0.25,
                    borderRadius: "14px",
                    cursor: "pointer",
                    background: isSelected ? (darkMode ? "#2F2F2F" : "#EEF6FF") : "transparent",
                    transition: "background 0.15s ease",
                    "&:hover": {
                      background: isSelected ? (darkMode ? "#2F2F2F" : "#EEF6FF") : (darkMode ? "#2A2A2A" : "rgba(0,0,0,0.03)"),
                    },
                    "&:hover .row-menu-btn": {
                      opacity: 1,
                    },
                  }}
                >
                  {isRenaming ? (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ width: "100%" }}
                      onClick={(e) => e.stopPropagation()}
                      className="active-rename-container"
                    >
                      <TextField
                        inputRef={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(chat.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                        variant="standard"
                        fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          fontSize: 14,
                          "& .MuiInputBase-input": {
                            fontSize: 14,
                            color: darkMode ? "#ECECEC" : "#1F2937",
                            py: 0,
                          },
                        }}
                      />
                      <IconButton size="small" onClick={() => commitRename(chat.id)}>
                        <CheckIcon sx={{ fontSize: 16, color: darkMode ? "#ECECEC" : "#1F2937" }} />
                      </IconButton>
                      <IconButton size="small" onClick={cancelRename}>
                        <CloseIcon sx={{ fontSize: 16, color: darkMode ? "#ECECEC" : "#1F2937" }} />
                      </IconButton>
                    </Stack>
                  ) : (
                    <>
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: darkMode ? "#ECECEC" : "#1F2937",
                          flex: 1,
                          pr: 3.5,
                          whiteSpace: "normal",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 3,
                          wordBreak: "normal",
                          overflowWrap: "break-word",
                          lineHeight: 1.35,
                        }}
                      >
                        {chat.title || "New chat"}
                      </Typography>
                      <IconButton
                        className="row-menu-btn"
                        size="small"
                        onClick={(e) => handleRowMenuOpen(e, chat.id)}
                        sx={{
                          position: "absolute",
                          right: 4,
                          opacity: isSelected ? 1 : 0,
                          transition: "opacity 0.15s ease",
                          color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)",
                        }}
                      >
                        <MoreHorizIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </>
                  )}
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={handleRowMenuClose}
        PaperProps={{
  sx: {
    background: darkMode ? "#2A2A2A" : "#FFFFFF",
    color: darkMode ? "#ECECEC" : "#1F2937",
    borderRadius: "14px",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: darkMode ? "none" : "0 8px 24px rgba(31, 41, 55, 0.06)",
    minWidth: 220,
  },
}}
      >
        <MenuItem
          onClick={() => {
            const chat = chats.find((c) => c.id === activeChatId);
            if (chat) startRename(chat);
          }}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: darkMode ? "#333333" : "rgba(0,0,0,0.04)" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <EditOutlinedIcon sx={{ fontSize: 18, color: darkMode ? "#ECECEC" : "#475467" }} />
          </ListItemIcon>
          <ListItemText primary="Rename" />
        </MenuItem>
        <MenuItem
          onClick={() => handleArchive(activeChatId)}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: darkMode ? "#333333" : "rgba(0,0,0,0.04)" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 18, color: darkMode ? "#ECECEC" : "#475467" }} />
          </ListItemIcon>
          <ListItemText primary="Archive" />
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(activeChatId)}
          sx={{ fontSize: 14, gap: 1, color: "#F87171", "&:hover": { background: darkMode ? "#333333" : "rgba(0,0,0,0.04)" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: "#F87171" }} />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      <Divider sx={{ borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", mx: 1 }} />

      <Box sx={{ px: 1, py: 1 }}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Box
            onClick={handleUserMenuOpen}
            role="button"
            tabIndex={0}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              height: 48,
              px: 1,
              borderRadius: "14px",
              cursor: "pointer",
              transition: "background 0.15s ease",
              "&:hover": { background: darkMode ? "#2A2A2A" : "rgba(0,0,0,0.03)" },
            }}
          >
           <Avatar
  src={currentUser?.photoURL || undefined}
>
  {!currentUser?.photoURL && avatarLetter}
</Avatar>
            <Box sx={{ overflow: "hidden", flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 500, color: darkMode ? "#ECECEC" : "#1F2937" }}>
                {displayName}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                {displayEmail}
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        PaperProps={{
          sx: {
            background: darkMode ? "#2A2A2A" : "#FFFFFF",
            color: darkMode ? "#ECECEC" : "#1F2937",
            borderRadius: "14px",
            border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
            boxShadow: darkMode ? "none" : "0 8px 24px rgba(31, 41, 55, 0.06)",
            minWidth: 220,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.2 }}>
          <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
            {displayEmail}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            onOpenProfile && onOpenProfile();
          }}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: darkMode ? "#333333" : "rgba(0,0,0,0.04)" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <AccountCircleOutlinedIcon
  sx={{
    fontSize: 18,
    color: darkMode ? "#ECECEC" : "#475467",
  }}
/>
          </ListItemIcon>
          <ListItemText
  primary="Profile"
  primaryTypographyProps={{
    sx: {
      color: darkMode ? "#ECECEC" : "#1F2937",
    },
  }}
/>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            onOpenSettings && onOpenSettings();
          }}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: darkMode ? "#333333" : "rgba(0,0,0,0.04)" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <SettingsOutlinedIcon
  sx={{
    fontSize: 18,
    color: darkMode ? "#ECECEC" : "#475467",
  }}
/>
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider sx={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />
        <MenuItem
          onClick={handleLogoutClick}
          sx={{ fontSize: 14, gap: 1, color: "#F87171", "&:hover": { background: darkMode ? "#333333" : "rgba(0,0,0,0.04)" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <LogoutIcon sx={{ fontSize: 18, color: "#F87171" }} />
          </ListItemIcon>
          <ListItemText primary="Log out" />
        </MenuItem>
      </Menu>
    </Box>
  );
}
