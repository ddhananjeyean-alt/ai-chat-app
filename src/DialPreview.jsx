import React from "react";
import { Box } from "@mui/material";
import SidebarDial from "./components/layout/SidebarDial";

export default function DialPreview() {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "#101010",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SidebarDial />
    </Box>
  );
}