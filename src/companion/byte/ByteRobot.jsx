import React from "react";
import "./byte.css";
import { useByte, BYTE_STATES } from "../../context/ByteContext";

import ByteFace from "./ByteFace";
import ByteArms from "./ByteArms";
import ByteTail from "./ByteTail";

export default function ByteRobot({
  size = 90,
  _x = 0,
  _y = 0,
  state: propState = "idle",
  expression: propExpression = "happy",
  gesture: propGesture = "none",
}) {
  const { byteState } = useByte();
  const [cuteAction, setCuteAction] = React.useState("none");

  React.useEffect(() => {
    if (byteState === BYTE_STATES.THINKING) {
      const actions = ["tilt-left", "tilt-right", "look-down", "small-bounce", "antenna-glow", "none"];
      const interval = setInterval(() => {
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        setCuteAction(randomAction);
        setTimeout(() => setCuteAction("none"), 1800);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [byteState, propState]);

  let state = propState;
  let expression = propExpression;
  let gesture = propGesture;

  // Map cuteAction overrides for idle wiggles/waves
  if (byteState === BYTE_STATES.IDLE && (propState === "idle" || propState === "float")) {
    if (cuteAction === "wave") {
      gesture = "wave";
      expression = "happy";
    } else if (cuteAction === "blink") {
      expression = "blink";
    } else if (cuteAction === "look-left" || cuteAction === "look-right") {
      expression = "focused";
    }
  }

  // Map global AI processing states to visual components
  if (byteState !== BYTE_STATES.IDLE) {
    if (byteState === BYTE_STATES.THINKING) {
      state = "thinking";
      expression = "thinking_state";
    } else if (byteState === BYTE_STATES.UPLOADING) {
      state = "float";
      expression = "uploading_state";
      gesture = "reach-up";
    } else if (byteState === BYTE_STATES.ANALYZING) {
      state = "thinking";
      expression = "analyzing_state";
    } else if (byteState === BYTE_STATES.SEARCHING) {
      state = "float";
      expression = "searching_state";
    } else if (byteState === BYTE_STATES.GENERATING) {
      state = "float generating-glow";
      expression = "generating_state";
    } else if (byteState === BYTE_STATES.LISTENING) {
      state = "float";
      expression = "listening_state";
    } else if (byteState === BYTE_STATES.SUCCESS) {
      state = "happy";
      expression = "happy";
    } else if (byteState === BYTE_STATES.ERROR) {
      state = "error_shake";
      expression = "error_state";
    }
  }

  return (
    <div
      className={`byte ${state}`}
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size * 1.45}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: cuteAction === "small-bounce" ? "translateY(-8px)" : "none",
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <svg
        className="byte-svg"
        viewBox="0 0 260 340"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pearl White Shell Gradient */}
          <linearGradient id="byteShell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f7f9fc" />
            <stop offset="75%" stopColor="#eaf0f6" />
            <stop offset="100%" stopColor="#d3dfeb" />
          </linearGradient>

          {/* Premium Gold/Bronze Gradient */}
          <linearGradient id="byteGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFEAA7" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#AA7C11" />
            <stop offset="100%" stopColor="#7F5A00" />
          </linearGradient>

          {/* Screen Background Gradient */}
          <linearGradient id="byteScreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#223042" />
            <stop offset="100%" stopColor="#0e141d" />
          </linearGradient>

          {/* Cyan Energy Glow */}
          <radialGradient id="byteGlow">
            <stop offset="0%" stopColor="#b2ffff" />
            <stop offset="60%" stopColor="#30e5ff" />
            <stop offset="100%" stopColor="#00b4d8" />
          </radialGradient>

          {/* Shadows and Glow Effects */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.22" />
          </filter>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tail (Coiled Base) */}
        <ByteTail />

        {/* Rocket Booster Pack */}
        {state && (state.includes("rocket") || state.includes("preflight") || state.includes("igniting")) && (
          <g filter="url(#shadow)" className="booster-pack">
            {/* Connecting Harness */}
            <path
              d="M 68 220 L 192 220"
              stroke="url(#byteGold)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Left Booster Pod */}
            <rect
              x="38"
              y="200"
              width="24"
              height="48"
              rx="8"
              fill="url(#byteShell)"
              stroke="url(#byteGold)"
              strokeWidth="2.5"
            />
            {/* Left Exhaust nozzle */}
            <path
              d="M 44 248 L 38 260 L 62 260 L 56 248 Z"
              fill="#223042"
              stroke="url(#byteGold)"
              strokeWidth="1.5"
            />
            {/* Right Booster Pod */}
            <rect
              x="198"
              y="200"
              width="24"
              height="48"
              rx="8"
              fill="url(#byteShell)"
              stroke="url(#byteGold)"
              strokeWidth="2.5"
            />
            {/* Right Exhaust nozzle */}
            <path
              d="M 204 248 L 198 260 L 222 260 L 216 248 Z"
              fill="#223042"
              stroke="url(#byteGold)"
              strokeWidth="1.5"
            />
            {/* Left Flame */}
            <path
              d="M 38 260 Q 50 305 50 315 Q 50 305 62 260 Z"
              fill="url(#byteGlow)"
              filter="url(#glow)"
              className="rocket-flame-left"
            />
            {/* Right Flame */}
            <path
              d="M 198 260 Q 210 305 210 315 Q 210 305 222 260 Z"
              fill="url(#byteGlow)"
              filter="url(#glow)"
              className="rocket-flame-right"
            />
          </g>
        )}

        {/* Gold Stacked Antenna */}
        <g filter="url(#shadow)">
          {/* Base Rings */}
          <ellipse cx="130" cy="24" rx="14" ry="4" fill="url(#byteGold)" />
          <ellipse cx="130" cy="18" rx="10" ry="3" fill="url(#byteGold)" />
          <ellipse cx="130" cy="12" rx="6" ry="2" fill="url(#byteGold)" />
          {/* Antenna Stem */}
          <line
            x1="130"
            y1="12"
            x2="130"
            y2="4"
            stroke="url(#byteGold)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Glowing Bulb */}
          <circle
            cx="130"
            cy="-1"
            r="8"
            fill="url(#byteGlow)"
            filter="url(#glow)"
            style={{
              transformOrigin: "130px -1px",
              transform: cuteAction === "antenna-glow" ? "scale(1.35)" : "scale(1)",
              filter: cuteAction === "antenna-glow" ? "drop-shadow(0 0 10px #79f8ff) url(#glow)" : "url(#glow)",
              transition: "transform 0.4s ease-in-out, filter 0.4s ease-in-out",
            }}
          />
        </g>
 
        {/* Tilting & Looking Head Group */}
        <g
          style={{
            transformOrigin: "130px 145px",
            transform: state && state.includes("preflight-left")
              ? "rotate(-12deg) translateX(-4px)"
              : state && state.includes("preflight-right")
              ? "rotate(12deg) translateX(4px)"
              : cuteAction === "tilt-left"
              ? "rotate(-7deg)"
              : cuteAction === "tilt-right"
              ? "rotate(7deg)"
              : cuteAction === "look-down"
              ? "translateY(5px) rotate(1deg)"
              : cuteAction === "look-left"
              ? "rotate(-5deg) translateX(-3px)"
              : cuteAction === "look-right"
              ? "rotate(5deg) translateX(3px)"
              : "none",
            transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Head Structure */}
          <g filter="url(#shadow)">
            {/* Main White Head Shell */}
            <rect
              x="52"
              y="26"
              width="156"
              height="132"
              rx="45"
              fill="url(#byteShell)"
            />

            {/* Head Top Specular highlight */}
            <ellipse
              cx="100"
              cy="46"
              rx="28"
              ry="9"
              fill="#ffffff"
              opacity=".55"
            />

            {/* Glowing Screen Outer Border */}
            <rect
              x="73"
              y="47"
              width="114"
              height="92"
              rx="28"
              fill="url(#byteScreen)"
              stroke="#4be9ff"
              strokeWidth="1.5"
              strokeOpacity=".45"
            />
          </g>

          {/* Side Gold Earpads (Reference Image Detail) */}
          <g filter="url(#shadow)">
            {/* Left Earpad */}
            <rect x="42" y="78" width="10" height="28" rx="4" fill="url(#byteGold)" />
            <circle
              cx="42"
              cy="92"
              r="11"
              fill="url(#byteShell)"
              stroke="url(#byteGold)"
              strokeWidth="2.5"
            />
            <circle cx="42" cy="92" r="5" fill="url(#byteGold)" />

            {/* Right Earpad */}
            <rect x="208" y="78" width="10" height="28" rx="4" fill="url(#byteGold)" />
            <circle
              cx="218"
              cy="92"
              r="11"
              fill="url(#byteShell)"
              stroke="url(#byteGold)"
              strokeWidth="2.5"
            />
            <circle cx="218" cy="92" r="5" fill="url(#byteGold)" />
          </g>

          {/* Face Elements (Eyes & Mouth) */}
          <ByteFace expression={expression} />
        </g>

        {/* Gold Neck Connector */}
        <rect
          x="116"
          y="158"
          width="28"
          height="20"
          rx="6"
          fill="url(#byteGold)"
        />

        {/* Body Structure */}
        <g filter="url(#shadow)">
          {/* Main White Chest Shell */}
          <rect
            x="66"
            y="176"
            width="128"
            height="98"
            rx="40"
            fill="url(#byteShell)"
          />

          {/* Body Top Specular Highlight */}
          <ellipse
            cx="108"
            cy="192"
            rx="32"
            ry="8"
            fill="#fff"
            opacity=".5"
          />

          {/* Gold Bolt/Plates details on Body */}
          <circle cx="78" cy="192" r="2.5" fill="url(#byteGold)" />
          <circle cx="182" cy="192" r="2.5" fill="url(#byteGold)" />

          {/* Gold circuit line details */}
          <path
            d="M 82 205 L 94 205 L 98 215"
            stroke="url(#byteGold)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M 178 205 L 166 205 L 162 215"
            stroke="url(#byteGold)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.75"
          />
        </g>

        {/* Glowing Shield/Rounded-Rect Core (Reference Image Detail) */}
        <g filter="url(#glow)">
          <rect
            x="110"
            y="202"
            width="40"
            height="44"
            rx="10"
            fill="url(#byteGlow)"
          />
          {/* Glowing Inner Highlight */}
          <rect
            x="116"
            y="208"
            width="28"
            height="32"
            rx="6"
            fill="#ffffff"
            opacity="0.38"
          />
        </g>

        {/* Render the switch handle inside Byte's SVG for 3D overlap sandwich alignment */}
        {(gesture === "reach-up" || gesture === "pull-rope") && (
          <g>
            <defs>
              <linearGradient id="metalGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8a9ba8" />
                <stop offset="50%" stopColor="#d8e1e8" />
                <stop offset="100%" stopColor="#5c7080" />
              </linearGradient>
              <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Metal cap connector */}
            <rect x="127" y="102" width="6" height="6" rx="1" fill="url(#metalGradient)" />

            {/* Pill-shaped frosted glass smart switch handle */}
            <rect x="122" y="108" width="16" height="28" rx="8" fill="url(#glassGradient)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" filter="url(#glow)" />
            
            {/* Inner glowing accent dot */}
            <circle cx="130" cy="124" r="3" fill="#79f8ff" filter="url(#glow)" />

            {/* Silver cap accents on the sides of the handle body */}
            <rect x="120" y="114" width="2" height="16" rx="0.5" fill="url(#metalGradient)" />
            <rect x="138" y="114" width="2" height="16" rx="0.5" fill="url(#metalGradient)" />

            {/* Metallic pull ring at the bottom of the handle */}
            <circle cx="130" cy="144" r="6" fill="none" stroke="url(#metalGradient)" strokeWidth="2.5" />
          </g>
        )}

        {/* Gold & White Raised Arms */}
        <ByteArms gesture={gesture} />
      </svg>
    </div>
  );
}