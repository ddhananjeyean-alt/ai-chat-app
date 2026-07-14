import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from "@mui/material";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";

import { COLORS } from "./SidebarConstants";

export default function ChatMenu({
  anchorEl,
  open,
  onClose,
  chat,
  onRename,
  onArchive,
  onRestore,
  onDelete,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const isArchived = chat?.archived || false;

  const textColor = theme.palette.text.primary;
  const hoverBg = isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.06)";
  const dividerColor = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)";

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      elevation={0}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          mt: 0.6,
          minWidth: 200,
          borderRadius: "14px",
          overflow: "hidden",
          background: isLight ? "rgba(255, 255, 255, 0.96)" : "rgba(30, 30, 32, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: isLight ? "0 10px 30px rgba(0, 0, 0, 0.08)" : "0 10px 30px rgba(0, 0, 0, 0.5)",
          color: textColor,
        },
      }}
    >
      {/* Rename (Only visible if the chat is NOT archived) */}
      {!isArchived && (
        <MenuItem
          onClick={() => {
            onRename?.(chat);
            onClose?.();
          }}
          sx={{
            py: 1,
            "&:hover": {
              bgcolor: hoverBg,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <EditRoundedIcon sx={{ color: textColor, fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Rename"
            primaryTypographyProps={{ fontSize: 13.5 }}
          />
        </MenuItem>
      )}

      {/* Archive / Restore Toggle */}
      {isArchived ? (
        <MenuItem
          onClick={() => {
            onRestore?.(chat);
            onClose?.();
          }}
          sx={{
            py: 1,
            "&:hover": {
              bgcolor: hoverBg,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SettingsBackupRestoreRoundedIcon sx={{ color: textColor, fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Restore"
            primaryTypographyProps={{ fontSize: 13.5 }}
          />
        </MenuItem>
      ) : (
        <MenuItem
          onClick={() => {
            onArchive?.(chat);
            onClose?.();
          }}
          sx={{
            py: 1,
            "&:hover": {
              bgcolor: hoverBg,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Inventory2OutlinedIcon sx={{ color: textColor, fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Archive"
            primaryTypographyProps={{ fontSize: 13.5 }}
          />
        </MenuItem>
      )}

      <Divider sx={{ borderColor: dividerColor, my: 0.5 }} />

      {/* Delete */}
      <MenuItem
        onClick={() => {
          onDelete?.(chat);
          onClose?.();
        }}
        sx={{
          py: 1,
          "&:hover": {
            bgcolor: isLight ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 70, 70, 0.1)",
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <DeleteOutlineRoundedIcon sx={{ color: isLight ? "#ef4444" : "#ff6b6b", fontSize: 18 }} />
        </ListItemIcon>
        <ListItemText
          primary="Delete"
          primaryTypographyProps={{
            fontSize: 13.5,
            color: isLight ? "#ef4444" : "#ff6b6b",
            fontWeight: 500,
          }}
        />
      </MenuItem>
    </Menu>
  );
}