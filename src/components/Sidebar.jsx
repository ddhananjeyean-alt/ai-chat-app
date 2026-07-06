import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Sidebar({
  darkMode,
  clearChat,
  conversations = [],
  activeChatId,
  setActiveChatId,
  deleteChat,
  archiveChat,
  restoreChat,
  renameChat,
  currentUser,
  onOpenProfile,
  onOpenSettings,
}) {
  console.log("✅ Sidebar Rendered");
  console.log("onOpenProfile:", onOpenProfile);
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  // Tracks whether the Archived Chats section is expanded or collapsed.
  // Persists for as long as the Sidebar stays mounted (i.e. while open).
  const [archivedExpanded, setArchivedExpanded] = useState(true);

  const handleMenuOpen = (event, chatId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedChatId(chatId);
  };

const handleMenuClose = () => {
  setAnchorEl(null);
};

  const handleProfileOpen = (event) => {
    console.log("Profile area clicked");
    event.stopPropagation();
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
  console.log("Profile menu closed");
  setProfileAnchorEl(null);
};

  const handleLogout = async () => {
    handleProfileClose();
    if (logout) {
      try {
        await logout();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Shared search predicate so Active Chats and Archived Chats are
  // filtered identically and search never breaks for either list.
  const chatMatchesSearch = (chat) =>
    chat?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat?.messages?.some((msg) =>
      msg?.text?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const activeChats = conversations.filter(
    (chat) => !chat.archived && chatMatchesSearch(chat)
  );

  const archivedChats = conversations.filter(
    (chat) => chat.archived === true && chatMatchesSearch(chat)
  );

  // Look up the chat currently targeted by the "..." menu so we know
  // whether to show "Archive Chat" or "Restore Chat".
  const selectedChat = conversations.find((c) => c.id === selectedChatId);
  const isSelectedChatArchived = Boolean(selectedChat?.archived);

  const renderChatItem = (chat) => (
    <Box
      key={chat.id}
      onClick={() => setActiveChatId(chat.id)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 0,
        mb: 1,
        borderRadius: "18px",
        cursor: "pointer",
        background:
          activeChatId === chat.id
            ? "rgba(59,130,246,0.25)"
            : darkMode
            ? "rgba(255,255,255,0.08)"
            : "rgba(15,23,42,0.04)",
        border:
          activeChatId === chat.id
            ? "1px solid rgba(59,130,246,0.5)"
            : "1px solid transparent",
        boxSizing: "border-box",
        height: 48,
        width: "100%",
        px: 1.5,
      }}
    >
      {editingChatId === chat.id ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            gap: 0.5,
          }}
        >
          <TextField
            size="small"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                renameChat(chat.id, editedTitle);
                setEditedTitle("");
                setEditingChatId(null);
              }
              if (e.key === "Escape") {
                setEditedTitle("");
                setEditingChatId(null);
              }
            }}
            sx={{
              flex: 1,
              "& .MuiInputBase-input": {
                color: darkMode ? "#fff" : "#000",
                fontSize: 14,
              },
            }}
          />

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              renameChat(chat.id, editedTitle);
              setEditedTitle("");
              setEditingChatId(null);
            }}
          >
            <CheckIcon fontSize="small" color="success" />
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEditingChatId(null);
            }}
          >
            <CloseIcon fontSize="small" color="error" />
          </IconButton>
        </Box>
      ) : (
        <Typography
          sx={{
            color: darkMode ? "white" : "#0f172a",
            fontSize: "14px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {chat.title}
        </Typography>
      )}

      <IconButton
        size="small"
        onClick={(e) => handleMenuOpen(e, chat.id)}
        sx={{
          color: darkMode ? "#94a3b8" : "#475569",
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <Box
      sx={{
        width: 300,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: darkMode ? "#202123" : "#f9fafb",
        borderRight: darkMode ? "1px solid #2d2d2d" : "1px solid #e5e7eb",
        transition: "all .25s ease",
        p: 2,
        pb: 2,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            mb: 2.5,
          }}
        >
          <SmartToyIcon sx={{ color: "#3b82f6", fontSize: 34 }} />
          <Typography
            variant="h6"
            sx={{
              color: darkMode ? "white" : "#0f172a",
              fontWeight: 700,
              letterSpacing: ".3px",
            }}
          >
            AI Chat
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={clearChat}
          sx={{
            borderRadius: "12px",
            py: 1.4,
            mb: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 15,
            background: "#2563eb",
            "&:hover": {
              background: "#1d4ed8",
            },
            minHeight: 48,
            width: "100%",
            boxShadow: "none",
          }}
        >
          New Chat
        </Button>

        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 2,
            background: darkMode ? "#2b2c2f" : "#ffffff",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              height: 44,
              "& fieldset": {
                borderColor: darkMode ? "#3b3b3b" : "#d1d5db",
              },
              "&:hover fieldset": {
                borderColor: "#2563eb",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#2563eb",
              },
            },
            "& .MuiInputBase-input": {
              color: darkMode ? "#fff" : "#111827",
              fontSize: 14,
            },
          }}
        />

        <Typography
          sx={{
            color: darkMode ? "#94a3b8" : "#475569",
            fontWeight: "bold",
            mb: 1,
          }}
        >
          Recent Chats
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          pr: 0.5,
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: darkMode ? "#4b5563" : "#cbd5e1",
            borderRadius: 10,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: darkMode ? "#6b7280" : "#94a3b8",
          },
        }}
      >
        {activeChats.map(renderChatItem)}

        {archivedChats.length > 0 && (
          <>
            <Box
              onClick={() => setArchivedExpanded((prev) => !prev)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                mt: 3,
                mb: 1,
                ml: 1,
                mr: 1,
                userSelect: "none",
                  }}
            >
              <Typography
                sx={{
                  color: darkMode ? "#94a3b8" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Archived Chats
              </Typography>
              {archivedExpanded ? (
                <ExpandLessIcon
                  fontSize="small"
                  sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                />
              ) : (
                <ExpandMoreIcon
                  fontSize="small"
                  sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                />
              )}
            </Box>
            {archivedExpanded && archivedChats.map(renderChatItem)}
          </>
        )}
      </Box>

      <Box
        onClick={handleProfileOpen}
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 3,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          transition: ".2s",
          borderTop: darkMode
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#2563eb",
            width: 42,
            height: 42,
            fontWeight: "bold",
          }}
        >
          {(currentUser?.displayName || currentUser?.email || "?").charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <Typography
            noWrap
            sx={{
              fontWeight: 700,
              color: darkMode ? "#fff" : "#0f172a",
              fontSize: 14,
            }}
          >
{
  currentUser?.displayName ||
  currentUser?.email?.split("@")[0] ||
  "User"
}          </Typography>

          <Typography
            noWrap
            sx={{
              fontSize: 12,
              color: darkMode ? "#94a3b8" : "#64748b",
            }}
          >
            {currentUser?.email || "No email"}
          </Typography>
        </Box>

        <KeyboardArrowUpIcon
          sx={{
            color: darkMode ? "#94a3b8" : "#64748b",
          }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              minWidth: 220,
              mt: 1,
              bgcolor: darkMode ? "#0f172a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#0f172a",
              border: darkMode
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const chat = conversations.find((c) => c.id === selectedChatId);
            setEditedTitle(chat?.title || "");
            setEditingChatId(selectedChatId);
            handleMenuClose();
          }}
          sx={{
            gap: 1.5,
            backgroundColor: "transparent",
            color: darkMode ? "#ffffff" : "#0f172a",
            "&:hover": {
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
            },
          }}
        >
          <EditIcon fontSize="small" />
          Rename Chat
        </MenuItem>

        <MenuItem
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSelectedChatArchived) {
      restoreChat(selectedChatId);
    } else {
      archiveChat(selectedChatId);
    }

    handleMenuClose();
  }}
  sx={{
    gap: 1.5,
    backgroundColor: "transparent",
    color: darkMode ? "#ffffff" : "#0f172a",
    "&:hover": {
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.05)",
    },
  }}
