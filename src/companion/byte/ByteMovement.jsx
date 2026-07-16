import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ByteMovement({
  children,
  initialX,
  initialY,
  onStateChange,
  overridePosition,
  onPointerDown,
  smoothOverride,
}) {
  const robotRef = useRef(null);
  const walkTimer = useRef(null);

  const isMobile = window.innerWidth <= 768;
  const HOME_X =
    initialX ?? Math.max(20, window.innerWidth - (isMobile ? 95 : 130));

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(value, max));

  const [maxAllowedY, setMaxAllowedY] = useState(window.innerHeight - (isMobile ? 150 : 200));

  const HOME_Y =
    initialY ?? clamp(window.innerHeight - (isMobile ? 150 : 220), 20, maxAllowedY);

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
    const updateBounds = () => {
      const inputEl = document.querySelector(".chat-input-area-wrapper");
      const height = robotRef.current?.offsetHeight || (isMobile ? 100 : 130);
      let calculatedMaxY;
      if (inputEl) {
        const rect = inputEl.getBoundingClientRect();
        calculatedMaxY = Math.max(20, rect.top - height - 15);
      } else {
        calculatedMaxY = Math.max(20, window.innerHeight - height - 20);
      }
      setMaxAllowedY(calculatedMaxY);

      if (!dragging && !walking) {
        const targetHomeY = initialY ?? Math.max(20, Math.min(window.innerHeight - (isMobile ? 150 : 220), calculatedMaxY));
        setPosition(prev => {
          if (prev.y > calculatedMaxY) {
            return { ...prev, y: targetHomeY };
          }
          return prev;
        });
      }
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    const interval = setInterval(updateBounds, 250);

    return () => {
      window.removeEventListener("resize", updateBounds);
      clearInterval(interval);
    };
  }, [dragging, walking, isMobile, initialY]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragging) return;

      const width =
        robotRef.current?.offsetWidth || 100;

      setPosition({
        x: clamp(
          event.clientX - dragOffset.current.x,
          0,
          window.innerWidth - width
        ),

        y: clamp(
          event.clientY - dragOffset.current.y,
          20,
          maxAllowedY
        ),
      });
    };

    const startWalkingHome = () => {
      setWalking(true);
      onStateChange?.("float");

      walkTimer.current = setInterval(() => {
        setPosition((current) => {
          const targetY = clamp(HOME_Y, 20, maxAllowedY);
          const dx = HOME_X - current.x;
          const dy = targetY - current.y;

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
              y: targetY,
            };
          }

          const step = 3;

          return {
            x: current.x + (dx / distance) * step,
            y: clamp(current.y + (dy / distance) * step, 20, maxAllowedY),
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
      const mobile = window.innerWidth <= 768;
      const hX = initialX ?? Math.max(20, window.innerWidth - (mobile ? 95 : 130));
      
      const inputEl = document.querySelector(".chat-input-area-wrapper");
      const height = robotRef.current?.offsetHeight || (mobile ? 100 : 130);
      const calculatedMaxY = inputEl 
        ? Math.max(20, inputEl.getBoundingClientRect().top - height - 15) 
        : Math.max(20, window.innerHeight - height - 20);

      const hY = initialY ?? Math.min(window.innerHeight - (mobile ? 150 : 220), calculatedMaxY);

      setPosition((prev) => {
        if (dragging) {
          return {
            x: clamp(prev.x, 0, window.innerWidth - (mobile ? 70 : 100)),
            y: clamp(prev.y, 20, calculatedMaxY),
          };
        }
        return { x: hX, y: hY };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dragging, initialX, initialY]);

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
          ? (smoothOverride ? { type: "spring", stiffness: 120, damping: 18 } : { duration: 0 })
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
        zIndex: 2000000,
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