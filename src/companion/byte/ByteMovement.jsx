import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ByteMovement({
  children,
  initialX,
  initialY,
  onStateChange,
  overridePosition,
  onPointerDown,
}) {
  const robotRef = useRef(null);
  const walkTimer = useRef(null);

  const HOME_X =
    initialX ?? Math.max(20, window.innerWidth - 130);

  const HOME_Y =
    initialY ?? Math.max(20, window.innerHeight - 180);

  const [position, setPosition] = useState({
    x: HOME_X,
    y: HOME_Y,
  });

  const [dragging, setDragging] = useState(false);
  const [walking, setWalking] = useState(false);

  const dragOffset = useRef({
    x: 0,
    y: 0,
  });

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(value, max));

  const handlePointerDown = (event) => {
    event.preventDefault();
    onPointerDown?.(event);

    if (walkTimer.current) {
      clearInterval(walkTimer.current);
      walkTimer.current = null;
    }

    setWalking(false);
    onStateChange?.("idle");

    setDragging(true);

    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragging) return;

      const width =
        robotRef.current?.offsetWidth || 100;

      const height =
        robotRef.current?.offsetHeight || 130;

      setPosition({
        x: clamp(
          event.clientX - dragOffset.current.x,
          0,
          window.innerWidth - width
        ),

        y: clamp(
          event.clientY - dragOffset.current.y,
          0,
          window.innerHeight - height
        ),
      });
    };

    const startWalkingHome = () => {
      setWalking(true);
      onStateChange?.("float");

      walkTimer.current = setInterval(() => {
        setPosition((current) => {
          const dx = HOME_X - current.x;
          const dy = HOME_Y - current.y;

          const distance = Math.sqrt(
            dx * dx + dy * dy
          );

          if (distance < 5) {
            clearInterval(walkTimer.current);
            walkTimer.current = null;

            setWalking(false);
            onStateChange?.("idle");

            return {
              x: HOME_X,
              y: HOME_Y,
            };
          }

          const step = 3;

          return {
            x: current.x + (dx / distance) * step,
            y: current.y + (dy / distance) * step,
          };
        });
      }, 40);
    };

    const handlePointerUp = () => {
      if (!dragging) return;

      setDragging(false);

      setTimeout(startWalkingHome, 500);
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      if (walkTimer.current) {
        clearInterval(walkTimer.current);
      }
    };
  }, [dragging, HOME_X, HOME_Y, onStateChange]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: clamp(
          prev.x,
          0,
          window.innerWidth - 100
        ),

        y: clamp(
          prev.y,
          0,
          window.innerHeight - 130
        ),
      }));
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // Halt internal walking home if overridePosition is active
  useEffect(() => {
    if (overridePosition) {
      if (walkTimer.current) {
        clearInterval(walkTimer.current);
        walkTimer.current = null;
      }
      setWalking(false);
    }
  }, [overridePosition]);

  const positionToUse = overridePosition || position;

  // Track movement direction (horizontal flipping disabled to prevent mirrored rendering)
  const scaleX = 1;

  return (
    <motion.div
      ref={robotRef}
      className="byte-movement-container"
      onPointerDown={handlePointerDown}
      animate={{
        x: positionToUse.x,
        y: positionToUse.y,
        rotate: positionToUse.rotate || 0,
        scaleX: scaleX,
        scaleY: dragging ? 1.05 : 1,
      }}
      transition={
        overridePosition
          ? { duration: 0 }
          : dragging
          ? {
              type: "spring",
              stiffness: 500,
              damping: 35,
            }
          : walking
          ? {
              duration: 0,
            }
          : {
              type: "spring",
              stiffness: 180,
              damping: 20,
            }
      }
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 99999,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        pointerEvents: overridePosition ? "none" : "auto",
      }}
    >
      {children}
    </motion.div>
  );
}