import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material";
import { ShareEnvelopeEvents } from "./ShareEnvelopeEvents";

// Premium Holographic Paper Airplane Component
const PaperAirplaneSVG = ({ color = "#79f8ff" }) => (
  <svg width="110" height="100" viewBox="0 0 100 90" style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
    <defs>
      <linearGradient id="airplaneHoloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(121, 248, 255, 0.95)" />
        <stop offset="60%" stopColor="rgba(59, 130, 246, 0.75)" />
        <stop offset="100%" stopColor="rgba(121, 248, 255, 0.35)" />
      </linearGradient>
    </defs>
    <path d="M50 5 L90 70 L50 55 Z" fill="url(#airplaneHoloGrad)" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M50 5 L10 70 L50 55 Z" fill="url(#airplaneHoloGrad)" stroke={color} strokeWidth="1.2" strokeLinejoin="round" opacity="0.85" />
    <path d="M50 55 L50 78 L65 70 Z" fill="url(#airplaneHoloGrad)" stroke={color} strokeWidth="1" strokeLinejoin="round" opacity="0.9" />
    <path d="M50 55 L50 78 L35 70 Z" fill="url(#airplaneHoloGrad)" stroke={color} strokeWidth="1" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

// Holographic Mini Envelope Component for Catch Morph
const HolographicEnvelopeSVG = ({ color = "#79f8ff" }) => (
  <svg width="50" height="36" viewBox="0 0 45 32" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
    <rect x="1" y="1" width="43" height="30" rx="3.5" fill="rgba(15, 23, 42, 0.75)" stroke={color} strokeWidth="1.8" />
    <path d="M2 2 L22.5 16.5 L43 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Catmull-Rom Spline Interpolation Mathematics
const catmullRom = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    )
  };
};

const catmullRomTangent = (p0, p1, p2, p3, t) => {
  const t2 = t * t;

  return {
    x: 0.5 * (
      (-p0.x + p2.x) +
      2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t +
      3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2
    ),
    y: 0.5 * (
      (-p0.y + p2.y) +
      2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t +
      3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2
    )
  };
};

