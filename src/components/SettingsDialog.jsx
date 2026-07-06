import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
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
}) {

const {
  themeName,
  changeTheme,
  fontSize,
  setFontSize,
} = useThemeContext();

console.log({
  themeName,
  fontSize,
  setFontSize,
});

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

            <FormControlLabel
              value="system"
              control={<Radio />}
              label="System"
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

          <Divider sx={{ my: 3 }} />

          {/* About */}

          <Typography
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            About
          </Typography>

          <Box sx={{ lineHeight: 2 }}>
            <Typography>
              <strong>Application</strong> : AI Chat Application
            </Typography>

            <Typography>
              <strong>Version</strong> : 1.0.0
            </Typography>

            <Typography>
              <strong>Developer</strong> : R. Dhananjeyean
            </Typography>

            <Typography>
              <strong>Framework</strong> : React + Material UI
            </Typography>

            <Typography>
              <strong>Backend</strong> : Firebase + Groq AI
            </Typography>
          </Box>

        </DialogContent>
      </Dialog>
    </>
  );
}