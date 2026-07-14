/**
 * petAnimationAdapter.js
 * ------------------------------------------------------------------
 * Companion Engine V1
 *
 * Animation bridge.
 *
 * Responsibilities:
 * - Convert pet state -> animation name
 * - Future species overrides
 * - Animation metadata lookup
 *
 * Does NOT:
 * - Draw
 * - Decode sprites
 * - Advance frames
 * - Replace the existing animation engine
 */

import { PET_STATES } from "./petDefaults";

const DEFAULT_ANIMATIONS = Object.freeze({
  [PET_STATES.IDLE]: "idle",
  [PET_STATES.WALK]: "walk",
  [PET_STATES.SLEEP]: "sleep",
  [PET_STATES.EAT]: "eat",
  [PET_STATES.HAPPY]: "happy",
  [PET_STATES.FOLLOW]: "walk",
  [PET_STATES.DRAG]: "idle",
});

const speciesAnimations = new Map();

export function registerSpeciesAnimations(
  species,
  animations
) {
  speciesAnimations.set(species, {
    ...DEFAULT_ANIMATIONS,
    ...animations,
  });
}

export function getAnimationName(pet) {
  const map =
    speciesAnimations.get(pet.species) ??
    DEFAULT_ANIMATIONS;

  return (
    map[pet.state] ??
    DEFAULT_ANIMATIONS.idle
  );
}

export function syncPetAnimation(pet) {
  const animation = getAnimationName(pet);

  if (pet.animation.name !== animation) {
    pet.animation.name = animation;
    pet.animation.frame = 0;
    pet.animation.elapsed = 0;
  }

  return pet.animation;
}

export function getCurrentAnimation(pet) {
  return pet.animation;
}