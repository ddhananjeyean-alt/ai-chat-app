import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded";
import IntegrationInstructionsRoundedIcon from "@mui/icons-material/IntegrationInstructionsRounded";

const defaultPrompts = [
  { label: "Explain code", prompt: "Explain what this code does", icon: CodeRoundedIcon },
  { label: "Summarize text", prompt: "Summarize this text for me", icon: SummarizeRoundedIcon },
  { label: "Generate image", prompt: "Generate an image of", icon: ImageRoundedIcon },
  { label: "Write email", prompt: "Write a professional email about", icon: MailOutlineRoundedIcon },
  { label: "Translate", prompt: "Translate this into Spanish", icon: TranslateRoundedIcon },
  { label: "Brainstorm ideas", prompt: "Brainstorm ideas for", icon: LightbulbRoundedIcon },
  { label: "Plan a trip", prompt: "Help me plan a trip to", icon: FlightTakeoffRoundedIcon },
  { label: "Help with React", prompt: "Help me debug this React component", icon: IntegrationInstructionsRoundedIcon },
];

export default function WelcomeScreen({
  examplePrompts,
  onSelectPrompt,
  currentUser,
  darkMode = true,
}) {
  const theme = useTheme();

  const prompts =
    examplePrompts && examplePrompts.length
      ? examplePrompts
      : defaultPrompts;

  const textColor = darkMode ? "#ECECEC" : "#111111";
  const subtitleColor = darkMode
    ? "rgba(255,255,255,0.5)"
    : "rgba(0,0,0,0.5)";
  const cardBg = darkMode ? "#2A2A2A" : "#F8F8F8";
  const cardHoverBg = darkMode ? "#333333" : "#F0F0F0";
  const iconColor = darkMode
    ? "rgba(255,255,255,0.75)"
    : "rgba(0,0,0,0.65)";

  const firstName =
    currentUser?.displayName?.split(" ")[0] ||
    currentUser?.email?.split("@")[0];

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ marginBottom: 24 }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: darkMode ? "#ECECEC" : "#111111",
          }}
        >
          <AutoAwesomeIcon
            sx={{
              fontSize: theme.typography.h4.fontSize,
              color: darkMode ? "#111111" : "#FFFFFF",
            }}
          />
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
          delay: 0.1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            color: textColor,
            textAlign: "center",
            mb: 1,
          }}
        >
          {firstName
            ? `How can I help you today, ${firstName}?`
            : "How can I help you today?"}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: subtitleColor,
            textAlign: "center",
            mb: 5,
          }}
        >
          Ask a question, share a task, or try one of these to get started
        </Typography>
      </motion.div>

      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
          },
          gap: 1.5,
        }}
      >
        {prompts.map((item, index) => {
          const Icon = item.icon || AutoAwesomeIcon;

          return (
            <motion.div
              key={item.label || index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
                delay: 0.05 * index,
              }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box
                onClick={() =>
                  onSelectPrompt &&
                  onSelectPrompt(item.prompt || item.label)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && onSelectPrompt) {
                    onSelectPrompt(item.prompt || item.label);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  height: 64,
                  px: 2,
                  borderRadius: "18px",
                  background: cardBg,
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  "&:hover": {
                    background: cardHoverBg,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: darkMode
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: theme.typography.body1.fontSize,
                      color: iconColor,
                    }}
                  />
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: textColor,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
}