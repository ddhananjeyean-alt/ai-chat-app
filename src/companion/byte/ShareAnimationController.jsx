import React, { useEffect, useRef, useState } from "react";
import { useTheme, Box, Typography, Button } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { ShareEvents } from "./ShareEvents";

export default function ShareAnimationController({
  isLanding = false,
  conversation = null,
  onUnfoldComplete = null,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const canvasRef = useRef(null);

  // Overlay states
  const [overlayState, setOverlayState] = useState(null); // null, 'flight_to_center', 'landed', 'open', 'closing', 'flight_to_byte'
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [byteCoords, setByteCoords] = useState({ x: 0, y: 0 });

  // Sync state to global window variable to prevent duplicate clicks in App.jsx
  useEffect(() => {
    window.ByteShareOverlayActive = overlayState !== null;
    return () => {
      window.ByteShareOverlayActive = false;
    };
  }, [overlayState]);

  useEffect(() => {
    if (isLanding) {
      // Shared route landing mode
      setTimeout(() => {
        triggerLandingAnimation();
      }, 500);
      return;
    }

    // Subscribe to ENVELOPE_THROWN from ByteWelcomeGuide
    const handleEnvelopeThrown = ({ byteCoords: coords, shareUrl: url }) => {
      setShareUrl(url);
      setByteCoords(coords);
      setOverlayState("flight_to_center");

      const centerCoords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      
      // Start Bezier flight to Center
      startEnvelopeFlight(coords, centerCoords, () => {
        setOverlayState("landed");
        
        // Wait 200ms as per Phase 3 rules, then slowly open top flap
        setTimeout(() => {
          setOverlayState("open");
        }, 200);
      });
    };

    const unsubThrown = ShareEvents.subscribe(ShareEvents.ENVELOPE_THROWN, handleEnvelopeThrown);
    return () => unsubThrown();
  }, [isLanding]);

  const triggerLandingAnimation = () => {
    const byteEl = document.querySelector(".byte-movement-container");
    let currentByteCoords = { x: window.innerWidth - 130, y: window.innerHeight - 200 };
    if (byteEl) {
      const rect = byteEl.getBoundingClientRect();
      currentByteCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    const startCoords = { x: window.innerWidth / 2, y: -50 }; // Fly in from top center

    startEnvelopeFlight(startCoords, currentByteCoords, () => {
      // Trigger catching state and reveal
      ShareEvents.publish(ShareEvents.LAND_ANIMATION, {
        onUnfold: () => {
          if (onUnfoldComplete) onUnfoldComplete();
        }
      });
    });
  };

  const startEnvelopeFlight = (start, end, onComplete) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onComplete();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onComplete();
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Curved flight path using quadratic Bezier (arching high)
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 180;
    const control = { x: midX, y: midY };

    let startTime = null;
    const duration = 1000; // 1.0 second flight

    const particles = [];
    const trail = [];
    const glowColor = isLight ? "rgba(37, 99, 235, 0.85)" : "rgba(121, 248, 255, 0.9)";
    const particleColor = isLight ? "37, 99, 235" : "121, 248, 255";

    const drawEnvelope = (x, y, angle, scale = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      ctx.shadowBlur = 10;
      ctx.shadowColor = glowColor;

      ctx.strokeStyle = isLight ? "#2563EB" : "#79f8ff";
      ctx.fillStyle = isLight ? "rgba(37, 99, 235, 0.15)" : "rgba(121, 248, 255, 0.25)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.rect(-18, -12, 36, 24);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.lineTo(0, 2);
      ctx.lineTo(18, -12);
      ctx.stroke();

      ctx.restore();
    };

    const drawBurst = (x, y) => {
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 2.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 1.5 + Math.random() * 2.5,
          color: particleColor,
        });
      }
    };

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = progress;
      const mt = 1 - t;
      const x = mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x;
      const y = mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y;

      const dx = 2 * mt * (control.x - start.x) + 2 * t * (end.x - control.x);
      const dy = 2 * mt * (control.y - start.y) + 2 * t * (end.y - control.y);
      const angle = Math.atan2(dy, dx);

      trail.push({ x, y });
      if (trail.length > 20) trail.shift();

      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      if (progress < 1 && Math.random() < 0.6) {
        particles.push({
          x: x - Math.cos(angle) * 10,
          y: y - Math.sin(angle) * 10,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          alpha: 1,
          size: 1 + Math.random() * 2,
          color: particleColor,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.fill();
        }
      }

      if (progress < 1) {
        drawEnvelope(x, y, angle);
        requestAnimationFrame(animate);
      } else {
        drawBurst(end.x, end.y);
        let burstFrames = 15;
        const animateBurst = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.05;
            if (p.alpha <= 0) {
              particles.splice(i, 1);
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
              ctx.fill();
            }
          }
          burstFrames--;
          if (burstFrames > 0 && particles.length > 0) {
            requestAnimationFrame(animateBurst);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onComplete();
          }
        };
        requestAnimationFrame(animateBurst);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLink = () => {
    window.open(shareUrl, "_blank");
  };

  const handleCloseEnvelope = () => {
    setOverlayState("closing");

    // Let Byte know to run the return catch sequence
    ShareEvents.publish(ShareEvents.ENVELOPE_RETURN_REQUEST, {
      byteCoords,
    });

    // Close animations (Framer motion exit takes 500ms)
    setTimeout(() => {
      const centerCoords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      setOverlayState("flight_to_byte");
      
      startEnvelopeFlight(centerCoords, byteCoords, () => {
        // Reset overlay back to idle
        setOverlayState(null);
        setShareUrl("");
      });
    }, 500);
  };

  const showBackdrop = overlayState === "landed" || overlayState === "open" || overlayState === "closing";
  const envelopeColor = isLight ? "#2563EB" : "#79f8ff";

  return (
    <>
      {/* Background blur/dark backdrop */}
      <AnimatePresence>
        {showBackdrop && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ 
              opacity: 1, 
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)" 
            }}
            exit={{ 
              opacity: 0, 
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(0, 0, 0, 0)" 
            }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999998,
            }}
          />
        )}
      </AnimatePresence>

      {/* Center 3D Envelope Container */}
      <AnimatePresence>
        {(overlayState === "landed" || overlayState === "open" || overlayState === "closing") && (
          <motion.div
            initial={{ scale: 0.5, rotate: -10, opacity: 0, x: "-50%", y: "-50%" }}
            animate={{ 
              scale: overlayState === "closing" ? 0 : 1, 
              rotate: 0, 
              opacity: overlayState === "closing" ? 0 : 1 
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 999999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "360px",
              height: "280px",
              perspective: "1000px",
            }}
          >
            {/* The Envelope Pocket Back Face */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                background: isLight ? "rgba(255, 255, 255, 0.65)" : "rgba(15, 23, 42, 0.65)",
                border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: isLight 
                  ? "0 10px 40px rgba(37, 99, 235, 0.15)" 
                  : "0 10px 40px rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(20px)",
                zIndex: 1,
                overflow: "visible",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 360 280" preserveAspectRatio="none" style={{ position: "absolute", zIndex: 4, pointerEvents: "none" }}>
                <polygon 
                  points="0,280 180,160 360,280" 
                  fill={isLight ? "rgba(230, 235, 245, 0.90)" : "rgba(18, 25, 41, 0.90)"}
                  stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255, 255, 255, 0.06)"}
                  strokeWidth="1"
                />
                <polygon 
                  points="0,0 0,280 180,160" 
                  fill={isLight ? "rgba(240, 245, 251, 0.70)" : "rgba(24, 34, 54, 0.70)"}
                  stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255, 255, 255, 0.04)"}
                  strokeWidth="1"
                />
                <polygon 
                  points="360,0 360,280 180,160" 
                  fill={isLight ? "rgba(240, 245, 251, 0.70)" : "rgba(24, 34, 54, 0.70)"}
                  stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255, 255, 255, 0.04)"}
                  strokeWidth="1"
                />
              </svg>
            </Box>

            {/* Triangular Top Opening Flap */}
            <motion.div
              animate={{ rotateX: overlayState === "open" ? 180 : 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "50%",
                transformOrigin: "top center",
                zIndex: overlayState === "open" ? 2 : 5,
                backfaceVisibility: "visible",
                transformStyle: "preserve-3d",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="none" style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,${isLight ? 0.05 : 0.2}))` }}>
                <polygon 
                  points="0,0 180,140 360,0" 
                  fill={isLight ? "rgba(245, 248, 253, 0.95)" : "rgba(30, 41, 59, 0.95)"}
                  stroke={isLight ? "rgba(0,0,0,0.15)" : envelopeColor}
                  strokeWidth="1.5"
                />
              </svg>
            </motion.div>

            {/* Inner Share Link Card (slides up out of envelope pocket) */}
            <motion.div
              animate={{ 
                y: overlayState === "open" ? -110 : 0, 
                scale: overlayState === "open" ? 1.02 : 0.92,
                opacity: overlayState === "open" ? 1 : 0,
                zIndex: 3
              }}
              transition={{ type: "spring", stiffness: 160, damping: 15 }}
              style={{
                position: "absolute",
                width: "330px",
                background: isLight ? "rgba(255, 255, 255, 0.98)" : "rgba(20, 24, 38, 0.98)",
                border: `1.5px solid ${isLight ? "rgba(37, 99, 235, 0.4)" : "rgba(121, 248, 255, 0.4)"}`,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: isLight
                  ? "0 10px 30px rgba(37, 99, 235, 0.12)"
                  : "0 10px 30px rgba(0, 0, 0, 0.35)",
                pointerEvents: overlayState === "open" ? "auto" : "none",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  mb: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  color: isLight ? "#111827" : "#FFFFFF",
                }}
              >
                🔗 Share Conversation
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: isLight ? "#4b5563" : "rgba(255, 255, 255, 0.5)",
                  mb: 1.5,
                  fontSize: "11px",
                }}
              >
                Anyone with this link can view this conversation.
              </Typography>
              <Box
                sx={{
                  background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                  border: `1px dashed ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: "8px",
                  py: 1,
                  px: 1.5,
                  mb: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  color: isLight ? "#2563EB" : "#79f8ff",
                  fontFamily: "monospace",
                }}
              >
                {shareUrl}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={handleCopyLink}
                    variant="outlined"
                    size="small"
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: isLight ? "#2563EB" : "#79f8ff",
                      color: isLight ? "#2563EB" : "#79f8ff",
                      "&:hover": {
                        background: isLight ? "rgba(37,99,235,0.05)" : "rgba(121, 248, 255, 0.1)",
                        borderColor: isLight ? "#1D4ED8" : "#79f8ff",
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
                      backgroundColor: isLight ? "#2563EB" : "#3b82f6",
                      color: "#ffffff",
                      "&:hover": {
                        backgroundColor: isLight ? "#1D4ED8" : "#2563eb",
                      },
                    }}
                  >
                    Open Shared
                  </Button>
                </Box>

                <Button
                  onClick={handleCloseEnvelope}
                  variant="text"
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: isLight ? "#374151" : "rgba(255,255,255,0.6)",
                    "&:hover": {
                      color: isLight ? "#111827" : "#ffffff",
                    },
                  }}
                >
                  Close
                </Button>
              </Box>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Canvas Flight Animation Overlays */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 999999,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
