/**
 * petStateMachine.js
 * ------------------------------------------------------------------
 * Companion Engine V1
 *
 * Pure Pet State Machine.
 *
 * Responsibilities:
 * - State transitions
 * - State timing
 * - Animation selection
 *
 * Does NOT:
 * - Move the pet
 * - Render anything
 * - Touch React
 */

import { PET_STATES } from "./petDefaults";

const STATE_ANIMATIONS = Object.freeze({
  [PET_STATES.IDLE]: "idle",
  [PET_STATES.WALK]: "walk",
  [PET_STATES.SLEEP]: "sleep",
  [PET_STATES.EAT]: "eat",
  [PET_STATES.HAPPY]: "happy",
  [PET_STATES.FOLLOW]: "walk",
  [PET_STATES.DRAG]: "idle",
});

export function setPetState(pet, newState) {
  if (pet.state === newState) return pet;

  pet.state = newState;

  pet.animation.name = STATE_ANIMATIONS[newState] ?? "idle";
  pet.animation.frame = 0;
  pet.animation.elapsed = 0;

  pet.metadata.updatedAt = Date.now();

  return pet;
}

export function updatePetState(pet, deltaTime) {
  pet.timers.idle += deltaTime;

  switch (pet.state) {
    case PET_STATES.EAT:
      pet.timers.eat += deltaTime;

      if (pet.timers.eat >= 2) {
        pet.timers.eat = 0;
        setPetState(pet, PET_STATES.IDLE);
      }
      break;

    case PET_STATES.HAPPY:
      pet.timers.happy += deltaTime;

      if (pet.timers.happy >= 2) {
        pet.timers.happy = 0;
        setPetState(pet, PET_STATES.IDLE);
      }
      break;

    case PET_STATES.SLEEP:
      if (pet.stats.energy >= 100) {
        setPetState(pet, PET_STATES.IDLE);
      }
      break;

    case PET_STATES.DRAG:
      // External controller handles drag.
      break;

    case PET_STATES.FOLLOW:
      // External movement controller decides when to stop.
      break;

    case PET_STATES.WALK:
    case PET_STATES.IDLE:
    default:
      break;
  }

  return pet;
}

export function playHappyAnimation(pet) {
  pet.timers.happy = 0;
  return setPetState(pet, PET_STATES.HAPPY);
}

export function startEating(pet) {
  pet.timers.eat = 0;
  return setPetState(pet, PET_STATES.EAT);
}

export function startSleeping(pet) {
  pet.timers.sleep = 0;
  return setPetState(pet, PET_STATES.SLEEP);
}

export function startWalking(pet) {
  return setPetState(pet, PET_STATES.WALK);
}

export function stopWalking(pet) {
  return setPetState(pet, PET_STATES.IDLE);
}

export function startFollowing(pet) {
  return setPetState(pet, PET_STATES.FOLLOW);
}

export function stopFollowing(pet) {
  return setPetState(pet, PET_STATES.IDLE);
}

export function startDragging(pet) {
  return setPetState(pet, PET_STATES.DRAG);
}

export function stopDragging(pet) {
  return setPetState(pet, PET_STATES.IDLE);
}