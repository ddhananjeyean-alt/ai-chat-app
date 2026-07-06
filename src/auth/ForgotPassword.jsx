import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/index.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 10, p: 4, borderRadius: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Forgot Password
        </Typography>

        <Typography variant="body2" align="center" sx={{ mb: 3 }}>
          Enter your email to receive reset instructions.
        </Typography>

        <Box component="form" onSubmit={handleReset}>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}

          <Button fullWidth type="submit" variant="contained" sx={{ mt: 3 }}>
            Send Reset Email
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
