import React from "react";

export default function ByteArms({ gesture = "none" }) {
  if (gesture === "reach-up") {
    return (
      <>
        {/* LEFT ARM REACHING INWARD TO HANDLE */}
        <g id="byte-left-arm">
          <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm */}
          <line x1="60" y1="196" x2="82" y2="155" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="60" y1="196" x2="80" y2="158" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="82" cy="155" r="7" fill="url(#byteGold)" />
          {/* Forearm bending inward */}
          <line x1="82" y1="155" x2="110" y2="124" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="82" y1="155" x2="105" y2="128" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="110" cy="124" r="5.5" fill="url(#byteGold)" />
          {/* Hand claw wrapping around left side of handle */}
          <g>
            <path d="M 110 124 Q 98 120 102 110" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 110 124 Q 120 116 114 108" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>

        {/* RIGHT ARM REACHING INWARD TO HANDLE */}
        <g id="byte-right-arm">
          <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm */}
          <line x1="200" y1="196" x2="178" y2="155" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="200" y1="196" x2="180" y2="158" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="178" cy="155" r="7" fill="url(#byteGold)" />
          {/* Forearm bending inward */}
          <line x1="178" y1="155" x2="150" y2="124" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="178" y1="155" x2="155" y2="128" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="150" cy="124" r="5.5" fill="url(#byteGold)" />
          {/* Hand claw wrapping around right side of handle */}
          <g>
            <path d="M 150 124 Q 162 120 158 110" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 150 124 Q 140 116 146 108" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>
      </>
    );
  }

  if (gesture === "pull-rope") {
    return (
      <>
        {/* LEFT ARM HUGGING AND PULLING DOWN */}
        <g id="byte-left-arm">
          <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm */}
          <line x1="60" y1="196" x2="86" y2="162" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="60" y1="196" x2="83" y2="165" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="86" cy="162" r="7" fill="url(#byteGold)" />
          {/* Forearm tightly bent inward */}
          <line x1="86" y1="162" x2="114" y2="124" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="86" y1="162" x2="108" y2="130" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="114" cy="124" r="5.5" fill="url(#byteGold)" />
          {/* Claw fully closed around handle */}
          <g>
            <path d="M 114 124 C 114 116, 126 116, 126 124" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 114 124 C 114 132, 126 132, 126 124" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>

        {/* RIGHT ARM HUGGING AND PULLING DOWN */}
        <g id="byte-right-arm">
          <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm */}
          <line x1="200" y1="196" x2="174" y2="162" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="200" y1="196" x2="177" y2="165" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="174" cy="162" r="7" fill="url(#byteGold)" />
          {/* Forearm tightly bent inward */}
          <line x1="174" y1="162" x2="146" y2="124" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="174" y1="162" x2="152" y2="130" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="146" cy="124" r="5.5" fill="url(#byteGold)" />
          {/* Claw fully closed around handle */}
          <g>
            <path d="M 146 124 C 146 116, 134 116, 134 124" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 146 124 C 146 132, 134 132, 134 124" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>
      </>
    );
  }

  if (gesture === "wave") {
    return (
      <>
        {/* LEFT ARM DOWN/IDLE */}
        <g id="byte-left-arm">
          <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm pointing down */}
          <line x1="60" y1="196" x2="52" y2="236" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="60" y1="196" x2="54" y2="226" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="52" cy="236" r="7" fill="url(#byteGold)" />
          {/* Forearm pointing down */}
          <line x1="52" y1="236" x2="48" y2="270" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="52" y1="236" x2="49" y2="260" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="48" cy="270" r="5.5" fill="url(#byteGold)" />
          {/* Claw pointing down */}
          <g>
            <path d="M 48 270 Q 36 275 40 288" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 48 270 Q 60 278 52 288" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>

        {/* RIGHT ARM RAISED & WAVING (Tilted higher) */}
        <g id="byte-right-arm">
          <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm raised up-right */}
          <line x1="200" y1="196" x2="230" y2="160" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="200" y1="196" x2="222" y2="169" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="230" cy="160" r="7" fill="url(#byteGold)" />
          {/* Forearm angled up-left */}
          <line x1="230" y1="160" x2="220" y2="115" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="230" y1="160" x2="223" y2="125" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="220" cy="115" r="5.5" fill="url(#byteGold)" />
          {/* Hand/Claw raised high */}
          <g>
            <path d="M 220 115 Q 232 110 228 97" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 220 115 Q 208 107 216 97" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>
      </>
    );
  }

  if (gesture === "point-left") {
    return (
      <>
        {/* LEFT ARM POINTING LEFT (TOWARDS TEXTBOX) */}
        <g id="byte-left-arm">
          {/* Gold Shoulder Joint */}
          <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />
          
          {/* Upper Arm mechanical core */}
          <line
            x1="60"
            y1="196"
            x2="26"
            y2="190"
            stroke="url(#byteGold)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Upper Arm white casing */}
          <line
            x1="60"
            y1="196"
            x2="32"
            y2="191"
            stroke="url(#byteShell)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Gold Elbow Joint */}
          <circle cx="26" cy="190" r="7" fill="url(#byteGold)" />

          {/* Lower Arm mechanical core */}
          <line
            x1="26"
            y1="190"
            x2="-2"
            y2="185"
            stroke="url(#byteGold)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Lower Arm white casing */}
          <line
            x1="26"
            y1="190"
            x2="4"
            y2="186"
            stroke="url(#byteShell)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Gold Wrist */}
          <circle cx="-2" cy="185" r="5" fill="url(#byteGold)" />

          {/* Pointing Hand with Index Finger */}
          <g stroke="url(#byteGold)" strokeWidth="3" strokeLinecap="round">
            {/* Index finger pointing straight left */}
            <line x1="-2" y1="185" x2="-16" y2="185" />
            {/* Curled thumb */}
            <line x1="-2" y1="185" x2="-8" y2="178" />
            {/* Curled other fingers */}
            <line x1="-2" y1="185" x2="-8" y2="192" />
          </g>
        </g>

        {/* RIGHT ARM (RAISED, MATCHING REFERENCE IMAGE) */}
        <g id="byte-right-arm">
          {/* Gold Shoulder Joint */}
          <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />

          {/* Upper Arm core */}
          <line
            x1="200"
            y1="196"
            x2="222"
            y2="185"
            stroke="url(#byteGold)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Upper Arm white casing */}
          <line
            x1="200"
            y1="196"
            x2="218"
            y2="187"
            stroke="url(#byteShell)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Gold Elbow Joint */}
          <circle cx="222" cy="185" r="7" fill="url(#byteGold)" />

          {/* Forearm core */}
          <line
            x1="222"
            y1="185"
            x2="236"
            y2="150"
            stroke="url(#byteGold)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Forearm white casing */}
          <line
            x1="222"
            y1="185"
            x2="232"
            y2="160"
            stroke="url(#byteShell)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Gold Wrist Joint */}
          <circle cx="236" cy="150" r="5.5" fill="url(#byteGold)" />

          {/* Gold Claw Hand (Pointing Up/In) */}
          <g>
            {/* Right finger loop */}
            <path
              d="M 236 150 Q 248 145 244 132"
              fill="none"
              stroke="url(#byteGold)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Left finger loop */}
            <path
              d="M 236 150 Q 224 142 232 132"
              fill="none"
              stroke="url(#byteGold)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Center thumb knob */}
            <circle cx="238" cy="132" r="2.5" fill="url(#byteGold)" />
          </g>
        </g>
      </>
    );
  }

  if (gesture === "pat-chest") {
    return (
      <>
        {/* LEFT ARM DOWN/IDLE */}
        <g id="byte-left-arm">
          <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm pointing down */}
          <line x1="60" y1="196" x2="52" y2="236" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="60" y1="196" x2="54" y2="226" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="52" cy="236" r="7" fill="url(#byteGold)" />
          {/* Forearm pointing down */}
          <line x1="52" y1="236" x2="48" y2="270" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="52" y1="236" x2="49" y2="260" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="48" cy="270" r="5.5" fill="url(#byteGold)" />
          {/* Claw pointing down */}
          <g>
            <path d="M 48 270 Q 36 275 40 288" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 48 270 Q 60 278 52 288" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>

        {/* RIGHT ARM PATTING CHEST COMPARTMENT */}
        <g id="byte-right-arm">
          <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm bending down-left */}
          <line x1="200" y1="196" x2="165" y2="215" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="200" y1="196" x2="170" y2="210" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="165" cy="215" r="7" fill="url(#byteGold)" />
          {/* Forearm reaching center chest */}
          <line x1="165" y1="215" x2="135" y2="222" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="165" y1="215" x2="140" y2="220" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="135" cy="222" r="5.5" fill="url(#byteGold)" />
          {/* Claw hand touching chest */}
          <g>
            <path d="M 135 222 Q 123 218 127 208" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 135 222 Q 145 214 139 206" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>
      </>
    );
  }

  if (gesture === "flail") {
    return (
      <>
        {/* LEFT ARM FLAILING */}
        <g id="byte-left-arm" className="byte-arm-flail-left">
          <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm raised */}
          <line x1="60" y1="196" x2="30" y2="150" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="60" y1="196" x2="35" y2="160" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="30" cy="150" r="7" fill="url(#byteGold)" />
          {/* Forearm pointing out */}
          <line x1="30" y1="150" x2="10" y2="110" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="30" y1="150" x2="15" y2="120" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="10" cy="110" r="5.5" fill="url(#byteGold)" />
          {/* Hand/Claw */}
          <g>
            <path d="M 10 110 Q -2 105 2 92" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 10 110 Q 22 102 14 92" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>
        
        {/* RIGHT ARM FLAILING */}
        <g id="byte-right-arm" className="byte-arm-flail-right">
          <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />
          {/* Upper Arm raised */}
          <line x1="200" y1="196" x2="230" y2="150" stroke="url(#byteGold)" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="200" y1="196" x2="225" y2="160" stroke="url(#byteShell)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="230" cy="150" r="7" fill="url(#byteGold)" />
          {/* Forearm pointing out */}
          <line x1="230" y1="150" x2="250" y2="110" stroke="url(#byteGold)" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="230" y1="150" x2="245" y2="120" stroke="url(#byteShell)" strokeWidth="9" strokeLinecap="round" />
          <circle cx="250" cy="110" r="5.5" fill="url(#byteGold)" />
          {/* Hand/Claw */}
          <g>
            <path d="M 250 110 Q 262 105 258 92" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 250 110 Q 238 102 246 92" fill="none" stroke="url(#byteGold)" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        </g>
      </>
    );
  }

  // DEFAULT POSE (BOTH ARMS RAISED Symmetrically like reference image)
  return (
    <>
      {/* LEFT ARM (RAISED) */}
      <g id="byte-left-arm">
        {/* Gold Shoulder Joint */}
        <circle cx="60" cy="196" r="10" fill="url(#byteGold)" />

        {/* Upper Arm core */}
        <line
          x1="60"
          y1="196"
          x2="38"
          y2="185"
          stroke="url(#byteGold)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        {/* Upper Arm casing */}
        <line
          x1="60"
          y1="196"
          x2="42"
          y2="187"
          stroke="url(#byteShell)"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Gold Elbow Joint */}
        <circle cx="38" cy="185" r="7" fill="url(#byteGold)" />

        {/* Forearm core */}
        <line
          x1="38"
          y1="185"
          x2="24"
          y2="150"
          stroke="url(#byteGold)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Forearm casing */}
        <line
          x1="38"
          y1="185"
          x2="28"
          y2="160"
          stroke="url(#byteShell)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Gold Wrist Joint */}
        <circle cx="24" cy="150" r="5.5" fill="url(#byteGold)" />

        {/* Gold Claw Hand (Pointing Up/In) */}
        <g>
          {/* Left finger loop */}
          <path
            d="M 24 150 Q 12 145 16 132"
            fill="none"
            stroke="url(#byteGold)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Right finger loop */}
          <path
            d="M 24 150 Q 36 142 28 132"
            fill="none"
            stroke="url(#byteGold)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Center thumb knob */}
          <circle cx="22" cy="132" r="2.5" fill="url(#byteGold)" />
        </g>
      </g>

      {/* RIGHT ARM (RAISED) */}
      <g id="byte-right-arm">
        {/* Gold Shoulder Joint */}
        <circle cx="200" cy="196" r="10" fill="url(#byteGold)" />

        {/* Upper Arm core */}
        <line
          x1="200"
          y1="196"
          x2="222"
          y2="185"
          stroke="url(#byteGold)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        {/* Upper Arm casing */}
        <line
          x1="200"
          y1="196"
          x2="218"
          y2="187"
          stroke="url(#byteShell)"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Gold Elbow Joint */}
        <circle cx="222" cy="185" r="7" fill="url(#byteGold)" />

        {/* Forearm core */}
        <line
          x1="222"
          y1="185"
          x2="236"
          y2="150"
          stroke="url(#byteGold)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Forearm casing */}
        <line
          x1="222"
          y1="185"
          x2="232"
          y2="160"
          stroke="url(#byteShell)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Gold Wrist Joint */}
        <circle cx="236" cy="150" r="5.5" fill="url(#byteGold)" />

        {/* Gold Claw Hand (Pointing Up/In) */}
        <g>
          {/* Right finger loop */}
          <path
            d="M 236 150 Q 248 145 244 132"
            fill="none"
            stroke="url(#byteGold)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Left finger loop */}
          <path
            d="M 236 150 Q 224 142 232 132"
            fill="none"
            stroke="url(#byteGold)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Center thumb knob */}
          <circle cx="238" cy="132" r="2.5" fill="url(#byteGold)" />
        </g>
      </g>
    </>
  );
}