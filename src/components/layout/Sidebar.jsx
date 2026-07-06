import React, { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
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
  };

  const commitRename = (chatId) => {
    if (renameValue.trim() && onRenameChat) {
      onRenameChat(chatId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDelete = (chatId) => {
    if (onDeleteChat) onDeleteChat(chatId);
    handleRowMenuClose();
  };

  const handleArchive = (chatId) => {
    if (onArchiveChat) onArchiveChat(chatId);
    handleRowMenuClose();
  };

  const handleLogoutClick = async () => {
    handleUserMenuClose();
    if (onLogout) {
      onLogout();
    } else {
      await signOut(auth);
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
        background: "#171717",
        color: "#ECECEC",
        fontFamily:
          '"Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        borderRight: "1px solid rgba(255,255,255,0.05)",
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
              background: "#ffffff",
            }}
          >
            <ChatOutlinedIcon sx={{ fontSize: 16, color: "#171717" }} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#ECECEC" }}>
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
              "&:hover": { background: "#2A2A2A" },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>New chat</Typography>
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
            "&:hover": { background: "#2A2A2A" },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }} />
          <InputBase
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            sx={{
              fontSize: 14,
              color: "#ECECEC",
              flex: 1,
              "& input::placeholder": {
                color: "rgba(255,255,255,0.45)",
                opacity: 1,
              },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 1 }} />

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
            background: "rgba(255,255,255,0.18)",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "transparent transparent",
        }}
      >
        {filteredChats.length === 0 && (
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
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
                    height: 40,
                    px: 1,
                    mb: 0.25,
                    borderRadius: "14px",
                    cursor: "pointer",
                    background: isSelected ? "#2F2F2F" : "transparent",
                    transition: "background 0.15s ease",
                    "&:hover": {
                      background: isSelected ? "#2F2F2F" : "#2A2A2A",
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
                            color: "#ECECEC",
                            py: 0,
                          },
                        }}
                      />
                      <IconButton size="small" onClick={() => commitRename(chat.id)}>
                        <CheckIcon sx={{ fontSize: 16, color: "#ECECEC" }} />
                      </IconButton>
                      <IconButton size="small" onClick={cancelRename}>
                        <CloseIcon sx={{ fontSize: 16, color: "#ECECEC" }} />
                      </IconButton>
                    </Stack>
                  ) : (
                    <>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 14,
                          color: "#ECECEC",
                          flex: 1,
                          pr: 3.5,
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
                          color: "rgba(255,255,255,0.7)",
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
    color: darkMode ? "#ECECEC" : "#111827",
    borderRadius: "14px",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.08)",
    minWidth: 220,
  },
}}
      >
        <MenuItem
          onClick={() => {
            const chat = chats.find((c) => c.id === activeChatId);
            if (chat) startRename(chat);
          }}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: "#333333" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <EditOutlinedIcon sx={{ fontSize: 18, color: "#ECECEC" }} />
          </ListItemIcon>
          <ListItemText primary="Rename" />
        </MenuItem>
        <MenuItem
          onClick={() => handleArchive(activeChatId)}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: "#333333" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 18, color: "#ECECEC" }} />
          </ListItemIcon>
          <ListItemText primary="Archive" />
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(activeChatId)}
          sx={{ fontSize: 14, gap: 1, color: "#F87171", "&:hover": { background: "#333333" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: "#F87171" }} />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 1 }} />

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
              "&:hover": { background: "#2A2A2A" },
            }}
          >
           <Avatar
  src={currentUser?.photoURL || undefined}
>
  {!currentUser?.photoURL && avatarLetter}
</Avatar>
            <Box sx={{ overflow: "hidden", flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 500, color: "#ECECEC" }}>
                {displayName}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
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
            background: "#2A2A2A",
            color: "#ECECEC",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
            minWidth: 220,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.2 }}>
          <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {displayEmail}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            onOpenProfile && onOpenProfile();
          }}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: "#333333" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <AccountCircleOutlinedIcon
  sx={{
    fontSize: 18,
    color: darkMode ? "#ECECEC" : "#6B7280",
  }}
/>
          </ListItemIcon>
          <ListItemText
  primary="Profile"
  primaryTypographyProps={{
    sx: {
      color: darkMode ? "#ECECEC" : "#111827",
    },
  }}
/>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            onOpenSettings && onOpenSettings();
          }}
          sx={{ fontSize: 14, gap: 1, "&:hover": { background: "#333333" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <SettingsOutlinedIcon
  sx={{
    fontSize: 18,
    color: darkMode ? "#ECECEC" : "#6B7280",
  }}
/>
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
        <MenuItem
          onClick={handleLogoutClick}
          sx={{ fontSize: 14, gap: 1, color: "#F87171", "&:hover": { background: "#333333" } }}
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
