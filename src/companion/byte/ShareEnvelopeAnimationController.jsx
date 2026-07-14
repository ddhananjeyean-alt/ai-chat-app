import React, { useEffect, useRef } from "react";
import { ShareEnvelopeEvents } from "./ShareEnvelopeEvents";

export default function ShareEnvelopeAnimationController() {
  const timeout300 = useRef(null);
  const timeout800 = useRef(null);
  const timeout1200 = useRef(null);
  const rafWindup = useRef(null);

  const clearAllTimers = () => {
    if (timeout300.current) clearTimeout(timeout300.current);
    if (timeout800.current) clearTimeout(timeout800.current);
    if (timeout1200.current) clearTimeout(timeout1200.current);
    if (rafWindup.current) cancelAnimationFrame(rafWindup.current);

    timeout300.current = null;
    timeout800.current = null;
    timeout1200.current = null;
    rafWindup.current = null;
  };

  useEffect(() => {
    // Sync active state to global window variable
    window.ShareEnvelopeAnimationActive = false;

    const handleTriggerAnimation = (shareUrl) => {
      if (window.ShareEnvelopeAnimationActive) return;
      window.ShareEnvelopeAnimationActive = true;

      // 1. Locate Byte to get initial coordinates
      const byteEl = document.querySelector(".byte-movement-container");
      let byteRect = byteEl
        ? byteEl.getBoundingClientRect()
        : { left: window.innerWidth - 110, top: window.innerHeight - 180, width: 95, height: 137 };

      const getHandCoords = (bRect, offset = { x: 0, y: 0 }) => {
        // Left hand position is approx 42% of width and 37% of height inside Byte's SVG bounding box
        return {
          x: bRect.left + bRect.width * 0.42 + offset.x,
          y: bRect.top + bRect.height * 0.37 + offset.y,
        };
      };

      // Phase 1: Notice (t = 0)
      // Byte turns head toward the Share button and shows "!" bubble
      ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
        phase: "noticing",
        shareBtnCoords: getShareButtonCoords(),
      });

      // Phase 2: Materialize & Reach (t = 300ms)
      // "!" bubble disappears. Envelope materializes. Byte reaches toward the envelope.
      timeout300.current = setTimeout(() => {
        const currentByteEl = document.querySelector(".byte-movement-container");
        const currentRect = currentByteEl ? currentByteEl.getBoundingClientRect() : byteRect;
        const handCoords = getHandCoords(currentRect);

        ShareEnvelopeEvents.publish(ShareEnvelopeEvents.START_ANIMATION, {
          startCoords: handCoords,
          shareUrl,
        });
        ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
          phase: "reaching",
        });
      }, 300);

      // Phase 3: Wind-up / Pull back (t = 800ms)
      // Byte grabs the envelope and pulls arm back, shifting the envelope along with his body
      timeout800.current = setTimeout(() => {
        const currentByteEl = document.querySelector(".byte-movement-container");
        const currentRect = currentByteEl ? currentByteEl.getBoundingClientRect() : byteRect;
        const startWindupRect = { ...currentRect };

        let startTimestamp = null;
        const windupDuration = 400;

        const animateWindup = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const elapsed = timestamp - startTimestamp;
          const p = Math.min(elapsed / windupDuration, 1);

          // Ease out curve
          const ease = p * (2 - p);

          // Shift Byte back (right and up) and rotate slightly
          const byteOffset = {
            x: ease * 15,
            y: ease * -10,
          };
          const byteRotate = ease * 8; // degrees

          // Update hand position dynamically during windup
          const shiftedRect = {
            left: startWindupRect.left + byteOffset.x,
            top: startWindupRect.top + byteOffset.y,
            width: startWindupRect.width,
            height: startWindupRect.height,
          };
          const currentHandCoords = getHandCoords(shiftedRect);

          // Publish current coords so envelope moves in sync with Byte's hand
          ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
            phase: "windup",
            byteOffset,
            byteRotate,
          });
          ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
            phase: "sync-hand",
            handCoords: currentHandCoords,
          });

          if (p < 1) {
            rafWindup.current = requestAnimationFrame(animateWindup);
          }
        };
        rafWindup.current = requestAnimationFrame(animateWindup);
      }, 800);

      // Phase 4: Throw (t = 1200ms)
      // Byte releases the envelope, triggering canvas flight, and returns smoothly to base position
      timeout1200.current = setTimeout(() => {
        const currentByteEl = document.querySelector(".byte-movement-container");
        const currentRect = currentByteEl ? currentByteEl.getBoundingClientRect() : byteRect;
        
        // Use current windup coordinates to calculate release position
        const releaseRect = {
          left: currentRect.left,
          top: currentRect.top,
          width: currentRect.width,
          height: currentRect.height,
        };
        const releaseHandCoords = getHandCoords(releaseRect);

        // 1. Release envelope to fly
        ShareEnvelopeEvents.publish(ShareEnvelopeEvents.ENVELOPE_THROWN, {
          releaseCoords: releaseHandCoords,
        });

        // 2. Immediately set Byte to idle (Do NOT animate Byte after throw)
        ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
          phase: "idle",
        });
      }, 1200);
    };

    // Subscriptions
    const unsubStart = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.START_ANIMATION, () => {
      // Verify subscription
    });
    
    // Listen for complete global reset
    const unsubReset = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.RESET_ANIMATION, () => {
      clearAllTimers();
      window.ShareEnvelopeAnimationActive = false;
    });

    const triggerListener = (event) => {
      if (event.detail && event.detail.trigger) {
        handleTriggerAnimation(event.detail.shareUrl);
      }
    };

    // Attach custom event listener so App.jsx can trigger it easily
    window.addEventListener("trigger-share-envelope-animation", triggerListener);

    return () => {
      unsubStart();
      unsubReset();
      window.removeEventListener("trigger-share-envelope-animation", triggerListener);
      clearAllTimers();
      window.ShareEnvelopeAnimationActive = false;
    };
  }, []);

  const getShareButtonCoords = () => {
    const btn = document.getElementById("header-share-button");
    if (btn) {
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: window.innerWidth - 100, y: 40 };
  };

  return null; // Invisible coordinator
}
