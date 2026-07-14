/**
 * spriteLoader.js
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Sprite Asset Loader
 *
 * Responsibilities:
 * - Load sprite sheets
 * - Cache loaded images
 * - Support multiple species
 * - Support skins/themes later
 *
 * No React.
 * No rendering.
 */

const spriteCache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Sprite source is missing."));
      return;
    }

    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () =>
      reject(
        new Error(`Failed to load sprite: ${src}`)
      );

    image.src = src;
  });
}

export async function loadSprite(name, src) {
  if (spriteCache.has(name)) {
    return spriteCache.get(name);
  }

  const image = await loadImage(src);

  spriteCache.set(name, image);

  return image;
}

export async function preloadSprites(definitions) {
  const entries = Object.entries(definitions);

  await Promise.all(
    entries.map(([name, src]) =>
      loadSprite(name, src)
    )
  );
}

export function getSprite(name) {
  return spriteCache.get(name) ?? null;
}

export function hasSprite(name) {
  return spriteCache.has(name);
}

export function removeSprite(name) {
  spriteCache.delete(name);
}

export function clearSpriteCache() {
  spriteCache.clear();
}

export function listLoadedSprites() {
  return [...spriteCache.keys()];
}

export function spriteCount() {
  return spriteCache.size;
}