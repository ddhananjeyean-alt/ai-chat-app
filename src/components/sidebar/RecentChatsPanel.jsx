import React, { useState, useEffect } from "react";
import { Box, Typography, Collapse, Button, useTheme } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { motion, AnimatePresence } from "framer-motion";

import { COLORS } from "./SidebarConstants";
import { panelVariants } from "./SidebarAnimations";
import ChatItem from "./ChatItem";
import { RestoreEvents } from "../../companion/byte/RestoreEvents";

export default function RecentChatsPanel({
  chats = [],
  currentChatId,
  onSelectChat,
  onOpenMenu,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [restorePlaceholder, setRestorePlaceholder] = useState(null);

  useEffect(() => {
    const unsubShow = RestoreEvents.subscribe("restore-chat:show-placeholder", ({ chatId }) => {
      setRestorePlaceholder({ chatId });
    });
    const unsubHide = RestoreEvents.subscribe("restore-chat:hide-placeholder", () => {
      setRestorePlaceholder(null);
    });
    return () => {
      unsubShow();
      unsubHide();
    };
  }, []);

  const recentChats = chats.filter((chat) => !chat.archived);
  const archivedChats = chats.filter((chat) => chat.archived);

  const recentWithPlaceholder = [...recentChats];
  if (restorePlaceholder) {
    const targetIndex = chats
      .filter((c) => !c.archived || c.id === restorePlaceholder.chatId)
      .findIndex((c) => c.id === restorePlaceholder.chatId);
    const insertIndex = Math.max(0, Math.min(recentWithPlaceholder.length, targetIndex === -1 ? 0 : targetIndex));
    recentWithPlaceholder.splice(insertIndex, 0, { isPlaceholder: true, id: "restore-placeholder" });
  }

  const textColor = theme.palette.text.primary;
  const subTextColor = isLight ? theme.palette.text.secondary : COLORS.subText;
  const scrollbarThumbColor = isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255,255,255,0.1)";
  const buttonHoverBg = isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255,255,255,0.03)";
  const placeholderBorder = isLight ? "1px dashed rgba(59, 130, 246, 0.4)" : "1px dashed rgba(121, 248, 255, 0.4)";
  const placeholderBg = isLight ? "rgba(59, 130, 246, 0.03)" : "rgba(121, 248, 255, 0.03)";

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
      {/* Recent Chats Title */}
      <Typography
        sx={{
          color: textColor,
          fontSize: 20,
          fontWeight: 700,
          mb: 2,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Recent Chats
      </Typography>

      {/* Main List of Recent Chats */}
      <Box
        id="recent-chats-list"
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
          {recentWithPlaceholder.length === 0 ? (
            <Typography
              sx={{
                mt: 4,
                color: subTextColor,
                textAlign: "center",
                fontSize: 13,
              }}
            >
              No recent conversations
            </Typography>
          ) : (
            recentWithPlaceholder.map((chat) => {
              if (chat.isPlaceholder) {
                return (
                  <motion.div
                    key="restore-placeholder"
                    id="restore-placeholder-element"
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: 52, opacity: 1, marginBottom: 8 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{
                      height: 52,
                      borderRadius: "16px",
                      border: placeholderBorder,
                      background: placeholderBg,
                      overflow: "hidden",
                      boxSizing: "border-box",
                    }}
                  />
                );
              }
              return (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  selected={currentChatId === chat.id}
                  onClick={() => onSelectChat?.(chat.id)}
                  onMenu={onOpenMenu}
                />
              );
            })
          )}
        </AnimatePresence>

        {/* Collapsible Archived Chats Section */}
        {archivedChats.length > 0 && (
          <Box sx={{ mt: 3, mb: 1 }}>
            <Button
              onClick={() => setArchivedOpen(!archivedOpen)}
              fullWidth
              sx={{
                justifyContent: "space-between",
                color: subTextColor,
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                py: 1,
                px: 1.5,
                borderRadius: "10px",
                "&:hover": {
                  bgcolor: buttonHoverBg,
                  color: textColor,
                },
              }}
              endIcon={
                archivedOpen ? (
                  <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                ) : (
                  <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                )
              }
            >
              Archived Chats ({archivedChats.length})
            </Button>

            <Collapse in={archivedOpen} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1, pl: 0.5 }}>
                <AnimatePresence initial={false}>
                  {archivedChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      selected={currentChatId === chat.id}
                      onClick={() => onSelectChat?.(chat.id)}
                      onMenu={onOpenMenu}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </motion.div>
  );
}