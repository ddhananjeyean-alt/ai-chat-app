/**
 * animationDefinitions.js
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Animation metadata only.
 *
 * No React.
 * No rendering.
 * No timing.
 */

export const PET_ANIMATIONS = Object.freeze({
  idle: {
    name: "idle",
    fps: 6,
    loop: true,
    frames: 4,
  },

  walk: {
    name: "walk",
    fps: 10,
    loop: true,
    frames: 8,
  },

  sleep: {
    name: "sleep",
    fps: 4,
    loop: true,
    frames: 4,
  },

  eat: {
    name: "eat",
    fps: 8,
    loop: false,
    frames: 6,
  },

  happy: {
    name: "happy",
    fps: 10,
    loop: false,
    frames: 8,
  },

  follow: {
    name: "walk",
    fps: 10,
    loop: true,
    frames: 8,
  },

  drag: {
    name: "idle",
    fps: 6,
    loop: true,
    frames: 4,
  },
});

export function getAnimation(name) {
  return PET_ANIMATIONS[name] ?? PET_ANIMATIONS.idle;
}

export function hasAnimation(name) {
  return name in PET_ANIMATIONS;
}

export function listAnimations() {
  return Object.keys(PET_ANIMATIONS);
}