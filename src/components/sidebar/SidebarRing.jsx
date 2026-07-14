import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material";
import {
  WHEEL_RADIUS,
  INNER_RADIUS,
  COLORS,
  SHADOWS,
} from "./SidebarConstants";
import {
  ringAnimation,
  glowAnimation,
} from "./SidebarAnimations";

const SIZE = WHEEL_RADIUS * 2;

export default function SidebarRing({ rotation = 0 }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const outer = WHEEL_RADIUS;
  const inner = INNER_RADIUS;

  const thickness = outer - inner;

  return (
    <div
      style={{
        width: SIZE,
        height: SIZE,
        position: "absolute",
        left: -outer,
        top: "50%",
        marginTop: -outer,
        pointerEvents: "none",
      }}
    >
      {/* Background Glow */}
      <motion.div
        {...glowAnimation}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: isLight
            ? `radial-gradient(circle,
                rgba(59,130,246,.12) 0%,
                rgba(59,130,246,.03) 45%,
                transparent 72%)`
            : `radial-gradient(circle,
                rgba(99,216,255,.28) 0%,
                rgba(99,216,255,.10) 45%,
                transparent 72%)`,
          filter: "blur(18px)",
        }}
      />

      {/* Ring */}
      <motion.svg
        {...ringAnimation}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient
            id="sidebarRingGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={COLORS.ring2}
            />
            <stop
              offset="100%"
              stopColor={COLORS.ring1}
            />
          </linearGradient>

          <filter
            id="sidebarShadow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="14"
              floodOpacity={isLight ? ".06" : ".45"}
            />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle
          cx={outer}
          cy={outer}
          r={(outer + inner) / 2}
          fill="none"
          stroke="url(#sidebarRingGradient)"
          strokeWidth={thickness}
          filter="url(#sidebarShadow)"
        />

        {/* Border */}
        <circle
          cx={outer}
          cy={outer}
          r={(outer + inner) / 2}
          fill="none"
          stroke={isLight ? "rgba(0,0,0,.04)" : "rgba(255,255,255,.06)"}
          strokeWidth="1.2"
        />

        {/* Highlight */}
        <path
          d={`
            M ${outer} ${outer - (outer + inner) / 2}
            A ${(outer + inner) / 2}
              ${(outer + inner) / 2}
              0
              0
              1
              ${outer + ((outer + inner) / 2) * 0.7}
              ${outer - ((outer + inner) / 2) * 0.7}
          `}
          fill="none"
          stroke={isLight ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.18)"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* Glass Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 18,
          borderRadius: "50%",
          background: isLight
            ? "linear-gradient(145deg, rgba(255,255,255,.6), rgba(255,255,255,.3))"
            : "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: `1px solid ${COLORS.border}`,
          boxShadow: isLight ? "0 15px 35px rgba(0,0,0,.06)" : SHADOWS.wheel,
        }}
      />

      {/* Inner Shadow */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          borderRadius: "50%",
          boxShadow: isLight
            ? "inset 0 0 16px rgba(0,0,0,.05)"
            : "inset 0 0 24px rgba(0,0,0,.45)",
        }}
      />
    </div>
  );
}