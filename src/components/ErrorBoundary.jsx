import React from "react";
import { Box, Typography, Button } from "@mui/material";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#07080d",
            color: "#ffffff",
            padding: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit, Inter, sans-serif' }}>
            ⚠️ Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", mb: 4, maxWidth: 500, fontFamily: 'Inter, sans-serif' }}>
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReset}
            sx={{
              background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
              borderRadius: "12px",
              px: 4,
              py: 1.5,
              textTransform: "none",
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Reload Application
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
