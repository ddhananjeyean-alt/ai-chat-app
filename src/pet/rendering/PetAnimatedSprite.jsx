import React from "react";

/**
 * PetAnimatedSprite.jsx
 * ------------------------------------------------------------------
 * Companion Engine V1
 *
 * Rendering only.
 *
 * Responsibilities:
 * - Draw current animation frame
 * - Flip horizontally
 * - Render sprite sheet frame
 *
 * Does NOT:
 * - Advance animation
 * - Control timing
 * - Change pet state
 */

export default function PetAnimatedSprite({
  image,
  frame,
  frameWidth,
  frameHeight,
  direction = 1,
}) {
  if (!image) return null;

  const x = frame * frameWidth;

  return (
    <div
      style={{
        width: frameWidth,
        height: frameHeight,
        overflow: "hidden",
        transform: `scaleX(${direction})`,
        transformOrigin: "center",
        imageRendering: "pixelated",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <img
        src={image}
        draggable={false}
        alt=""
        style={{
          display: "block",
          width: "auto",
          height: frameHeight,
          marginLeft: -x,
          imageRendering: "pixelated",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}