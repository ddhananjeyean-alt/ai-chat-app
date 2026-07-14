/**
 * petBehavior.js
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Autonomous Behavior Engine
 *
 * Responsibilities
 * - Decide what the pet wants to do
 * - Mood-based behavior
 * - Random wandering
 * - Sleep decisions
 * - Hunger decisions
 *
 * No rendering.
 * No React.
 */

import { PET_STATES } from "./petDefaults";
import {
  startWalking,
  startSleeping,
  startEating,
  stopWalking,
} from "./petStateMachine";

const DECISION_INTERVAL = 3;

export function updateBehavior(pet, deltaTime) {
  if (pet.dragging) return;

  if (
    pet.state === PET_STATES.DRAG ||
    pet.state === PET_STATES.FOLLOW
  ) {
    return;
  }

  pet.behaviorTimer =
    (pet.behaviorTimer ?? 0) + deltaTime;

  if (pet.behaviorTimer < DECISION_INTERVAL) {
    return;
  }

  pet.behaviorTimer = 0;

  makeDecision(pet);
}

function makeDecision(pet) {
  const {
    hunger,
    happiness,
    energy,
  } = pet.stats;

  if (energy <= 20) {
    startSleeping(pet);
    return;
  }

  if (hunger <= 20) {
    startEating(pet);
    return;
  }

  if (happiness <= 25) {
    startWalking(pet);
    return;
  }

  const random = Math.random();

  if (random < 0.35) {
    startWalking(pet);
    return;
  }

  stopWalking(pet);
}

export function forceSleep(pet) {
  startSleeping(pet);
}

export function forceEat(pet) {
  startEating(pet);
}

export function forceWalk(pet) {
  startWalking(pet);
}

export function wakeUp(pet) {
  if (pet.state === PET_STATES.SLEEP) {
    stopWalking(pet);
  }
}