/**
 * ThemeRope.jsx
 * 
 * Renders a premium physics-based hanging rope using Verlet integration.
 * Rebuilt as a high-fidelity futuristic neon energy cable with glass-like braiding,
 * dynamic outer bloom, inner light flow, and traveling upward energy pulses.
 */

import { useState, useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { ThemeEvents } from "./ThemeEvents";
import "./ThemeRope.css";

const NUM_POINTS = 16;
const GRAVITY = 0.42;
const DAMPING = 0.985;
const ITERATIONS = 10;
const NATURAL_LENGTH = 190; // Premium longer hanging rope

export default function ThemeRope() {
  const [visible, setVisible] = useState(false);
  const [ropeX, setRopeX] = useState(0);
  const [buttonY, setButtonY] = useState(0);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [status, setStatus] = useState("idle"); // "idle", "dropping", "active", "retracting"

  // Upward traveling pulse states
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseProgress, setPulseProgress] = useState(1.0); // 1.0 (bottom) to 0.0 (top)

  // Inner light flow offset
  const [flowOffset, setFlowOffset] = useState(0);

  // React state to hold the computed path and coords for rendering
  const [ropeData, setRopeData] = useState({ pathD: "", handleX: 0, handleY: 0 });

  // Refs for physics calculations to prevent stale closures in the loop
  const pointsRef = useRef([]);
  const statusRef = useRef("idle");
  const anchorRef = useRef({ x: 0, y: 0 });
  const isGrabbedRef = useRef(false);
  const pullOffsetRef = useRef(0);
  const ropeLengthRef = useRef(0);
  const targetPosRef = useRef(null);
  const dropElapsedRef = useRef(null);
  const flowOffsetRef = useRef(0);

  // Sync refs with state in real time
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { anchorRef.current = { x: ropeX, y: buttonY }; }, [ropeX, buttonY]);
  useEffect(() => { isGrabbedRef.current = isGrabbed; }, [isGrabbed]);
  useEffect(() => { pullOffsetRef.current = pullOffset; }, [pullOffset]);

  // Handle Event Bus subscriptions
  useEffect(() => {
    // 1. TRIGGER -> Initialize points stretching from button to Byte's start position
    const unsubTrigger = ThemeEvents.subscribe(ThemeEvents.TRIGGER, (coords) => {
      setRopeX(coords.x);
      setButtonY(coords.y);
      setPullOffset(0);
      setIsGrabbed(false); // starts NOT grabbed!
      setVisible(true);
      setStatus("dropping");
      setPulseActive(false);
      ropeLengthRef.current = 0;
      dropElapsedRef.current = Date.now();

      // Initialize points dangling under anchor with horizontal swaying impulse
      const pts = [];
      for (let i = 0; i < NUM_POINTS; i++) {
        const t = i / (NUM_POINTS - 1);
        const px = coords.x + Math.sin(t * Math.PI) * 15; // Natural swaying
        const py = coords.y + t * 4;
        pts.push({
          x: px,
          y: py,
          oldX: px,
          oldY: py
        });
      }
      pointsRef.current = pts;
    });

    // 2. BYTE_REACHED -> Lock Byte to rope bottom
    const unsubReached = ThemeEvents.subscribe(ThemeEvents.BYTE_REACHED, () => {
      setIsGrabbed(true);
    });

    // 3. TARGET_POS -> Follow Byte's walking/pulling target coordinates
    const unsubTarget = ThemeEvents.subscribe("theme-pull:target-pos", (targetCoords) => {
      targetPosRef.current = targetCoords;
    });

    // 4. PULL_UPDATE -> Continuous pull displacement updates from Byte
    const unsubPull = ThemeEvents.subscribe("theme-pull:pull-update", (offset) => {
      setPullOffset(offset);
    });

    // 5. BYTE_PULLED -> Byte has reached max pull and holds tension
    const unsubBytePulled = ThemeEvents.subscribe(ThemeEvents.BYTE_PULLED, () => {
      // Trigger the upward energy pulse along the neon rope
      setPulseProgress(1.0);
      setPulseActive(true);
      animate(1.0, 0.0, {
        duration: 0.5,
        ease: "easeOut",
        onUpdate: (latest) => {
          setPulseProgress(latest);
        },
        onComplete: () => {
          setPulseActive(false);
          // Let overlay trigger button glow and radial wave
          ThemeEvents.publish("theme-pull:pulse-reached-top");
        }
      });
    });

    // 6. THEME_CHANGED -> Release Byte and transition into snap-back retraction
    const unsubThemeChanged = ThemeEvents.subscribe(ThemeEvents.THEME_CHANGED, () => {
      setIsGrabbed(false);
      setStatus("retracting");
    });

    return () => {
      unsubTrigger();
      unsubReached();
      unsubTarget();
      unsubPull();
      unsubBytePulled();
      unsubThemeChanged();
    };
  }, []);

  // Physics animation loop using requestAnimationFrame
  useEffect(() => {
    if (!visible) return;

    let animationId;

    const loop = () => {
      const pts = pointsRef.current;
      const statusVal = statusRef.current;
      const anchor = anchorRef.current;
      const grabbed = isGrabbedRef.current;

      if (pts.length === 0) {
        animationId = requestAnimationFrame(loop);
        return;
      }

      // Physics parameters
      let gravity = GRAVITY;
      let damping = DAMPING;

      // Update animated inner light flow offset
      flowOffsetRef.current = (flowOffsetRef.current + 0.005) % 1.0;
      setFlowOffset(flowOffsetRef.current);

      // Adjust target length and constraints based on lifecycle status
      if (statusVal === "retracting") {
        ropeLengthRef.current = Math.max(0, ropeLengthRef.current - 14.0);
        gravity = 0; // Disable gravity to snap straight upward
        damping = 0.72; // High damping to suppress kinetic wiggle
      } else if (statusVal === "dropping") {
        // Smoothly grow constraint length
        ropeLengthRef.current = Math.min(NATURAL_LENGTH, ropeLengthRef.current + 9.5);
        
        // Wait for drop to fully settle and notify Byte
        if (dropElapsedRef.current && Date.now() - dropElapsedRef.current > 1200) {
          setStatus("active");
          ThemeEvents.publish(ThemeEvents.ROPE_DROPPED);
          dropElapsedRef.current = null;
        }
      }

      // 1. Verlet Integration (Inertia, Gravity, and Sway)
      for (let i = 1; i < NUM_POINTS; i++) {
        const p = pts[i];
        let vx = (p.x - p.oldX) * damping;
        let vy = (p.y - p.oldY) * damping;

        p.oldX = p.x;
        p.oldY = p.y;

        p.x += vx;
        p.y += vy + gravity;

        // Apply gentle background sway (wind effect) when hanging or active
        if (statusVal === "active" || statusVal === "dropping") {
          const time = performance.now();
          p.x += Math.sin(time * 0.0016 + i * 0.25) * 0.05;
        }
      }

      // 2. Constrain Anchor Point
      pts[0].x = anchor.x;
      pts[0].y = anchor.y;

      // 3. Lock Bottom Point to Hand when grabbed
      if (statusVal === "active" && grabbed && targetPosRef.current) {
        pts[NUM_POINTS - 1].x = targetPosRef.current.x;
        pts[NUM_POINTS - 1].y = targetPosRef.current.y;
      }

      // Sucking points during retraction
      if (statusVal === "retracting") {
        for (let i = 1; i < NUM_POINTS; i++) {
          pts[i].x += (anchor.x - pts[i].x) * 0.22;
          pts[i].y += (anchor.y - pts[i].y) * 0.22;
        }
      }

      // 4. Distance Constraints Resolution (10 iterations for physical stability)
      let currentRopeLength = NATURAL_LENGTH;
      if (statusVal === "retracting" || statusVal === "dropping") {
        currentRopeLength = ropeLengthRef.current;
      } else if (grabbed && targetPosRef.current) {
        // Elasticity/Tension stretch
        const straightDist = Math.sqrt(
          (pts[NUM_POINTS - 1].x - anchor.x) ** 2 +
          (pts[NUM_POINTS - 1].y - anchor.y) ** 2
        );
        if (straightDist > NATURAL_LENGTH) {
          const stretch = straightDist - NATURAL_LENGTH;
          currentRopeLength = NATURAL_LENGTH + stretch * 0.35; // stretch with tension factor
        }
      }

      const targetSegmentLength = currentRopeLength / (NUM_POINTS - 1);

      for (let iter = 0; iter < ITERATIONS; iter++) {
        for (let i = 0; i < NUM_POINTS - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist === 0) continue;

          const diff = targetSegmentLength - dist;
          const percent = diff / dist;
          const offsetX = dx * percent;
          const offsetY = dy * percent;

          if (i === 0) {
            p2.x += offsetX;
            p2.y += offsetY;
          } else if (i === NUM_POINTS - 2 && grabbed && statusVal !== "retracting") {
            // Lock bottom point: only displace upper segments
            p1.x -= offsetX;
            p1.y -= offsetY;
          } else {
            p1.x -= offsetX * 0.5;
            p1.y -= offsetY * 0.5;
            p2.x += offsetX * 0.5;
            p2.y += offsetY * 0.5;
          }
        }
      }

      // 5. Compute Byte's physical position during pull sequence
      if (statusVal === "active" && grabbed) {
        const byteX = pts[NUM_POINTS - 1].x - 47.5;
        const byteY = pts[NUM_POINTS - 1].y - 34;

        // Lean calculated from the bottom segment slope
        const bdx = pts[NUM_POINTS - 1].x - pts[NUM_POINTS - 2].x;
        const bdy = pts[NUM_POINTS - 1].y - pts[NUM_POINTS - 2].y;
        const angleRad = Math.atan2(bdx, bdy);
        const rotate = Math.max(-15, Math.min(15, (angleRad * 180) / Math.PI));

        ThemeEvents.publish("theme-pull:byte-pos", { x: byteX, y: byteY, rotate });
      }

      // 6. Generate smooth path
      const pathD = getBezierPath(pts);

      setRopeData({
        pathD,
        handleX: pts[NUM_POINTS - 1].x,
        handleY: pts[NUM_POINTS - 1].y
      });

      // Handle teardown when retraction completes
      if (statusVal === "retracting" && ropeLengthRef.current === 0) {
        setVisible(false);
        setStatus("idle");
      } else {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [visible]);

  // Compute the pulse position along the rope coordinates dynamically
  const getPulseCoords = () => {
    const pts = pointsRef.current;
    if (pts.length === 0) return { x: ropeX, y: buttonY };
    const totalSegments = pts.length - 1;
    const indexFloat = pulseProgress * totalSegments;
    const index = Math.floor(indexFloat);
    const nextIndex = Math.min(totalSegments, index + 1);
    const t = indexFloat - index;
    const p1 = pts[index];
    const p2 = pts[nextIndex];
    if (!p1 || !p2) return { x: ropeX, y: buttonY };
    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    };
  };

  if (!visible) return null;

  const handleX = ropeData.handleX || ropeX;
  const handleY = ropeData.handleY || (buttonY + ropeLengthRef.current + pullOffset);

  const pulseCoords = getPulseCoords();

  return (
    <div className="theme-rope-overlay">
      <svg width="100%" height="100%">
        <defs>
          {/* Soft Bloom Filter for Neon Glow */}
          <filter id="neonBloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core glow filter for thin energy line */}
          <filter id="coreGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse node glow filter */}
          <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Linear Cable Gradients */}
          <linearGradient id="neonBloomGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d8ff" />
            <stop offset="60%" stopColor="#79f8ff" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <linearGradient id="glassCableGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(121, 248, 255, 0.4)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.85)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.4)" />
          </linearGradient>

          <linearGradient id="flowPulseGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(0, 216, 255, 0)" />
            <stop offset="50%" stopColor="rgba(121, 248, 255, 0.95)" />
            <stop offset="100%" stopColor="rgba(0, 216, 255, 0)" />
          </linearGradient>

          {/* Metal gradients */}
          <linearGradient id="neonMetal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="40%" stopColor="#1e293b" />
            <stop offset="60%" stopColor="#79f8ff" /> {/* specular cyan highlight */}
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* 1. Outer Neon Soft Glow (Bloom) */}
        {ropeData.pathD && (
          <path
            d={ropeData.pathD}
            stroke="url(#neonBloomGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity="0.25"
            filter="url(#neonBloom)"
          />
        )}

        {/* 2. Glass Braided Cable Sheath */}
        {ropeData.pathD && (
          <path
            d={ropeData.pathD}
            stroke="url(#glassCableGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="5 3.5" // braided visual appearance
            fill="none"
            opacity="0.65"
          />
        )}

        {/* 3. Animated Inner Light Flow (Energy Current) */}
        {ropeData.pathD && (
          <path
            d={ropeData.pathD}
            stroke="url(#flowPulseGradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="25 150"
            strokeDashoffset={-flowOffset * 220} // flows downward
            fill="none"
          />
        )}

        {/* 4. Core Energy Line */}
        {ropeData.pathD && (
          <path
            d={ropeData.pathD}
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            filter="url(#coreGlow)"
          />
        )}

        {/* 5. Upward Traveling Energy Pulse Flare */}
        {pulseActive && (
          <g>
            {/* Core bright spark */}
            <circle
              cx={pulseCoords.x}
              cy={pulseCoords.y}
              r={9}
              fill="#ffffff"
              filter="url(#coreGlow)"
            />
            {/* Soft cyan halo */}
            <circle
              cx={pulseCoords.x}
              cy={pulseCoords.y}
              r={24}
              fill="rgba(121, 248, 255, 0.85)"
              filter="url(#pulseGlow)"
            />
          </g>
        )}

        {/* 6. Rounded Premium Rope Cap (Anchor Connection) */}
        <circle cx={ropeX} cy={buttonY} r={6} fill="url(#neonMetal)" stroke="#0f172a" strokeWidth="1" />

        {/* 7. Futuristic Energy Handle (Rendered only when not grabbed by Byte) */}
        {!isGrabbed && (
          <g>
            {/* Cable end connector cap */}
            <rect x={handleX - 4.5} y={handleY - 3} width={9} height={6} rx={1.5} fill="url(#neonMetal)" />

            {/* Glowing neon core block inside glass handle */}
            <rect
              x={handleX - 9}
              y={handleY + 3}
              width={18}
              height={32}
              rx={9}
              fill="rgba(13, 15, 23, 0.72)"
              stroke="rgba(121, 248, 255, 0.5)"
              strokeWidth="1.2"
              className="theme-rope-handle"
              style={{
                filter: "drop-shadow(0 0 8px rgba(121, 248, 255, 0.45))",
                backdropFilter: "blur(4px)",
              }}
            />
            
            {/* Glowing crystal dot */}
            <circle cx={handleX} cy={handleY + 19} r={4.5} fill="#79f8ff" filter="url(#coreGlow)" className="handle-crystal-pulse" />
          </g>
        )}
      </svg>
    </div>
  );
}

// Bezier path string generator (Quadratic Bezier spline through the physics points)
function getBezierPath(points) {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 2; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc}, ${yc}`;
  }
  const len = points.length;
  if (len > 2) {
    d += ` Q ${points[len - 2].x} ${points[len - 2].y}, ${points[len - 1].x} ${points[len - 1].y}`;
  } else if (len === 2) {
    d += ` L ${points[1].x} ${points[1].y}`;
  }
  return d;
}
