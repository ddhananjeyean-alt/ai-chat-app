/**
 * animationEngine.js
 * ---------------------------------------------------------------------------
 * Pure state-machine logic for sprite playback: which frame to show, and
 * when a companion should be in RUN vs TURN vs IDLE. Movement math lives in
 * pathEngine.js — this file only decides "which image" and "what rotation
 * offset" a companion should render on a given tick.
 *
 * Each companion gets one CompanionAnimator instance. It is a small class
 * (not a React hook) so it can live inside a ref and be mutated every frame
 * of the rAF loop without triggering React re-renders — re-renders happen
 * only through direct DOM style writes in BorderCompanions.jsx.
 * ---------------------------------------------------------------------------
 */

import {
  ANIMATION_STATES,
  FRAME_COUNTS,
  MS_PER_SPRITE_FRAME,
  TURN_DURATION_MS,
  TURN_EASING,
} from './constants';

export class CompanionAnimator {
  constructor() {
    this.state = ANIMATION_STATES.RUN;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;

    // Turn-specific bookkeeping
    this.turnElapsedMs = 0;
    this.turnFromAngle = 0;
    this.turnToAngle = 0;

    // The last committed "resting" heading, used as the base for the next
    // turn interpolation and for RUN/IDLE rendering.
    this.currentRenderAngle = 0;

    // Tracks which path segment we were on last frame, so BorderCompanions
    // can detect "we just crossed into a new segment" and call beginTurn().
    this.lastSegmentIndex = null;
  }

  /**
   * Call once per rAF tick with the elapsed sprite-animation time.
   * deltaMs: real time elapsed since last tick (ms).
   */
  tick(deltaMs) {
    if (this.state === ANIMATION_STATES.TURN) {
      this._tickTurn(deltaMs);
    } else {
      this._tickFrameCycle(deltaMs, this.state);
    }
  }

  _tickFrameCycle(deltaMs, state) {
    this.frameElapsedMs += deltaMs;
    const frameCount = FRAME_COUNTS[state];
    while (this.frameElapsedMs >= MS_PER_SPRITE_FRAME) {
      this.frameElapsedMs -= MS_PER_SPRITE_FRAME;
      this.frameIndex = (this.frameIndex + 1) % frameCount;
    }
  }

  _tickTurn(deltaMs) {
    this.turnElapsedMs += deltaMs;

    // Advance turn sprite frames (turn1 -> turn2 -> turn3, no repeat)
    const turnFrameCount = FRAME_COUNTS[ANIMATION_STATES.TURN];
    const turnProgress = Math.min(this.turnElapsedMs / TURN_DURATION_MS, 1);
    this.frameIndex = Math.min(
      Math.floor(turnProgress * turnFrameCount),
      turnFrameCount - 1,
    );

    // Smoothly interpolate rotation using an eased curve (never instant).
    const eased = TURN_EASING(turnProgress);
    this.currentRenderAngle = lerpAngle(
      this.turnFromAngle,
      this.turnToAngle,
      eased,
    );

    if (turnProgress >= 1) {
      // Turn complete -> resume running.
      this.state = ANIMATION_STATES.RUN;
      this.frameIndex = 0;
      this.frameElapsedMs = 0;
      this.currentRenderAngle = this.turnToAngle;
    }
  }

  /**
   * Begins a turn from the current render angle to `toAngle`. Safe to call
   * even if already turning (it just retargets, still smooth).
   */
  beginTurn(toAngle) {
    if (this.state === ANIMATION_STATES.TURN && this.turnToAngle === toAngle) {
      return; // already turning to this exact angle, avoid restarting
    }
    this.state = ANIMATION_STATES.TURN;
    this.turnElapsedMs = 0;
    this.turnFromAngle = this.currentRenderAngle;
    this.turnToAngle = normalizeTurnTarget(this.turnFromAngle, toAngle);
    this.frameIndex = 0;
  }

  /**
   * Sets angle directly with no interpolation. Used only once, on first
   * mount, to establish the initial heading without a "turn from 0".
   */
  setInitialAngle(angle) {
    this.currentRenderAngle = angle;
    this.turnFromAngle = angle;
    this.turnToAngle = angle;
  }

  /** Returns the sprite frame URL to render right now. */
  getCurrentFrameUrl(spriteSet) {
    const frames = spriteSet[this.state];
    return frames[this.frameIndex] ?? frames[0];
  }

  /** Returns the current rotation angle (degrees) to apply to the sprite. */
  getRenderAngle() {
    return this.currentRenderAngle;
  }
}

/**
 * Rotation always proceeds in the +90deg (clockwise) direction as
 * companions travel clockwise around the border. Rather than wrapping
 * angles modulo 360 (which would force an ugly reverse-spin at the
 * 270->0 wrap), we keep angle accumulating monotonically upward, e.g.
 * 0 -> 90 -> 180 -> 270 -> 360 -> 450 ... CSS `rotate()` renders any of
 * these identically to their mod-360 equivalent, so this is purely a
 * math convenience that guarantees every turn spins the same direction.
 */
function normalizeTurnTarget(fromAngle, rawToAngle) {
  const fromMod = ((fromAngle % 360) + 360) % 360;
  const toMod = ((rawToAngle % 360) + 360) % 360;
  let delta = toMod - fromMod;
  if (delta < 0) delta += 360;
  // If delta is 0 (shouldn't normally happen since we only call beginTurn
  // on an actual corner/direction change), still allow a full loop rather
  // than a no-op spin.
  if (delta === 0) delta = 360;
  return fromAngle + delta;
}

function lerpAngle(from, to, t) {
  return from + (to - from) * t;
}