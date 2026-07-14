/**
 * constants.js
 * ---------------------------------------------------------------------------
 * Single source of truth for every tunable number in the Companion Engine.
 * Nothing in animationEngine.js, pathEngine.js, spriteLoader.js or
 * BorderCompanions.jsx should contain a raw magic number — everything is
 * imported from here.
 * ---------------------------------------------------------------------------
 */

// -----------------------------------------------------------------------
// Sprite root (public/ folder is served from "/")
// -----------------------------------------------------------------------
export const SPRITE_BASE_PATH = '/companions';

// Companion identifiers
export const COMPANION_TYPES = {
  CAT: 'cat',
  MOUSE: 'mouse',
};

// -----------------------------------------------------------------------
// Animation states
// -----------------------------------------------------------------------
export const ANIMATION_STATES = {
  RUN: 'run',
  IDLE: 'idle',
  TURN: 'turn',
};

// How many frames exist per state, per companion (all companions share counts)
export const FRAME_COUNTS = {
  [ANIMATION_STATES.RUN]: 8,
  [ANIMATION_STATES.IDLE]: 4,
  [ANIMATION_STATES.TURN]: 3,
};

// Sprite animation playback rate (independent from the 60 FPS movement loop)
export const SPRITE_FPS = 12;
export const MS_PER_SPRITE_FRAME = 1000 / SPRITE_FPS;

// -----------------------------------------------------------------------
// Movement speeds (pixels per second, along the border path)
// -----------------------------------------------------------------------
export const MOUSE_SPEED_PX_PER_SEC = 140;
export const CAT_SPEED_PX_PER_SEC = 138;

// The cat is never allowed to exceed this fraction of the mouse's speed,
// which is what mathematically guarantees "mouse always escapes."
export const CAT_MAX_SPEED_RATIO = 0.99;
// Floor so the cat never grinds to a near-stop while correcting.
export const CAT_MIN_SPEED_RATIO = 0.55;

// -----------------------------------------------------------------------
// Cat chase behavior (distance-behind-mouse controller)
// -----------------------------------------------------------------------
export const CAT_FOLLOW_DISTANCE_MIN = 70; // px behind mouse
export const CAT_FOLLOW_DISTANCE_MAX = 90; // px behind mouse
export const CAT_FOLLOW_DISTANCE_TARGET =
  (CAT_FOLLOW_DISTANCE_MIN + CAT_FOLLOW_DISTANCE_MAX) / 2;

// Proportional gain for the cat's speed-correction controller.
// (error in px) * gain = speed adjustment in px/sec
export const CAT_CORRECTION_GAIN = 0.9;

// -----------------------------------------------------------------------
// Turning / cornering
// -----------------------------------------------------------------------
// How close (in px, measured along the path) to a corner before a
// companion is considered "at" the corner and begins its turn animation.
export const CORNER_TRIGGER_RADIUS = 4;

// Total time a turn takes: this drives both the turn sprite playback
// AND the smooth rotation interpolation, so they stay in sync.
export const TURN_DURATION_MS = 320;

// Easing used for the rotation interpolation during a turn (simple cubic
// ease-in-out, computed inline — no external easing lib required).
export const TURN_EASING = (t) => (t < 0.5
  ? 4 * t * t * t
  : 1 - Math.pow(-2 * t + 2, 3) / 2);

// -----------------------------------------------------------------------
// Sprite rendering size (responsive)
// -----------------------------------------------------------------------
// Breakpoints follow common device widths. Sizes are the rendered
// width/height (sprites are square) of each companion, in px.
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE_MAX_WIDTH: 600,
  TABLET_MAX_WIDTH: 1024,
};

export const SPRITE_SIZE_BY_DEVICE = {
  MOBILE: 40,
  TABLET: 52,
  DESKTOP: 64,
};

// How far inside the viewport edge the path sits, so sprites are never
// clipped by the browser edge. Scales with sprite size (defined in
// pathEngine.js as SPRITE_SIZE / 2 + this constant).
export const PATH_EDGE_MARGIN = 6;

// -----------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------
export const COMPANION_Z_INDEX = 9999;

// -----------------------------------------------------------------------
// Resize handling
// -----------------------------------------------------------------------
export const RESIZE_DEBOUNCE_MS = 150;

export const MAX_DELTA_TIME_SEC = 0.05; // 50ms ~ 3 dropped frames at 60fps