import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

const ByteContext = createContext();

export const BYTE_STATES = {
  IDLE: "IDLE",
  THINKING: "THINKING",
  UPLOADING: "UPLOADING",
  ANALYZING: "ANALYZING",
  SEARCHING: "SEARCHING",
  GENERATING: "GENERATING",
  LISTENING: "LISTENING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  SEARCH_BAR_DELIVERY: "SEARCH_BAR_DELIVERY",
};

const THINKING_PHRASES = [
  "Thinking...",
  "Understanding your request...",
  "Searching my knowledge...",
  "Preparing the best answer...",
  "Almost finished..."
];

const SEARCHING_PHRASES = [
  "Searching the web...",
  "Finding recent information..."
];

export function ByteProvider({ children }) {
  // Global AI processing state
  const [byteState, setByteStateInternal] = useState(BYTE_STATES.IDLE);
  
  // Search Delivery played state
  const [hasPlayedSearchDelivery, setHasPlayedSearchDelivery] = useState(false);
  const { currentUser, updateCompanionDisplayName } = useAuth();
  const prevUserRef = useRef(currentUser);

  const [displayName, setDisplayName] = useState("My Companion");

  useEffect(() => {
    if (currentUser) {
      const name = currentUser.companionDisplayName || localStorage.getItem(`companionName_${currentUser.uid}`) || "My Companion";
      setDisplayName(name);
    } else {
      setDisplayName("My Companion");
    }
  }, [currentUser, currentUser?.companionDisplayName]);

  useEffect(() => {
    if (currentUser !== prevUserRef.current) {
      setHasPlayedSearchDelivery(false);
      prevUserRef.current = currentUser;
    }
  }, [currentUser]);
  
  // Custom bubble text and visibility
  const [bubbleText, setBubbleText] = useState("");
  
  // Welcome onboarding flow state
  const [welcomeState, setWelcomeState] = useState("idle"); // idle, waiting, moving_in, talking, moving_out, completed
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });

  // Naming dialog companion states
  const [namingActive, setNamingActive] = useState(false);
  const [namingPlaceholderPos, setNamingPlaceholderPos] = useState(null);
  const [namingRobotState, setNamingRobotState] = useState("float");
  const [namingExpression, setNamingExpression] = useState("happy");
  const [namingGesture, setNamingGesture] = useState("none");
  const [namingTilt, setNamingTilt] = useState(0);
  const [namingLookOffset, setNamingLookOffset] = useState({ x: 0, y: 0 });
  const [namingJumpActive, setNamingJumpActive] = useState(false);

  // Global companion navigation states
  const [isBusy, setIsBusy] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const [originalPosition, setOriginalPosition] = useState(null);
  
  // Active timeout/interval refs for cleanup
  const stateTimeoutRef = useRef(null);
  const phraseIntervalRef = useRef(null);
  const simulationTimeoutRefs = useRef([]);

  // Calculate coordinates dynamically to be next to the chat input box
  const updateTargetCoordinates = useCallback(() => {
    const inputEl = document.querySelector(".chat-input-area-wrapper");
    const targetX = window.innerWidth - 110;
    let targetY;
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect();
      targetY = Math.max(20, rect.top - 140);
    } else {
      targetY = window.innerHeight - 250;
    }
    setTargetPosition({ x: targetX, y: targetY });
  }, []);

  // Update target on load and window resize
  useEffect(() => {
    updateTargetCoordinates();
    window.addEventListener("resize", updateTargetCoordinates);
    return () => {
      window.removeEventListener("resize", updateTargetCoordinates);
    };
  }, [updateTargetCoordinates]);

  // Welcome initialization will be handled by ByteWelcomeGuide on mount
  useEffect(() => {
    // Keep welcomeState as "idle" on mount to prevent early trigger on login page
  }, []);

  // Main welcome sequence timers
  useEffect(() => {
    let t1, t2, t4;

    if (welcomeState === "waiting") {
      t1 = setTimeout(() => {
        setWelcomeState("moving_in");
      }, 4000);
    } else if (welcomeState === "moving_in") {
      t2 = setTimeout(() => {
        setWelcomeState("talking");
      }, 1000);
    } else if (welcomeState === "talking") {
      // Automatically fade bubble and exit after 9.5 seconds
      t4 = setTimeout(() => {
        setWelcomeState("moving_out");
      }, 9500);
    } else if (welcomeState === "moving_out") {
      t4 = setTimeout(() => {
        setWelcomeState("completed");
        sessionStorage.setItem("byte_welcome_shown", "true");
      }, 1000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t4);
    };
  }, [welcomeState]);

  // Clean up all active intervals & timeouts
  const clearAllTimers = () => {
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
      stateTimeoutRef.current = null;
    }
    if (phraseIntervalRef.current) {
      clearInterval(phraseIntervalRef.current);
      phraseIntervalRef.current = null;
    }
    simulationTimeoutRefs.current.forEach((t) => clearTimeout(t));
    simulationTimeoutRefs.current = [];
  };

  // Helper to schedule simulation steps safely
  const scheduleSimulationStep = (fn, delay) => {
    const timer = setTimeout(fn, delay);
    simulationTimeoutRefs.current.push(timer);
  };

  // Centralized state setter
  const setByteState = useCallback((state) => {
    clearAllTimers();
    setByteStateInternal(state);
    console.log(`[ByteContext] State transition: ${state}`);

    if (state === BYTE_STATES.IDLE) {
      setBubbleText("");
      return;
    }

    // Immediately cancel welcome bubble once processing starts
    if (welcomeState !== "completed" && welcomeState !== "idle") {
      setWelcomeState("completed");
      sessionStorage.setItem("byte_welcome_shown", "true");
    }

    if (state === BYTE_STATES.THINKING) {
      let index = 0;
      setBubbleText(THINKING_PHRASES[0]);
      
      phraseIntervalRef.current = setInterval(() => {
        index = (index + 1) % THINKING_PHRASES.length;
        setBubbleText(THINKING_PHRASES[index]);
      }, 2000);

    } else if (state === BYTE_STATES.SEARCHING) {
      let index = 0;
      setBubbleText(SEARCHING_PHRASES[0]);
      
      phraseIntervalRef.current = setInterval(() => {
        index = (index + 1) % SEARCHING_PHRASES.length;
        setBubbleText(SEARCHING_PHRASES[index]);
      }, 2000);

    } else if (state === BYTE_STATES.UPLOADING) {
      setBubbleText("Uploading image...");
    } else if (state === BYTE_STATES.ANALYZING) {
      setBubbleText("Analyzing image...");
    } else if (state === BYTE_STATES.GENERATING) {
      setBubbleText("Creating your image...");
    } else if (state === BYTE_STATES.LISTENING) {
      setBubbleText("Listening...");
    } else if (state === BYTE_STATES.SUCCESS) {
      setBubbleText("✓ Done!");
      stateTimeoutRef.current = setTimeout(() => {
        setByteStateInternal(BYTE_STATES.IDLE);
        setBubbleText("");
      }, 1500);
    } else if (state === BYTE_STATES.ERROR) {
      setBubbleText("Something went wrong.");
      stateTimeoutRef.current = setTimeout(() => {
        setByteStateInternal(BYTE_STATES.IDLE);
        setBubbleText("");
      }, 3000);
    }
  }, [welcomeState]);

  // Cancel/dismiss welcome bubble immediately
  const cancelWelcome = useCallback(() => {
    setWelcomeState((prev) => {
      if (prev === "talking" || prev === "moving_in") {
        return "moving_out";
      }
      return prev;
    });
    sessionStorage.setItem("byte_welcome_shown", "true");
  }, []);

  // Watch for user typing to dismiss greeting bubble
  const onUserTyping = useCallback(() => {
    if (welcomeState !== "completed" && welcomeState !== "idle") {
      cancelWelcome();
    }
  }, [welcomeState, cancelWelcome]);

  // Click handler for New Chat: Reset Byte and show welcome bubble again
  const triggerNewChatWelcome = useCallback(() => {
    clearAllTimers();
    setByteStateInternal(BYTE_STATES.IDLE);
    setBubbleText("");
    
    // Position Byte to move in and greet again
    setWelcomeState("moving_in");
  }, []);

  // Image upload animation sequence simulation
  const triggerImageUploadSequence = useCallback(() => {
    clearAllTimers();
    
    // 1. Uploading image...
    setByteStateInternal(BYTE_STATES.UPLOADING);
    setBubbleText("Uploading image...");

    // Cancel welcome bubble if visible
    if (welcomeState !== "completed" && welcomeState !== "idle") {
      setWelcomeState("completed");
      sessionStorage.setItem("byte_welcome_shown", "true");
    }

    // 2. Schedule: Analyzing image...
    scheduleSimulationStep(() => {
      setByteStateInternal(BYTE_STATES.ANALYZING);
      setBubbleText("Analyzing image...");

      // 3. Schedule: Thinking...
      scheduleSimulationStep(() => {
        setByteStateInternal(BYTE_STATES.THINKING);
        let index = 0;
        setBubbleText(THINKING_PHRASES[0]);
        
        phraseIntervalRef.current = setInterval(() => {
          index = (index + 1) % THINKING_PHRASES.length;
          setBubbleText(THINKING_PHRASES[index]);
        }, 2000);

        // 4. Schedule: Return to IDLE
        scheduleSimulationStep(() => {
          clearAllTimers();
          setByteStateInternal(BYTE_STATES.IDLE);
          setBubbleText("");
        }, 2000);

      }, 1500);

    }, 1500);

  }, [welcomeState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Computed layout state variables for movements and guide bubbles
  const isMoving = welcomeState === "moving_in" || welcomeState === "talking" || welcomeState === "moving_out";
  const overridePosition = isMoving ? targetPosition : null;
  const welcomeActive = welcomeState !== "idle" && welcomeState !== "completed";
  
  // Greeting bubble is shown during onboarding greeting
  // Processing bubble is shown for active processing states (excluding IDLE & when SUCCESS timeout is done)
  const showWelcomeBubble = welcomeState === "talking";
  const showProcessingBubble = byteState !== BYTE_STATES.IDLE;
  const showBubble = showWelcomeBubble || showProcessingBubble;

  // Determine standard expression / gesture overrides
  const expression = byteState === BYTE_STATES.IDLE && welcomeState === "talking" ? "look-left" : "happy";
  const gesture = byteState === BYTE_STATES.IDLE && welcomeState === "talking" ? "point-left" : "none";

  // Provide state mapping values
  const isReturningUser = currentUser && (currentUser.companionDisplayName || localStorage.getItem(`companionName_${currentUser.uid}`));
  const defaultWelcomeText = isReturningUser 
    ? `Welcome back!\nIt's great to see you again.` 
    : `Hi! 👋\nI'm ${displayName}, your AI companion.\nI'm here to help you with anything you need.`;
  const activeBubbleText = showProcessingBubble ? bubbleText : (showWelcomeBubble ? defaultWelcomeText : "");

  return (
    <ByteContext.Provider
      value={{
        byteState,
        setByteState,
        showBubble,
        bubbleText: activeBubbleText,
        welcomeActive,
        welcomeState,
        setWelcomeState,
        overridePosition,
        expression,
        gesture,
        cancelWelcome,
        onUserTyping,
        triggerNewChatWelcome,
        triggerImageUploadSequence,
        isBusy,
        setIsBusy,
        currentTarget,
        setCurrentTarget,
        isReturning,
        setIsReturning,
        originalPosition,
        setOriginalPosition,
        hasPlayedSearchDelivery,
        setHasPlayedSearchDelivery,
        displayName,
        updateCompanionDisplayName,
        namingActive,
        setNamingActive,
        namingPlaceholderPos,
        setNamingPlaceholderPos,
        namingRobotState,
        setNamingRobotState,
        namingExpression,
        setNamingExpression,
        namingGesture,
        setNamingGesture,
        namingTilt,
        setNamingTilt,
        namingLookOffset,
        setNamingLookOffset,
        namingJumpActive,
        setNamingJumpActive,
      }}
    >
      {children}
    </ByteContext.Provider>
  );
}

export function useByte() {
  const context = useContext(ByteContext);
  if (!context) {
    throw new Error("useByte must be used within a ByteProvider");
  }
  return context;
}
