import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

import SidebarRing from "./SidebarRing";
import SidebarItems from "./SidebarItems";
import { DeleteEvents } from "../../companion/byte/DeleteEvents";
import { ArchiveEvents } from "../../companion/byte/ArchiveEvents";
import {
  WHEEL_RADIUS,
  INNER_RADIUS,
  COLORS,
} from "./SidebarConstants";
import {
  wheelSpring,
  wheelVariants,
} from "./SidebarAnimations";

export default function SidebarWheel({
  selected = "search",
  onChange,
  chats = [],
  onOpenMenu,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const ITEM_SPACING = 26;
  const LABEL_RADIUS = (WHEEL_RADIUS + INNER_RADIUS) / 2; // 190px
  const WHEEL_LEFT_SHIFT = -120; // Shift dial left so it fits inside the 320px sidebar without overlapping chat

  // Construct dynamic menu list: Search + active user chats
  const wheelItems = useMemo(() => {
    const activeChats = chats.filter((c) => !c.archived);
    return [
      {
        id: "search",
        label: "Search Chats",
        short: "Search",
        angle: -50,
        icon: SearchOutlinedIcon,
        isSearch: true,
      },
      ...activeChats.map((chat, idx) => ({
        id: chat.id,
        label: chat.title || "Untitled Chat",
        short: `Chat ${idx + 1}`,
        angle: -50 + ITEM_SPACING * (idx + 1),
        icon: ChatBubbleOutlineRoundedIcon,
        isChat: true,
      })),
    ];
  }, [chats]);

  // Compute dynamic rotation clamp boundaries based on item count
  const { minRotation, maxRotation } = useMemo(() => {
    if (wheelItems.length <= 1) {
      return { minRotation: 50, maxRotation: 50 };
    }
    const maxAngle = wheelItems[wheelItems.length - 1].angle;
    const minAngle = wheelItems[0].angle; // which is -50
    return {
      minRotation: -maxAngle,
      maxRotation: -minAngle, // +50
    };
  }, [wheelItems]);

  const getInitialAngle = () => {
    const targetItem = wheelItems.find((i) => i.id === selected);
    return targetItem ? -targetItem.angle : 50;
  };

  // Single source of truth for the rotation angle of the wheel
  const [rotation, setRotation] = useState(getInitialAngle);
  const [dragging, setDragging] = useState(false);

  // Auto-scroll/rotate dial to center the selected conversation item
  useEffect(() => {
    if (!dragging) {
      const targetItem = wheelItems.find((i) => i.id === selected);
      if (targetItem) {
        setRotation(-targetItem.angle);
      }
    }
  }, [selected, wheelItems, dragging]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingArchiveId, setPendingArchiveId] = useState(null);

  // Freeze sidebar interaction during delete vacuum animation
  useEffect(() => {
    const unsubTrigger = DeleteEvents.subscribe(DeleteEvents.TRIGGER, ({ chatId }) => {
      setIsDeleting(true);
      setPendingDeleteId(chatId);
    });
    const unsubComplete = DeleteEvents.subscribe(DeleteEvents.BYTE_VACUUM_COMPLETE, () => {
      setIsDeleting(false);
    });
    const unsubRestore = DeleteEvents.subscribe(DeleteEvents.UNDO_SEQUENCE_COMPLETE, () => {
      setIsDeleting(false);
    });
    return () => {
      unsubTrigger();
      unsubComplete();
      unsubRestore();
    };
  }, []);

  // Freeze sidebar interaction during archive carry animation
  useEffect(() => {
    const unsubTrigger = ArchiveEvents.subscribe(ArchiveEvents.TRIGGER, ({ chatId }) => {
      setIsArchiving(true);
      setPendingArchiveId(chatId);
    });
    const unsubComplete = ArchiveEvents.subscribe(ArchiveEvents.COMPLETE, () => {
      setIsArchiving(false);
    });
    return () => {
      unsubTrigger();
      unsubComplete();
    };
  }, []);

  // Sync pending archive ID cleanup when chats list updates
  useEffect(() => {
    const activeChats = chats.filter((c) => !c.archived);
    if (pendingArchiveId && !activeChats.some((c) => c.id === pendingArchiveId)) {
      setPendingArchiveId(null);
    }
  }, [chats, pendingArchiveId]);

  // Sync pending delete ID cleanup when chats list updates
  useEffect(() => {
    if (pendingDeleteId && !chats.some((c) => c.id === pendingDeleteId)) {
      setPendingDeleteId(null);
    }
  }, [chats, pendingDeleteId]);

  const wheelRef = useRef(null);

  useEffect(() => {
    if (dragging || isDeleting || isArchiving) return;
    const targetItem = wheelItems.find((i) => i.id === selected);
    if (targetItem) {
      setRotation(-targetItem.angle);
    }
  }, [selected, dragging, wheelItems, isDeleting, isArchiving]);

  // Math helper to snap rotation to the nearest item's angle
  const snapToNearest = useCallback((currentRotation) => {
    if (wheelItems.length === 0) return "search";
    const closest = wheelItems.reduce((prev, curr) => {
      return Math.abs(curr.angle + currentRotation) < Math.abs(prev.angle + currentRotation)
        ? curr
        : prev;
    });
    setRotation(-closest.angle);
    return closest.id;
  }, [wheelItems]);

  // Use a non-passive wheel event listener registered directly on the DOM node to avoid passive listener warnings
  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;

    const onWheelEvent = (e) => {
      if (isDeleting || isArchiving) return;
      
      // Stop native page scroll behavior while rotating the sidebar dial
      e.preventDefault();
      
      const delta = Math.sign(e.deltaY) * 4.5; // 4.5 degrees per tick (25% reduction from 6)
      setRotation((prev) => {
        const next = Math.max(minRotation, Math.min(maxRotation, prev - delta));

        clearTimeout(window.__sidebarWheelTimeout);
        window.__sidebarWheelTimeout = setTimeout(() => {
          const nearestId = snapToNearest(next);
          if (onChange) onChange(nearestId);
        }, 120);

        return next;
      });
    };

    el.addEventListener("wheel", onWheelEvent, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelEvent);
    };
  }, [minRotation, maxRotation, onChange, snapToNearest, isDeleting, isArchiving]);

  // Handle dragging states (Frozen when search or delete is active)
  const handleDragStart = () => {
    if (isDeleting || isArchiving) return;
    setDragging(true);
  };

  const handleDrag = (e, info) => {
    if (isDeleting || isArchiving) return;
    const deltaAngle = -info.delta.y * 0.21; // 0.21 sensitivity (25% reduction from 0.28)
    setRotation((prev) =>
      Math.max(minRotation, Math.min(maxRotation, prev + deltaAngle))
    );
  };

  const handleDragEnd = () => {
    if (isDeleting || isArchiving) return;
    setDragging(false);
    setRotation((prev) => {
      const nearestId = snapToNearest(prev);
      if (onChange) onChange(nearestId);
      return prev;
    });
  };

  // Find currently active item based on rotation mapping (Lock to 'search' when search is open)
  const activeItem = useMemo(() => {
    if (isDeleting || isArchiving) return selected;
    if (wheelItems.length === 0) return "search";
    return wheelItems.reduce((prev, curr) => {
      return Math.abs(curr.angle + rotation) < Math.abs(prev.angle + rotation)
        ? curr
        : prev;
    }).id;
  }, [wheelItems, rotation, isDeleting, selected]);

  return (
    <Box
      sx={{
        position: "relative",
        width: 110,
        height: "100%",
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexShrink: 0,
        zIndex: 10,
        pointerEvents: (isDeleting || isArchiving) ? "none" : "auto",
      }}
    >
      {/* High-Performance Framer Motion Drag and Scroll Area */}
      <motion.div
        ref={wheelRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        variants={wheelVariants}
        animate={dragging ? "dragging" : "idle"}
        whileHover="hover"
        transition={wheelSpring}
        style={{
          position: "absolute",
          left: WHEEL_LEFT_SHIFT, // Shifted left to keep it centered inside the sidebar
          top: "50%",
          marginTop: -WHEEL_RADIUS,
          width: WHEEL_RADIUS * 2,
          height: WHEEL_RADIUS * 2,
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {/* Semi-circular Ring backdrop (Static Glass track) */}
        <SidebarRing />

        {/* Floating circular menu items (Pure math positioning) */}
        <SidebarItems
          items={wheelItems}
          rotation={rotation}
          activeItem={activeItem}
          chats={chats}
          onOpenMenu={onOpenMenu}
          hideLabels={false}
          pendingDeleteId={pendingDeleteId}
          pendingArchiveId={pendingArchiveId}
          onSelect={(id) => {
            if (isDeleting || isArchiving) return;
            const item = wheelItems.find((i) => i.id === id);
            if (item) {
              setRotation(-item.angle);
              if (onChange) onChange(id);
            }
          }}
        />
      </motion.div>
    </Box>
  );
}