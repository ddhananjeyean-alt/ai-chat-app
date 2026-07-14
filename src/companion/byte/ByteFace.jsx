import { useState, useEffect } from "react";

export default function ByteFace({
  expression = "happy",
  eyeColor = "url(#byteGlow)",
}) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout;
    let nextBlinkTimeout;

    const triggerBlink = () => {
      // Disable blinking for specialized processing states to prevent visual glitches
      // EXCEPT thinking_state so that Byte reacts naturally while thinking!
      if (expression.endsWith("_state") && expression !== "thinking_state") {
        setIsBlinking(false);
        const nextDelay = 3000 + Math.random() * 5000;
        nextBlinkTimeout = setTimeout(triggerBlink, nextDelay);
        return;
      }

      setIsBlinking(true);
      blinkTimeout = setTimeout(() => {
        setIsBlinking(false);
        const nextDelay = 3000 + Math.random() * 5000;
        nextBlinkTimeout = setTimeout(triggerBlink, nextDelay);
      }, 150);
    };

    const initialDelay = 1500 + Math.random() * 3000;
    nextBlinkTimeout = setTimeout(triggerBlink, initialDelay);

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(nextBlinkTimeout);
    };
  }, [expression]);

  const renderEyes = () => {
    if (isBlinking) {
      return (
        <>
          <line
            x1="98"
            y1="86"
            x2="112"
            y2="86"
            stroke="#79F8FF"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <line
            x1="148"
            y1="86"
            x2="162"
            y2="86"
            stroke="#79F8FF"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </>
      );
    }

    switch (expression) {
      case "thinking_state":
        // 2. THINKING: Eyes become animated rotating circles
        return (
          <g>
            <circle
              cx="105"
              cy="86"
              r="8.5"
              fill="none"
              stroke="#79F8FF"
              strokeWidth="3.5"
              strokeDasharray="16 6"
              className="byte-spin-eye"
              filter="url(#glow)"
            />
            <circle
              cx="155"
              cy="86"
              r="8.5"
              fill="none"
              stroke="#79F8FF"
              strokeWidth="3.5"
              strokeDasharray="16 6"
              className="byte-spin-eye"
              filter="url(#glow)"
            />
          </g>
        );

      case "uploading_state":
        // 3. IMAGE UPLOADING: Progress rings + Upload arrow above Byte
        return (
          <g>
            {/* Upload Arrow */}
            <path
              d="M124 16 L130 9 L136 16 M130 9 L130 23"
              stroke="#79F8FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="byte-arrow-bounce"
              filter="url(#glow)"
            />
            {/* Progress Ring Eyes */}
            <circle
              cx="105"
              cy="86"
              r="8.5"
              fill="none"
              stroke="#00d8ff"
              strokeWidth="3.5"
              strokeDasharray="32 14"
              className="byte-pulse-eye"
              filter="url(#glow)"
            />
            <circle
              cx="155"
              cy="86"
              r="8.5"
              fill="none"
              stroke="#00d8ff"
              strokeWidth="3.5"
              strokeDasharray="32 14"
              className="byte-pulse-eye"
              filter="url(#glow)"
            />
          </g>
        );

      case "analyzing_state":
        // 4. IMAGE ANALYSIS: Scanning eyes + thin moving scan line
        return (
          <g>
            {/* Moving scan line */}
            <line
              x1="75"
              y1="90"
              x2="185"
              y2="90"
              stroke="#79F8FF"
              strokeWidth="2.5"
              opacity="0.8"
              className="byte-scan-line"
              filter="url(#glow)"
            />
            {/* Scanning Eyes */}
            <ellipse
              cx="105"
              cy="86"
              rx="10"
              ry="2.5"
              fill="#79F8FF"
              filter="url(#glow)"
            />
            <ellipse
              cx="155"
              cy="86"
              rx="10"
              ry="2.5"
              fill="#79F8FF"
              filter="url(#glow)"
            />
          </g>
        );

      case "searching_state":
        // 5. WEB SEARCH: Globes + Orbiting particles
        return (
          <g>
            {/* Orbiting rings */}
            <circle
              cx="105"
              cy="86"
              r="14"
              fill="none"
              stroke="#79F8FF"
              strokeWidth="1"
              strokeDasharray="3 9"
              className="byte-searching-orbit"
              opacity="0.65"
            />
            <circle
              cx="155"
              cy="86"
              r="14"
              fill="none"
              stroke="#79F8FF"
              strokeWidth="1"
              strokeDasharray="3 9"
              className="byte-searching-orbit"
              opacity="0.65"
            />
            {/* Globe Eyes */}
            <g className="byte-spin-eye">
              <circle cx="105" cy="86" r="8" fill="none" stroke="#79F8FF" strokeWidth="1.8" filter="url(#glow)" />
              <ellipse cx="105" cy="86" rx="3.5" ry="8" fill="none" stroke="#79F8FF" strokeWidth="1.2" />
              <line x1="97" y1="86" x2="113" y2="86" stroke="#79F8FF" strokeWidth="1.2" />
            </g>
            <g className="byte-spin-eye">
              <circle cx="155" cy="86" r="8" fill="none" stroke="#79F8FF" strokeWidth="1.8" filter="url(#glow)" />
              <ellipse cx="155" cy="86" rx="3.5" ry="8" fill="none" stroke="#79F8FF" strokeWidth="1.2" />
              <line x1="147" y1="86" x2="163" y2="86" stroke="#79F8FF" strokeWidth="1.2" />
            </g>
          </g>
        );

      case "generating_state":
        return (
          <g>
            <circle cx="105" cy="86" r="8" fill="#79F8FF" />
            <circle cx="155" cy="86" r="8" fill="#79F8FF" />
          </g>
        );

      case "listening_state":
        // 7. VOICE LISTENING: Pulse audio waves + Mic icon
        return (
          <g>
            {/* Small Microphone Icon */}
            <path
              d="M127 12 H133 V18 H127 Z M125 15 A5 5 0 0 0 135 15 M130 20 V23"
              stroke="#79F8FF"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              className="byte-mic-pulse"
              filter="url(#glow)"
            />
            {/* Audio Wave Eyes */}
            <line x1="99" y1="82" x2="99" y2="90" stroke="#79F8FF" strokeWidth="2.5" strokeLinecap="round" className="byte-wave-bar-1" filter="url(#glow)" />
            <line x1="105" y1="77" x2="105" y2="95" stroke="#79F8FF" strokeWidth="2.5" strokeLinecap="round" className="byte-wave-bar-2" filter="url(#glow)" />
            <line x1="111" y1="82" x2="111" y2="90" stroke="#79F8FF" strokeWidth="2.5" strokeLinecap="round" className="byte-wave-bar-1" filter="url(#glow)" />

            <line x1="149" y1="82" x2="149" y2="90" stroke="#79F8FF" strokeWidth="2.5" strokeLinecap="round" className="byte-wave-bar-1" filter="url(#glow)" />
            <line x1="155" y1="77" x2="155" y2="95" stroke="#79F8FF" strokeWidth="2.5" strokeLinecap="round" className="byte-wave-bar-2" filter="url(#glow)" />
            <line x1="161" y1="82" x2="161" y2="90" stroke="#79F8FF" strokeWidth="2.5" strokeLinecap="round" className="byte-wave-bar-1" filter="url(#glow)" />
          </g>
        );

      case "error_state":
        // 9. ERROR: Orange warning icons (triangles with exclamation marks)
        return (
          <g>
            {/* Left Warning Triangle */}
            <path d="M105 76 L114 92 H96 Z" fill="none" stroke="#FF9F43" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow)" />
            <line x1="105" y1="81" x2="105" y2="86" stroke="#FF9F43" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="105" cy="89.5" r="1" fill="#FF9F43" />
            {/* Right Warning Triangle */}
            <path d="M155 76 L164 92 H146 Z" fill="none" stroke="#FF9F43" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow)" />
            <line x1="155" y1="81" x2="155" y2="86" stroke="#FF9F43" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="155" cy="89.5" r="1" fill="#FF9F43" />
          </g>
        );

      case "blink":
        return (
          <>
            <line
              x1="98"
              y1="86"
              x2="112"
              y2="86"
              stroke="#79F8FF"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <line
              x1="148"
              y1="86"
              x2="162"
              y2="86"
              stroke="#79F8FF"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </>
        );

      case "sleep":
        return (
          <>
            <path
              d="M96 86 L112 82"
              stroke="#79F8FF"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M148 82 L164 86"
              stroke="#79F8FF"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </>
        );

      case "surprised":
        return (
          <>
            <circle cx="105" cy="86" r="8" fill={eyeColor} />
            <circle cx="155" cy="86" r="8" fill={eyeColor} />
          </>
        );

      case "look-left":
        return (
          <>
            <path
              d="M88 90 Q101 76 114 90"
              stroke={eyeColor}
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
            <path
              d="M138 90 Q151 76 164 90"
              stroke={eyeColor}
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
          </>
        );

      case "determined":
        return (
          <>
            <path
              d="M90 82 L116 88"
              stroke={eyeColor}
              strokeWidth="5.5"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            <path
              d="M170 82 L144 88"
              stroke={eyeColor}
              strokeWidth="5.5"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          </>
        );

      case "focused":
        return (
          <>
            <ellipse
              cx="105"
              cy="86"
              rx="9"
              ry="4.5"
              fill={eyeColor}
              filter="url(#glow)"
            />
            <ellipse
              cx="155"
              cy="86"
              rx="9"
              ry="4.5"
              fill={eyeColor}
              filter="url(#glow)"
            />
          </>
        );

      case "laughing":
        return (
          <>
            <path
              d="M90 92 L105 84 L120 92"
              stroke={eyeColor}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
            <path
              d="M140 92 L155 84 L170 92"
              stroke={eyeColor}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
          </>
        );

      case "proud":
        return (
          <g>
            <path
              d="M 80 78 H 180 L 168 96 H 92 Z"
              fill="#0e141d"
              stroke="url(#byteGold)"
              strokeWidth="3"
            />
            <line x1="88" y1="83" x2="108" y2="83" stroke="#79F8FF" strokeWidth="2.5" opacity="0.7" />
            <line x1="138" y1="83" x2="158" y2="83" stroke="#79F8FF" strokeWidth="2.5" opacity="0.7" />
          </g>
        );

      case "oops":
        return (
          <>
            <circle cx="105" cy="86" r="10" fill={eyeColor} filter="url(#glow)" />
            <line
              x1="144"
              y1="86"
              x2="166"
              y2="86"
              stroke={eyeColor}
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          </>
        );

      case "happy":
      default:
        return (
          <>
            <path
              d="M92 90 Q105 76 118 90"
              stroke={eyeColor}
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
            <path
              d="M142 90 Q155 76 168 90"
              stroke={eyeColor}
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
          </>
        );
    }
  };

  const renderMouth = () => {
    switch (expression) {
      case "error_state":
        return (
          <path
            d="M120 120 Q130 110 140 120"
            stroke="#FF9F43"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
          />
        );

      case "sad":
        return (
          <path
            d="M112 118 Q130 108 148 118"
            stroke="#79F8FF"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        );

      case "surprised":
        return (
          <circle cx="130" cy="116" r="6" fill="#79F8FF" />
        );

      case "thinking":
      case "thinking_state":
      case "analyzing_state":
      case "determined":
      case "focused":
        return (
          <line
            x1="118"
            y1="116"
            x2="142"
            y2="116"
            stroke="#79F8FF"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        );

      case "laughing":
        return (
          <path
            d="M116 114 C116 128, 144 128, 144 114 Z"
            fill="#79F8FF"
            stroke="#79F8FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />
        );

      case "proud":
        return (
          <path
            d="M118 114 Q132 118 142 110"
            stroke="#79F8FF"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
          />
        );

      case "oops":
        return (
          <path
            d="M116 116 Q122 110 128 116 Q134 122 140 116"
            stroke="#79F8FF"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
          />
        );

      case "happy":
      default:
        return (
          <path
            d="M120 114 Q130 124 140 114"
            stroke="#79F8FF"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
          />
        );
    }
  };

  return (
    <g filter="url(#glow)">
      {renderEyes()}
      {renderMouth()}
    </g>
  );
}