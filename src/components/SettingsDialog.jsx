import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Stack,
} from "@mui/material";
import { useThemeContext } from "../theme/ThemeContext";

export default function SettingsDialog({
  open,
  onClose,
  darkMode,
  onDeleteAllChats,
  onRenameCompanion,
}) {

const {
  themeName,
  changeTheme,
  fontSize,
  setFontSize,
} = useThemeContext();



const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: darkMode ? "#2F2F2F" : "#FFFFFF",
            color: darkMode ? "#FFFFFF" : "#111827",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: 24,
          }}
        >
          Settings
        </DialogTitle>

        <DialogContent>

          {/* Theme */}

          <Typography
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Theme
          </Typography>

         <RadioGroup
  value={themeName}
  onChange={(e) => {
    changeTheme(e.target.value);
  }}
>
            <FormControlLabel
              value="light"
              control={<Radio />}
              label="Light"
            />

            <FormControlLabel
              value="midnight"
              control={<Radio />}
              label="Dark"
            />
          </RadioGroup>

          <Divider sx={{ my: 3 }} />

          {/* Font Size */}

          <Typography
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Font Size
          </Typography>

          <RadioGroup
  value={fontSize}
  onChange={(e) => {
    console.log("Font Size:", e.target.value);
    setFontSize(e.target.value);
  }}
>
            <FormControlLabel
              value="small"
              control={<Radio />}
              label="Small"
            />

            <FormControlLabel
              value="medium"
              control={<Radio />}
              label="Medium"
            />

            <FormControlLabel
              value="large"
              control={<Radio />}
              label="Large"
            />
          </RadioGroup>

          <Divider sx={{ my: 3 }} />

          {/* Companion */}
          <Typography
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Companion
          </Typography>

          <Typography
            variant="body2"
            sx={{
              opacity: 0.75,
              mb: 2,
            }}
          >
            Personalize your AI companion by giving it a custom display name.
          </Typography>

          <Button
            variant="contained"
            onClick={onRenameCompanion}
            sx={{
              background: "linear-gradient(90deg, #06b6d4 0%, #7c3aed 100%)",
              color: "#ffffff",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              px: 3,
              py: 1,
              boxShadow: "0 4px 14px rgba(6, 182, 212, 0.2)",
              "&:hover": {
                background: "linear-gradient(90deg, #06b6d4 20%, #7c3aed 80%)",
                boxShadow: "0 6px 20px rgba(6, 182, 212, 0.35)",
              },
            }}
          >
            Rename Companion
          </Button>

          <Divider sx={{ my: 3 }} />

          {/* Delete Chats */}

          <Typography
            sx={{
              fontWeight: 700,
              color: "#ef4444",
              mb: 1,
            }}
          >
            Delete All Chats
          </Typography>

          <Typography
            variant="body2"
            sx={{
              opacity: 0.75,
              mb: 2,
            }}
          >
            Permanently remove every conversation from this device.
          </Typography>

          {!confirmDelete ? (
            <Button
              variant="contained"
              color="error"
              onClick={() => setConfirmDelete(true)}
            >
              Delete All Chats
            </Button>
          ) : (
            <Stack
              direction="row"
              spacing={2}
            >
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  onDeleteAllChats();
                  setConfirmDelete(false);
                }}
              >
                Yes, Delete
              </Button>

              <Button
                variant="outlined"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </Stack>
          )}



        </DialogContent>
      </Dialog>
    </>
  );
}