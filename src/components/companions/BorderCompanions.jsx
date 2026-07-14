/**
 * BorderCompanions.jsx
 * ---------------------------------------------------------------------------
 * The Companion Engine's single entry point / orchestrator.
 *
 * Responsibilities:
 *  - Load & preload sprites once.
 *  - Compute the border path for the current viewport (recomputed on resize).
 *  - Run exactly ONE requestAnimationFrame loop that:
 *      1. Advances mouse distance-traveled at MOUSE_SPEED_PX_PER_SEC.
 *      2. Advances cat distance-traveled via a PD-style controller that
 *         targets staying 70-90px behind the mouse, never exceeding
 *         CAT_MAX_SPEED_RATIO * mouse speed (mouse always escapes).
 *      3. Converts both distances to path positions.
 *      4. Detects segment (corner) crossings and triggers turn animations.
 *      5. Writes position/rotation/frame directly to the DOM via refs
 *         (no React state updates in the hot loop -> no re-renders).
 *  - Pauses cleanly when the tab is hidden and resumes without a time-jump.
 *  - Cleans up all listeners/rAF on unmount.
 *
 * This component renders on top of the existing app via a fixed, full-screen,
 * pointer-events:none layer. It does not read from, wrap, or alter any
 * existing component (Sidebar, ChatWindow, ChatInput, Header, etc.).
 * ---------------------------------------------------------------------------
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './BorderCompanions.css';
import { loadAllSprites } from './spriteLoader';
import * as PathEngine from "./pathEngine";
import { CompanionAnimator } from './animationEngine';
import {
  COMPANION_TYPES,
  MOUSE_SPEED_PX_PER_SEC,
  CAT_SPEED_PX_PER_SEC,
  CAT_MAX_SPEED_RATIO,
  CAT_MIN_SPEED_RATIO,
  CAT_FOLLOW_DISTANCE_TARGET,
  CAT_CORRECTION_GAIN,
  RESPONSIVE_BREAKPOINTS,
  SPRITE_SIZE_BY_DEVICE,
  RESIZE_DEBOUNCE_MS,
  MAX_DELTA_TIME_SEC,
} from './constants';

/**
 * Determines the responsive sprite size for the current viewport width.
 */
function getResponsiveSpriteSize(width) {
  if (width <= RESPONSIVE_BREAKPOINTS.MOBILE_MAX_WIDTH) {
    return SPRITE_SIZE_BY_DEVICE.MOBILE;
  }
  if (width <= RESPONSIVE_BREAKPOINTS.TABLET_MAX_WIDTH) {
    return SPRITE_SIZE_BY_DEVICE.TABLET;
  }
  return SPRITE_SIZE_BY_DEVICE.DESKTOP;
}

