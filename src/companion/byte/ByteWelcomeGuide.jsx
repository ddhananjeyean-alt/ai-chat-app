import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import ByteRobot from "./ByteRobot";
import ByteMovement from "./ByteMovement";
import { useThemeContext } from "../../theme/ThemeContext";
import { ThemeEvents } from "./ThemeEvents";
import { DeleteEvents } from "./DeleteEvents";
import { ArchiveEvents } from "./ArchiveEvents";
import { RenameEvents } from "./RenameEvents";
import { useByte } from "../../context/ByteContext";
import { RestoreEvents } from "./RestoreEvents";
import { ShareEvents } from "./ShareEvents";
import { ShareEnvelopeEvents } from "./ShareEnvelopeEvents";
import { Box, Typography } from "@mui/material";

function TypingText({ text, speed = 25 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span style={{ whiteSpace: "pre-wrap" }}>{displayedText}</span>;
}

export default function ByteWelcomeGuide({
  byteState,
  setByteState,
  isTyping,
  isGenerating = false,
  message,
  currentUser,
  activeChatId,
  hasMessages,
  isSharedRoute = false,
}) {
  const { currentTheme } = useThemeContext();
  const darkMode = currentTheme?.palette?.mode === "dark";

  const {
    welcomeActive,
    welcomeState,
    setWelcomeState,
    overridePosition,
    showBubble,
    cancelWelcome,
    bubbleText,
    expression,
    gesture,
    isBusy,
    setIsBusy,
    currentTarget,
    setCurrentTarget,
    isReturning,
    setIsReturning,
    originalPosition,
    setOriginalPosition,
  } = useByte();

  const [celebrate, setCelebrate] = useState(false);
  const prevIsGenerating = useRef(isGenerating);

  // FSM and animation lock refs
  const isBusyRef = useRef(false);
  const isMountedRef = useRef(true);
  const activeAnimateRef = useRef(null);
  const savedPositionRef = useRef(null);

  // Rocket idle animation states
  const [rocketState, setRocketState] = useState(null);
  const [rocketOverridePos, setRocketOverridePos] = useState(null);
  const [rocketTargetPos, setRocketTargetPos] = useState(null);
  const [rocketSelectedSelector, setRocketSelectedSelector] = useState(null);
  const [rocketParticles, setRocketParticles] = useState([]);
  const [rocketExpression, setRocketExpression] = useState("happy");
  const [rocketGesture, setRocketGesture] = useState("none");
  const [cameraShake, setCameraShake] = useState({ x: 0, y: 0 });

  const lastActivityRef = useRef(Date.now());
  const rocketTimerRef = useRef(null);

  // Theme rope pull animation state
  const [ropeState, setRopeState] = useState(null); // null, 'go_to_rope', 'grab_rope', 'pull_rope', 'return_home'
  const [ropeCoords, setRopeCoords] = useState({ x: 0, y: 0 });
  const [pullOffset, setPullOffset] = useState(0);
  const [ropeOverridePos, setRopeOverridePos] = useState(null);
  const ropeAnimRef = useRef(null);

  const ropeStateRef = useRef(null);
  const ropeOverridePosRef = useRef(null);
  useEffect(() => { ropeStateRef.current = ropeState; }, [ropeState]);
  useEffect(() => { ropeOverridePosRef.current = ropeOverridePos; }, [ropeOverridePos]);

  // Delete conversation vacuum animation state
  const [deleteState, setDeleteState] = useState(null); // null, 'go_to_chat', 'vacuuming', 'celebrating', 'return_home'
  const [deleteCoords, setDeleteCoords] = useState({ x: 0, y: 0 });
  const [deleteOverridePos, setDeleteOverridePos] = useState(null);
  const [activeDeleteChatId, setActiveDeleteChatId] = useState(null);
  const [particles, setParticles] = useState([]);

  // Delete / Undo animation state overrides
  const [deleteNotice, setDeleteNotice] = useState(false);
  const [deleteBubbleActive, setDeleteBubbleActive] = useState(false);
  
  // Undo animation state overrides
  const [undoState, setUndoState] = useState(null); // null, 'noticing', 'go_to_center', 'opening_compartment', 'catching_chat', 'go_to_chat', 'placing_chat', 'celebrating', 'return_home'
  const [undoOverridePos, setUndoOverridePos] = useState(null);
  const [undoNotice, setUndoNotice] = useState(false);
  const [undoBubbleActive, setUndoBubbleActive] = useState(false);
  const [steamParticles, setSteamParticles] = useState([]);

  // Timeout recycle animation state overrides
  const [recycleActive, setRecycleActive] = useState(false);
  const [dissolveParticles, setDissolveParticles] = useState([]);
  const [recycledBubbleActive, setRecycledBubbleActive] = useState(false);

  // Archive conversation animation state
  const [archiveState, setArchiveState] = useState(null); // null, 'go_to_chat', 'grabbing_chat', 'carrying_chat', 'placing_chat', 'celebrating', 'return_home'
  const [archiveCoords, setArchiveCoords] = useState({ x: 0, y: 0 });
  const [archiveOverridePos, setArchiveOverridePos] = useState(null);
  const [activeArchiveChatId, setActiveArchiveChatId] = useState(null);

  // Restore conversation animation state
  const [restoreState, setRestoreState] = useState(null); // null, 'noticing', 'go_to_box', 'opening_box', 'grabbing_chat', 'carrying_chat', 'placing_chat', 'celebrating', 'return_home'
  const [restoreOverridePos, setRestoreOverridePos] = useState(null);
  const [activeRestoreChatId, setActiveRestoreChatId] = useState(null);
  const [restoreNotice, setRestoreNotice] = useState(false);
  const [restoreBubble, setRestoreBubble] = useState(false);

  // Rename conversation animation state
  const [renameState, setRenameState] = useState(null); // null, 'noticing', 'go_to_chat', 'editing', 'finish_rename', 'return_home'
  const [renameCoords, setRenameCoords] = useState({ x: 0, y: 0 });
  const [renameOverridePos, setRenameOverridePos] = useState(null);
  const [activeRenameChatId, setActiveRenameChatId] = useState(null);
  const [renameParticles, setRenameParticles] = useState([]);
  const [checkmarkActive, setCheckmarkActive] = useState(false);

  // Share animation state overrides
  const [shareState, setShareState] = useState(null); // null, 'noticing', 'holding', 'throwing', 'celebrating', 'catching', 'opening'
  const [shareOverridePos, setShareOverridePos] = useState(null);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [shareBubbleActive, setShareBubbleActive] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const [shareFailureBubble, setShareFailureBubble] = useState(false);
  const [shareCloseBubble, setShareCloseBubble] = useState(false);

  // New ShareEnvelope states
  const [shareEnvelopeState, setShareEnvelopeState] = useState(null);
  const [shareEnvelopeNotice, setShareEnvelopeNotice] = useState(false);
  const [shareEnvelopePos, setShareEnvelopePos] = useState(null);
  const [shareEnvelopeSuccessBubble, setShareEnvelopeSuccessBubble] = useState(false);
  const shareEnvelopeStateRef = useRef(null);
  useEffect(() => { shareEnvelopeStateRef.current = shareEnvelopeState; }, [shareEnvelopeState]);

  const renameStateRef = useRef(null);
  const renameOverridePosRef = useRef(null);
  useEffect(() => { renameStateRef.current = renameState; }, [renameState]);
  useEffect(() => { renameOverridePosRef.current = renameOverridePos; }, [renameOverridePos]);

  // Track component mounted lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activeAnimateRef.current) {
        activeAnimateRef.current.stop();
      }
    };
  }, []);

  // Initialize welcome bubble once user is authenticated and chat component mounts
  useEffect(() => {
    const welcomeShown = sessionStorage.getItem("byte_welcome_shown");
    if (currentUser && !welcomeShown && welcomeState === "idle") {
      setWelcomeState("waiting");
    }
  }, [currentUser, welcomeState, setWelcomeState]);

  // Compute duration dynamically based on travel distance to maintain constant velocity
  const getVelocityDuration = (startX, startY, endX, endY, baseSpeed = 1000) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0.18, Math.min(0.8, distance / baseSpeed)); // Clamped between 180ms and 800ms
  };

  // Promise wrapper around Framer Motion animate for clean async timeline flow
  const animatePromise = (from, to, options) => {
    return new Promise((resolve) => {
      const controls = animate(from, to, {
        ...options,
        onComplete: () => {
          if (options.onComplete) options.onComplete();
          resolve();
        }
      });
      activeAnimateRef.current = controls;
    });
  };

  // Helper to play optional audio effects
  const playSound = useCallback((soundName) => {
    if (typeof window !== "undefined" && window.ByteAudio?.play) {
      window.ByteAudio.play(soundName);
    }
  }, []);

  // Helper to animate chat item sucking towards Byte
  const animateChatVacuum = useCallback((chatId, byteX, byteY, itemX, itemY) => {
    const el = document.getElementById("chat-delete-clone-" + chatId);
    if (!el) return;

    playSound("vacuum");
    playSound("suction");

    const rect = el.getBoundingClientRect();
    const destX = byteX + 47.5 - rect.width / 2;
    const destY = byteY + 85 - rect.height / 2;

    // 1. Shake and compress (200ms)
    animate(el, {
      x: [0, -3, 3, -2, 2, 0],
      rotate: [0, -3, 3, -2, 2, 0],
      scale: 0.85,
    }, {
      duration: 0.2,
      ease: "easeInOut",
      onComplete: () => {
        // 2. Suction pull, stretch, shrink, fade out
        animate(el, {
          left: destX,
          top: destY,
          scaleX: 0.2,
          scaleY: 1.3,
          scale: 0.05,
          opacity: 0,
          rotate: 45,
        }, {
          duration: 0.5,
          ease: [0.25, 1, 0.5, 1],
        });
      }
    });
  }, [playSound]);

  // Synchronous sequential timeline for delete vacuum
  const runDeleteSequence = async (chatId, coords) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    setIsBusy(true);
    setCurrentTarget(chatId);
    setIsReturning(false);

    // Save starting home coordinates dynamically
    const element = document.querySelector(".byte-movement-container");
    const rect = element 
      ? element.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: rect.left, y: rect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);

    setDeleteCoords(coords);
    setActiveDeleteChatId(chatId);
    setDeleteOverridePos(origPos);

    // Create clone immediately as requested in Flow Step 3
    const cardEl = document.getElementById("chat-wheel-item-" + chatId) || document.getElementById("search-result-item-" + chatId);
    if (cardEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const clone = cardEl.cloneNode(true);
      clone.id = "chat-delete-clone-" + chatId;
      clone.style.position = "fixed";
      clone.style.left = cardRect.left + "px";
      clone.style.top = cardRect.top + "px";
      clone.style.width = cardRect.width + "px";
      clone.style.height = cardRect.height + "px";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      clone.style.margin = "0";
      clone.style.transform = "none";
      clone.style.transition = "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease, filter 0.45s ease";
      document.body.appendChild(clone);
    }

    // Step 4: Byte notices the delete request
    setDeleteState("noticing");
    setDeleteNotice(true);
    playSound("pop");
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDeleteNotice(false);

    if (!isMountedRef.current) return;

    // Step 5: Byte walks to the chat
    setDeleteState("go_to_chat");

    const startX = rect.left;
    const startY = rect.top;
    const endX = coords.x - 47.5 + 40; 
    const endY = coords.y - 120;

    const flyDuration = getVelocityDuration(startX, startY, endX, endY, 1000);

    // MOVE_TO_CHAT
    await animatePromise(0, 1, {
      duration: flyDuration,
      ease: [0.645, 0.045, 0.355, 1], // easeInOutCubic
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setDeleteOverridePos({
          x: startX + (endX - startX) * latest,
          y: startY + (endY - startY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    // Step 6 & 7: VACUUM
    setDeleteState("vacuuming");
    DeleteEvents.publish(DeleteEvents.BYTE_REACHED, { chatId });

    animateChatVacuum(chatId, endX, endY, coords.x, coords.y);

    const interval = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(interval);
        return;
      }
      const pStartX = coords.x - endX - 20 + Math.random() * 40;
      const pStartY = coords.y - endY - 10 + Math.random() * 20;
      const targetX = 47.5;
      const targetY = 85;

      const angle = Math.random() * Math.PI * 2;
      const midX = (pStartX + targetX) / 2 + Math.cos(angle) * 45;
      const midY = (pStartY + targetY) / 2 + Math.sin(angle) * 45;

      const isSparkle = Math.random() > 0.65;
      const color = Math.random() > 0.5 ? "#79f8ff" : "#3B82F6";
      const size = isSparkle ? (4 + Math.random() * 5) : (3 + Math.random() * 4);

      setParticles((prev) => [
        ...prev,
        {
          id: Math.random(),
          xKeyframes: [pStartX, midX, targetX],
          yKeyframes: [pStartY, midY, targetY],
          scale: 1 + Math.random() * 1.5,
          size,
          color,
          isSparkle,
        }
      ]);
    }, 40);

    await new Promise((resolve) => setTimeout(resolve, 750));

    clearInterval(interval);
    if (!isMountedRef.current) return;

    setParticles([]);
    playSound("pop");

    // Step 8: Remove temporary clone
    const clone = document.getElementById("chat-delete-clone-" + chatId);
    if (clone) clone.remove();

    // Step 9: Execute existing delete logic (UI removal)
    DeleteEvents.publish(DeleteEvents.DELETE_CHAT_STORED, { chatId });

    // Step 10: Byte pats the vacuum compartment
    setDeleteState("patting");
    playSound("pop"); // slight pat sound effect
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!isMountedRef.current) return;

    // Step 11: Show speech bubble "Stored safely!"
    setDeleteBubbleActive(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setDeleteBubbleActive(false);

    if (!isMountedRef.current) return;

    // RETURN_HOME
    setDeleteState("return_home");
    setIsReturning(true);
    setCurrentTarget(null);

    const currentX = endX;
    const currentY = endY;
    const homeX = origPos.x;
    const homeY = origPos.y;

    const returnDuration = getVelocityDuration(currentX, currentY, homeX, homeY, 1000);

    await animatePromise(0, 1, {
      duration: returnDuration,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setDeleteOverridePos({
          x: currentX + (homeX - currentX) * latest,
          y: currentY + (homeY - currentY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    // Reset delete states
    setDeleteState(null);
    setDeleteOverridePos(null);
    setActiveDeleteChatId(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);

    setIsBusy(false);
    setIsReturning(false);
    isBusyRef.current = false;
    DeleteEvents.publish(DeleteEvents.DELETE_SEQUENCE_COMPLETE, { chatId });
  };

  const spawnSteamPuff = (x, y) => {
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // upward cone
      const speed = 1.0 + Math.random() * 2.5;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 5 + Math.random() * 6,
        opacity: 0.7,
      });
    }
    setSteamParticles(newParticles);
  };

  const createPopOutClone = (chatId, title, startX, startY) => {
    const clone = document.createElement("div");
    clone.id = "chat-undo-clone-" + chatId;
    clone.style.position = "fixed";
    clone.style.left = startX + "px";
    clone.style.top = startY + "px";
    clone.style.width = "220px";
    clone.style.height = "44px";
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    clone.style.display = "flex";
    clone.style.alignItems = "center";
    clone.style.opacity = "0";
    clone.style.transform = "scale(0.2)";

    // Add circle icon
    const circle = document.createElement("div");
    circle.style.width = "44px";
    circle.style.height = "44px";
    circle.style.borderRadius = "50%";
    circle.style.display = "flex";
    circle.style.alignItems = "center";
    circle.style.justifyContent = "center";
    circle.style.border = darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)";
    circle.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    circle.style.color = darkMode ? "#79f8ff" : "#1F2937";
    circle.innerHTML = `
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
      </svg>
    `;
    clone.appendChild(circle);

    // Add title text
    const textDiv = document.createElement("div");
    textDiv.style.marginLeft = "16px";
    textDiv.style.color = darkMode ? "#79f8ff" : "#1F2937";
    textDiv.style.fontFamily = "Inter, sans-serif";
    textDiv.style.fontSize = "14px";
    textDiv.style.fontWeight = "600";
    textDiv.style.whiteSpace = "nowrap";
    textDiv.style.overflow = "hidden";
    textDiv.style.textOverflow = "ellipsis";
    textDiv.innerText = title || "Untitled Chat";
    clone.appendChild(textDiv);

    document.body.appendChild(clone);
  };

  const runUndoSequence = async (chatId, title, origCoords) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);
    setCurrentTarget(chatId);
    setIsReturning(false);

    // Save starting home coordinates dynamically
    const element = document.querySelector(".byte-movement-container");
    const rect = element 
      ? element.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: rect.left, y: rect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);

    // 1. Notice the undo request
    setUndoState("noticing");
    setUndoNotice(true);
    playSound("pop");
    await new Promise((resolve) => setTimeout(resolve, 300));
    setUndoNotice(false);

    if (!isMountedRef.current) return;

    // 2. Walk to the center of the sidebar
    setUndoState("go_to_center");
    const startX = rect.left;
    const startY = rect.top;
    const centerTargetX = 160 - 47.5;
    const centerTargetY = window.innerHeight / 2 - 70;

    const durationCenter = getVelocityDuration(startX, startY, centerTargetX, centerTargetY, 1200);

    setUndoOverridePos(origPos);

    await animatePromise(0, 1, {
      duration: durationCenter,
      ease: [0.645, 0.045, 0.355, 1], // easeInOutCubic
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setUndoOverridePos({
          x: startX + (centerTargetX - startX) * latest,
          y: startY + (centerTargetY - startY) * latest,
        });
      }
    });

    if (!isMountedRef.current) return;

    // 3. Open the vacuum compartment
    setUndoState("opening_compartment");
    
    // 4. Steam puff animation
    const byteX = centerTargetX;
    const byteY = centerTargetY;
    spawnSteamPuff(47.5, 85);
    playSound("vacuum");

    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!isMountedRef.current) return;

    // 5. POP effect & pop out clone
    playSound("pop");

    const cloneX = byteX + 47.5 - 110;
    const cloneY = byteY + 85 - 22;
    createPopOutClone(chatId, title, cloneX, cloneY);

    const cloneEl = document.getElementById("chat-undo-clone-" + chatId);
    if (cloneEl) {
      animate(cloneEl, {
        top: cloneY - 40,
        scale: 1,
        opacity: 1,
        rotate: [-10, 10, 0],
      }, {
        duration: 0.45,
        ease: "easeOut",
      });
    }

    // Byte catches it
    setUndoState("catching_chat");
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!isMountedRef.current) return;

    // 6. Walk to Recent Chats section (origCoords)
    setUndoState("go_to_chat");
    const currentX = centerTargetX;
    const currentY = centerTargetY;
    
    const destX = origCoords.x - 47.5 + 40;
    const destY = origCoords.y - 120;

    const durationDest = getVelocityDuration(currentX, currentY, destX, destY, 1200);

    const cloneStartTop = cloneY - 40;
    await animatePromise(0, 1, {
      duration: durationDest,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        const curByteX = currentX + (destX - currentX) * latest;
        const curByteY = currentY + (destY - currentY) * latest;
        setUndoOverridePos({ x: curByteX, y: curByteY });

        if (cloneEl) {
          cloneEl.style.left = (curByteX + 47.5 - 110) + "px";
          cloneEl.style.top = (cloneStartTop + (destY - currentY) * latest) + "px";
        }
      }
    });

    if (!isMountedRef.current) return;

    // 7. Place chat card
    setUndoState("placing_chat");
    if (cloneEl) {
      animate(cloneEl, {
        left: origCoords.x - 110,
        top: origCoords.y - 22,
        scale: [1, 1.15, 1],
      }, {
        duration: 0.35,
        ease: "easeOut",
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    if (!isMountedRef.current) return;

    // 8. Fade clone
    if (cloneEl) {
      animate(cloneEl, {
        opacity: 0,
      }, {
        duration: 0.25,
        onComplete: () => {
          cloneEl.remove();
        }
      });
    }

    DeleteEvents.publish(DeleteEvents.DELETE_CHAT_RESTORED, { chatId });

    // 9. Show speech bubble
    setUndoState("celebrating");
    setUndoBubbleActive(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUndoBubbleActive(false);

    if (!isMountedRef.current) return;

    // 10. Walk back home
    setUndoState("return_home");
    setIsReturning(true);
    setCurrentTarget(null);

    const homeX = origPos.x;
    const homeY = origPos.y;
    const returnDuration = getVelocityDuration(destX, destY, homeX, homeY, 1200);

    await animatePromise(0, 1, {
      duration: returnDuration,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setUndoOverridePos({
          x: destX + (homeX - destX) * latest,
          y: destY + (homeY - destY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    setUndoState(null);
    setUndoOverridePos(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);
    setIsBusy(false);
    setIsReturning(false);
    isBusyRef.current = false;
    DeleteEvents.publish(DeleteEvents.UNDO_SEQUENCE_COMPLETE, { chatId });
  };

  const runTimeoutSequence = async (chatId) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);
    setIsReturning(false);

    const element = document.querySelector(".byte-movement-container");
    const rect = element 
      ? element.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: rect.left, y: rect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);

    // 1. Look at vacuum
    setUndoState("looking_vacuum");
    playSound("pop");
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!isMountedRef.current) return;

    // 2. Open compartment slightly
    setUndoState("opening_compartment_slightly");

    // 3. Small recycle icon appears
    setRecycleActive(true);

    // 4. Tiny particles dissolve
    const numParticles = 8;
    const newParticles = [];
    for (let i = 0; i < numParticles; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const speed = 1.0 + Math.random() * 2.0;
      newParticles.push({
        id: Math.random(),
        x: 47.5,
        y: 85,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: "#10B981",
        opacity: 0.9,
      });
    }
    setDissolveParticles(newParticles);
    playSound("suction");

    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!isMountedRef.current) return;

    setRecycleActive(false);
    setDissolveParticles([]);

    // 5. Close vacuum & speech bubble: "Recycled!"
    setUndoState("closing_vacuum");
    setRecycledBubbleActive(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRecycledBubbleActive(false);

    if (!isMountedRef.current) return;

    // Fire completion event
    DeleteEvents.publish(DeleteEvents.BYTE_VACUUM_COMPLETE, { chatId });

    // Reset states
    setUndoState(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);
    setIsBusy(false);
    isBusyRef.current = false;
  };

  // Synchronous sequential timeline for rename flow
  const runRenameSequence = async (chatId, coords) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);
    setCurrentTarget(chatId);
    setIsReturning(false);

    const element = document.querySelector(".byte-movement-container");
    const rect = element 
      ? element.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: rect.left, y: rect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);

    setRenameCoords(coords);
    setActiveRenameChatId(chatId);
    setRenameState("noticing");
    setRenameOverridePos(origPos);

    // Wait a moment to notice
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (!isMountedRef.current) return;

    setRenameState("go_to_chat");

    const startX = rect.left;
    const startY = rect.top;
    const endX = coords.x + 32; 
    const endY = coords.y - 34;

    const flyDuration = getVelocityDuration(startX, startY, endX, endY, 1000);

    // MOVE_TO_TITLE
    await animatePromise(0, 1, {
      duration: flyDuration,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setRenameOverridePos({
          x: startX + (endX - startX) * latest,
          y: startY + (endY - startY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    setRenameState("editing");
    RenameEvents.publish(RenameEvents.BYTE_REACHED, { chatId });
  };

  const runRenameConfirmSequence = async (chatId) => {
    if (renameStateRef.current !== "editing") return;
    setRenameState("finish_rename");
    playSound("pop");
    setCheckmarkActive(true);

    await new Promise((resolve) => setTimeout(resolve, 600));
    if (!isMountedRef.current) return;

    setCheckmarkActive(false);
    setRenameParticles([]);

    // RETURN_HOME
    setRenameState("return_home");
    setIsReturning(true);
    setCurrentTarget(null);

    const currentX = renameOverridePosRef.current?.x ?? (window.innerWidth - 110);
    const currentY = renameOverridePosRef.current?.y ?? (window.innerHeight - 185);
    const homeX = savedPositionRef.current?.x ?? (window.innerWidth - 110);
    const homeY = savedPositionRef.current?.y ?? (window.innerHeight - 185);

    const returnDuration = getVelocityDuration(currentX, currentY, homeX, homeY, 1000);

    await animatePromise(0, 1, {
      duration: returnDuration,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setRenameOverridePos({
          x: currentX + (homeX - currentX) * latest,
          y: currentY + (homeY - currentY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    setRenameState(null);
    setRenameOverridePos(null);
    setActiveRenameChatId(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);

    setIsBusy(false);
    setIsReturning(false);
    isBusyRef.current = false;
    RenameEvents.publish(RenameEvents.COMPLETE);
  };

  const runRenameCancelSequence = async () => {
    if (renameStateRef.current !== "editing" && renameStateRef.current !== "go_to_chat" && renameStateRef.current !== "noticing") return;

    setRenameParticles([]);
    setRenameState("return_home");
    setIsReturning(true);
    setCurrentTarget(null);

    const currentX = renameOverridePosRef.current?.x ?? (window.innerWidth - 110);
    const currentY = renameOverridePosRef.current?.y ?? (window.innerHeight - 185);
    const homeX = savedPositionRef.current?.x ?? (window.innerWidth - 110);
    const homeY = savedPositionRef.current?.y ?? (window.innerHeight - 185);

    const returnDuration = getVelocityDuration(currentX, currentY, homeX, homeY, 1000);

    await animatePromise(0, 1, {
      duration: returnDuration,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setRenameOverridePos({
          x: currentX + (homeX - currentX) * latest,
          y: currentY + (homeY - currentY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    setRenameState(null);
    setRenameOverridePos(null);
    setActiveRenameChatId(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);

    setIsBusy(false);
    setIsReturning(false);
    isBusyRef.current = false;
    RenameEvents.publish(RenameEvents.COMPLETE);
  };

  // Synchronous share outgoing courier sequence
  const runShareSequence = async (shareCoords, onThrow) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);

    const byteElement = document.querySelector(".byte-movement-container");
    const byteRect = byteElement 
      ? byteElement.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: byteRect.left, y: byteRect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);
    setShareOverridePos(origPos);

    // 1. Notice the share request
    setShareState("noticing");
    setShareNotice(true);
    playSound("pop");
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!isMountedRef.current) return;
    setShareNotice(false);

    // 2. Holographic envelope materializes
    setShareState("holding");
    setShowEnvelope(true);
    await new Promise((resolve) => setTimeout(resolve, 650));

    if (!isMountedRef.current) return;

    // 3. Perform small wind-up and throw animation (facing left/forward)
    await animatePromise(0, 1, {
      duration: 350,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setShareOverridePos({
          x: origPos.x - latest * 15,
          y: origPos.y - latest * 20
        });
      }
    });

    if (!isMountedRef.current) return;

    // Trigger canvas flight of the paper airplane
    setShowEnvelope(false);
    onThrow();

    // 4. Return Byte smoothly to base coordinates
    await animatePromise(0, 1, {
      duration: 250,
      ease: "easeIn",
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setShareOverridePos({
          x: (origPos.x - 15) + latest * 15,
          y: (origPos.y - 20) + latest * 20
        });
      }
    });

    if (!isMountedRef.current) return;

    // 5. Celebrate and return to idle
    setShareState("celebrating");
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!isMountedRef.current) return;

    setShareState(null);
    setShareOverridePos(null);
    setIsBusy(false);
    isBusyRef.current = false;
  };

  // Synchronous share close/return envelope courier sequence
  const runShareCloseSequence = async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);

    const byteElement = document.querySelector(".byte-movement-container");
    const byteRect = byteElement 
      ? byteElement.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: byteRect.left, y: byteRect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);
    setShareOverridePos(origPos);

    // Prepares to catch
    setShareState("catching");

    // Wait for envelope to return (flight takes 1000ms, wait 900ms)
    await new Promise((resolve) => setTimeout(resolve, 900));

    if (!isMountedRef.current) return;

    // Catch the envelope
    playSound("pop");
    setShowEnvelope(true);
    setShareState("holding");
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!isMountedRef.current) return;

    // Envelope disappears
    setShowEnvelope(false);
    setShareState(null);

    // Byte smiles and says "Ready whenever you need me."
    setShareCloseBubble(true);
    setShareState("celebrating");
    
    await new Promise((resolve) => setTimeout(resolve, 2500));

    if (!isMountedRef.current) return;

    setShareCloseBubble(false);
    setShareState(null);
    setShareOverridePos(null);
    setIsBusy(false);
    isBusyRef.current = false;
  };

  // Synchronous share landing courier sequence
  const runShareLandSequence = async (onUnfold) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);

    const byteElement = document.querySelector(".byte-movement-container");
    const byteRect = byteElement 
      ? byteElement.getBoundingClientRect() 
      : { left: window.innerWidth - 130, top: window.innerHeight - 200 };

    const origPos = { x: byteRect.left, y: byteRect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);
    setShareOverridePos(origPos);

    // 1. Reaching up to catch the airplane
    setShareState("catching");
    
    // Wait for the swoop animation (takes 1200ms, wait 1100ms)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    if (!isMountedRef.current) return;

    // 2. Catch the envelope
    playSound("pop");
    setShowEnvelope(true);
    setShareState("holding");
    await new Promise((resolve) => setTimeout(resolve, 550));

    if (!isMountedRef.current) return;

    // 3. Opening envelope
    setShareState("opening");
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!isMountedRef.current) return;

    // 4. Unfold conversation & say delivered
    setShowEnvelope(false);
    onUnfold();
    
    setShareBubbleActive(true);
    setShareState("celebrating");
    
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!isMountedRef.current) return;

    // 5. Reset to idle
    setShareBubbleActive(false);
    setShareState(null);
    setShareOverridePos(null);
    setIsBusy(false);
    isBusyRef.current = false;
  };

  // Synchronous sequential timeline for archive flow
  const runArchiveSequence = async (chatId, coords) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    setIsBusy(true);
    setCurrentTarget(chatId);
    setIsReturning(false);

    // Save starting home coordinates dynamically
    const byteElement = document.querySelector(".byte-movement-container");
    const byteRect = byteElement 
      ? byteElement.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: byteRect.left, y: byteRect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);

    setArchiveCoords(coords);
    setActiveArchiveChatId(chatId);
    setArchiveState("go_to_chat");
    setArchiveOverridePos(origPos);

    const grabElement = document.getElementById("chat-wheel-item-" + chatId) || document.getElementById("search-result-item-" + chatId);
    const rect = grabElement 
      ? grabElement.getBoundingClientRect() 
      : { left: coords.x - 22, top: coords.y - 22, width: 44, height: 44 };

    const startX = byteRect.left;
    const startY = byteRect.top;
    const targetX = rect.left + rect.width / 2 - 47.5;
    const targetY = rect.top + rect.height / 2 - 45;

    // Clone element immediately at TRIGGER to keep the original card invisible from the start
    let clone = null;
    if (grabElement) {
      const grabRect = grabElement.getBoundingClientRect();
      clone = grabElement.cloneNode(true);
      clone.id = "chat-archive-clone-" + chatId;
      clone.style.position = "fixed";
      clone.style.left = grabRect.left + "px";
      clone.style.top = grabRect.top + "px";
      clone.style.width = grabRect.width + "px";
      clone.style.height = grabRect.height + "px";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      clone.style.margin = "0";
      clone.style.transform = "none";
      clone.style.visibility = "visible";
      document.body.appendChild(clone);
      
      grabElement.style.visibility = "hidden";
    }

    const flyDuration = getVelocityDuration(startX, startY, targetX, targetY, 1200);

    // MOVE_TO_CHAT
    await animatePromise(0, 1, {
      duration: flyDuration,
      ease: [0.1, 0.8, 0.2, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setArchiveOverridePos({
          x: startX + (targetX - startX) * latest,
          y: startY + (targetY - startY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    // GRAB_CHAT
    setArchiveState("grabbing_chat");
    ArchiveEvents.publish(ArchiveEvents.BYTE_REACHED, { chatId });

    await new Promise((resolve) => setTimeout(resolve, 10));
    if (!isMountedRef.current) return;

    // CARRY_CHAT
    setArchiveState("carrying_chat");
    ArchiveEvents.publish(ArchiveEvents.BYTE_GRABBED, { chatId });

    const boxElement = document.getElementById("archive-box-button");
    const boxRect = boxElement 
      ? boxElement.getBoundingClientRect() 
      : { left: window.innerWidth / 2, top: 20, width: 38, height: 38 };

    const boxCenterX = boxRect.left + boxRect.width / 2;
    const boxCenterY = boxRect.top + boxRect.height / 2;
    
    const carryStartX = targetX;
    const carryStartY = targetY;
    const destByteX = boxCenterX - 47.5;
    const destByteY = boxCenterY - 45;

    const carryDuration = getVelocityDuration(carryStartX, carryStartY, destByteX, destByteY, 1000);

    await animatePromise(0, 1, {
      duration: carryDuration,
      ease: [0.1, 0.8, 0.2, 1],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        const currentByteX = carryStartX + (destByteX - carryStartX) * latest;
        const currentByteY = carryStartY + (destByteY - carryStartY) * latest;
        
        const bounce = Math.sin(latest * Math.PI * 4) * 12;
        const swingAngle = Math.sin(latest * Math.PI * 4) * 8;
        
        setArchiveOverridePos({
          x: currentByteX,
          y: currentByteY + bounce
        });
        
        if (clone) {
          clone.style.left = (currentByteX + 25.5) + "px";
          clone.style.top = (currentByteY + 23 + bounce) + "px";
          clone.style.transform = `rotate(${swingAngle}deg)`;
        }
      }
    });

    if (!isMountedRef.current) return;

    // PLACE_CHAT
    setArchiveState("placing_chat");
    ArchiveEvents.publish(ArchiveEvents.ARCHIVE_BOX_OPEN, { chatId });

    if (clone) {
      const cloneStartLeft = parseFloat(clone.style.left);
      const cloneStartTop = parseFloat(clone.style.top);
      const cloneStartWidth = rect.width;
      const cloneStartHeight = rect.height;

      await animatePromise(0, 1, {
        duration: 0.18,
        ease: [0.645, 0.045, 0.355, 1],
        onUpdate: (val) => {
          const currentLeft = cloneStartLeft + (boxCenterX - (cloneStartLeft + cloneStartWidth / 2)) * val;
          const currentTop = cloneStartTop + (boxCenterY - (cloneStartTop + cloneStartHeight / 2)) * val;
          
          clone.style.left = currentLeft + "px";
          clone.style.top = currentTop + "px";
          clone.style.transform = `scale(${(1 - val) * 0.95}) rotate(${val * 35}deg)`;
          clone.style.opacity = 1 - val;
        }
      });

      clone.remove();
    }

    ArchiveEvents.publish(ArchiveEvents.PLACE_COMPLETE, { chatId });
    setArchiveState("celebrating");

    await new Promise((resolve) => setTimeout(resolve, 10));
    if (!isMountedRef.current) return;

    // RETURN_HOME
    setArchiveState("return_home");
    setIsReturning(true);
    setCurrentTarget(null);

    const startHomeX = destByteX;
    const startHomeY = destByteY;
    const endHomeX = origPos.x;
    const endHomeY = origPos.y;

    const returnDuration = getVelocityDuration(startHomeX, startHomeY, endHomeX, endHomeY, 1200);

    await animatePromise(0, 1, {
      duration: returnDuration,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (val) => {
        if (!isMountedRef.current) return;
        setArchiveOverridePos({
          x: startHomeX + (endHomeX - startHomeX) * val,
          y: startHomeY + (endHomeY - startHomeY) * val
        });
      }
    });

    if (!isMountedRef.current) return;

    // IDLE (Restore state)
    setArchiveState(null);
    setArchiveOverridePos(null);
    setActiveArchiveChatId(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);

    setIsBusy(false);
    setIsReturning(false);
    isBusyRef.current = false;

    ArchiveEvents.publish(ArchiveEvents.COMPLETE, { chatId });
  };

  const runRestoreSequence = async (chatId, title) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);
    setCurrentTarget(chatId);
    setIsReturning(false);

    // Save starting home coordinates dynamically
    const byteElement = document.querySelector(".byte-movement-container");
    const byteRect = byteElement 
      ? byteElement.getBoundingClientRect() 
      : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

    const origPos = { x: byteRect.left, y: byteRect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);

    setActiveRestoreChatId(chatId);
    setRestoreState("noticing");
    setRestoreOverridePos(origPos);

    // 1. Notice the restore request (Bubble '!' for 300ms, eyes look left)
    setRestoreNotice(true);
    playSound("pop");
    await new Promise((resolve) => setTimeout(resolve, 300));
    setRestoreNotice(false);

    if (!isMountedRef.current) return;
    setRestoreState("go_to_box");

    // Get Archive box position
    const boxElement = document.getElementById("archive-box-button");
    const boxRect = boxElement 
      ? boxElement.getBoundingClientRect() 
      : { left: 150, top: 15, width: 36, height: 36 };

    const boxCenterX = boxRect.left + boxRect.width / 2;
    const boxCenterY = boxRect.top + boxRect.height / 2;

    const startX = byteRect.left;
    const startY = byteRect.top;
    
    // Byte position near Archive box (slightly below and centered)
    const targetByteX = boxCenterX - 47.5;
    const targetByteY = boxCenterY + 10;

    const flyDuration = getVelocityDuration(startX, startY, targetByteX, targetByteY, 1200);

    // 2. Walk smoothly to the Archive box
    await animatePromise(0, 1, {
      duration: flyDuration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        setRestoreOverridePos({
          x: startX + (targetByteX - startX) * latest,
          y: startY + (targetByteY - startY) * latest
        });
      }
    });

    if (!isMountedRef.current) return;

    // 3. Reached Archive box: open lid & subtle glow inside box
    setRestoreState("opening_box");
    ArchiveEvents.publish(ArchiveEvents.ARCHIVE_BOX_OPEN, { chatId });
    playSound("pop");

    // Wait 150ms for the lid to pop open
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (!isMountedRef.current) return;

    // 4. Archived chat card becomes visible inside the box (scale up from box center)
    const cloneWidth = 220;
    const cloneHeight = 42;
    const cloneStartX = boxCenterX - cloneWidth / 2;
    const cloneStartY = boxCenterY - cloneHeight / 2;

    let clone = document.createElement("div");
    clone.id = "chat-restore-clone-" + chatId;
    clone.style.position = "fixed";
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    clone.style.background = darkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)";
    clone.style.border = darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)";
    clone.style.borderRadius = "16px";
    clone.style.padding = "10px 16px";
    clone.style.width = `${cloneWidth}px`;
    clone.style.height = `${cloneHeight}px`;
    clone.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
    clone.style.display = "flex";
    clone.style.alignItems = "center";
    clone.style.gap = "12px";
    clone.style.color = darkMode ? "#ffffff" : "#111827";
    clone.style.fontFamily = "Inter, sans-serif";
    clone.style.fontSize = "13.5px";
    clone.style.opacity = "0";
    clone.style.transform = "scale(0.1)";
    clone.style.transformOrigin = "center center";
    clone.style.boxSizing = "border-box";

    // Icon
    const icon = document.createElement("span");
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${darkMode ? "#79f8ff" : "#2563eb"}"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    clone.appendChild(icon);

    // Title
    const textNode = document.createElement("span");
    textNode.innerText = title || "Restoring Chat";
    textNode.style.whiteSpace = "nowrap";
    textNode.style.overflow = "hidden";
    textNode.style.textOverflow = "ellipsis";
    textNode.style.fontWeight = "600";
    clone.appendChild(textNode);

    document.body.appendChild(clone);

    clone.style.left = `${cloneStartX}px`;
    clone.style.top = `${cloneStartY}px`;

    // Scale up the card
    await animatePromise(0, 1, {
      duration: 0.25,
      ease: "easeOut",
      onUpdate: (latest) => {
        clone.style.opacity = latest;
        clone.style.transform = `scale(${0.1 + 0.9 * latest})`;
      }
    });

    if (!isMountedRef.current) return;

    // 5. Byte reaches in and grabs the chat
    setRestoreState("grabbing_chat");
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (!isMountedRef.current) return;

    setRestoreState("carrying_chat");

    // Trigger placeholder creation in Recent Chats
    RestoreEvents.publish("restore-chat:show-placeholder", { chatId });

    // Wait a frame for placeholder element to render
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (!isMountedRef.current) return;

    // Get destination placeholder coordinates
    const placeholderEl = document.getElementById("restore-placeholder-element");
    let destByteX = origPos.x;
    let destByteY = origPos.y;

    let pRect = { left: window.innerWidth - 300, top: window.innerHeight - 300, width: 280, height: 50 };
    if (placeholderEl) {
      pRect = placeholderEl.getBoundingClientRect();
      destByteX = pRect.left + pRect.width / 2 - 47.5;
      destByteY = pRect.top + pRect.height / 2 - 80; // Byte floating slightly above/centered on the slot
    } else {
      const recentHeader = document.querySelector(".ai-sidebar");
      if (recentHeader) {
        const rRect = recentHeader.getBoundingClientRect();
        pRect = { left: rRect.left + 20, top: rRect.top + 120, width: 280, height: 50 };
        destByteX = pRect.left + pRect.width / 2 - 47.5;
        destByteY = pRect.top - 20;
      }
    }

    const carryStartX = targetByteX;
    const carryStartY = targetByteY;
    const carryDuration = getVelocityDuration(carryStartX, carryStartY, destByteX, destByteY, 1000);

    // 6. Byte walks to Recent Chats carrying the card
    await animatePromise(0, 1, {
      duration: carryDuration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (latest) => {
        if (!isMountedRef.current) return;
        const currentByteX = carryStartX + (destByteX - carryStartX) * latest;
        const currentByteY = carryStartY + (destByteY - carryStartY) * latest;
        
        const bounce = Math.sin(latest * Math.PI * 4) * 8;
        const swingAngle = Math.sin(latest * Math.PI * 4) * 4;

        setRestoreOverridePos({
          x: currentByteX,
          y: currentByteY + bounce
        });

        if (clone) {
          clone.style.left = `${currentByteX + 47.5 - cloneWidth / 2}px`;
          clone.style.top = `${currentByteY + 70 + bounce}px`;
          clone.style.transform = `rotate(${swingAngle}deg)`;
        }
      }
    });

    if (!isMountedRef.current) return;

    // 7. Byte places the chat card into Recent Chats placeholder
    setRestoreState("placing_chat");

    const cardDestX = pRect.left + pRect.width / 2 - cloneWidth / 2;
    const cardDestY = pRect.top + pRect.height / 2 - cloneHeight / 2;
    const cardStartX = parseFloat(clone.style.left);
    const cardStartY = parseFloat(clone.style.top);

    // Animate the card into the slot with a small bounce
    await animatePromise(0, 1, {
      duration: 0.35,
      ease: [0.175, 0.885, 0.32, 1.1], // spring/bounce easing
      onUpdate: (latest) => {
        if (!clone) return;
        clone.style.left = `${cardStartX + (cardDestX - cardStartX) * latest}px`;
        clone.style.top = `${cardStartY + (cardDestY - cardStartY) * latest}px`;
        clone.style.transform = `scale(${1 + 0.05 * (1 - latest)})`;
      }
    });

    if (clone) {
      await animate(clone, {
        y: [0, 4, -2, 0],
      }, {
        duration: 0.25,
        ease: "easeOut"
      });
    }

    // 8. Trigger the actual restore operation and close the box
    RestoreEvents.publish(RestoreEvents.ARCHIVE_RESTORE_COMPLETE, { chatId });
    ArchiveEvents.publish(ArchiveEvents.PLACE_COMPLETE, { chatId }); // closes ArchiveBox
    RestoreEvents.publish("restore-chat:hide-placeholder");

    // Remove the clone immediately
    if (clone) {
      clone.remove();
      clone = null;
    }

    setRestoreState("celebrating");
    playSound("pop");

    // Look at restored chat
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Show "Restored!" speech bubble
    setRestoreBubble(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRestoreBubble(false);

    if (!isMountedRef.current) return;

    // 9. Byte returns home
    setRestoreState("return_home");
    setIsReturning(true);
    setCurrentTarget(null);

    const currentX = destByteX;
    const currentY = destByteY;
    const homeX = origPos.x;
    const homeY = origPos.y;
    const returnDuration = getVelocityDuration(currentX, currentY, homeX, homeY, 1200);

    await animatePromise(0, 1, {
      duration: returnDuration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (val) => {
        if (!isMountedRef.current) return;
        setRestoreOverridePos({
          x: currentX + (homeX - currentX) * val,
          y: currentY + (homeY - currentY) * val
        });
      }
    });

    if (!isMountedRef.current) return;

    // Reset all restore-related local state
    setRestoreState(null);
    setRestoreOverridePos(null);
    setActiveRestoreChatId(null);
    savedPositionRef.current = null;
    setOriginalPosition(null);

    setIsBusy(false);
    setIsReturning(false);
    isBusyRef.current = false;
    RestoreEvents.publish(RestoreEvents.RESTORE_SEQUENCE_COMPLETE, { chatId });
  };

  // Subscribe to theme, delete, and archive triggers
  useEffect(() => {
    const unsubBytePos = ThemeEvents.subscribe("theme-pull:byte-pos", ({ x, y, rotate }) => {
      if (ropeStateRef.current === "go_to_rope" || ropeStateRef.current === "grab_rope" || ropeStateRef.current === "pull_rope") {
        setRopeOverridePos({ x, y, rotate });
      }
    });

    const unsubTrigger = ThemeEvents.subscribe(ThemeEvents.TRIGGER, (coords) => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      setIsBusy(true);

      const element = document.querySelector(".byte-movement-container");
      const rect = element 
        ? element.getBoundingClientRect() 
        : { left: window.innerWidth - 110, top: window.innerHeight - 185 };

      const origPos = { x: rect.left, y: rect.top };
      savedPositionRef.current = origPos;
      setOriginalPosition(origPos);
      
      const targetRopeCoords = { x: coords.x, y: coords.y + 190 }; // Natural length is 190
      setRopeCoords(targetRopeCoords);
      setRopeState("noticing"); // Byte notices the rope first
    });

    const unsubRopeDropped = ThemeEvents.subscribe(ThemeEvents.ROPE_DROPPED, () => {
      setRopeState("go_to_rope");

      const startX = savedPositionRef.current?.x ?? (window.innerWidth - 110);
      const startY = savedPositionRef.current?.y ?? (window.innerHeight - 185);
      const endTargetX = ropeCoords.x;
      const endTargetY = ropeCoords.y;

      const startTargetX = startX + 47.5;
      const startTargetY = startY + 34;

      const duration = getVelocityDuration(startX, startY, endTargetX - 47.5, endTargetY - 34, 1200);

      ropeAnimRef.current = animate(0, 1, {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        onUpdate: (latest) => {
          const curTargetX = startTargetX + (endTargetX - startTargetX) * latest;
          const curTargetY = startTargetY + (endTargetY - startTargetY) * latest;
          ThemeEvents.publish("theme-pull:target-pos", { x: curTargetX, y: curTargetY });
        },
        onComplete: () => {
          ropeAnimRef.current = null;
          setRopeState("grab_rope");
          ThemeEvents.publish(ThemeEvents.BYTE_REACHED);
        }
      });
    });

    const unsubThemeChanged = ThemeEvents.subscribe(ThemeEvents.THEME_CHANGED, () => {
      setRopeState("return_home");

      // Use actual overridden position as starting point of return-home walk to prevent snapping
      const startX = ropeOverridePosRef.current?.x ?? (ropeCoords.x - 47.5);
      const startY = ropeOverridePosRef.current?.y ?? (ropeCoords.y - 34 + 80);
      const endX = savedPositionRef.current?.x ?? (window.innerWidth - 110);
      const endY = savedPositionRef.current?.y ?? (window.innerHeight - 185);

      const duration = getVelocityDuration(startX, startY, endX, endY, 1200);

      ropeAnimRef.current = animate(0, 1, {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        onUpdate: (latest) => {
          const currentX = startX + (endX - startX) * latest;
          const currentY = startY + (endY - startY) * latest;
          setRopeOverridePos({ x: currentX, y: currentY, rotate: 0 });
        },
        onComplete: () => {
          ropeAnimRef.current = null;
          setRopeState(null);
          setRopeOverridePos(null);
          savedPositionRef.current = null;
          setOriginalPosition(null);
          isBusyRef.current = false;
          setIsBusy(false);
          ThemeEvents.publish(ThemeEvents.COMPLETE);
        }
      });
    });

    const unsubDelete = DeleteEvents.subscribe(DeleteEvents.TRIGGER, ({ chatId, coords }) => {
      runDeleteSequence(chatId, coords);
    });

    const unsubUndo = DeleteEvents.subscribe(DeleteEvents.DELETE_CHAT_UNDO, (data) => {
      if (data && data.chatId) {
        runUndoSequence(data.chatId, data.title, data.coords);
      }
    });

    const unsubTimeout = DeleteEvents.subscribe(DeleteEvents.DELETE_CHAT_TIMEOUT, (data) => {
      if (data && data.chatId) {
        runTimeoutSequence(data.chatId);
      }
    });

    const unsubArchive = ArchiveEvents.subscribe(ArchiveEvents.TRIGGER, ({ chatId, coords }) => {
      runArchiveSequence(chatId, coords);
    });

    const unsubRestore = RestoreEvents.subscribe(RestoreEvents.TRIGGER_ANIMATION, ({ chatId, title }) => {
      runRestoreSequence(chatId, title);
    });

    const unsubRenameTrigger = RenameEvents.subscribe(RenameEvents.TRIGGER, ({ chatId, coords }) => {
      runRenameSequence(chatId, coords);
    });

    const unsubRenameConfirm = RenameEvents.subscribe(RenameEvents.CONFIRM, ({ chatId }) => {
      runRenameConfirmSequence(chatId);
    });

    const unsubRenameCancel = RenameEvents.subscribe(RenameEvents.CANCEL, () => {
      runRenameCancelSequence();
    });

    const unsubShareReady = ShareEvents.subscribe(ShareEvents.SHARE_LINK_READY, ({ shareUrl, shareCoords }) => {
      // Find current position of Byte
      const byteEl = document.querySelector(".byte-movement-container");
      let bytePos = { x: window.innerWidth - 110, y: window.innerHeight - 180 };
      if (byteEl) {
        const rect = byteEl.getBoundingClientRect();
        bytePos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }

      // Play noticing, materialize, and throw animation. Once thrown, publish ENVELOPE_THROWN event
      runShareSequence(shareCoords, () => {
        ShareEvents.publish(ShareEvents.ENVELOPE_THROWN, {
          byteCoords: bytePos,
          shareUrl,
        });
      });
    });

    const unsubShareLand = ShareEvents.subscribe(ShareEvents.LAND_ANIMATION, ({ onUnfold }) => {
      runShareLandSequence(onUnfold);
    });

    const unsubShareFailure = ShareEvents.subscribe(ShareEvents.SHARE_GENERATION_FAILED, () => {
      setShareFailureBubble(true);
      setTimeout(() => {
        setShareFailureBubble(false);
      }, 3000);
    });

    const unsubShareReturn = ShareEvents.subscribe(ShareEvents.ENVELOPE_RETURN_REQUEST, () => {
      runShareCloseSequence();
    });

    return () => {
      unsubBytePos();
      unsubTrigger();
      unsubRopeDropped();
      unsubThemeChanged();
      unsubDelete();
      unsubUndo();
      unsubTimeout();
      unsubArchive();
      unsubRestore();
      unsubRenameTrigger();
      unsubRenameConfirm();
      unsubRenameCancel();
      unsubShareReady();
      unsubShareLand();
      unsubShareFailure();
      unsubShareReturn();
      
      if (ropeAnimRef.current) {
        ropeAnimRef.current.stop();
      }
      const deleteClones = document.querySelectorAll('[id^="chat-delete-clone-"]');
      deleteClones.forEach((c) => c.remove());
      const archiveClones = document.querySelectorAll('[id^="chat-archive-clone-"]');
      archiveClones.forEach((c) => c.remove());
      const restoreClones = document.querySelectorAll('[id^="chat-restore-clone-"]');
      restoreClones.forEach((c) => c.remove());
      const undoClones = document.querySelectorAll('[id^="chat-undo-clone-"]');
      undoClones.forEach((c) => c.remove());
    };
  }, [ropeCoords]);

  useEffect(() => {
    const handleUpdateByteState = (data) => {
      const { phase, byteOffset, byteRotate } = data;
      if (phase === "sync-hand") return;
      
      setShareEnvelopeState(phase);

      if (phase === "noticing" || phase === "reaching" || phase === "windup" || phase === "returning" || phase === "catching" || phase === "catching_dissolve") {
        isBusyRef.current = true;
        setIsBusy(true);
      }

      if (phase === "noticing") {
        setShareEnvelopeNotice(true);
      } else if (phase === "reaching") {
        setShareEnvelopeNotice(false);
      } else if (phase === "windup" || phase === "returning") {
        setShareEnvelopeNotice(false);
        const basePos = overridePosition || { x: window.innerWidth - 110, y: window.innerHeight - 180 };
        setShareEnvelopePos({
          x: basePos.x + (byteOffset?.x || 0),
          y: basePos.y + (byteOffset?.y || 0),
          rotate: byteRotate || 0,
        });
      } else if (phase === "success") {
        setShareEnvelopeNotice(false);
        setShareEnvelopeSuccessBubble(true);
        isBusyRef.current = true;
        setIsBusy(true);
        playSound("pop");
        setTimeout(() => {
          setShareEnvelopeSuccessBubble(false);
          setShareEnvelopeState(null);
          // Broadcast complete global reset
          ShareEnvelopeEvents.publish(ShareEnvelopeEvents.RESET_ANIMATION);
        }, 2500);
      } else if (phase === "idle" || phase === null) {
        setShareEnvelopeNotice(false);
        setShareEnvelopeState(null);
        setShareEnvelopePos(null);
        if (!window.ShareEnvelopeAnimationActive) {
          isBusyRef.current = false;
          setIsBusy(false);
        }
      }
    };

    const handleReset = () => {
      setShareEnvelopeState(null);
      setShareEnvelopeNotice(false);
      setShareEnvelopeSuccessBubble(false);
      setShareEnvelopePos(null);
      isBusyRef.current = false;
      setIsBusy(false);
      
      // Restore focus to the main input box if available
      const chatInput = document.querySelector("textarea");
      if (chatInput) {
        chatInput.focus();
      }
    };

    const unsub = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.UPDATE_BYTE_STATE, handleUpdateByteState);
    const unsubReset = ShareEnvelopeEvents.subscribe(ShareEnvelopeEvents.RESET_ANIMATION, handleReset);
    return () => {
      unsub();
      unsubReset();
    };
  }, [overridePosition]);

  // Update rope and Byte targets dynamically on window resize
  useEffect(() => {
    const handleResize = () => {
      if (ropeState && ropeState !== "return_home") {
        const themeButton = document.querySelector('[aria-label="Toggle theme"]');
        if (themeButton) {
          const rect = themeButton.getBoundingClientRect();
          const newX = rect.left + rect.width / 2;
          const newY = rect.bottom + 95;
          
          setRopeCoords({ x: newX, y: newY });
          
          if (ropeState === "grab_rope" || ropeState === "pull_rope") {
            setRopeOverridePos({
              x: newX - 47.5,
              y: newY - 34 + (ropeState === "pull_rope" ? pullOffset : 0)
            });
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ropeState, pullOffset]);

  // Transition from grab_rope to pull_rope
  useEffect(() => {
    if (ropeState === "grab_rope") {
      const timer = setTimeout(() => {
        setRopeState("pull_rope");
        ThemeEvents.publish(ThemeEvents.BYTE_GRABBED);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ropeState]);

  // Spawns cyan writing sparkles while editing (disabled)
  useEffect(() => {
    if (renameState === "editing") {
      // Sparkles disabled
    }
  }, [renameState]);

  // Execute actual theme rope pull downward pull animation
  useEffect(() => {
    if (ropeState === "pull_rope") {
      const startTargetX = ropeCoords.x;
      const startTargetY = ropeCoords.y;

      const controls = animate(0, 80, {
        duration: 1.0,
        ease: "easeInOut",
        onUpdate: (latest) => {
          setPullOffset(latest);
          ThemeEvents.publish("theme-pull:target-pos", { x: startTargetX, y: startTargetY + latest });
          ThemeEvents.publish("theme-pull:pull-update", latest);
        },
        onComplete: () => {
          setTimeout(() => {
            ThemeEvents.publish(ThemeEvents.BYTE_PULLED);
          }, 200);
        }
      });
      return () => controls.stop();
    }
  }, [ropeState, ropeCoords]);

  // Monitor isGenerating changes to trigger celebrate/happy bounce animation on message complete
  useEffect(() => {
    if (prevIsGenerating.current === true && isGenerating === false && !welcomeActive) {
      setCelebrate(true);
      const timer = setTimeout(() => {
        setCelebrate(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, welcomeActive]);

  // Activity tracking for Rocket idle animation
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isBusyRef.current && !welcomeActive && !isGenerating && !rocketState) {
        resetRocketTimer();
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    
    resetRocketTimer();

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (rocketTimerRef.current) clearTimeout(rocketTimerRef.current);
    };
  }, [welcomeActive, isGenerating, rocketState]);

  const resetRocketTimer = () => {
    if (rocketTimerRef.current) {
      clearTimeout(rocketTimerRef.current);
    }
    const delay = 22000 + Math.random() * 6000; // 22–28 seconds
    rocketTimerRef.current = setTimeout(() => {
      if (!isBusyRef.current && !welcomeActive && !isGenerating && !rocketState) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= 20000) {
          triggerRocketSequence();
        } else {
          resetRocketTimer();
        }
      } else {
        resetRocketTimer();
      }
    }, delay);
  };

  // Rocket booster exhaust smoke/spark particles loop
  useEffect(() => {
    if (!rocketState || rocketState === "noticing") {
      setRocketParticles([]);
      return;
    }

    let active = true;
    let frameId;

    const tick = () => {
      if (!active) return;

      const byteEl = document.querySelector(".byte-movement-container");
      if (byteEl) {
        const rect = byteEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setRocketParticles((prev) => {
          let next = [...prev];
          
          // Spawn thruster particles if actively flying
          if (["igniting", "flying", "carrying", "returning_icon", "flying_home"].includes(rocketState)) {
            const spawnCount = rocketState === "igniting" ? 2 : 4;
            for (let i = 0; i < spawnCount; i++) {
              const isSmoke = Math.random() > 0.45;
              const isSpark = !isSmoke && Math.random() > 0.3;
              const type = isSmoke ? "smoke" : (isSpark ? "spark" : "flame");
              
              const thrusterX = Math.random() > 0.5 ? (centerX - 24) : (centerX + 24);
              const thrusterY = centerY + 36;

              next.push({
                id: Math.random(),
                x: thrusterX,
                y: thrusterY,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 1.5 + Math.random() * 3.5,
                size: type === "smoke" ? (4 + Math.random() * 8) : (2 + Math.random() * 3),
                alpha: 1,
                decay: type === "smoke" ? (0.02 + Math.random() * 0.02) : (0.03 + Math.random() * 0.04),
                type
              });
            }

            // Periodically spawn heat distortion
            if (Math.random() < 0.25 && rocketState !== "igniting") {
              const thrusterX = Math.random() > 0.5 ? (centerX - 24) : (centerX + 24);
              next.push({
                id: Math.random(),
                x: thrusterX,
                y: centerY + 42,
                vx: (Math.random() - 0.5) * 0.6,
                vy: 1.0 + Math.random() * 2.0,
                size: 15 + Math.random() * 10,
                alpha: 0.9,
                decay: 0.06,
                type: "distortion"
              });
            }
          }

          next = next
            .map((p) => {
              let vx = p.vx || 0;
              let vy = p.vy || 0;
              if (p.type === "landing-dust") {
                vy -= 0.04;
                vx *= 0.96;
              } else if (p.type === "smoke") {
                vy -= 0.06; // smoke drifts upward naturally
                vx *= 0.96;
              } else if (p.type === "bubble") {
                // drift floaty bubbles with a bit of wave
                vx += Math.sin(Date.now() * 0.005 + p.id) * 0.05;
                vy *= 0.98;
              }
              return {
                ...p,
                x: p.x + vx,
                y: p.y + vy,
                vx,
                vy,
                alpha: p.alpha - p.decay,
                size: p.type === "smoke" || p.type === "landing-dust" ? p.size + 0.25 : (p.type === "distortion" ? p.size + 0.5 : p.size * 0.95),
              };
            })
            .filter((p) => p.alpha > 0);

          if (next.length > 120) {
            next = next.slice(next.length - 120);
          }

          return next;
        });
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [rocketState]);

  const triggerRocketSequence = async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);

    const selectors = [
      '[aria-label="Toggle theme"]',
      '[aria-label="Share chat"]',
      '[aria-label="New Chat"]',
      '#chat-wheel-item-archived'
    ];
    
    const availableSelectors = selectors.filter(s => document.querySelector(s) !== null);
    if (availableSelectors.length === 0) {
      isBusyRef.current = false;
      setIsBusy(false);
      resetRocketTimer();
      return;
    }

    const selectedSelector = availableSelectors[Math.floor(Math.random() * availableSelectors.length)];
    const element = document.querySelector(selectedSelector);
    if (!element) {
      isBusyRef.current = false;
      setIsBusy(false);
      resetRocketTimer();
      return;
    }

    setRocketSelectedSelector(selectedSelector);

    const byteElement = document.querySelector(".byte-movement-container");
    const byteRect = byteElement 
      ? byteElement.getBoundingClientRect() 
      : { left: window.innerWidth - 130, top: window.innerHeight - 200 };

    const origPos = { x: byteRect.left, y: byteRect.top };
    savedPositionRef.current = origPos;
    setOriginalPosition(origPos);
    
    const elemRect = element.getBoundingClientRect();
    const targetPos = {
      x: elemRect.left + elemRect.width / 2,
      y: elemRect.top + elemRect.height / 2
    };
    setRocketTargetPos(targetPos);

    let animationCancelled = false;
    const cancelAnimation = () => {
      animationCancelled = true;
    };

    const handleIconClick = (e) => {
      if (element.contains(e.target)) {
        cancelAnimation();
      }
    };
    window.addEventListener("click", handleIconClick, true);

    const isCancelled = () => animationCancelled || !isMountedRef.current;

    let clone = null;
    let flashlightBeam = null;

    try {
      // Direction detection (left vs right)
      const isLeft = targetPos.x < origPos.x;

      // 1. Look at targeted icon first & unfold booster pack (200ms)
      setRocketState("noticing");
      setRocketExpression("focused");
      playSound("lock");
      
      // Energize the original icon
      element.classList.add("icon-glow-active");

      await animatePromise(0, 1, {
        duration: 0.2,
        ease: "easeOut",
        onUpdate: (t) => {
          if (isCancelled()) return;
          setRocketOverridePos({
            x: origPos.x,
            y: origPos.y,
            rotate: 0
          });
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      // 2. Rocket Booster Ignition (300ms)
      // Body shakes, anticipation crouch, ignites slowly
      setRocketState("igniting");
      setRocketExpression("determined");
      playSound("ignite");
      
      const homeX = origPos.x;
      const homeY = origPos.y;

      await animatePromise(0, 1, {
        duration: 0.4, // stronger 400ms anticipation
        ease: "easeOut",
        onUpdate: (t) => {
          if (isCancelled()) return;
          
          // Anticipation crouch (crouch down and slightly opposite to flight direction)
          const crouchAmt = Math.sin(t * Math.PI) * 15;
          const crouchX = isLeft ? crouchAmt * 0.55 : -crouchAmt * 0.55;
          
          setRocketOverridePos({
            x: homeX + crouchX,
            y: homeY + crouchAmt,
            rotate: isLeft ? crouchAmt * 0.95 : -crouchAmt * 0.95
          });

          // Body shakes escalate quadratically up to 6.5px max offset
          setCameraShake({
            x: (Math.random() - 0.5) * 6.5 * t * t,
            y: (Math.random() - 0.5) * 6.5 * t * t
          });
        }
      });
      setCameraShake({ x: 0, y: 0 });
      if (isCancelled()) throw new Error("cancelled");

      // 3. Fly to Icon (700ms) - Bezier path with overshoot
      setRocketState("flying");
      setRocketExpression("happy");
      playSound("whoosh");

      const startX = origPos.x;
      const startY = origPos.y;
      const destX = targetPos.x - 47.5;
      const destY = targetPos.y - 45; // fly centered to icon

      const midX = (startX + destX) / 2;
      const controlX = midX + (startY - destY) * 0.25 + (Math.random() - 0.5) * 80;
      const controlY = Math.min(startY, destY) - 120 + (Math.random() - 0.5) * 50;

      await animatePromise(0, 1, {
        duration: 0.7,
        ease: [0.34, 1.56, 0.64, 1], // overshoot Bezier
        onUpdate: (t) => {
          if (isCancelled()) return;
          const mt = 1 - t;
          const currentX = mt * mt * startX + 2 * mt * t * controlX + t * t * destX;
          const currentY = mt * mt * startY + 2 * mt * t * controlY + t * t * destY;

          // Body tilts in direction of velocity tangent
          const tangentX = 2 * mt * (controlX - startX) + 2 * t * (destX - controlX);
          const tangentY = 2 * mt * (controlY - startY) + 2 * t * (destY - controlY);
          const angle = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
          const tilt = Math.max(-25, Math.min(25, angle * 0.6));

          setRocketOverridePos({
            x: currentX,
            y: currentY,
            rotate: tilt
          });
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      // 4. Grab & Pull Icon with Elastic Stretch (300ms grab + 150ms pop)
      setRocketState("grabbing");
      setRocketGesture("reach-up");
      setRocketExpression("determined");
      playSound("magnetic");

      const origRect = element.getBoundingClientRect();
      clone = element.cloneNode(true);
      clone.id = "byte-rocket-clone";
      clone.className += " icon-glow-active";
      clone.style.position = "fixed";
      clone.style.left = `${origRect.left}px`;
      clone.style.top = `${origRect.top}px`;
      clone.style.width = `${origRect.width}px`;
      clone.style.height = `${origRect.height}px`;
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.zIndex = "100000";
      clone.style.pointerEvents = "none";
      clone.style.transition = "none";
      document.body.appendChild(clone);

      // Hide original icon immediately
      element.style.opacity = "0";
      element.style.pointerEvents = "auto";

      // Elastic pull displacement vector calculation
      const dirX = destX + 47.5 - (origRect.left + origRect.width / 2);
      const dirY = destY + 45 - (origRect.top + origRect.height / 2);
      const distance = Math.sqrt(dirX * dirX + dirY * dirY);
      const ndX = dirX / (distance || 1);
      const ndY = dirY / (distance || 1);

      await animatePromise(0, 1, {
        duration: 0.3,
        ease: [0.55, 0.085, 0.68, 0.53], // high tension easeIn
        onUpdate: (t) => {
          if (isCancelled() || !clone) return;
          const pullDist = t * 18;
          const stretchX = 1 + t * 0.35;
          const stretchY = 1 - t * 0.18;
          clone.style.left = `${origRect.left + ndX * pullDist}px`;
          clone.style.top = `${origRect.top + ndY * pullDist}px`;
          const angle = Math.atan2(ndY, ndX) * 180 / Math.PI;
          clone.style.transform = `rotate(${angle * t * 0.12}deg) scaleX(${stretchX}) scaleY(${stretchY})`;
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      playSound("pop");
      if (clone) {
        // Elastic "boing" release overshoot bounce using damped sine wave
        await animatePromise(0, 1, {
          duration: 0.25,
          ease: "easeOut",
          onUpdate: (t) => {
            if (isCancelled() || !clone) return;
            const decay = Math.exp(-t * 6);
            const boingVal = Math.sin(t * Math.PI * 5) * 0.25 * decay;
            const scaleX = 1.2 + boingVal;
            const scaleY = 0.8 - boingVal;
            clone.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
          }
        });
        if (clone) clone.style.transform = "scale(1) rotate(0deg)";
      }
      if (isCancelled()) throw new Error("cancelled");

      // 5. Carry Back carrying clone (700ms)
      setRocketState("carrying");
      setRocketExpression("laughing");
      setRocketGesture("none");

      const carryStartX = destX;
      const carryStartY = destY;

      const backMidX = (carryStartX + homeX) / 2;
      const backControlX = backMidX - (carryStartY - homeY) * 0.2 + (Math.random() - 0.5) * 60;
      const backControlY = Math.min(carryStartY, homeY) - 100 + (Math.random() - 0.5) * 40;

      await animatePromise(0, 1, {
        duration: 0.7,
        ease: [0.34, 1.56, 0.64, 1], // overshoot Bezier
        onUpdate: (t) => {
          if (isCancelled()) return;
          const mt = 1 - t;
          const currentX = mt * mt * carryStartX + 2 * mt * t * backControlX + t * t * homeX;
          const currentY = mt * mt * carryStartY + 2 * mt * t * backControlY + t * t * homeY;

          const tangentX = 2 * mt * (backControlX - carryStartX) + 2 * t * (homeX - backControlX);
          const tangentY = 2 * mt * (backControlY - carryStartY) + 2 * t * (homeY - backControlY);
          const angle = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
          const tilt = Math.max(-25, Math.min(25, angle * 0.6));

          setRocketOverridePos({
            x: currentX,
            y: currentY,
            rotate: tilt
          });

          if (clone) {
            // Icon swing physics
            const swingAngle = Math.sin(t * Math.PI * 4) * 10;
            clone.style.left = `${currentX + 47.5 - origRect.width / 2}px`;
            clone.style.top = `${currentY + 25 + Math.sin(t * Math.PI * 4) * 6}px`;
            clone.style.transform = `rotate(${swingAngle}deg)`;
          }
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      // 6. Land & Lose Balance (tumble backwards thud)
      setRocketState("losing_balance");
      setRocketExpression("oops");
      setRocketGesture("flail");
      playSound("pop"); // fallback thud

      // Spawn landing dust puff
      setRocketParticles((prev) => {
        const next = [...prev];
        for (let i = 0; i < 18; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 3.0;
          next.push({
            id: Math.random(),
            x: homeX + 47.5,
            y: homeY + 80,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            size: 8 + Math.random() * 12,
            alpha: 0.9,
            decay: 0.025 + Math.random() * 0.02,
            type: "landing-dust"
          });
        }
        return next;
      });

      // Tumble backwards thud animation
      await animatePromise(0, 1, {
        duration: 0.35,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (isCancelled()) return;
          setRocketOverridePos({
            x: homeX,
            y: homeY + latest * 22,
            rotate: latest * 100
          });
          if (clone) {
            clone.style.left = `${homeX + 47.5 - origRect.width / 2 + latest * 22}px`;
            clone.style.top = `${homeY + 25 + latest * 15}px`;
            clone.style.transform = `rotate(${latest * 60}deg)`;
          }
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      // Hold fallen position (antenna wiggles due to thud)
      setRocketExpression("oops");
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (isCancelled()) throw new Error("cancelled");

      // Stand up & recover upright
      setRocketExpression("happy");
      setRocketGesture("none");
      await animatePromise(0, 1, {
        duration: 0.45,
        ease: [0.175, 0.885, 0.32, 1.25], // spring recover
        onUpdate: (latest) => {
          if (isCancelled()) return;
          const val = 1 - latest;
          setRocketOverridePos({
            x: homeX,
            y: homeY + val * 22,
            rotate: val * 100
          });
          if (clone) {
            clone.style.left = `${homeX + 47.5 - origRect.width / 2}px`;
            clone.style.top = `${homeY + 25 + val * 15}px`;
            clone.style.transform = `rotate(${val * 60}deg)`;
          }
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      // 7. Interactive Play Animations (UNIQUE FOR EACH ICON)
      setRocketState("playing");

      if (selectedSelector === '[aria-label="New Chat"]') {
        // --- NEW CHAT PLAY ---
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const pathPoints = [
          { x: screenW * 0.2, y: screenH * 0.15 },
          { x: screenW * 0.75, y: screenH * 0.25 },
          { x: screenW * 0.4, y: screenH * 0.6 }
        ];

        setRocketExpression("surprised");
        playSound("whoosh");

        let currentCloneX = homeX + 47.5 - origRect.width / 2;
        let currentCloneY = homeY + 25;

        for (let step = 0; step < pathPoints.length; step++) {
          const pt = pathPoints[step];
          const startPtX = currentCloneX;
          const startPtY = currentCloneY;
          const duration = step === 0 ? 0.6 : (step === 1 ? 0.7 : 0.8);
          
          if (step === 2) {
            setRocketExpression("determined");
            setRocketGesture("reach-up");
          }

          await animatePromise(0, 1, {
            duration: duration,
            ease: step === 2 ? "easeIn" : "easeInOut",
            onUpdate: (t) => {
              if (isCancelled() || !clone) return;
              
              currentCloneX = startPtX + (pt.x - startPtX) * t;
              currentCloneY = startPtY + (pt.y - startPtY) * t;

              const dx = pt.x - startPtX;
              const dy = pt.y - startPtY;
              const speed = Math.sqrt(dx * dx + dy * dy) / 300;
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;

              clone.style.left = `${currentCloneX}px`;
              clone.style.top = `${currentCloneY}px`;
              clone.style.transform = `rotate(${angle}deg) scaleX(${1 + speed * 0.3}) scaleY(${1 - speed * 0.15})`;

              if (Math.random() < 0.8) {
                setRocketParticles((prev) => {
                  const next = [...prev];
                  const vx = -Math.cos(angle * Math.PI / 180) * 4;
                  const vy = -Math.sin(angle * Math.PI / 180) * 4;
                  next.push({
                    id: Math.random(),
                    x: currentCloneX + origRect.width / 2,
                    y: currentCloneY + origRect.height / 2,
                    vx: vx + (Math.random() - 0.5) * 1.5,
                    vy: vy + (Math.random() - 0.5) * 1.5,
                    size: 8 + Math.random() * 8,
                    alpha: 1.0,
                    decay: 0.04 + Math.random() * 0.04,
                    type: "sparkle",
                    angle: Math.random() * 360,
                    color: Math.random() > 0.4 ? "#79f8ff" : "#2563eb"
                  });
                  return next.slice(-120);
                });
              }

              if (step < 2) {
                const targetByteX = currentCloneX - 47.5 + origRect.width / 2;
                const targetByteY = currentCloneY + 40;
                setRocketOverridePos((prev) => {
                  if (!prev) return { x: homeX, y: homeY, rotate: 0 };
                  return {
                    x: prev.x + (targetByteX - prev.x) * 0.15,
                    y: prev.y + (targetByteY - prev.y) * 0.15,
                    rotate: (targetByteX - prev.x) * 0.2
                  };
                });
              } else {
                const targetByteX = pt.x - 47.5 + origRect.width / 2;
                const targetByteY = pt.y - 10;
                setRocketOverridePos((prev) => {
                  if (!prev) return { x: homeX, y: homeY, rotate: 0 };
                  return {
                    x: prev.x + (targetByteX - prev.x) * 0.22,
                    y: prev.y + (targetByteY - prev.y) * 0.22,
                    rotate: (targetByteX - prev.x) * 0.25
                  };
                });
              }
            }
          });
          if (isCancelled()) throw new Error("cancelled");
          
          playSound("pop");
          setRocketParticles((prev) => {
            const next = [...prev];
            const px = currentCloneX + origRect.width / 2;
            const py = currentCloneY + origRect.height / 2;
            for (let i = 0; i < 8; i++) {
              next.push({
                id: Math.random(),
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                size: 2 + Math.random() * 4,
                alpha: 1,
                decay: 0.04,
                type: "spark"
              });
            }
            return next;
          });
        }

        setRocketExpression("proud");
        setRocketGesture("none");
        if (clone) clone.style.transform = "scale(1.1) rotate(-10deg)";

        await animatePromise(0, 1, {
          duration: 0.8,
          ease: "easeInOut",
          onUpdate: (t) => {
            if (isCancelled()) return;
            setRocketOverridePos((prev) => {
              if (!prev) return { x: homeX, y: homeY, rotate: 0 };
              return {
                x: prev.x + (homeX - prev.x) * t,
                y: prev.y + (homeY - prev.y) * t,
                rotate: prev.rotate * (1 - t)
              };
            });
            if (clone) {
              clone.style.left = `${homeX + 47.5 - origRect.width / 2}px`;
              clone.style.top = `${homeY + 25}px`;
              clone.style.transform = `scale(1)`;
            }
          }
        });

      } else if (selectedSelector === '[aria-label="Toggle theme"]') {
        // --- THEME PLAY (Flashlight sweep) ---
        setRocketExpression("focused");
        setRocketGesture("none");

        flashlightBeam = document.createElement("div");
        flashlightBeam.className = "flashlight-beam-cone";
        flashlightBeam.style.position = "fixed";
        flashlightBeam.style.left = "0";
        flashlightBeam.style.top = "0";
        flashlightBeam.style.width = "100%";
        flashlightBeam.style.height = "100%";
        flashlightBeam.style.pointerEvents = "none";
        flashlightBeam.style.zIndex = "99998";
        flashlightBeam.innerHTML = `
          <svg width="100%" height="100%" style="overflow:visible;">
            <defs>
              <radialGradient id="beamSpot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(121, 248, 255, 0.45)" />
                <stop offset="50%" stop-color="rgba(121, 248, 255, 0.15)" />
                <stop offset="100%" stop-color="rgba(121, 248, 255, 0)" />
              </radialGradient>
              <linearGradient id="beamCone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(121, 248, 255, 0.4)" />
                <stop offset="100%" stop-color="rgba(121, 248, 255, 0)" />
              </linearGradient>
            </defs>
            <polygon id="conePoly" points="0,0 0,0 0,0" fill="url(#beamCone)" />
            <ellipse id="spotEl" cx="0" cy="0" rx="90" ry="60" fill="url(#beamSpot)" />
          </svg>
        `;
        document.body.appendChild(flashlightBeam);

        const conePoly = flashlightBeam.querySelector("#conePoly");
        const spotEl = flashlightBeam.querySelector("#spotEl");

        const sweepDirections = [
          { x: window.innerWidth * 0.2, y: window.innerHeight * 0.4 },
          { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3 },
          { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
        ];

        for (let i = 0; i < sweepDirections.length; i++) {
          const targetPt = sweepDirections[i];
          const startPtX = i === 0 ? homeX + 47.5 : sweepDirections[i - 1].x;
          const startPtY = i === 0 ? homeY + 40 : sweepDirections[i - 1].y;

          await animatePromise(0, 1, {
            duration: 0.5,
            ease: "easeInOut",
            onUpdate: (t) => {
              if (isCancelled() || !clone) return;
              
              const currentSpotX = startPtX + (targetPt.x - startPtX) * t;
              const currentSpotY = startPtY + (targetPt.y - startPtY) * t;
              const cloneX = homeX + 47.5;
              const cloneY = homeY + 40;

              const angle = Math.atan2(currentSpotY - cloneY, currentSpotX - cloneX) * 180 / Math.PI;
              clone.style.transform = `rotate(${angle - 90}deg)`;

              setRocketOverridePos({
                x: homeX,
                y: homeY,
                rotate: (currentSpotX - cloneX) * 0.03
              });

              const dx = currentSpotX - cloneX;
              const dy = currentSpotY - cloneY;
              const dist = Math.sqrt(dx*dx + dy*dy) || 1;
              const ux = dx / dist;
              const uy = dy / dist;
              const perpX = -uy;
              const perpY = ux;

              const c1x = cloneX;
              const c1y = cloneY;
              const c2x = currentSpotX - perpX * 80;
              const c2y = currentSpotY - perpY * 50;
              const c3x = currentSpotX + perpX * 80;
              const c3y = currentSpotY + perpY * 50;

              if (conePoly && spotEl) {
                conePoly.setAttribute("points", `${c1x},${c1y} ${c2x},${c2y} ${c3x},${c3y}`);
                spotEl.setAttribute("cx", currentSpotX);
                spotEl.setAttribute("cy", currentSpotY);
              }
            }
          });
          if (isCancelled()) throw new Error("cancelled");
        }

        if (flashlightBeam) {
          flashlightBeam.remove();
          flashlightBeam = null;
        }

        // Polish it
        setRocketExpression("laughing");
        playSound("magnetic");
        await animatePromise(0, 1, {
          duration: 1.0,
          ease: "linear",
          onUpdate: (t) => {
            if (isCancelled() || !clone) return;
            const offsetX = Math.sin(t * Math.PI * 18) * 10;
            clone.style.left = `${homeX + 47.5 - origRect.width / 2 + offsetX}px`;
            clone.style.top = `${homeY + 25}px`;
            clone.style.transform = `rotate(${offsetX * 2}deg)`;

            if (Math.random() < 0.3) {
              setRocketParticles((prev) => {
                const next = [...prev];
                next.push({
                  id: Math.random(),
                  x: homeX + 47.5 + offsetX + (Math.random() - 0.5) * 15,
                  y: homeY + 45 + (Math.random() - 0.5) * 15,
                  vx: (Math.random() - 0.5) * 2.5,
                  vy: (Math.random() - 0.5) * 2.5 - 1,
                  size: 6 + Math.random() * 6,
                  alpha: 1,
                  decay: 0.05,
                  type: "sparkle",
                  angle: Math.random() * 360,
                  color: "#FFEAA7"
                });
                return next.slice(-120);
              });
            }
          }
        });
        if (isCancelled()) throw new Error("cancelled");

        setRocketExpression("proud");
        if (clone) clone.style.transform = "scale(1.05)";
        await new Promise((resolve) => setTimeout(resolve, 500));

      } else if (selectedSelector === '[aria-label="Share chat"]') {
        // --- SHARE PLAY (Paper airplane loop) ---
        setRocketExpression("determined");
        setRocketGesture("none");

        if (clone) {
          clone.style.transition = "transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
          clone.style.transform = "scaleX(0.7) skewY(12deg) rotate(35deg)";
          await new Promise((resolve) => setTimeout(resolve, 250));
          clone.style.transition = "none";
        }

        playSound("whoosh");
        const startPtX = homeX + 47.5 - origRect.width / 2;
        const startPtY = homeY + 25;

        await animatePromise(0, 1, {
          duration: 1.8,
          ease: "easeInOut",
          onUpdate: (t) => {
            if (isCancelled() || !clone) return;

            const angle = t * Math.PI * 2;
            const currentCloneX = startPtX - 280 * Math.sin(angle);
            const currentCloneY = startPtY - 140 * Math.sin(angle * 2);

            const dx = -280 * Math.cos(angle);
            const dy = -280 * Math.cos(angle * 2);
            const moveAngle = Math.atan2(dy, dx) * 180 / Math.PI;

            clone.style.left = `${currentCloneX}px`;
            clone.style.top = `${currentCloneY}px`;
            clone.style.transform = `rotate(${moveAngle}deg) scaleX(0.7) skewY(8deg)`;

            if (Math.random() < 0.65) {
              setRocketParticles((prev) => {
                const next = [...prev];
                next.push({
                  id: Math.random(),
                  x: currentCloneX + origRect.width / 2,
                  y: currentCloneY + origRect.height / 2,
                  vx: (Math.random() - 0.5) * 1.0,
                  vy: (Math.random() - 0.5) * 1.0,
                  size: 4 + Math.random() * 4,
                  alpha: 0.8,
                  decay: 0.04,
                  type: "spark"
                });
                return next.slice(-120);
              });
            }

            setRocketOverridePos({
              x: homeX,
              y: homeY,
              rotate: Math.sin(angle) * 12
            });
            if (t > 0.4 && t < 0.8) {
              setRocketExpression("surprised");
            } else {
              setRocketExpression("happy");
            }
          }
        });
        if (isCancelled()) throw new Error("cancelled");

        playSound("pop");
        setRocketExpression("proud");
        if (clone) {
          clone.style.left = `${homeX + 47.5 - origRect.width / 2}px`;
          clone.style.top = `${homeY + 25}px`;
          clone.style.transition = "transform 0.25s ease";
          clone.style.transform = "scale(1) rotate(0deg)";
          await new Promise((resolve) => setTimeout(resolve, 250));
          clone.style.transition = "none";
        }

      } else {
        // --- ARCHIVE PLAY (Escaping chat bubbles) ---
        setRocketExpression("surprised");
        
        if (clone) {
          clone.style.transition = "transform 0.25s ease";
          clone.style.transform = "scale(1.25)";
          await new Promise((resolve) => setTimeout(resolve, 250));
          clone.style.transition = "none";
        }

        playSound("magnetic");

        const bubbles = [];
        const bubbleAngles = [Math.PI * 0.7, Math.PI * 0.4, Math.PI * 1.3, Math.PI * 1.6];
        
        setRocketParticles((prev) => {
          const next = [...prev];
          for (let i = 0; i < 4; i++) {
            const angle = bubbleAngles[i];
            const speed = 1.6 + Math.random() * 0.8;
            const b = {
              id: Math.random() + i,
              x: homeX + 47.5,
              y: homeY + 25,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 15,
              alpha: 1,
              decay: 0.001,
              type: "bubble"
            };
            bubbles.push(b);
            next.push(b);
          }
          return next;
        });

        setRocketExpression("oops");

        for (let i = 0; i < bubbles.length; i++) {
          const b = bubbles[i];
          const startByteX = i === 0 ? homeX : (rocketOverridePos ? rocketOverridePos.x : homeX);
          const startByteY = i === 0 ? homeY : (rocketOverridePos ? rocketOverridePos.y : homeY);

          await animatePromise(0, 1, {
            duration: 0.65,
            ease: "easeInOut",
            onUpdate: (t) => {
              if (isCancelled()) return;

              b.x += b.vx * 0.6;
              b.y += b.vy * 0.6;

              setRocketParticles((prev) => 
                prev.map(p => p.id === b.id ? { ...p, x: b.x, y: b.y } : p)
              );

              const destByteX = b.x - 47.5;
              const destByteY = b.y - 40;

              setRocketOverridePos({
                x: startByteX + (destByteX - startByteX) * t,
                y: startByteY + (destByteY - startByteY) * t,
                rotate: (destByteX - startByteX) * 0.15
              });
            }
          });
          if (isCancelled()) throw new Error("cancelled");

          playSound("pop");
          setRocketGesture("pat-chest");
          
          setRocketParticles((prev) => 
            prev.map(p => p.id === b.id ? { ...p, alpha: 0 } : p).filter(p => p.alpha > 0)
          );

          setRocketParticles((prev) => {
            const next = [...prev];
            for (let k = 0; k < 6; k++) {
              next.push({
                id: Math.random(),
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 3 + Math.random() * 3,
                alpha: 1,
                decay: 0.05,
                type: "spark"
              });
            }
            return next;
          });

          await new Promise((resolve) => setTimeout(resolve, 150));
          setRocketGesture("none");
        }

        setRocketExpression("happy");
        const currentPanicX = rocketOverridePos ? rocketOverridePos.x : homeX;
        const currentPanicY = rocketOverridePos ? rocketOverridePos.y : homeY;

        await animatePromise(0, 1, {
          duration: 0.6,
          ease: "easeInOut",
          onUpdate: (t) => {
            if (isCancelled()) return;
            setRocketOverridePos({
              x: currentPanicX + (homeX - currentPanicX) * t,
              y: currentPanicY + (homeY - currentPanicY) * t,
              rotate: 0
            });
            if (clone) {
              clone.style.left = `${homeX + 47.5 - origRect.width / 2}px`;
              clone.style.top = `${homeY + 25}px`;
            }
          }
        });

        if (clone) {
          clone.style.transition = "transform 0.2s ease";
          clone.style.transform = "scale(1)";
          await new Promise((resolve) => setTimeout(resolve, 200));
          clone.style.transition = "none";
        }
      }

      if (isCancelled()) throw new Error("cancelled");

      // 8. Return Icon back to Toolbar (decelerate perfectly, merge & snap bounce)
      setRocketState("returning_icon");
      setRocketExpression("happy");

      const returnStartX = homeX;
      const returnStartY = homeY;

      await animatePromise(0, 1, {
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1], // easeOutQuad decelerating
        onUpdate: (t) => {
          if (isCancelled()) return;
          const mt = 1 - t;
          const currentX = mt * mt * returnStartX + 2 * mt * t * backControlX + t * t * destX;
          const currentY = mt * mt * returnStartY + 2 * mt * t * backControlY + t * t * destY;

          const tangentX = 2 * mt * (backControlX - returnStartX) + 2 * t * (destX - backControlX);
          const tangentY = 2 * mt * (backControlY - returnStartY) + 2 * t * (destY - backControlY);
          const angle = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
          const tilt = Math.max(-20, Math.min(20, angle * 0.5));

          setRocketOverridePos({
            x: currentX,
            y: currentY,
            rotate: tilt
          });

          if (clone) {
            clone.style.left = `${currentX + (origRect.left - (currentX + 47.5 - origRect.width / 2)) * t + 47.5 - origRect.width / 2}px`;
            clone.style.top = `${currentY + (origRect.top - (currentY + 25)) * t + 25}px`;
            clone.style.transform = `scale(${1 + 0.1 * (1 - t)}) rotate(${15 * (1 - t)}deg)`;
          }
        }
      });
      if (isCancelled()) throw new Error("cancelled");

      playSound("pop");
      
      // Snap original back to layout with a scale bounce and fade
      if (clone) {
        clone.remove();
        clone = null;
      }

      if (element) {
        element.style.transition = "opacity 0.2s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        element.style.opacity = "1";
        element.style.transform = "scale(1.2)";
        setTimeout(() => {
          element.style.transform = "scale(1)";
        }, 150);

        // Transition glow to fade
        element.className = element.className.replace("icon-glow-active", "icon-glow-fade");
        setTimeout(() => {
          element.className = element.className.replace("icon-glow-fade", "").trim();
        }, 1500);
      }

      // Sparkle pop burst at original icon
      setRocketParticles((prev) => {
        const next = [...prev];
        for (let i = 0; i < 15; i++) {
          next.push({
            id: Math.random(),
            x: origRect.left + origRect.width / 2,
            y: origRect.top + origRect.height / 2,
            vx: (Math.random() - 0.5) * 3.5,
            vy: (Math.random() - 0.5) * 3.5,
            size: 6 + Math.random() * 8,
            alpha: 1,
            decay: 0.035,
            type: "sparkle",
            angle: Math.random() * 360,
            color: "#79f8ff"
          });
        }
        return next.slice(-120);
      });

      // 9. Return Home (700ms) with secondary motion antenna wobble
      setRocketState("flying_home");
      setRocketExpression("happy");

      await animatePromise(0, 1, {
        duration: 0.7,
        ease: [0.34, 1.56, 0.64, 1], // overshoot Bezier
        onUpdate: (t) => {
          if (isCancelled()) return;
          const mt = 1 - t;
          const currentX = mt * mt * destX + 2 * mt * t * controlX + t * t * homeX;
          const currentY = mt * mt * destY + 2 * mt * t * controlY + t * t * homeY;

          const tangentX = 2 * mt * (controlX - destX) + 2 * t * (homeX - controlX);
          const tangentY = 2 * mt * (controlY - destY) + 2 * t * (homeY - controlY);
          const angle = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
          const tilt = Math.max(-20, Math.min(20, angle * 0.5));

          setRocketOverridePos({
            x: currentX,
            y: currentY,
            rotate: tilt
          });
        }
      });

      // Settle antenna wobble
      setRocketExpression("happy");
      setRocketGesture("none");

    } catch (err) {
      console.log("Rocket sequence cancelled or error:", err);
    } finally {
      window.removeEventListener("click", handleIconClick, true);
      if (clone) {
        clone.remove();
      }
      if (flashlightBeam) {
        flashlightBeam.remove();
      }

      // Safeguard: Always restore original element styles!
      if (element) {
        element.style.opacity = "";
        element.style.pointerEvents = "";
        element.style.transform = "";
        element.style.transition = "";
        element.className = element.className.replace("icon-glow-active", "").replace("icon-glow-fade", "").trim();
      }

      setRocketState(null);
      setRocketOverridePos(null);
      setRocketTargetPos(null);
      setRocketSelectedSelector(null);
      setCameraShake({ x: 0, y: 0 });

      savedPositionRef.current = null;
      setOriginalPosition(null);
      setIsBusy(false);
      isBusyRef.current = false;
      
      resetRocketTimer();
    }
  };

  // Handle state changes from ByteMovement
  const handleStateChange = (state) => {
    setByteState(state);
  };

  // Determine actual state and expression for the robot
  let robotState = welcomeActive ? "float" : byteState;
  let finalExpression = expression;
  let finalGesture = welcomeActive ? gesture : "none";

  if (rocketState) {
    const isL = (rocketTargetPos && originalPosition) ? (rocketTargetPos.x < originalPosition.x) : true;
    const directionClass = isL ? "preflight-left" : "preflight-right";
    robotState = (rocketState === "igniting" || rocketState === "flying" || rocketState === "carrying" || rocketState === "returning_icon" || rocketState === "flying_home")
      ? "float rocket"
      : (rocketState === "noticing" ? `float preflight ${directionClass}` : "float");
    finalExpression = rocketExpression;
    finalGesture = rocketGesture;
  } else if (shareEnvelopeState) {
    robotState = shareEnvelopeState === "success" ? "happy" : "float";
    if (shareEnvelopeState === "noticing") {
      finalExpression = "look-left";
      finalGesture = "none";
    } else if (shareEnvelopeState === "reaching" || shareEnvelopeState === "windup" || shareEnvelopeState === "catching" || shareEnvelopeState === "catching_dissolve") {
      finalExpression = shareEnvelopeState === "windup" ? "thinking" : "happy";
      finalGesture = "reach-up";
    } else if (shareEnvelopeState === "success") {
      finalExpression = "happy";
      finalGesture = "wave";
    } else if (shareEnvelopeState === "returning") {
      finalExpression = "happy";
      finalGesture = "none";
    }
  } else if (shareState) {
    robotState = shareState === "celebrating" ? "happy" : "float";
    finalExpression = shareState === "celebrating" 
      ? "happy" 
      : (shareState === "noticing" ? "look-left" : "happy");
    
    if (shareState === "celebrating") {
      finalGesture = "wave";
    } else if (shareState === "holding" || shareState === "catching" || shareState === "opening") {
      finalGesture = "reach-up";
    } else {
      finalGesture = "none";
    }
  } else if (ropeState) {
    robotState = "float";
    if (ropeState === "noticing") {
      finalExpression = "look-left";
      finalGesture = "none";
    } else if (ropeState === "go_to_rope") {
      finalExpression = "happy";
      finalGesture = "none";
    } else if (ropeState === "grab_rope") {
      finalExpression = "surprised";
      finalGesture = "reach-up";
    } else if (ropeState === "pull_rope") {
      finalExpression = "thinking";
      finalGesture = "pull-rope";
    } else if (ropeState === "return_home") {
      finalExpression = "happy";
      finalGesture = "none";
    } else {
      finalExpression = "surprised";
      finalGesture = "none";
    }
  } else if (renameState) {
    robotState = "float";
    if (renameState === "noticing") {
      finalExpression = "look-left";
      finalGesture = "none";
    } else if (renameState === "go_to_chat") {
      finalExpression = "happy";
      finalGesture = "none";
    } else if (renameState === "editing") {
      finalExpression = "thinking";
      finalGesture = "reach-up";
    } else if (renameState === "finish_rename") {
      finalExpression = "happy";
      finalGesture = "wave";
    } else if (renameState === "return_home") {
      finalExpression = "happy";
      finalGesture = "none";
    } else {
      finalExpression = "happy";
      finalGesture = "none";
    }
  } else if (deleteState) {
    if (deleteState === "noticing") {
      robotState = "float";
      finalExpression = "look-left";
      finalGesture = "none";
    } else if (deleteState === "go_to_chat") {
      robotState = "float";
      finalExpression = "happy";
      finalGesture = "none";
    } else if (deleteState === "vacuuming") {
      robotState = "float";
      finalExpression = "thinking";
      finalGesture = "pull-rope";
    } else if (deleteState === "patting") {
      robotState = "float";
      finalExpression = "happy";
      finalGesture = "pat-chest";
    } else if (deleteState === "celebrating") {
      robotState = "happy";
      finalExpression = "happy";
      finalGesture = "wave";
    } else if (deleteState === "return_home") {
      robotState = "float";
      finalExpression = "happy";
      finalGesture = "none";
    } else {
      robotState = "float";
      finalExpression = "happy";
      finalGesture = "none";
    }
  } else if (undoState) {
    if (undoState === "noticing" || undoState === "looking_vacuum") {
      robotState = "float";
      finalExpression = "surprised";
      finalGesture = "none";
    } else if (undoState === "go_to_center" || undoState === "go_to_chat" || undoState === "return_home") {
      robotState = "float";
      finalExpression = "happy";
      finalGesture = "none";
    } else if (undoState === "opening_compartment" || undoState === "opening_compartment_slightly" || undoState === "catching_chat" || undoState === "placing_chat") {
      robotState = "float";
      finalExpression = "thinking";
      finalGesture = "reach-up";
    } else if (undoState === "celebrating") {
      robotState = "happy";
      finalExpression = "happy";
      finalGesture = "wave";
    } else {
      robotState = "float";
      finalExpression = "happy";
      finalGesture = "none";
    }
  } else if (archiveState) {
    robotState = archiveState === "celebrating" ? "happy" : "float";
    finalExpression = archiveState === "celebrating" ? "happy" : (archiveState === "placing_chat" ? "thinking" : "surprised");
    if (archiveState === "celebrating") {
      finalGesture = "wave";
    } else if (archiveState === "grabbing_chat" || archiveState === "carrying_chat" || archiveState === "placing_chat") {
      finalGesture = "reach-up";
    } else {
      finalGesture = "none";
    }
  } else if (restoreState) {
    robotState = restoreState === "celebrating" ? "happy" : "float";
    finalExpression = 
      restoreState === "noticing"
        ? "look-left"
        : (restoreState === "celebrating"
            ? "happy"
            : (restoreState === "placing_chat" || restoreState === "opening_box" ? "thinking" : "surprised"));
    if (restoreState === "celebrating") {
      finalGesture = "wave";
    } else if (restoreState === "grabbing_chat" || restoreState === "carrying_chat" || restoreState === "placing_chat") {
      finalGesture = "reach-up";
    } else {
      finalGesture = "none";
    }
  } else if (!welcomeActive) {
    if (celebrate) {
      robotState = "happy";
      finalExpression = "happy";
    } else if (isGenerating) {
      robotState = "thinking";
      finalExpression = "thinking";
    } else {
      finalExpression = "happy";
    }
  }
  // Override coordinates when interacting with the rope, deleting, archiving, renaming, or restoring chats
  const overridePositionToUse = shareEnvelopePos
    ? shareEnvelopePos
    : (ropeState
        ? ropeOverridePos
        : (deleteState 
            ? deleteOverridePos 
            : (archiveState 
                ? archiveOverridePos 
                : (renameState 
                    ? renameOverridePos 
                    : (restoreState 
                        ? restoreOverridePos 
                        : (undoState
                            ? undoOverridePos
                            : (shareState
                                ? shareOverridePos
                                : (rocketState
                                    ? rocketOverridePos
                                    : overridePosition))))))));

  const bubbleTextToUse = restoreBubble 
    ? "Restored!" 
    : (deleteBubbleActive 
        ? "Stored safely!" 
        : (undoBubbleActive 
            ? "Saved it just in time!" 
            : (recycledBubbleActive 
                ? "Recycled!" 
                : (shareBubbleActive
                     ? "Message delivered!"
                     : (shareEnvelopeSuccessBubble
                          ? "Delivered successfully!"
                          : (shareFailureBubble
                              ? "I couldn't prepare your letter."
                              : (shareCloseBubble
                                  ? "Your message is ready to send."
                                  : bubbleText)))))));

  const shouldShowBubble = 
    (showBubble && !ropeState && !deleteState && !archiveState && !renameState && !restoreState && !undoState && !shareState && typeof bubbleText === "string" && bubbleText.trim() !== "") ||
    restoreBubble || deleteBubbleActive || undoBubbleActive || recycledBubbleActive || shareBubbleActive || shareFailureBubble || shareCloseBubble || shareEnvelopeSuccessBubble;

  const [bubblePlacement, setBubblePlacement] = useState("left");

  useEffect(() => {
    if (!shouldShowBubble) return;

    const updatePlacement = () => {
      const container = document.querySelector(".byte-movement-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = rect.left;
      const y = rect.top;

      const bubbleWidth = 260;
      const bubbleHeight = 120;
      const spaceLeft = x;
      const spaceRight = window.innerWidth - (x + 95);
      const spaceTop = y;
      const spaceBottom = window.innerHeight - (y + 140);

      // Check left edge
      if (spaceLeft < bubbleWidth + 20) {
        if (spaceRight >= bubbleWidth + 20) {
          setBubblePlacement("right");
          return;
        }
      }
      // Check right edge
      if (spaceRight < bubbleWidth + 20) {
        if (spaceLeft >= bubbleWidth + 20) {
          setBubblePlacement("left");
          return;
        }
      }
      // Check top edge
      if (spaceTop < bubbleHeight + 20) {
        setBubblePlacement("bottom");
        return;
      }
      // Check bottom edge
      if (spaceBottom < bubbleHeight + 20) {
        setBubblePlacement("top");
        return;
      }
      
      setBubblePlacement("left");
    };

    updatePlacement();
    
    // Also track layout updates/resize
    window.addEventListener("resize", updatePlacement);
    const interval = setInterval(updatePlacement, 100);
    
    return () => {
      window.removeEventListener("resize", updatePlacement);
      clearInterval(interval);
    };
  }, [shouldShowBubble, overridePositionToUse]);

  // Compute bubble absolute wrapper style relative to Byte's container
  let wrapperStyle = {
    position: "absolute",
    zIndex: 10000,
    pointerEvents: "none",
  };
  if (bubblePlacement === "left") {
    wrapperStyle.right = "110%";
    wrapperStyle.top = "15px";
  } else if (bubblePlacement === "right") {
    wrapperStyle.left = "110%";
    wrapperStyle.top = "15px";
  } else if (bubblePlacement === "bottom") {
    wrapperStyle.top = "110%";
    wrapperStyle.left = "50%";
    wrapperStyle.transform = "translateX(-50%)";
  } else if (bubblePlacement === "top") {
    wrapperStyle.bottom = "110%";
    wrapperStyle.left = "50%";
    wrapperStyle.transform = "translateX(-50%)";
  }

  // Compute tail styles
  let tailStyle = {
    position: "absolute",
    width: "0",
    height: "0",
  };
  const tailColor = darkMode ? "rgba(30, 41, 59, 0.92)" : "rgba(255, 255, 255, 0.92)";
  
  if (bubblePlacement === "left") {
    tailStyle.right = "-8px";
    tailStyle.top = "24px";
    tailStyle.borderTop = "8px solid transparent";
    tailStyle.borderBottom = "8px solid transparent";
    tailStyle.borderLeft = `8px solid ${tailColor}`;
  } else if (bubblePlacement === "right") {
    tailStyle.left = "-8px";
    tailStyle.top = "24px";
    tailStyle.borderTop = "8px solid transparent";
    tailStyle.borderBottom = "8px solid transparent";
    tailStyle.borderRight = `8px solid ${tailColor}`;
  } else if (bubblePlacement === "bottom") {
    tailStyle.top = "-8px";
    tailStyle.left = "50%";
    tailStyle.transform = "translateX(-50%)";
    tailStyle.borderLeft = "8px solid transparent";
    tailStyle.borderRight = "8px solid transparent";
    tailStyle.borderBottom = `8px solid ${tailColor}`;
  } else if (bubblePlacement === "top") {
    tailStyle.bottom = "-8px";
    tailStyle.left = "50%";
    tailStyle.transform = "translateX(-50%)";
    tailStyle.borderLeft = "8px solid transparent";
    tailStyle.borderRight = "8px solid transparent";
    tailStyle.borderTop = `8px solid ${tailColor}`;
  }

  // Compute direction-based animations
  const bubbleMotionProps = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] }
  };
  
  if (bubblePlacement === "left") {
    bubbleMotionProps.initial.x = 15;
    bubbleMotionProps.animate.x = 0;
    bubbleMotionProps.exit.x = 15;
  } else if (bubblePlacement === "right") {
    bubbleMotionProps.initial.x = -15;
    bubbleMotionProps.animate.x = 0;
    bubbleMotionProps.exit.x = -15;
  } else if (bubblePlacement === "bottom") {
    bubbleMotionProps.initial.y = -15;
    bubbleMotionProps.animate.y = 0;
    bubbleMotionProps.exit.y = -15;
  } else if (bubblePlacement === "top") {
    bubbleMotionProps.initial.y = 15;
    bubbleMotionProps.animate.y = 0;
    bubbleMotionProps.exit.y = 15;
  }

  return (
    <>
      {/* Target Laser Overlay */}
      {rocketState === "noticing" && overridePositionToUse && rocketTargetPos && (
        <svg style={{ position: "fixed", inset: 0, zIndex: 99998, pointerEvents: "none" }}>
          <line
            x1={overridePositionToUse.x + 47.5}
            y1={overridePositionToUse.y + 40}
            x2={rocketTargetPos.x}
            y2={rocketTargetPos.y}
            stroke="#79f8ff"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            filter="drop-shadow(0 0 8px #79f8ff)"
          />
          <circle
            cx={rocketTargetPos.x}
            cy={rocketTargetPos.y}
            r="24"
            stroke="#79f8ff"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 4"
          />
        </svg>
      )}

      {/* Locked Target Label */}
      {rocketState === "noticing" && rocketTargetPos && (
        <Box
          sx={{
            position: "fixed",
            left: rocketTargetPos.x - 40,
            top: rocketTargetPos.y - 45,
            zIndex: 99999,
            background: "rgba(220, 38, 38, 0.95)",
            border: "1px solid #ef4444",
            borderRadius: "6px",
            px: 1,
            py: 0.25,
            boxShadow: "0 0 10px rgba(239, 68, 68, 0.6)",
            pointerEvents: "none"
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#ffffff", fontFamily: "monospace", letterSpacing: 0.5 }}>
            🎯 LOCKED
          </Typography>
        </Box>
      )}

      {/* Rocket Particles trail */}
      {rocketParticles.map((p) => {
        if (p.type === "distortion") {
          return (
            <div
              key={p.id}
              className="heat-distortion"
              style={{
                position: "fixed",
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                opacity: p.alpha,
                transform: "translate3d(-50%, -50%, 0)",
              }}
            />
          );
        }

        if (p.type === "sparkle") {
          return (
            <div
              key={p.id}
              style={{
                position: "fixed",
                left: p.x,
                top: p.y,
                fontSize: `${p.size}px`,
                color: p.color || "#79f8ff",
                opacity: p.alpha,
                textShadow: "0 0 6px rgba(121, 248, 255, 0.8)",
                zIndex: 99999,
                pointerEvents: "none",
                transform: `translate3d(-50%, -50%, 0) scale(${p.alpha}) rotate(${p.angle || 0}deg)`,
              }}
            >
              ✦
            </div>
          );
        }

        if (p.type === "bubble") {
          return (
            <div
              key={p.id}
              style={{
                position: "fixed",
                left: p.x,
                top: p.y,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: "50%",
                border: "1px solid rgba(121, 248, 255, 0.85)",
                background: "rgba(121, 248, 255, 0.22)",
                boxShadow: "0 0 8px rgba(121, 248, 255, 0.45)",
                opacity: p.alpha,
                zIndex: 99999,
                pointerEvents: "none",
                transform: "translate3d(-50%, -50%, 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "7px",
                color: "#ffffff"
              }}
            >
              💬
            </div>
          );
        }

        let color = "rgba(255,255,255,0.7)";
        let blur = "none";
        if (p.type === "smoke") {
          color = `rgba(235, 235, 240, ${p.alpha * 0.65})`;
          blur = "blur(5px)";
        } else if (p.type === "landing-dust") {
          color = `rgba(215, 215, 220, ${p.alpha * 0.55})`;
          blur = "blur(6px)";
        } else if (p.type === "spark") {
          color = `rgba(121, 248, 255, ${p.alpha})`;
          blur = "blur(0.5px)";
        } else if (p.type === "flame") {
          color = Math.random() > 0.5 ? `rgba(48, 229, 255, ${p.alpha})` : `rgba(37, 99, 235, ${p.alpha})`;
          blur = "blur(2px)";
        }

        return (
          <div
            key={p.id}
            style={{
              position: "fixed",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              filter: blur,
              zIndex: 99997,
              pointerEvents: "none",
              transform: "translate3d(-50%, -50%, 0)"
            }}
          />
        );
      })}

      <ByteMovement
        overridePosition={overridePositionToUse}
        onStateChange={handleStateChange}
        onPointerDown={() => {
          if (welcomeActive) cancelWelcome();
        }}
      >
      <div 
        className={deleteState === "vacuuming" ? "byte-pulling-jitter" : ""}
        style={{ 
          position: "relative",
          transform: rocketState === "igniting"
            ? `translate3d(${cameraShake.x}px, ${cameraShake.y}px, 0)`
            : (ropeState === "grab_rope" 
              ? "rotate(-5deg)" 
              : ropeState === "pull_rope" 
              ? "scaleY(0.92) translateY(6px)" 
              : archiveState === "placing_chat"
              ? "translateY(5px) scaleY(0.95)"
              : (deleteState === "celebrating" || archiveState === "celebrating" ? "translateY(-14px) scale(1.05)" : "none")),
          transformOrigin: "bottom center",
          transition: rocketState === "igniting" ? "none" : "transform 0.25s ease-out"
        }}
      >
        <ByteRobot
          size={95}
          state={robotState}
          expression={finalExpression}
          gesture={finalGesture}
        />

        {/* Holographic Envelope for sharing */}
        <AnimatePresence>
          {showEnvelope && (
            <motion.div
              initial={{ scale: 0, opacity: 0, x: -30, y: 10 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: -30,
                y: -10,
                filter: `drop-shadow(0 0 8px ${darkMode ? "rgba(121, 248, 255, 0.8)" : "rgba(37, 99, 235, 0.6)"})`
              }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                left: "10%",
                top: "30%",
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <svg width="32" height="24" viewBox="0 0 24 18" fill="none">
                <rect x="1" y="1" width="22" height="16" rx="3" fill={darkMode ? "rgba(121, 248, 255, 0.25)" : "rgba(37, 99, 235, 0.15)"} stroke={darkMode ? "#79f8ff" : "#2563EB"} strokeWidth="1.5" />
                <path d="M2 3L12 10L22 3" stroke={darkMode ? "#79f8ff" : "#2563EB"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore exclamation bubble notice */}
        <AnimatePresence>
          {(restoreNotice || deleteNotice || undoNotice || shareNotice || shareEnvelopeNotice) && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              style={{
                position: "absolute",
                top: "-15px",
                left: "calc(50% - 13px)",
                background: "#ffb300",
                color: "#ffffff",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "15px",
                boxShadow: "0 0 10px rgba(255, 179, 0, 0.6)",
                border: "1.5px solid #ffffff",
                zIndex: 100,
                pointerEvents: "none",
                fontFamily: "Inter, sans-serif",
              }}
            >
              !
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Stylus Drawing overlay */}
        <AnimatePresence>
          {renameState === "editing" && (
            <motion.div
              initial={{ scale: 0, rotate: -35 }}
              animate={{ 
                scale: 1, 
                rotate: [-35, -55, -35],
                x: [-1, 2, -1],
                y: [-1, 1, -1] 
              }}
              exit={{ scale: 0 }}
              transition={{
                rotate: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{
                position: "absolute",
                top: "22px",
                left: "-18px", 
                width: "12px",
                height: "24px",
                transformOrigin: "bottom center",
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <svg width="12" height="24" viewBox="0 0 12 24" fill="none">
                <path d="M4 0 L8 0 L10 16 L6 24 L2 16 Z" fill="url(#stylusGrad)" stroke="#121620" strokeWidth="0.5" />
                <circle cx="6" cy="22" r="2.5" fill="#ffffff" filter="url(#coreGlow)" />
                
                <defs>
                  <linearGradient id="stylusGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00d8ff" />
                    <stop offset="50%" stopColor="#79f8ff" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle checkmark finish overlay */}
        <AnimatePresence>
          {checkmarkActive && (
            <motion.div
              initial={{ scale: 0.1, opacity: 0, x: -25, y: 15 }}
              animate={{ scale: [0.1, 1.4, 1.0], opacity: [0.7, 1.0, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                position: "absolute",
                fontSize: "20px",
                fontWeight: 800,
                color: "#79f8ff",
                textShadow: "0 0 8px #79f8ff",
                pointerEvents: "none",
                zIndex: 12,
              }}
            >
              ✓
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rename Sparkle trail particles */}
        {renameParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.x, 
              y: p.y, 
              opacity: 0.9, 
              scale: 1 
            }}
            animate={{ 
              x: p.x + p.dx, 
              y: p.y + p.dy, 
              opacity: 0, 
              scale: 0.2 
            }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: p.isSparkle ? "2px" : "50%",
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              pointerEvents: "none",
              transform: p.isSparkle ? "rotate(45deg)" : "none",
              zIndex: 8,
            }}
          />
        ))}

        {/* Vacuum Nozzle Overlay */}
        <AnimatePresence>
          {deleteState === "vacuuming" && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "80px",
                left: "32.5px", // align with body center
                width: "30px",
                height: "25px",
                transformOrigin: "top center",
                zIndex: -1,
              }}
            >
              <svg width="30" height="25" viewBox="0 0 30 25" fill="none">
                <path d="M10 0 H20 L25 25 H5 Z" fill={darkMode ? "#79f8ff" : "#3B82F6"} opacity="0.85" />
                <line x1="5" y1="23" x2="25" y2="23" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

         {/* Suction Particles Overlay */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.xKeyframes[0], 
              y: p.yKeyframes[0], 
              opacity: 0.8, 
              scale: p.scale,
              rotate: 0 
            }}
            animate={{ 
              x: p.xKeyframes, 
              y: p.yKeyframes, 
              opacity: 0, 
              scale: 0.1,
              rotate: p.isSparkle ? 180 : 0 
            }}
            transition={{ duration: 0.55, ease: "easeIn" }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: p.isSparkle ? "2px" : "50%",
              background: p.color,
              boxShadow: `0 0 8px ${p.color}`,
              pointerEvents: "none",
              transform: p.isSparkle ? "rotate(45deg)" : "none",
            }}
          />
        ))}

        {/* Steam Puff Overlay */}
        {steamParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: p.opacity, scale: 0.5 }}
            animate={{
              x: p.x + p.vx * 30,
              y: p.y + p.vy * 30 - 20,
              opacity: 0,
              scale: 1.8,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(240, 240, 240, 0.6)",
              filter: "blur(2.5px)",
              pointerEvents: "none",
              zIndex: 99,
            }}
          />
        ))}

        {/* Floating Recycle Icon Overlay */}
        <AnimatePresence>
          {recycleActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 85, x: 47.5 - 12 }}
              animate={{ scale: [0.5, 1.2, 1.0], opacity: [0.8, 1.0, 0], y: 40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: "24px",
                height: "24px",
                color: "#10B981", // Emerald green recycle icon
                filter: "drop-shadow(0 0 6px #10B981)",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recycle Dissolve Particles Overlay */}
        {dissolveParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: p.opacity, scale: 1 }}
            animate={{
              x: p.x + p.vx * 20,
              y: p.y + p.vy * 30 - 30,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{ duration: 0.9, ease: "easeIn" }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              pointerEvents: "none",
              zIndex: 99,
            }}
          />
        ))}

        {/* Speech Bubble */}
        <AnimatePresence>
          {shouldShowBubble && (
            <div style={wrapperStyle}>
              <motion.div
                initial={bubbleMotionProps.initial}
                animate={bubbleMotionProps.animate}
                exit={bubbleMotionProps.exit}
                transition={bubbleMotionProps.transition}
                style={{
                  minWidth: "120px",
                  maxWidth: "260px",
                  width: "max-content",
                  padding: "14px 18px",
                  borderRadius: "20px",
                  background: darkMode ? "#1E293B" : "#FFFFFF",
                  border: darkMode 
                    ? "1px solid #334155" 
                    : "1px solid #E2E8F0",
                  boxShadow: darkMode 
                    ? "0px 4px 12px rgba(0, 0, 0, 0.4)" 
                    : "0px 4px 12px rgba(0, 0, 0, 0.06)",
                  color: darkMode ? "#F3F4F6" : "#1F2937",
                  pointerEvents: "auto",
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div style={{ fontSize: "13.5px", lineHeight: "1.5", fontWeight: 500 }}>
                  {bubbleTextToUse}
                </div>
                
                {/* Tail pointing towards Byte */}
                <div style={tailStyle} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ByteMovement>
    </>
  );
}
