/**
 * spriteLoader.js
 * ---------------------------------------------------------------------------
 * Responsible for building sprite frame URL tables and warming the browser's
 * image cache so the first play-through of each animation never flickers or
 * shows a blank frame.
 * ---------------------------------------------------------------------------
 */

import {
  SPRITE_BASE_PATH,
  COMPANION_TYPES,
  ANIMATION_STATES,
  FRAME_COUNTS,
} from './constants';

/**
 * Builds the ordered list of frame URLs for a single (companion, state) pair.
 * e.g. buildFramePaths('cat', 'run') ->
 *   ['/companions/cat/run/run1.png', ..., '/companions/cat/run/run8.png']
 */
function buildFramePaths(companionType, state) {
  const count = FRAME_COUNTS[state];
  const frames = [];
  for (let i = 1; i <= count; i += 1) {
    frames.push(`${SPRITE_BASE_PATH}/${companionType}/${state}/${state}${i}.png`);
  }
  return frames;
}

/**
 * Builds the full sprite table for one companion:
 * { run: [...urls], idle: [...urls], turn: [...urls] }
 */
function buildCompanionSpriteSet(companionType) {
  const states = Object.values(ANIMATION_STATES);
  const set = {};
  states.forEach((state) => {
    set[state] = buildFramePaths(companionType, state);
  });
  return set;
}

/**
 * Preloads a single image URL. Resolves even on error (we don't want one
 * missing/renamed frame to block the whole engine from starting) but logs
 * a warning so it's easy to spot in dev.
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ url, ok: true });
    img.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn(`[CompanionEngine] Failed to preload sprite: ${url}`);
      resolve({ url, ok: false });
    };
    img.src = url;
  });
}

/**
 * Builds sprite tables for every companion type and preloads every frame.
 * Returns a promise resolving to:
 *   { cat: { run: [...], idle: [...], turn: [...] }, mouse: { ... } }
 */
export async function loadAllSprites() {
  const companionTypes = Object.values(COMPANION_TYPES);
  const spriteTables = {};
  const preloadPromises = [];

  companionTypes.forEach((type) => {
    const set = buildCompanionSpriteSet(type);
    spriteTables[type] = set;
    Object.values(set).forEach((urls) => {
      urls.forEach((url) => preloadPromises.push(preloadImage(url)));
    });
  });

  await Promise.all(preloadPromises);
  return spriteTables;
}