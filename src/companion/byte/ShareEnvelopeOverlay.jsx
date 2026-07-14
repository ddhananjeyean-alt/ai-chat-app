import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { ShareEnvelopeEvents } from "./ShareEnvelopeEvents";

// Premium Holographic Paper Airplane Component (used for morph animation)
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

export default function ShareEnvelopeOverlay() {
  const canvasRef = useRef(null);
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  
  // active controls if the component is mounted at all
  const [active, setActive] = useState(false);
  // idle, holding, flight, landed, opening_flap, sliding_paper, unfolding_paper, fully_opened, closing_content, folding_paper, sliding_paper_in, closing_flap, transforming_airplane
  const [phase, setPhase] = useState("idle"); 
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]); 
  
  // Coordinates and dynamic states
  const [envelopePos, setEnvelopePos] = useState({ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 });
  const [flightConfig, setFlightConfig] = useState(null);
  const [shadowOpacity, setShadowOpacity] = useState(0);
  const [glowPulse, setGlowPulse] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0); // 0 to 1

  // Timer & Animation Refs
  const activeTimeouts = useRef([]);
  const trailRaf = useRef(null);
  const burstRaf = useRef(null);
  const morphRaf = useRef(null);

  // Constants
  const centerCoords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  const addTimeout = (callback, delay) => {
    const id = setTimeout(() => {
      activeTimeouts.current = activeTimeouts.current.filter((tid) => tid !== id);
      callback();
    }, delay);
    activeTimeouts.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    activeTimeouts.current.forEach((id) => clearTimeout(id));
    activeTimeouts.current = [];
    
    if (trailRaf.current) cancelAnimationFrame(trailRaf.current);
    if (burstRaf.current) cancelAnimationFrame(burstRaf.current);
    if (morphRaf.current) cancelAnimationFrame(morphRaf.current);
    
    trailRaf.current = null;
    burstRaf.current = null;
    morphRaf.current = null;
  };

  useEffect(() => {
    // 1. Materialize envelope at Byte's hand
    const handleStart = ({ startCoords, shareUrl: url }) => {
      clearAllTimers();
      setShareUrl(url || "");
      setActive(true);
      setPhase("holding");
      setEnvelopePos({
        x: startCoords.x,
        y: startCoords.y,
        scale: 0,
        opacity: 0,
        rotate: 0,
      });

      // Materialize: Scale to 0.12 (suitable small size for Byte's hand)
      let startTime = null;
      const duration = 500;
      const animateMaterialize = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const p = Math.min(elapsed / duration, 1);
        
        const scale = p === 1 ? 0.12 : (1 - Math.pow(1 - p, 3)) * 0.12;
        
        setEnvelopePos((prev) => ({
          ...prev,
          scale: scale,
          opacity: p,
        }));

        if (p < 1) {
          morphRaf.current = requestAnimationFrame(animateMaterialize);
        }
      };
      morphRaf.current = requestAnimationFrame(animateMaterialize);
    };

    // 2. Sync position during reaching and wind-up
    const handleUpdateByteState = (data) => {
      if (data && data.handCoords && (phaseRef.current === "holding" || phaseRef.current === "reaching" || phaseRef.current === "windup")) {
        setEnvelopePos((prev) => ({
          ...prev,
          x: data.handCoords.x,
          y: data.handCoords.y,
        }));
      }
    };

    // 3. Launch independent envelope flight
    const handleThrown = ({ releaseCoords }) => {
      setPhase("flight");
      
      const startX = releaseCoords.x;
      const startY = releaseCoords.y;
      const endX = centerCoords.x;
      const endY = centerCoords.y;

      const midX = (startX + endX) / 2;
      const midY = Math.min(startY, endY) - 150; // Curve arc

      setFlightConfig({
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [0.12, 0.6, 1.0],
        rotate: [0, 20, -10, 0],
      });

      // Render background canvas particles for trail
      runParticleTrail(releaseCoords, centerCoords, 900);
    };

    // 4. Centralized Reset handler
    const handleReset = () => {
      clearAllTimers();
      setPhase("idle");
      setActive(false);
      setShareUrl("");
      setCopied(false);
    };

    const unsubStart = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.START_ANIMATION, handleStart);
    const unsubUpdate = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.UPDATE_BYTE_STATE, handleUpdateByteState);
    const unsubThrown = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.ENVELOPE_THROWN, handleThrown);
    const unsubReset = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.RESET_ANIMATION, handleReset);

    return () => {
      unsubStart();
      unsubUpdate();
      unsubThrown();
      unsubReset();
      clearAllTimers();
    };
  }, []);

  // 60 FPS Canvas background rendering for particle trail (forward flight only)
  const runParticleTrail = (start, end, duration) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 150;
    const control = { x: midX, y: midY };

    let startTime = null;

    const animateTrail = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Decoupled Bezier curve coordinates
      const t = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const mt = 1 - t;
      const x = mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x;
      const y = mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Track trail history
      trail.push({ x, y });
      if (trail.length > 15) trail.shift();

      // Draw faint holographic trail segment
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = "rgba(121, 248, 255, 0.3)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Add particles
      if (progress < 1 && Math.random() < 0.8) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          alpha: 1.0,
          size: 1.5 + Math.random() * 2.5,
        });
      }

      // Render & update particles
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
          ctx.fillStyle = `rgba(121, 248, 255, ${p.alpha})`;
          ctx.fill();
        }
      }

      if (progress < 1) {
        trailRaf.current = requestAnimationFrame(animateTrail);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const particles = [];
    const trail = [];
    trailRaf.current = requestAnimationFrame(animateTrail);
  };

  // Spark burst for holographic airplane morphing
  const runTransformBurst = (cx, cy) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.0;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        size: 2.0 + Math.random() * 3.0,
        color: Math.random() > 0.5 ? "121, 248, 255" : "59, 130, 246",
      });
    }

    let startTime = null;
    const duration = 800;

    const animateBurst = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = elapsed / duration;

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
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${p.color}, 0.85)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      if (progress < 1 && particles.length > 0) {
        burstRaf.current = requestAnimationFrame(animateBurst);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    burstRaf.current = requestAnimationFrame(animateBurst);
  };

  const handleFlightComplete = () => {
    setPhase("landed");
    setGlowPulse(true);
    setShadowOpacity(1);
    
    ShareEnvelopeEvents.publish(ShareEnvelopeEvents.ENVELOPE_LANDED);

    // 1. Landing settle: Remains closed for 250ms
    addTimeout(() => {
      // 2. Open Flap: top triangular flap rotates 130 degrees (duration 700ms)
      setPhase("opening_flap");
      
      addTimeout(() => {
        // 3. Slide Paper: emerging vertically from inside pocket (duration 800ms)
        setPhase("sliding_paper");
        
        addTimeout(() => {
          // 4. Unfold Paper: Left and right panels unfold outward (duration 1000ms)
          setPhase("unfolding_paper");
          
          addTimeout(() => {
            // 5. Fully Opened: Share card content visible
            setPhase("fully_opened");
            ShareEnvelopeEvents.publish(ShareEnvelopeEvents.ENVELOPE_OPENED);
          }, 1000);
        }, 800);
      }, 700);
    }, 250);
  };

  // Cinematic Close and Morph Sequence
  const handleClose = () => {
    // 1. Hide share content (opacity fades, duration 200ms)
    setPhase("closing_content");
    setCopied(false);

    addTimeout(() => {
      // 2. Fold paper back (duration 600ms)
      setPhase("folding_paper");

      addTimeout(() => {
        // 3. Slide paper back inside envelope pocket (duration 600ms)
        setPhase("sliding_paper_in");

        addTimeout(() => {
          // 4. Close the envelope flap (duration 500ms)
          setPhase("closing_flap");

          addTimeout(() => {
            // 5. Smoothly Morph Envelope into Paper Airplane (duration 800ms)
            setPhase("transforming_airplane");
            setTransformProgress(0);
            setGlowPulse(false);
            setShadowOpacity(0);

            // Morph loop
            let startT = null;
            const morphDur = 800;
            
            // Trigger particle burst at the morph point
            runTransformBurst(centerCoords.x, centerCoords.y);

            const animateMorph = (ts) => {
              if (!startT) startT = ts;
              const elapsed = ts - startT;
              const prog = Math.min(elapsed / morphDur, 1);
              
              setTransformProgress(prog);

              if (prog < 1) {
                morphRaf.current = requestAnimationFrame(animateMorph);
              } else {
                // Morph complete! Locate Byte coordinates and hand off to global PaperAirplaneOverlay
                const byteEl = document.querySelector(".byte-movement-container");
                const byteRect = byteEl 
                  ? byteEl.getBoundingClientRect() 
                  : { left: window.innerWidth - 110, top: window.innerHeight - 180, width: 95, height: 137 };

                const endX = byteRect.left + byteRect.width * 0.42;
                const endY = byteRect.top + byteRect.height * 0.37;

                // Launch the global paper airplane
                ShareEnvelopeEvents.publish(ShareEnvelopeEvents.LAUNCH_AIRPLANE, {
                  byteCoords: { x: endX, y: endY }
                });

                // Reset local envelope overlay back to idle immediately
                setPhase("idle");
                setActive(false);
                setShareUrl("");
                setCopied(false);
              }
            };
            morphRaf.current = requestAnimationFrame(animateMorph);
          }, 500);
        }, 600);
      }, 600);
    }, 200);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // Wait exactly 1 second, then trigger automatic closing sequence
      addTimeout(() => {
        setCopied(false);
        handleClose();
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLink = () => {
    window.open(shareUrl, "_blank");
  };

  if (!active || phase === "idle") return null;

  const hasOpenedFlap = phase === "opening_flap" || phase === "sliding_paper" || phase === "unfolding_paper" || phase === "fully_opened" || phase === "closing_content" || phase === "folding_paper" || phase === "sliding_paper_in";
  const isPaperVisible = phase === "sliding_paper" || phase === "unfolding_paper" || phase === "fully_opened" || phase === "closing_content" || phase === "folding_paper";
  const isContentVisible = phase === "fully_opened";
  
  // Opacity of standard envelope elements during transformation
  const envelopeOpacity = phase === "transforming_airplane" ? 1 - transformProgress : 1;
  const envelopeColor = isLight ? "#2563EB" : "#79f8ff";

  return (
    <div
      id="share-envelope-overlay-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999998,
        pointerEvents: "none",
      }}
    >
      {/* Background canvas for particle trails (only for initial flight to center) */}
      {phase === "flight" && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Unified Envelope Object */}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            key="independent-share-envelope"
            animate={
              phase === "holding"
                ? {
                    x: envelopePos.x,
                    y: envelopePos.y,
                    scale: envelopePos.scale,
                    opacity: envelopePos.opacity,
                    rotate: 0,
                  }
                : phase === "flight"
                ? {
                    x: flightConfig?.x || 0,
                    y: flightConfig?.y || 0,
                    scale: flightConfig?.scale || 1.0,
                    opacity: 1,
                    rotate: flightConfig?.rotate || 0,
                  }
                : {
                    // Landed, opening, & transforming phases
                    x: centerCoords.x,
                    y: centerCoords.y,
                    scale: 1.0,
                    opacity: 1,
                    rotate: 0,
                  }
            }
            transition={
              phase === "flight"
                ? {
                    duration: 0.9,
                    ease: [0.25, 1, 0.5, 1], // easeOutCubic
                  }
                : phase === "landed"
                ? {
                    type: "spring",
                    stiffness: 220,
                    damping: 12, // Landing bounce
                  }
                : {
                    duration: 0.05, // Smooth sync for hand tracking
                  }
            }
            onAnimationComplete={() => {
              if (phase === "flight") {
                handleFlightComplete();
              }
            }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              translateX: "-50%",
              translateY: "-50%",
              width: "360px",
              height: "260px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              perspective: "1200px",
              pointerEvents: (phase === "landed" || phase === "fully_opened" || phase === "closing_content") ? "auto" : "none",
              zIndex: 999999,
            }}
          >
            {/* Outer Cyber Blue Glow Pulse (visible on envelope) */}
            {phase !== "transforming_airplane" && (
              <motion.div
                animate={{
                  boxShadow: glowPulse 
                    ? [
                        "0 0 25px rgba(121, 248, 255, 0.35)",
                        "0 0 55px rgba(121, 248, 255, 0.8)",
                        "0 0 30px rgba(121, 248, 255, 0.4)"
                      ]
                    : "0 0 20px rgba(121, 248, 255, 0.2)"
                }}
                transition={{
                  repeat: glowPulse ? Infinity : 0,
                  duration: 2,
                  ease: "easeInOut"
                }}
                style={{
                  position: "absolute",
                  width: "104%",
                  height: "104%",
                  borderRadius: "24px",
                  pointerEvents: "none",
                  zIndex: 0,
                  opacity: envelopeOpacity,
                }}
              />
            )}

            {/* Layer 1: Back Pocket Face (zIndex: 1) */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                background: "rgba(15, 23, 42, 0.85)",
                border: "1.5px solid rgba(121, 248, 255, 0.35)",
                backdropFilter: "blur(25px)",
                WebkitBackdropFilter: "blur(25px)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65)",
                zIndex: 1,
                opacity: envelopeOpacity,
                transition: phase === "transforming_airplane" ? "opacity 0.8s ease-out" : "none",
              }}
            />

            {/* Layer 2: The Unfolded Letter / Share Page (zIndex: 2 or 4) */}
            <motion.div
              animate={
                isPaperVisible
                  ? { y: -130, opacity: 1 }
                  : { y: 20, opacity: 0 }
              }
              transition={{
                y: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.15 }
              }}
              style={{
                position: "absolute",
                zIndex: (phase === "unfolding_paper" || phase === "fully_opened" || phase === "closing_content" || phase === "folding_paper") ? 4 : 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                perspective: "1200px",
                transformStyle: "preserve-3d",
                pointerEvents: isPaperVisible ? "auto" : "none",
              }}
            >
              {/* Paper Content Overlay (Fades in over unfolded letter) */}
              <motion.div
                animate={{
                  opacity: isContentVisible ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  width: "380px",
                  height: "240px",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: isContentVisible ? "auto" : "none",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 800,
                    fontSize: "15px",
                    color: isLight ? "#111827" : "#79f8ff",
                    textShadow: isLight ? "none" : "0 0 10px rgba(121, 248, 255, 0.4)",
                    letterSpacing: "1.2px",
                    mb: 0.5,
                  }}
                >
                  🔗 SHARE CONVERSATION
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: isLight ? "#4b5563" : "rgba(255, 255, 255, 0.65)",
                    mb: 2,
                  }}
                >
                  Anyone with this link can view this conversation.
                </Typography>
                <Box
                  sx={{
                    width: "300px",
                    py: 1,
                    px: 1.5,
                    background: isLight ? "rgba(37, 99, 235, 0.05)" : "rgba(121, 248, 255, 0.05)",
                    border: isLight ? "1px dashed rgba(37, 99, 235, 0.25)" : "1px dashed rgba(121, 248, 255, 0.3)",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: isLight ? "#2563eb" : "#79f8ff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    mb: 2,
                  }}
                >
                  {shareUrl}
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, width: "300px", mb: 1.5 }}>
                  <Button
                    onClick={handleCopyLink}
                    variant="outlined"
                    size="small"
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: isLight ? "#2563eb" : "#79f8ff",
                      color: isLight ? "#2563eb" : "#79f8ff",
                      fontSize: "12px",
                      borderRadius: "6px",
                      py: 0.7,
                      "&:hover": {
                        background: isLight ? "rgba(37, 99, 235, 0.06)" : "rgba(121, 248, 255, 0.1)",
                        borderColor: isLight ? "#1d4ed8" : "#79f8ff",
                      },
                    }}
                  >
                    {copied ? "✓ Link Copied" : "Copy Link"}
                  </Button>
                  <Button
                    onClick={handleOpenLink}
                    variant="contained"
                    size="small"
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      backgroundColor: isLight ? "#2563eb" : "#3b82f6",
                      color: "#ffffff",
                      fontSize: "12px",
                      borderRadius: "6px",
                      py: 0.7,
                      boxShadow: isLight ? "0 4px 10px rgba(37, 99, 235, 0.15)" : "0 4px 10px rgba(59, 130, 246, 0.3)",
                      "&:hover": {
                        backgroundColor: isLight ? "#1d4ed8" : "#2563eb",
                      },
                    }}
                  >
                    Open Link
                  </Button>
                </Box>
                <Button
                  onClick={handleClose}
                  variant="text"
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: isLight ? "#4b5563" : "rgba(255, 255, 255, 0.55)",
                    fontSize: "12px",
                    "&:hover": {
                      color: isLight ? "#111827" : "#ffffff",
                    },
                  }}
                >
                  Close
                </Button>
              </motion.div>

              {/* Center Panel Sheet (Translucent Premium Glass) */}
              <motion.div
                animate={
                  phase === "unfolding_paper"
                    ? { scale: [1, 1.03, 1], rotate: [0, 1.2, -0.8, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 1.0, ease: "easeInOut" }}
                style={{
                  position: "relative",
                  width: "150px",
                  height: "270px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(242, 247, 255, 0.9) 100%)" 
                    : "rgba(18, 25, 41, 0.78)",
                  border: isLight ? "1.5px solid rgba(37, 99, 235, 0.18)" : "1.5px solid rgba(121, 248, 255, 0.25)",
                  borderRadius: "8px",
                  boxShadow: isLight
                    ? "0 15px 35px rgba(37, 99, 235, 0.1)"
                    : "0 15px 35px rgba(0, 0, 0, 0.45), 0 0 15px rgba(121, 248, 255, 0.08)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Left Folding Panel */}
                <motion.div
                  animate={{
                    rotateY: (phase === "unfolding_paper" || phase === "fully_opened") ? 0 : 180
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 10,
                  }}
                  style={{
                    position: "absolute",
                    top: -1.5,
                    right: "100%",
                    width: "135px",
                    height: "270px",
                    background: isLight 
                      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(242, 247, 255, 0.9) 100%)" 
                      : "rgba(18, 25, 41, 0.78)",
                    border: isLight ? "1.5px solid rgba(37, 99, 235, 0.18)" : "1.5px solid rgba(121, 248, 255, 0.25)",
                    borderRight: "none",
                    borderRadius: "8px 0 0 8px",
                    transformOrigin: "right center",
                    backfaceVisibility: "visible",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "inset -4px 0 8px rgba(0,0,0,0.02)",
                  }}
                />

                {/* Right Folding Panel */}
                <motion.div
                  animate={{
                    rotateY: (phase === "unfolding_paper" || phase === "fully_opened") ? 0 : -180
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 10,
                  }}
                  style={{
                    position: "absolute",
                    top: -1.5,
                    left: "100%",
                    width: "135px",
                    height: "270px",
                    background: isLight 
                      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(242, 247, 255, 0.9) 100%)" 
                      : "rgba(18, 25, 41, 0.78)",
                    border: isLight ? "1.5px solid rgba(37, 99, 235, 0.18)" : "1.5px solid rgba(121, 248, 255, 0.25)",
                    borderLeft: "none",
                    borderRadius: "0 8px 8px 0",
                    transformOrigin: "left center",
                    backfaceVisibility: "visible",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "inset 4px 0 8px rgba(0,0,0,0.02)",
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Layer 3: Front Pocket Flaps (zIndex: 3) */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 3,
                pointerEvents: "none",
                opacity: envelopeOpacity,
                transition: phase === "transforming_airplane" ? "opacity 0.8s ease-out" : "none",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 360 260" preserveAspectRatio="none" style={{ display: "block" }}>
                <polygon 
                  points="0,260 180,140 360,260" 
                  fill="rgba(24, 34, 54, 0.9)"
                  stroke="rgba(121, 248, 255, 0.2)"
                  strokeWidth="1.5"
                />
                <polygon 
                  points="0,0 0,260 180,140" 
                  fill="rgba(20, 28, 45, 0.75)"
                  stroke="rgba(121, 248, 255, 0.08)"
                  strokeWidth="1"
                />
                <polygon 
                  points="360,0 360,260 180,140" 
                  fill="rgba(20, 28, 45, 0.75)"
                  stroke="rgba(121, 248, 255, 0.08)"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Layer 4: Triangular Top Opening Flap */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={{ rotateX: hasOpenedFlap ? 130 : 0 }}
              transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "50%",
                transformOrigin: "top center",
                zIndex: hasOpenedFlap ? 1 : 5,
                backfaceVisibility: "visible",
                transformStyle: "preserve-3d",
                opacity: envelopeOpacity,
                transition: phase === "transforming_airplane" ? "opacity 0.8s ease-out" : "none",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 360 130" preserveAspectRatio="none" style={{ filter: `drop-shadow(0 6px 8px rgba(0,0,0,${isLight ? 0.15 : 0.55}))` }}>
                <polygon 
                  points="0,0 180,130 360,0" 
                  fill={isLight ? "rgba(240, 245, 253, 0.98)" : "rgba(30, 41, 59, 0.98)"}
                  stroke={envelopeColor}
                  strokeWidth="2"
                />
              </svg>
            </motion.div>

            {/* Layer 5: Paper Airplane (fades in and morphs smoothly) */}
            {phase === "transforming_airplane" && (
              <motion.div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  opacity: transformProgress,
                  scale: 0.5 + transformProgress * 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PaperAirplaneSVG color={isLight ? "#2563EB" : "#79f8ff"} />
              </motion.div>
            )}

            {/* Tiny Drop Shadow Underneath (envelope closed/landed state only) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: shadowOpacity, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                position: "absolute",
                bottom: "-35px",
                width: "260px",
                height: "16px",
                background: "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 70%)",
                pointerEvents: "none",
                zIndex: 1,
                opacity: phase === "transforming_airplane" ? 1 - transformProgress : shadowOpacity,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
