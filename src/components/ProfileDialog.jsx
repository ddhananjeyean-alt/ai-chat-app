import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  TextField,
  Snackbar,
  Alert,
  Stack,
  IconButton,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";

export default function ProfileDialog({
  open,
  onClose,
  currentUser,
}) {
  const { logout, updateUsername } = useAuth();
  console.log("Profile Current User:", currentUser);
  const navigate = useNavigate();
  const theme = useTheme();

  const [editOpen, setEditOpen] = useState(false);
  console.log("editOpen =", editOpen);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const displayName = currentUser?.displayName
    ? currentUser.displayName
    : currentUser?.email
    ? currentUser.email.split("@")[0]
    : "User";
  console.log("Display Name:", displayName);
  const email = currentUser?.email || "No email available";

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleOpenEdit = () => {
    console.log("handleOpenEdit called");
    setNewUsername(displayName);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed) {
      setSnackbar({
        open: true,
        message: "Username cannot be empty",
        severity: "error",
      });
      return;
    }

    try {
      setSavingUsername(true);
      await updateUsername(trimmed);
      setEditOpen(false);
      setSnackbar({
        open: true,
        message: "Username updated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.message || "Failed to update username",
        severity: "error",
      });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleOpenSwitchAccount = () => {
    setSwitchAccountOpen(true);
  };

  const handleCloseSwitchAccount = () => {
    setSwitchAccountOpen(false);
  };

  const handleConfirmSwitchAccount = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setSwitchAccountOpen(false);
      onClose();
      navigate("/login");
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.message || "Failed to log out",
        severity: "error",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 600,
          }}
        >
          Profile
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 3,
            }}
          >
            <Avatar
              src={currentUser?.photoURL || undefined}
              sx={{
                width: 96,
                height: 96,
                fontSize: 36,
                bgcolor: theme.palette.primary.main,
                mb: 2,
              }}
            >
              {displayName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {email}
            </Typography>
            {/* Identity connection pill */}
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: "20px",
                bgcolor: theme.palette.mode === "dark" ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.08)",
                color: theme.palette.mode === "dark" ? "#22d3ee" : "#0891b2",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "1px solid rgba(6, 182, 212, 0.25)",
              }}
            >
              {currentUser?.provider === "google" ? "Google" : "Microsoft"} Identity Account
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Account Information
          </Typography>

          <Stack spacing={2} sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1.5,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1">{displayName}</Typography>
              </Box>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={handleOpenEdit}
              >
                Edit
              </Button>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{email}</Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleOpenSwitchAccount}
          >
            Login Another Account
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit Username</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={savingUsername}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEdit} disabled={savingUsername}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveUsername}
            disabled={savingUsername}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={switchAccountOpen}
        onClose={handleCloseSwitchAccount}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Login Another Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You will be logged out of the current account. Do you want to
            continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSwitchAccount} disabled={loggingOut}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmSwitchAccount}
            disabled={loggingOut}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
