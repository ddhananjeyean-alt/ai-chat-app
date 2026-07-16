import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme, Tooltip } from "@mui/material";
import {
  WHEEL_RADIUS,
  INNER_RADIUS,
  COLORS,
} from "./SidebarConstants";
import { DeleteEvents } from "../../companion/byte/DeleteEvents";
import { ArchiveEvents } from "../../companion/byte/ArchiveEvents";

const SIZE = WHEEL_RADIUS * 2;
const LABEL_RADIUS = (WHEEL_RADIUS + INNER_RADIUS) / 2;

// Memoize individual items to prevent redundant component recreations during rotation animation frames
const SidebarItem = React.memo(({
  item,
  x,
  y,
  d,
  active,
  onClick,
  onContextMenu,
  hideLabels,
  isHidden,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const activeColor = isLight ? theme.palette.primary.main : COLORS.active;
  const textColor = isLight ? "#111827" : COLORS.text;
  const subTextColor = isLight ? "#374151" : COLORS.subText;
  const iconColor = active ? (isLight ? "#ffffff" : "#0f0f10") : textColor;
  const iconBg = active 
    ? activeColor 
    : (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)");
  const iconBorder = isLight 
    ? "1px solid rgba(0,0,0,0.15)" 
    : "1px solid rgba(255,255,255,0.08)";
  const iconShadow = active 
    ? (isLight ? `0 0 20px ${theme.palette.primary.light}` : "0 0 20px rgba(116,220,255,0.5)") 
    : "none";

  const targetOpacity = Math.max(0, 1 - Math.abs(d) * 0.25);
  const targetScale = active ? 1.15 : Math.max(0.7, 1 - Math.abs(d) * 0.08);
  const targetBlur = Math.min(8, Math.abs(d) * 1.5);

  const itemContent = (
    <motion.div
      id={`chat-wheel-item-${item.id}`}
      animate={{
        x: x - 22,
        y: y - 22,
        scale: targetScale,
        opacity: targetOpacity,
        filter: `blur(${targetBlur}px)`,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
      }}
      whileHover={{ scale: active ? 1.15 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 44,
        height: 44,
        pointerEvents: (isHidden || targetOpacity < 0.1) ? "none" : "auto",
        cursor: "pointer",
        userSelect: "none",
        visibility: isHidden ? "hidden" : "visible",
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Icon Circle (Perfect Semicircle Centering) */}
      <motion.div
        animate={{
          background: iconBg,
          color: iconColor,
          boxShadow: iconShadow,
        }}
        transition={{ duration: 0.18 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: iconBorder,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <item.icon fontSize="medium" />
      </motion.div>

      {/* Label Block (placed absolutely to the right of the icon circle to prevent layout drift) */}
      <motion.div
        animate={{
          opacity: hideLabels ? 0 : (active ? 1 : 0.6),
          x: active ? 0 : -4,
        }}
        transition={{ duration: 0.18 }}
        style={{
          position: "absolute",
          left: 60,
          top: "50%",
          transform: "translateY(-50%)",
          width: 220,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            color: textColor,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.4,
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
          {item.label}
        </div>
        <div
          style={{
            color: subTextColor,
            fontSize: 10,
            marginTop: 2,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.short}
        </div>
      </motion.div>
    </motion.div>
  );

  return itemContent;
});

export default function SidebarItems({
  items = [],
  rotation = 0,
  activeItem = "search",
  onSelect,
  chats = [],
  onOpenMenu,
  hideLabels = false,
  pendingDeleteId = null,
  pendingArchiveId = null,
}) {
  const ITEM_SPACING = 26;

  // Find index of the currently active item
  const activeIdx = items.findIndex((item) => item.id === activeItem);
  const centerIdx = activeIdx !== -1 ? activeIdx : 0;

  // Filter items to render only the visible ones (window of size 17)
  const visibleItemsWithIndices = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ idx }) => Math.abs(idx - centerIdx) <= 8);

  return (
    <div
      style={{
        position: "absolute",
        left: -WHEEL_RADIUS,
        top: "50%",
        marginTop: -WHEEL_RADIUS,
        width: SIZE,
        height: SIZE,
        pointerEvents: "none",
      }}
    >
      {visibleItemsWithIndices.map(({ item, idx }) => {
        // Compute item angle dynamically including the parent rotation angle
        const angle = (item.angle + rotation) * (Math.PI / 180);

        // Calculate exact (x, y) coordinates along the semicircle track
        const x = WHEEL_RADIUS + LABEL_RADIUS * Math.cos(angle);
        const y = WHEEL_RADIUS + LABEL_RADIUS * Math.sin(angle);

        // Calculate continuous offset d for smooth animations
        const d = (item.angle + rotation) / ITEM_SPACING;

        const active = activeItem === item.id;
        const isHidden = pendingDeleteId === item.id || pendingArchiveId === item.id;

        return (
          <SidebarItem
            key={item.id}
            item={item}
            x={x}
            y={y}
            d={d}
            active={active}
            onClick={() => onSelect?.(item.id)}
            onContextMenu={(e) => {
              if (item.isChat && onOpenMenu) {
                e.preventDefault();
                const chatObject = chats.find((c) => c.id === item.id);
                if (chatObject) {
                  onOpenMenu(e.currentTarget, chatObject);
                }
              }
            }}
            chats={chats}
            hideLabels={hideLabels}
            isHidden={isHidden}
          />
        );
      })}
    </div>
  );
}