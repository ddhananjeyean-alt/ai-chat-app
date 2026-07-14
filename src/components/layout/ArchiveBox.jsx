import React, { useEffect, useState } from "react";
import { Box, Tooltip } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { motion } from "framer-motion";
import { ArchiveEvents } from "../../companion/byte/ArchiveEvents";

export default function ArchiveBox({ onClick, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const unsubOpen = ArchiveEvents.subscribe(ArchiveEvents.ARCHIVE_BOX_OPEN, () => {
      setIsOpen(true);
    });
    const unsubComplete = ArchiveEvents.subscribe(ArchiveEvents.PLACE_COMPLETE, () => {
      setIsOpen(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 1000);
    });

    return () => {
      unsubOpen();
      unsubComplete();
    };
  }, []);

  const activeGlow = isSuccess 
    ? (darkMode ? "0 0 20px rgba(121, 248, 255, 0.9), inset 0 0 12px rgba(121, 248, 255, 0.5)" : "0 0 20px rgba(37, 99, 235, 0.7), inset 0 0 12px rgba(37, 99, 235, 0.3)")
    : (isOpen 
        ? (darkMode ? "0 0 16px rgba(121, 248, 255, 0.7), inset 0 0 10px rgba(121, 248, 255, 0.4)" : "0 0 16px rgba(37, 99, 235, 0.5), inset 0 0 10px rgba(37, 99, 235, 0.2)") 
        : (darkMode ? "0 0 10px rgba(121, 248, 255, 0.15)" : "0 0 10px rgba(0, 0, 0, 0.04)"));

  return (
    <Tooltip title="Archived Conversations">
      <Box
        id="archive-box-button"
        onClick={onClick}
        component={motion.div}
        whileHover={{ 
          scale: 1.05, 
          boxShadow: darkMode ? "0 0 15px rgba(121, 248, 255, 0.4)" : "0 0 15px rgba(37, 99, 235, 0.3)",
          borderColor: darkMode ? "#79f8ff" : "#2563EB"
        }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: activeGlow,
          borderColor: isOpen || isSuccess ? (darkMode ? "#79f8ff" : "#2563EB") : (darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.15)"),
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "10px",
          cursor: "pointer",
          background: darkMode ? "rgba(30, 41, 59, 0.35)" : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid",
          transition: "box-shadow 0.3s, border-color 0.3s",
          position: "relative",
          overflow: "visible",
          pointerEvents: "auto",
        }}
      >
        {/* Lid representation */}
        <Box
          component={motion.div}
          animate={{
            y: isOpen ? -6 : 0,
            rotate: isOpen ? -8 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          sx={{
            position: "absolute",
            top: 5,
            width: 18,
            height: 3,
            borderRadius: "2px",
            background: isOpen || isSuccess 
              ? (darkMode ? "#79f8ff" : "#2563EB") 
              : (darkMode ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.55)"),
            zIndex: 2,
          }}
        />

        {/* Box Body/Icon */}
        <Inventory2OutlinedIcon
          sx={{
            fontSize: 18,
            color: isOpen || isSuccess
              ? (darkMode ? "#79f8ff" : "#2563EB")
              : (darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.55)"),
            transition: "color 0.3s",
            mt: 0.75, // shift down slightly to show lid at the top
          }}
        />
      </Box>
    </Tooltip>
  );
}
