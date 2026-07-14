import { useCallback, useEffect, useRef, useState } from "react";
import {
  MENU_ITEMS,
  ROTATION_LIMIT,
  DRAG_SENSITIVITY,
  SCROLL_SENSITIVITY,
} from "./SidebarConstants";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function nearestItem(rotation) {
  return MENU_ITEMS.reduce((closest, item) => {
    if (!closest) return item;
    return Math.abs(item.angle - rotation) < Math.abs(closest.angle - rotation)
      ? item
      : closest;
  }, null);
}

export default function useSidebarWheel(selected = "search", onSnap) {
  const startY = useRef(0);
  const startRotation = useRef(0);

  const initialItem =
    MENU_ITEMS.find((i) => i.id === selected) || MENU_ITEMS[1];

  const [rotation, setRotation] = useState(initialItem.angle);
  const [activeItem, setActiveItem] = useState(initialItem.id);
  const [dragging, setDragging] = useState(false);

  const snapToNearest = useCallback((value) => {
    const item = nearestItem(value);
    setRotation(item.angle);
    setActiveItem(item.id);
    return item.id;
  }, []);

  // Synchronize internal state with parent-provided prop changes (e.g. clicking an item)
  useEffect(() => {
    if (dragging) return; // Skip updating local state from props during drag gesture
    const item = MENU_ITEMS.find((i) => i.id === selected);
    if (item && item.id !== activeItem) {
      setRotation(item.angle);
      setActiveItem(item.id);
    }
  }, [selected, activeItem, dragging]);

  const onPointerDown = useCallback(
    (e) => {
      setDragging(true);
      startY.current = e.clientY;
      startRotation.current = rotation;
      document.body.style.userSelect = "none";
    },
    [rotation]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      const delta = (e.clientY - startY.current) * DRAG_SENSITIVITY;
      const nextRotation = clamp(
        startRotation.current + delta,
        -ROTATION_LIMIT,
        ROTATION_LIMIT
      );
      setRotation(nextRotation);
    },
    [dragging]
  );

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    document.body.style.userSelect = "";
    const finalId = snapToNearest(rotation);
    if (onSnap) onSnap(finalId);
  }, [dragging, rotation, snapToNearest, onSnap]);

  const onWheel = useCallback(
    (e) => {
      // Rotation adjusts by scroll direction
      const next = clamp(
        rotation + Math.sign(e.deltaY) * SCROLL_SENSITIVITY,
        -ROTATION_LIMIT,
        ROTATION_LIMIT
      );
      setRotation(next);

      clearTimeout(window.__sidebarWheelTimeout);
      window.__sidebarWheelTimeout = setTimeout(() => {
        const finalId = snapToNearest(next);
        if (onSnap) onSnap(finalId);
      }, 150);
    },
    [rotation, snapToNearest, onSnap]
  );

  const selectItem = useCallback((id) => {
    const item = MENU_ITEMS.find((i) => i.id === id);
    if (!item) return;
    setRotation(item.angle);
    setActiveItem(item.id);
  }, []);

  const rotateUp = useCallback(() => {
    const currentIndex = MENU_ITEMS.findIndex((i) => i.id === activeItem);
    if (currentIndex <= 0) return;
    const item = MENU_ITEMS[currentIndex - 1];
    setRotation(item.angle);
    setActiveItem(item.id);
  }, [activeItem]);

  const rotateDown = useCallback(() => {
    const currentIndex = MENU_ITEMS.findIndex((i) => i.id === activeItem);
    if (currentIndex >= MENU_ITEMS.length - 1 || currentIndex === -1) return;
    const item = MENU_ITEMS[currentIndex + 1];
    setRotation(item.angle);
    setActiveItem(item.id);
  }, [activeItem]);

  // Keyboard navigation bindings
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === "ArrowUp") rotateUp();
      if (e.key === "ArrowDown") rotateDown();
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [rotateUp, rotateDown]);

  // Global move/up listener support for drag-out-of-bounds pointer capture
  useEffect(() => {
    if (dragging) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, onPointerMove, onPointerUp]);

  return {
    rotation,
    activeItem,
    dragging,
    onPointerDown,
    onWheel,
    selectItem,
    rotateUp,
    rotateDown,
  };
}