>
  {isSelectedChatArchived ? (
    <UnarchiveIcon fontSize="small" />
  ) : (
    <ArchiveIcon fontSize="small" />
  )}
  {isSelectedChatArchived ? "Restore Chat" : "Archive Chat"}
</MenuItem>
        <MenuItem
          onClick={() => {
            deleteChat(selectedChatId);
            handleMenuClose();
          }}
          sx={{
            gap: 1.5,
            backgroundColor: "transparent",
            color: "#ef4444",
            "&:hover": {
              backgroundColor: darkMode
                ? "rgba(239,68,68,0.15)"
                : "rgba(239,68,68,0.08)",
            },
          }}
        >
          <DeleteIcon fontSize="small" />
          Delete Chat
        </MenuItem>
      </Menu>

      <Menu
  anchorEl={profileAnchorEl}
  open={true}
        onClose={handleProfileClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              minWidth: 230,
              bgcolor: darkMode ? "#0f172a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#0f172a",
              border: darkMode
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",
            },
          },
        }}
      >
<MenuItem
  onClick={() => {
    console.log("✅ My Profile MenuItem Clicked");
    handleProfileClose();

    console.log("✅ Calling onOpenProfile");
    onOpenProfile?.();
  }}
>
  <AccountCircleOutlinedIcon sx={{ mr: 1.5 }} fontSize="small" />
  My Profile
</MenuItem>
<MenuItem
  onClick={() => {
    console.log("My Profile clicked");
    handleProfileClose();
    onOpenProfile?.();
  }}
>         <SettingsOutlinedIcon sx={{ mr: 1.5 }} fontSize="small" />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "#ef4444" }}>
          <LogoutOutlinedIcon sx={{ mr: 1.5 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Sidebar;