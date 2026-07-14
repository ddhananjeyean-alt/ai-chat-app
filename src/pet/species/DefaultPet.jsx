import React from "react";
import PetAnimatedSprite from "../rendering/PetAnimatedSprite";
import { getAnimationManifest } from "../assets/spriteManifest";

/**
 * DefaultPet.jsx
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Default pet species renderer.
 *
 * Responsibilities:
 * - Select correct sprite sheet
 * - Supply frame dimensions
 * - Render animated sprite
 *
 * No movement.
 * No AI.
 * No React state.
 */

export default function DefaultPet({
  pet,
  sprites,
}) {
  if (!pet) return null;

  const manifest = getAnimationManifest(
    pet.species,
    pet.animation.name
  );

  const image = sprites?.[pet.animation.name];

  if (!image) return null;

  return (
    <PetAnimatedSprite
      image={image}
      frame={pet.animation.frame}
      frameWidth={manifest.frameWidth}
      frameHeight={manifest.frameHeight}
      direction={pet.direction}
    />
  );
}