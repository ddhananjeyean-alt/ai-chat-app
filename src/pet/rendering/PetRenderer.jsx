import React from "react";
import PetAnimatedSprite from "./PetAnimatedSprite";

/**
 * PetRenderer.jsx
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Responsibilities
 * - Render pet container
 * - Position pet
 * - Render animated sprite
 * - Forward mouse events
 *
 * No movement logic.
 * No animation timing.
 * No React state.
 */

const DEFAULT_SIZE = 96;

export default function PetRenderer({
  pet,
  sprite,

  frameWidth = DEFAULT_SIZE,
  frameHeight = DEFAULT_SIZE,

  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  if (!pet) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: pet.position.x,
          top: pet.position.y,
          width: frameWidth,
          height: frameHeight,
          transform: "translate(-50%, -50%)",
          pointerEvents: "auto",
          cursor: pet.dragging ? "grabbing" : "pointer",
          touchAction: "none",
          userSelect: "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(pet, e);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown?.(pet, e);
        }}
        onPointerMove={(e) => {
          onPointerMove?.(pet, e);
        }}
        onPointerUp={(e) => {
          onPointerUp?.(pet, e);
        }}
      >
        <PetAnimatedSprite
          image={sprite}
          frame={pet.animation.frame}
          frameWidth={frameWidth}
          frameHeight={frameHeight}
          direction={pet.direction}
        />
      </div>
    </div>
  );
}