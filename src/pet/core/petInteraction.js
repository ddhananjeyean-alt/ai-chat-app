/**
 * petInteraction.js
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Pure interaction layer.
 *
 * Responsibilities:
 * - Click interaction
 * - Dragging
 * - Follow cursor
 * - Pointer events
 *
 * No React.
 * No rendering.
 */

import { PET_STATES } from "./petDefaults";
import {
  playHappyAnimation,
  startDragging,
  stopDragging,
  startFollowing,
  stopFollowing,
} from "./petStateMachine";

import {
  setFollowTarget,
  movePetTo,
  clearTarget,
} from "./petMovement";

const FOLLOW_DISTANCE = 8;

export function handlePetClick(pet) {
  playHappyAnimation(pet);

  pet.stats.happiness = Math.min(
    100,
    pet.stats.happiness + 5
  );

  pet.metadata.updatedAt = Date.now();
}

export function beginDrag(
  pet,
  pointerX,
  pointerY
) {
  pet.dragging = true;

  pet.dragOffset = {
    x: pointerX - pet.position.x,
    y: pointerY - pet.position.y,
  };

  startDragging(pet);
}

export function updateDrag(
  pet,
  pointerX,
  pointerY,
  bounds
) {
  if (!pet.dragging) return;

  const x = pointerX - pet.dragOffset.x;
  const y = pointerY - pet.dragOffset.y;

  movePetTo(
    pet,
    Math.max(0, Math.min(bounds.width, x)),
    Math.max(0, Math.min(bounds.height, y))
  );
}

export function endDrag(pet) {
  pet.dragging = false;

  delete pet.dragOffset;

  stopDragging(pet);
}

export function beginFollow(pet) {
  startFollowing(pet);
}

export function stopFollow(pet) {
  clearTarget(pet);

  stopFollowing(pet);
}

export function updateFollowTarget(
  pet,
  pointerX,
  pointerY
) {
  setFollowTarget(
    pet,
    pointerX,
    pointerY
  );
}

export function reachedPointer(
  pet,
  pointerX,
  pointerY
) {
  const dx = pointerX - pet.position.x;
  const dy = pointerY - pet.position.y;

  return (
    Math.hypot(dx, dy) <= FOLLOW_DISTANCE
  );
}