export default function BorderCompanions({ enabled = true }) {
  const [spriteTables, setSpriteTables] = useState(null);
  const [spriteSize, setSpriteSize] = useState(() =>
    getResponsiveSpriteSize(typeof window !== 'undefined' ? window.innerWidth : 1200),
  );

  // DOM refs for direct, allocation-free style writes every frame.
  const mouseElRef = useRef(null);
  const mouseImgRef = useRef(null);
  const catElRef = useRef(null);
  const catImgRef = useRef(null);

  // Mutable engine state that must NOT trigger re-renders.
  const engineRef = useRef({
    path: null, // { segments, perimeter }
    mouseDistance: 0,
    catDistance: 0,
    mouseAnimator: new CompanionAnimator(),
    catAnimator: new CompanionAnimator(),
    rafId: null,
    lastTimestamp: null,
    isPaused: false,
  });

  // -------------------------------------------------------------------
  // Load sprites once on mount.
  // -------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    loadAllSprites().then((tables) => {
      if (!cancelled) setSpriteTables(tables);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------
  // (Re)build the border path whenever viewport size or sprite size
  // changes. Debounced so rapid resize events don't thrash geometry.
  // -------------------------------------------------------------------
  const rebuildPath = useCallback((width, height, size) => {
    const engine = engineRef.current;
    const previousPerimeter = engine.path ? engine.path.perimeter : null;
    const newPath = PathEngine.buildBorderPath(width, height, size);

    // Rescale existing progress proportionally so companions don't jump
    // to a wildly different spot when the window is resized mid-run.
    if (previousPerimeter && previousPerimeter > 0) {
      const ratio = newPath.perimeter / previousPerimeter;
      engine.mouseDistance *= ratio;
      engine.catDistance *= ratio;
    }

    engine.path = newPath;
  }, []);

  useEffect(() => {
    let resizeTimer = null;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newSize = getResponsiveSpriteSize(window.innerWidth);
        setSpriteSize(newSize);
        rebuildPath(window.innerWidth, window.innerHeight, newSize);
      }, RESIZE_DEBOUNCE_MS);
    };

    // Initial build.
    rebuildPath(window.innerWidth, window.innerHeight, spriteSize);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
    // spriteSize intentionally omitted from deps: resize handler always
    // reads the freshest value via getResponsiveSpriteSize itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildPath]);

  // Rebuild immediately if spriteSize state changes for a reason other
  // than the debounced resize above (e.g. first mount).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    rebuildPath(window.innerWidth, window.innerHeight, spriteSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spriteSize]);

  // -------------------------------------------------------------------
  // The single requestAnimationFrame loop. Starts once sprites are
  // loaded and `enabled` is true; fully torn down otherwise.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !spriteTables) return undefined;

    const engine = engineRef.current;

    // Establish a sane initial heading (no "turn from angle 0" glitch).
    engine.mouseAnimator.setInitialAngle(0);
    engine.catAnimator.setInitialAngle(0);

    const applyStyles = () => {
      const { path } = engine;
      if (!path) return;

      // ---- Mouse ----
      const mousePos = PathEngine.getPositionAtDistance(path, engine.mouseDistance);
      if (
        engine.mouseAnimator.lastSegmentIndex !== null &&
        engine.mouseAnimator.lastSegmentIndex !== mousePos.segmentIndex
      ) {
        const newAngle = path.segments[mousePos.segmentIndex].angle;
        engine.mouseAnimator.beginTurn(newAngle);
      }
      engine.mouseAnimator.lastSegmentIndex = mousePos.segmentIndex;

      // ---- Cat ----
      const catPos = getPositionAtDistance(path, engine.catDistance);
      if (
        engine.catAnimator.lastSegmentIndex !== null &&
        engine.catAnimator.lastSegmentIndex !== catPos.segmentIndex
      ) {
        const newAngle = path.segments[catPos.segmentIndex].angle;
        engine.catAnimator.beginTurn(newAngle);
      }
      engine.catAnimator.lastSegmentIndex = catPos.segmentIndex;

      // ---- Write DOM (translate centers the sprite on the path point) ----
      const half = spriteSize / 2;

      if (mouseElRef.current) {
        const angle = engine.mouseAnimator.getRenderAngle();
        mouseElRef.current.style.transform =
          `translate3d(${mousePos.x - half}px, ${mousePos.y - half}px, 0) rotate(${angle}deg)`;
      }
      if (catElRef.current) {
        const angle = engine.catAnimator.getRenderAngle();
        catElRef.current.style.transform =
          `translate3d(${catPos.x - half}px, ${catPos.y - half}px, 0) rotate(${angle}deg)`;
      }

      // ---- Write current sprite frame ----
      if (mouseImgRef.current) {
        mouseImgRef.current.src = engine.mouseAnimator.getCurrentFrameUrl(
          spriteTables[COMPANION_TYPES.MOUSE],
        );
      }
      if (catImgRef.current) {
        catImgRef.current.src = engine.catAnimator.getCurrentFrameUrl(
          spriteTables[COMPANION_TYPES.CAT],
        );
      }
    };

    const step = (timestamp) => {
      const engine2 = engineRef.current;

      if (engine2.lastTimestamp === null) {
        engine2.lastTimestamp = timestamp;
      }

      let deltaSec = (timestamp - engine2.lastTimestamp) / 1000;
      deltaSec = Math.min(deltaSec, MAX_DELTA_TIME_SEC); // clamp huge jumps
      engine2.lastTimestamp = timestamp;

      if (engine2.path) {
        const { perimeter } = engine2.path;

        // --- Advance mouse ---
        engine2.mouseDistance += MOUSE_SPEED_PX_PER_SEC * deltaSec;

        // --- Advance cat via PD-style follow controller ---
        const gap = PathEngine.getForwardGap(
          engine2.mouseDistance,
          engine2.catDistance,
          perimeter,
        );
        const error = gap - CAT_FOLLOW_DISTANCE_TARGET;
        let catSpeed = CAT_SPEED_PX_PER_SEC + error * CAT_CORRECTION_GAIN;

        // Clamp: cat can speed up to close a large gap, or slow down if
        // it's crowding the mouse, but can NEVER reach/exceed mouse speed —
        // this is what guarantees "mouse always escapes."
        const maxCatSpeed = MOUSE_SPEED_PX_PER_SEC * CAT_MAX_SPEED_RATIO;
        const minCatSpeed = MOUSE_SPEED_PX_PER_SEC * CAT_MIN_SPEED_RATIO;
        catSpeed = Math.max(minCatSpeed, Math.min(maxCatSpeed, catSpeed));

        engine2.catDistance += catSpeed * deltaSec;
      }

      // --- Advance sprite-frame state machines (12fps, independent of
      // the 60fps movement tick above) ---
      const deltaMs = deltaSec * 1000;
      engine2.mouseAnimator.tick(deltaMs);
      engine2.catAnimator.tick(deltaMs);

      applyStyles();

      engine2.rafId = requestAnimationFrame(step);
    };

    const startLoop = () => {
      if (engine.rafId !== null) return; // already running
      engine.lastTimestamp = null; // reset so next delta isn't a huge jump
      engine.rafId = requestAnimationFrame(step);
    };

    const stopLoop = () => {
      if (engine.rafId !== null) {
        cancelAnimationFrame(engine.rafId);
        engine.rafId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!document.hidden) {
      startLoop();
    }

    return () => {
      stopLoop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, spriteTables, spriteSize]);

  // -------------------------------------------------------------------
  // Render: two absolutely-inert (pointer-events:none), fixed-position
  // sprite layers. Nothing else in the existing app tree is touched.
  // -------------------------------------------------------------------
  if (!enabled || !spriteTables) return null;

  return (
    <div className="companion-layer" aria-hidden="true">
      <div
        ref={mouseElRef}
        className="companion-sprite"
        style={{ width: spriteSize, height: spriteSize }}
      >
        <img
          ref={mouseImgRef}
          src={spriteTables[COMPANION_TYPES.MOUSE].run[0]}
          alt=""
          draggable={false}
        />
      </div>
      <div
        ref={catElRef}
        className="companion-sprite"
        style={{ width: spriteSize, height: spriteSize }}
      >
        <img
          ref={catImgRef}
          src={spriteTables[COMPANION_TYPES.CAT].run[0]}
          alt=""
          draggable={false}
        />
      </div>
    </div>
  );
}