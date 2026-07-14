import React, { useMemo } from "react";
import { Box, InputBase, Typography, useTheme } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS } from "./SidebarConstants";
import { panelVariants } from "./SidebarAnimations";
import ChatItem from "./ChatItem";

export default function SearchPanel({
  chats = [],
  searchQuery = "",
  setSearchQuery,
  currentChatId,
  onSelectChat,
  onOpenMenu,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const filteredChats = useMemo(() => {
    // Only display matching non-archived chats
    const activeChats = chats.filter((chat) => !chat.archived);
    if (!searchQuery.trim()) return activeChats;

    return activeChats.filter((chat) =>
      (chat.title || "New Chat")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, chats]);

  const textColor = theme.palette.text.primary;
  const subTextColor = isLight ? theme.palette.text.secondary : COLORS.subText;
  const inputBg = isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.04)";
  const inputBorder = isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.08)";
  const scrollbarThumbColor = isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255,255,255,0.1)";

  return (
    <motion.div
      variants={panelVariants}
      initial="closed"
      animate="open"
      exit="closed"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search Header */}
      <Typography
        sx={{
          color: textColor,
          fontWeight: 700,
          fontSize: 20,
          mb: 2,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Search Chats
      </Typography>

      {/* Input Box */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 44,
          px: 1.5,
          borderRadius: "12px",
          bgcolor: inputBg,
          border: inputBorder,
          mb: 2,
        }}
      >
        <SearchRoundedIcon
          sx={{
            color: subTextColor,
            mr: 1,
            fontSize: 20,
          }}
        />
        <InputBase
          value={searchQuery}
          onChange={(e) => setSearchQuery?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filteredChats.length > 0) {
                onSelectChat?.(filteredChats[0].id);
              }
            }
          }}
          placeholder="Search conversation title..."
          fullWidth
          sx={{
            color: textColor,
            fontSize: 14,
            "& input::placeholder": {
              color: subTextColor,
              opacity: 0.8,
            },
          }}
        />
      </Box>

      {/* List Results */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          pr: 0.5,
          WebkitOverflowScrolling: "touch", // Smooth touchpad inertial scrolling
          "&::-webkit-scrollbar": {
            width: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            background: scrollbarThumbColor,
            borderRadius: 10,
          },
        }}
      >
        <AnimatePresence initial={false}>
          {filteredChats.length === 0 ? (
            <Typography
              sx={{
                textAlign: "center",
                color: subTextColor,
                fontSize: 13,
                mt: 4,
              }}
            >
              No conversations found
            </Typography>
          ) : (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                selected={currentChatId === chat.id}
                onClick={() => onSelectChat?.(chat.id)}
                onMenu={onOpenMenu}
              />
            ))
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
}
