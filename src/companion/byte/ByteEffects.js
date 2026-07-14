/**
 * ==========================================
 * ByteEffects
 * ------------------------------------------
 * Visual state helper for Byte.
 * Future:
 *  - blinking
 *  - eye tracking
 *  - typing
 *  - celebration
 *  - theme reactions
 * ==========================================
 */

export const BYTE_STATE = {
  IDLE: "idle",
  HAPPY: "happy",
  THINKING: "thinking",
  WAVE: "wave",
  BLINK: "blink",
  SLEEP: "sleep",
  SURPRISED: "surprised",
  SAD: "sad",
};

export function getExpression(state) {
  switch (state) {
    case BYTE_STATE.BLINK:
      return "blink";

    case BYTE_STATE.SLEEP:
      return "sleep";

    case BYTE_STATE.SURPRISED:
      return "surprised";

    case BYTE_STATE.SAD:
      return "sad";

    case BYTE_STATE.THINKING:
      return "thinking";

    default:
      return "happy";
  }
}

export function getClassName(state) {
  switch (state) {
    case BYTE_STATE.THINKING:
      return "thinking";

    case BYTE_STATE.HAPPY:
      return "happy";

    case BYTE_STATE.WAVE:
      return "wave";

    default:
      return "idle";
  }
}

export function nextBlinkDelay() {
  return 2500 + Math.random() * 3000;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}