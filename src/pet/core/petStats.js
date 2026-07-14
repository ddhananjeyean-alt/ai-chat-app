/**
 * petStats.js
 * ------------------------------------------------------------------
 * Companion Engine V1
 *
 * Pure Pet Stats Engine.
 *
 * Responsibilities:
 * - Hunger
 * - Happiness
 * - Energy
 * - Feeding
 * - Playing
 * - Sleeping recovery
 *
 * No React.
 * No rendering.
 * No movement.
 */

import { startEating, startSleeping, playHappyAnimation } from "./petStateMachine";

const MAX_STAT = 100;
const MIN_STAT = 0;

const HUNGER_DECAY = 1.2;
const HAPPINESS_DECAY = 0.35;
const ENERGY_DECAY = 0.7;

const ENERGY_RECOVERY = 8;

function clamp(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

export function updatePetStats(pet, deltaTime) {
  const stats = pet.stats;

  if (pet.state === "sleep") {
    stats.energy += ENERGY_RECOVERY * deltaTime;
    stats.energy = clamp(stats.energy);

    if (stats.energy >= MAX_STAT) {
      stats.energy = MAX_STAT;
    }

    return pet;
  }

  stats.hunger -= HUNGER_DECAY * deltaTime;
  stats.happiness -= HAPPINESS_DECAY * deltaTime;
  stats.energy -= ENERGY_DECAY * deltaTime;

  stats.hunger = clamp(stats.hunger);
  stats.happiness = clamp(stats.happiness);
  stats.energy = clamp(stats.energy);

  if (stats.energy <= 10) {
    startSleeping(pet);
  }

  pet.metadata.updatedAt = Date.now();

  return pet;
}

export function feedPet(pet, amount = 30) {
  pet.stats.hunger = clamp(
    pet.stats.hunger + amount
  );

  startEating(pet);

  pet.metadata.updatedAt = Date.now();

  return pet;
}

export function playWithPet(
  pet,
  happinessGain = 20,
  energyCost = 8
) {
  pet.stats.happiness = clamp(
    pet.stats.happiness + happinessGain
  );

  pet.stats.energy = clamp(
    pet.stats.energy - energyCost
  );

  playHappyAnimation(pet);

  pet.metadata.updatedAt = Date.now();

  return pet;
}

export function restoreEnergy(
  pet,
  amount = 25
) {
  pet.stats.energy = clamp(
    pet.stats.energy + amount
  );

  pet.metadata.updatedAt = Date.now();

  return pet;
}

export function setPetStats(
  pet,
  stats
) {
  pet.stats = {
    hunger: clamp(stats.hunger),
    happiness: clamp(stats.happiness),
    energy: clamp(stats.energy),
  };

  pet.metadata.updatedAt = Date.now();

  return pet;
}

export function isHungry(pet) {
  return pet.stats.hunger <= 30;
}

export function isTired(pet) {
  return pet.stats.energy <= 20;
}

export function isHappy(pet) {
  return pet.stats.happiness >= 75;
}

export function getPetMood(pet) {
  if (pet.stats.energy <= 20) {
    return "tired";
  }

  if (pet.stats.hunger <= 25) {
    return "hungry";
  }

  if (pet.stats.happiness <= 25) {
    return "sad";
  }

  if (pet.stats.happiness >= 80) {
    return "happy";
  }

  return "normal";
}