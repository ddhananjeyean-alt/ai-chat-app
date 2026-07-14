import React from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import { motion } from "framer-motion";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";

import { COLORS } from "./SidebarConstants";
import { chatItemVariants } from "./SidebarAnimations";

const MotionBox = motion(Box);

export default function ChatItem({
  chat,
  selected = false,
  onClick,
  onMenu,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const activeColor = isLight ? theme.palette.primary.main : COLORS.active;
  const itemBg = selected 
    ? (isLight ? "rgba(0, 0, 0, 0.06)" : COLORS.selected) 
    : "transparent";
  const hoverBg = isLight ? "rgba(0, 0, 0, 0.04)" : COLORS.hover;
  const textColor = theme.palette.text.primary;
  const subTextColor = isLight ? theme.palette.text.secondary : COLORS.subText;
  const optionHoverBg = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)";

  return (
    <MotionBox
      variants={chatItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      layout
    >
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.35,
          mb: 1,
          borderRadius: "16px",
          cursor: "pointer",
          bgcolor: itemBg,
          transition: "all .18s ease",
          "&:hover": {
            bgcolor: hoverBg,
          },
          "&:hover .chat-options": {
            opacity: 1,
          },
        }}
      >
        {/* Chat Icon */}
        <ChatBubbleOutlineRoundedIcon
          sx={{
            fontSize: 20,
            color: selected ? activeColor : subTextColor,
          }}
        />

        {/* Chat Title */}
        <Typography
          sx={{
            flex: 1,
            color: textColor,
            fontSize: 14,
            fontWeight: selected ? 600 : 400,
            letterSpacing: 0.2,
            whiteSpace: "normal",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            wordBreak: "normal",
            overflowWrap: "break-word",
            lineHeight: 1.35,
          }}
        >
          {chat?.title || "New Chat"}
        </Typography>

        {/* Three Dot Menu */}
        <IconButton
          className="chat-options"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onMenu?.(e.currentTarget, chat);
          }}
          sx={{
            opacity: selected ? 1 : 0,
            transition: ".18s",
            color: subTextColor,
            "&:hover": {
              color: textColor,
              bgcolor: optionHoverBg,
            },
          }}
        >
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </MotionBox>
  );
}