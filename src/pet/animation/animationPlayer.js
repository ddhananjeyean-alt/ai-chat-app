/**
 * animationPlayer.js
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Pure animation playback engine.
 *
 * Responsibilities:
 * - Advance animation frames
 * - Delta time playback
 * - Looping
 * - One-shot animations
 *
 * No React.
 * No rendering.
 */

import { getAnimation } from "./animationDefinitions";

export function updateAnimation(pet, deltaTime) {
  const animation = getAnimation(pet.animation.name);

  if (!animation) {
    return pet.animation;
  }

  pet.animation.elapsed += deltaTime;

  const frameDuration = 1 / animation.fps;

  while (pet.animation.elapsed >= frameDuration) {
    pet.animation.elapsed -= frameDuration;

    pet.animation.frame++;

    if (pet.animation.frame >= animation.frames) {
      if (animation.loop) {
        pet.animation.frame = 0;
      } else {
        pet.animation.frame = animation.frames - 1;
      }
    }
  }

  return pet.animation;
}

export function resetAnimation(pet) {
  pet.animation.frame = 0;
  pet.animation.elapsed = 0;

  return pet.animation;
}

export function setAnimation(pet, animationName) {
  if (pet.animation.name === animationName) {
    return;
  }

  pet.animation.name = animationName;
  pet.animation.frame = 0;
  pet.animation.elapsed = 0;
}

export function getCurrentFrame(pet) {
  return pet.animation.frame;
}

export function getCurrentAnimation(pet) {
  return getAnimation(pet.animation.name);
}

export function animationFinished(pet) {
  const animation = getAnimation(pet.animation.name);

  if (animation.loop) {
    return false;
  }

  return pet.animation.frame >= animation.frames - 1;
}