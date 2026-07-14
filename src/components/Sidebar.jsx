import React from "react";
import {
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

export default function UserMenu({
  anchorEl,
  open,
  darkMode,
  onClose,
  onProfile,
  onSettings,
  onLogout,
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
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
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          },
        },
      }}
    >
      <MenuItem onClick={onProfile}>
        <ListItemIcon>
          <AccountCircleOutlinedIcon
            fontSize="small"
            sx={{
              color: darkMode ? "#ffffff" : "#0f172a",
            }}
          />
        </ListItemIcon>

        <ListItemText primary="My Profile" />
      </MenuItem>

      <MenuItem onClick={onSettings}>
        <ListItemIcon>
          <SettingsOutlinedIcon
            fontSize="small"
            sx={{
              color: darkMode ? "#ffffff" : "#0f172a",
            }}
          />
        </ListItemIcon>

        <ListItemText primary="Settings" />
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={onLogout}
        sx={{
          color: "#ef4444",
        }}
      >
        <ListItemIcon>
          <LogoutOutlinedIcon
            fontSize="small"
            sx={{
              color: "#ef4444",
            }}
          />
        </ListItemIcon>

        <ListItemText primary="Logout" />
      </MenuItem>
    </Menu>
  );
}