export default function PaperAirplaneOverlay() {
  const canvasRef = useRef(null);
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  
  // idle, flight_celebration, flight_to_byte, catching_dissolve
  const [phase, setPhase] = useState("idle"); 
  const [airplanePos, setAirplanePos] = useState({ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0, bank: 0 });
  const [dissolveProgress, setDissolveProgress] = useState(0);
  const [byteCoords, setByteCoords] = useState({ x: 0, y: 0 });

  const centerCoords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Timer & Animation Refs
  const launchTimeout = useRef(null);
  const phaseTimeout = useRef(null);
  const celebrationRaf = useRef(null);
  const returnRaf = useRef(null);
  const dissolveRaf = useRef(null);
  const dissolveBurstRaf = useRef(null);

  const clearAllTimers = () => {
    if (launchTimeout.current) clearTimeout(launchTimeout.current);
    if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
    if (celebrationRaf.current) cancelAnimationFrame(celebrationRaf.current);
    if (returnRaf.current) cancelAnimationFrame(returnRaf.current);
    if (dissolveRaf.current) cancelAnimationFrame(dissolveRaf.current);
    if (dissolveBurstRaf.current) cancelAnimationFrame(dissolveBurstRaf.current);

    launchTimeout.current = null;
    phaseTimeout.current = null;
    celebrationRaf.current = null;
    returnRaf.current = null;
    dissolveRaf.current = null;
    dissolveBurstRaf.current = null;
  };

  useEffect(() => {
    const handleLaunch = ({ byteCoords: targetHandCoords }) => {
      clearAllTimers();
      setByteCoords(targetHandCoords);
      setPhase("flight_celebration");
      setDissolveProgress(0);

      // Trigger the 60 FPS celebration flight
      launchTimeout.current = setTimeout(() => {
        runCelebrationFlight(targetHandCoords);
      }, 30);
    };

    const handleReset = () => {
      clearAllTimers();
      setPhase("idle");
      setDissolveProgress(0);
      setAirplanePos({ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0, bank: 0 });
      setByteCoords({ x: 0, y: 0 });
      window.ShareEnvelopeAnimationActive = false;
    };

    const unsubLaunch = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.LAUNCH_AIRPLANE, handleLaunch);
    const unsubReset = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.RESET_ANIMATION, handleReset);
    
    return () => {
      unsubLaunch();
      unsubReset();
      clearAllTimers();
    };
  }, []);

  // Particle transformation burst
  const runDissolveBurst = (cx, cy) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4, // drift up
        alpha: 1.0,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? "121, 248, 255" : "59, 130, 246",
      });
    }

    let startTime = null;
    const duration = 650;

    const animateDissolve = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1.0 - progress;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${p.color}, 0.85)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      if (progress < 1 && particles.length > 0) {
        dissolveBurstRaf.current = requestAnimationFrame(animateDissolve);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    dissolveBurstRaf.current = requestAnimationFrame(animateDissolve);
  };

  // Phase 1: Viewport Boundary Spline celebration lap
  const runCelebrationFlight = (targetHandCoords) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const points = [
      // P0-Dummy: starts slightly offset to establish initial takeoff direction
      { x: cx + w * 0.1, y: cy + h * 0.1 },
      
      // P1 (Center):
      { x: cx, y: cy },
      
      // P2 (P1): 15% width, 18% height (Upper-Left)
      { x: w * 0.15, y: h * 0.18 },
      
      // P3 (P2): 50% width, 8% height (Top Center)
      { x: w * 0.5, y: h * 0.08 },
      
      // P4 (P3): 85% width, 18% height (Upper-Right)
      { x: w * 0.85, y: h * 0.18 },
      
      // P5 (P4): 92% width, 50% height (Right Side)
      { x: w * 0.92, y: h * 0.5 },
      
      // P6 (P5): 85% width, 82% height (Lower-Right)
      { x: w * 0.85, y: h * 0.82 },
      
      // P7 (P6): 50% width, 92% height (Bottom Center)
      { x: w * 0.5, y: h * 0.92 },
      
      // P8 (P7): 15% width, 82% height (Lower-Left)
      { x: w * 0.15, y: h * 0.82 },
      
      // P9 (P8): 8% width, 50% height (Left Side)
      { x: w * 0.08, y: h * 0.5 },
      
      // P10 (P9): Center (End of celebration loop)
      { x: cx, y: cy },
      
      // P11-Dummy: establishes landing flight path vector out of center
      { x: targetHandCoords.x - w * 0.1, y: targetHandCoords.y - h * 0.1 }
    ];

    let startTime = null;
    let lastTime = null;
    let progress = 0;
    const duration = 3800; // 3.8s celebration lap
    const trail = [];
    const particles = [];

    const animateCelebration = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
        lastTime = timestamp;
      }
      const elapsedFrame = timestamp - lastTime;
      lastTime = timestamp;

      // 9 intervals between points P1 to P10
      const numSegments = 9;
      const scaledT = progress * numSegments;
      let segmentIdx = Math.floor(scaledT);
      if (segmentIdx >= numSegments) segmentIdx = numSegments - 1;
      const tLocal = scaledT - segmentIdx;

      const p0 = points[segmentIdx];
      const p1 = points[segmentIdx + 1];
      const p2 = points[segmentIdx + 2];
      const p3 = points[segmentIdx + 3];

      const currentPos = catmullRom(p0, p1, p2, p3, tLocal);
      const tangent = catmullRomTangent(p0, p1, p2, p3, tLocal);
      const angle = Math.atan2(tangent.y, tangent.x);

      // Curvature sampling for banking and slowdowns
      const tNext = Math.min(1.0, tLocal + 0.005);
      const posNext = catmullRom(p0, p1, p2, p3, tNext);
      const tangentNext = { x: posNext.x - currentPos.x, y: posNext.y - currentPos.y };
      const angleNext = Math.atan2(tangentNext.y, tangentNext.x);

      let deltaAngle = angleNext - angle;
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      // Speed configuration: takeoff acceleration, corner slow-down, straight speed-up
      let speedFactor = 1.0;

      const turnRate = Math.abs(deltaAngle);
      const cornerSlowdown = Math.max(0.48, 1.0 - turnRate * 7.5);
      speedFactor *= cornerSlowdown;

      if (progress < 0.15) {
        const takeoffFactor = 0.4 + 0.6 * (progress / 0.15); // accelerate from center
        speedFactor *= takeoffFactor;
      }

      progress += (elapsedFrame / duration) * speedFactor;
      if (progress > 1.0) progress = 1.0;

      // Aerodynamic turbulence floating motion (offset perp to travel)
      const floatOffset = Math.sin(progress * Math.PI * 24) * 8.5;
      const perpAngle = angle + Math.PI / 2;
      const finalX = currentPos.x + Math.cos(perpAngle) * floatOffset;
      const finalY = currentPos.y + Math.sin(perpAngle) * floatOffset;

      const yawAngle = (angle + Math.PI / 2) * (180 / Math.PI);
      const bankAngle = Math.max(-28, Math.min(28, deltaAngle * 280));

      setAirplanePos({
        x: finalX,
        y: finalY,
        scale: 0.88, // slightly smaller to simulate height
        opacity: 1,
        rotate: yawAngle,
        bank: bankAngle,
      });

      // Canvas elements: Shadow and particles trail
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Shadow offset downwards
      ctx.beginPath();
      ctx.ellipse(finalX, finalY + 54, 13, 5, angle, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Blue holographic trail
      trail.push({ x: finalX, y: finalY });
      if (trail.length > 25) trail.shift();

      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        const grad = ctx.createLinearGradient(
          trail[0].x, trail[0].y,
          trail[trail.length - 1].x, trail[trail.length - 1].y
        );
        grad.addColorStop(0, "rgba(121, 248, 255, 0)");
        grad.addColorStop(0.5, "rgba(59, 130, 246, 0.25)");
        grad.addColorStop(1, "rgba(121, 248, 255, 0.75)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 4.0;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.strokeStyle = "rgba(121, 248, 255, 0.15)";
        ctx.lineWidth = 9.0;
        ctx.stroke();
      }

      // Trail sparks
      if (progress < 1.0 && Math.random() < 0.85) {
        const wingOffset = 18;
        const px = finalX - Math.sin(angle) * wingOffset;
        const py = finalY + Math.cos(angle) * wingOffset;
        particles.push({
          x: px,
          y: py,
          vx: -Math.sin(angle) * (1.0 + Math.random() * 1.5) + (Math.random() - 0.5) * 0.7,
          vy: Math.cos(angle) * (1.0 + Math.random() * 1.5) + (Math.random() - 0.5) * 0.7,
          alpha: 1.0,
          size: 1.5 + Math.random() * 2.0,
          color: "121, 248, 255",
        });
      }

      // Draw sparks
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.022;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = `rgba(${p.color}, 0.8)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      if (progress < 1.0) {
        celebrationRaf.current = requestAnimationFrame(animateCelebration);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Start phase 2: Return to Byte
        setPhase("flight_to_byte");
        phaseTimeout.current = setTimeout(() => {
          runReturnFlight(targetHandCoords);
        }, 30);
      }
    };

    celebrationRaf.current = requestAnimationFrame(animateCelebration);
  };

  // Phase 2: Direct smooth curve Center -> Byte Position
  const runReturnFlight = (targetHandCoords) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const points = [
      // S0: Dummy start (established from loop continuation)
      { x: cx - w * 0.1, y: cy + h * 0.1 },
      
      // S1 (Center):
      { x: cx, y: cy },
      
      // S2 (Mid curve): swoop up slightly
      { x: (cx + targetHandCoords.x) / 2, y: Math.min(cy, targetHandCoords.y) - h * 0.15 },
      
      // S3 (Byte Hand):
      { x: targetHandCoords.x, y: targetHandCoords.y },
      
      // S4: Dummy end
      { x: targetHandCoords.x + w * 0.05, y: targetHandCoords.y + h * 0.05 }
    ];

    let startTime = null;
    let lastTime = null;
    let progress = 0;
    const duration = 1200; // 1.2s flight to Byte
    const trail = [];
    const particles = [];

    const animateReturn = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
        lastTime = timestamp;
      }
      const elapsedFrame = timestamp - lastTime;
      lastTime = timestamp;

      // 2 segments: S1 -> S2, S2 -> S3
      const numSegments = 2;
      const scaledT = progress * numSegments;
      let segmentIdx = Math.floor(scaledT);
      if (segmentIdx >= numSegments) segmentIdx = numSegments - 1;
      const tLocal = scaledT - segmentIdx;

      const p0 = points[segmentIdx];
      const p1 = points[segmentIdx + 1];
      const p2 = points[segmentIdx + 2];
      const p3 = points[segmentIdx + 3];

      const currentPos = catmullRom(p0, p1, p2, p3, tLocal);
      const tangent = catmullRomTangent(p0, p1, p2, p3, tLocal);
      const angle = Math.atan2(tangent.y, tangent.x);

      // Curvature sampling for banking and slowdowns
      const tNext = Math.min(1.0, tLocal + 0.005);
      const posNext = catmullRom(p0, p1, p2, p3, tNext);
      const tangentNext = { x: posNext.x - currentPos.x, y: posNext.y - currentPos.y };
      const angleNext = Math.atan2(tangentNext.y, tangentNext.x);

      let deltaAngle = angleNext - angle;
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      // Speed profile: decelerates dramatically as it approaches Byte's hand
      let speedFactor = 1.0;
      if (progress > 0.8) {
        const landingFactor = 0.28 + 0.72 * ((1.0 - progress) / 0.2); // Slow dramatically before Byte catches
        speedFactor *= landingFactor;
      }

      progress += (elapsedFrame / duration) * speedFactor;
      if (progress > 1.0) progress = 1.0;

      // Floating drift motion
      const floatOffset = Math.sin(progress * Math.PI * 10) * 5.0;
      const perpAngle = angle + Math.PI / 2;
      const finalX = currentPos.x + Math.cos(perpAngle) * floatOffset;
      const finalY = currentPos.y + Math.sin(perpAngle) * floatOffset;

      // Scales down to match hand size at the landing point
      const scale = 0.88 - progress * 0.73; // down to 0.15

      const yawAngle = (angle + Math.PI / 2) * (180 / Math.PI);
      const bankAngle = Math.max(-28, Math.min(28, deltaAngle * 280));

      setAirplanePos({
        x: finalX,
        y: finalY,
        scale: scale,
        opacity: 1,
        rotate: yawAngle,
        bank: bankAngle,
      });

      // Canvas trail & shadow
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Shadow gets closer and smaller as it lands
      const shadowYOffset = 54 * (1 - progress);
      ctx.beginPath();
      ctx.ellipse(finalX, finalY + shadowYOffset, 13 * scale, 5 * scale, angle, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fill();

      // Blue holographic trail
      trail.push({ x: finalX, y: finalY });
      if (trail.length > 25) trail.shift();

      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        const grad = ctx.createLinearGradient(
          trail[0].x, trail[0].y,
          trail[trail.length - 1].x, trail[trail.length - 1].y
        );
        grad.addColorStop(0, "rgba(121, 248, 255, 0)");
        grad.addColorStop(0.5, "rgba(59, 130, 246, 0.25)");
        grad.addColorStop(1, "rgba(121, 248, 255, 0.75)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 4.0 * scale;
        ctx.stroke();
      }

      // Add sparks
      if (progress < 1.0 && Math.random() < 0.85) {
        const wingOffset = 18 * scale;
        const px = finalX - Math.sin(angle) * wingOffset;
        const py = finalY + Math.cos(angle) * wingOffset;
        particles.push({
          x: px,
          y: py,
          vx: -Math.sin(angle) * (1.0 + Math.random() * 1.5) + (Math.random() - 0.5) * 0.7,
          vy: Math.cos(angle) * (1.0 + Math.random() * 1.5) + (Math.random() - 0.5) * 0.7,
          alpha: 1.0,
          size: (1.5 + Math.random() * 2.0) * scale,
          color: "121, 248, 255",
        });
      }

      // Draw sparks
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.fill();
        }
      }

      if (progress < 1.0) {
        returnRaf.current = requestAnimationFrame(animateReturn);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Phase 3: Catch and Dissolve Envelope
        setPhase("catching_dissolve");
        runDissolveBurst(targetHandCoords.x, targetHandCoords.y);

        // Tell Byte dissolve is happening
        ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
          phase: "catching_dissolve",
        });

        let startD = null;
        const dissolveDur = 850;

        const animateDissolve = (tsD) => {
          if (!startD) startD = tsD;
          const elap = tsD - startD;
          const progD = Math.min(elap / dissolveDur, 1);

          setDissolveProgress(progD);

          if (progD < 1) {
            dissolveRaf.current = requestAnimationFrame(animateDissolve);
          } else {
            // Flight completed! Reset overlay and send success to Byte
            setPhase("idle");
            setAirplanePos({ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0, bank: 0 });
            setByteCoords({ x: 0, y: 0 });
            window.ShareEnvelopeAnimationActive = false;

            ShareEnvelopeEvents.publish(ShareEnvelopeEvents.UPDATE_BYTE_STATE, {
              phase: "success",
            });
          }
        };
        dissolveRaf.current = requestAnimationFrame(animateDissolve);
      }
    };

    returnRaf.current = requestAnimationFrame(animateReturn);
  };

  if (phase === "idle") return null;

  return createPortal(
    <div
      id="global-paper-airplane-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 999999,
        overflow: "visible",
      }}
    >
      {/* Background canvas for particles and moving shadow */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* The Global Independent Paper Airplane HTML element */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
          overflow: "visible",
        }}
      >
        <AnimatePresence>
          {phase !== "idle" && (
            <motion.div
              key="global-independent-airplane"
              animate={
                phase === "catching_dissolve"
                  ? {
                      x: byteCoords.x,
                      y: byteCoords.y,
                      scale: 1.0,
                      opacity: 1,
                      rotate: 0,
                      rotateY: 0
                    }
                  : {
                      x: airplanePos.x,
                      y: airplanePos.y,
                      scale: airplanePos.scale,
                      opacity: airplanePos.opacity,
                      rotate: airplanePos.rotate,
                      rotateY: airplanePos.bank || 0,
                    }
              }
              transition={{
                type: "tween",
                duration: 0, // Direct pixel position mapping (no transition lag!)
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                translateX: "-50%",
                translateY: "-50%",
                width: "110px",
                height: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: "1200px",
                transformStyle: "preserve-3d",
                overflow: "visible",
              }}
            >
              {/* Paper Airplane Component */}
              {(phase === "flight_celebration" || phase === "flight_to_byte" || phase === "catching_dissolve") && (
                <div
                  style={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: phase === "catching_dissolve"
                      ? (dissolveProgress < 0.4 ? 1 - dissolveProgress / 0.4 : 0)
                      : 1,
                    scale: phase === "catching_dissolve" ? 0.15 : 1,
                  }}
                >
                  <PaperAirplaneSVG color={isLight ? "#2563EB" : "#79f8ff"} />
                </div>
              )}

              {/* Morph back to Holographic envelope in Byte's hand during dissolve */}
              {phase === "catching_dissolve" && (
                <div
                  style={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: dissolveProgress < 0.4 
                      ? (dissolveProgress / 0.4) 
                      : (1.0 - (dissolveProgress - 0.4) / 0.6),
                    scale: 0.9,
                  }}
                >
                  <HolographicEnvelopeSVG color={isLight ? "#2563EB" : "#79f8ff"} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
}
