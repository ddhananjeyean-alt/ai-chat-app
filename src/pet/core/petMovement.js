/**
 * petMovement.js
 * ------------------------------------------------------------------
 * Companion Engine V1
 *
 * Pure movement engine.
 *
 * Responsibilities:
 * - Wander movement
 * - Follow movement
 * - Delta-time updates
 * - Bounds checking
 *
 * Does NOT:
 * - Render
 * - Animate
 * - Use React
 */

import { PET_STATES } from "./petDefaults";
import {
  startWalking,
  stopWalking,
} from "./petStateMachine";

const DEFAULT_SPEED = 70;
const FOLLOW_SPEED = 120;
const TARGET_RADIUS = 4;

function randomPoint(bounds) {
  return {
    x: Math.random() * bounds.width,
    y: Math.random() * bounds.height,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function updatePetMovement(
  pet,
  deltaTime,
  bounds
) {
  if (pet.dragging) return pet;

  switch (pet.state) {
    case PET_STATES.FOLLOW:
      updateFollow(pet, deltaTime, bounds);
      break;

    case PET_STATES.WALK:
      updateWalk(pet, deltaTime, bounds);
      break;

    case PET_STATES.IDLE:
      updateIdle(pet, bounds);
      break;

    default:
      break;
  }

  return pet;
}

function updateIdle(pet, bounds) {
  pet.timers.wander++;

  if (pet.timers.wander < 180) return;

  pet.timers.wander = 0;

  pet.target = randomPoint(bounds);

  startWalking(pet);
}

function updateWalk(
  pet,
  deltaTime,
  bounds
) {
  if (!pet.target) {
    stopWalking(pet);
    return;
  }

  const dx = pet.target.x - pet.position.x;
  const dy = pet.target.y - pet.position.y;

  const distance = Math.hypot(dx, dy);

  if (distance < TARGET_RADIUS) {
    pet.target = null;
    stopWalking(pet);
    return;
  }

  const nx = dx / distance;
  const ny = dy / distance;

  pet.direction = nx >= 0 ? 1 : -1;

  pet.position.x += nx * DEFAULT_SPEED * deltaTime;
  pet.position.y += ny * DEFAULT_SPEED * deltaTime;

  pet.position.x = clamp(
    pet.position.x,
    0,
    bounds.width
  );

  pet.position.y = clamp(
    pet.position.y,
    0,
    bounds.height
  );
}

function updateFollow(
  pet,
  deltaTime,
  bounds
) {
  if (!pet.target) {
    stopWalking(pet);
    return;
  }

  const dx = pet.target.x - pet.position.x;
  const dy = pet.target.y - pet.position.y;

  const distance = Math.hypot(dx, dy);

  if (distance < TARGET_RADIUS) {
    return;
  }

  const nx = dx / distance;
  const ny = dy / distance;

  pet.direction = nx >= 0 ? 1 : -1;

  pet.position.x += nx * FOLLOW_SPEED * deltaTime;
  pet.position.y += ny * FOLLOW_SPEED * deltaTime;

  pet.position.x = clamp(
    pet.position.x,
    0,
    bounds.width
  );

  pet.position.y = clamp(
    pet.position.y,
    0,
    bounds.height
  );
}

export function setFollowTarget(
  pet,
  x,
  y
) {
  pet.target = { x, y };
}

export function clearTarget(pet) {
  pet.target = null;
}

export function movePetTo(
  pet,
  x,
  y
) {
  pet.position.x = x;
  pet.position.y = y;
}

export function setPetBoundsPosition(
  pet,
  bounds
) {
  pet.position.x = clamp(
    pet.position.x,
    0,
    bounds.width
  );

  pet.position.y = clamp(
    pet.position.y,
    0,
    bounds.height
  );
}