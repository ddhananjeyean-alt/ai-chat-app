import { useState, useEffect, useCallback } from "react";

export default function useByteWelcome({ message, currentUser, activeChatId }) {
  const [welcomeState, setWelcomeState] = useState("idle"); // idle, waiting, moving_in, talking, moving_out, completed
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });

  console.log("Byte Onboarding debug:", {
    welcomeState,
    currentUser: !!currentUser,
    activeChatId,
    sessionStorageShown: sessionStorage.getItem("byte_welcome_shown")
  });

  // Calculate coordinates dynamically to be next to the chat input box
  const updateTargetCoordinates = useCallback(() => {
    // Place Byte just to the right side of the input box, ensuring it doesn't clip off screen
    const targetX = window.innerWidth - 110;
    const targetY = window.innerHeight - 185;

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

  // Check session storage on mount
  useEffect(() => {
    const welcomeShown = sessionStorage.getItem("byte_welcome_shown");
    if (!welcomeShown && currentUser && activeChatId === null) {
      setWelcomeState("waiting");
    }
  }, [currentUser, activeChatId]);

  // Cancel flow callback
  const cancelWelcome = useCallback(() => {
    setWelcomeState("completed");
    sessionStorage.setItem("byte_welcome_shown", "true");
  }, []);

  // Monitor user typing to cancel onboarding welcome immediately
  useEffect(() => {
    if (message && message.trim().length > 0 && welcomeState !== "completed" && welcomeState !== "idle") {
      cancelWelcome();
    }
  }, [message, welcomeState, cancelWelcome]);

  // Main welcome sequence timers
  useEffect(() => {
    let timer1 = null;
    let timer2 = null;
    let timer3 = null;
    let timer4 = null;

    if (welcomeState === "waiting") {
      // 1. Wait 4 seconds in idle position
      timer1 = setTimeout(() => {
        setWelcomeState("moving_in");
      }, 4000);
    } else if (welcomeState === "moving_in") {
      // 2. Allow 1 second for the float-in animation to complete
      timer2 = setTimeout(() => {
        setWelcomeState("talking");
      }, 1000);
    } else if (welcomeState === "talking") {
      // 3. Point and talk for 6 seconds
      timer3 = setTimeout(() => {
        setWelcomeState("moving_out");
      }, 6000);
    } else if (welcomeState === "moving_out") {
      // 4. Return to home position, then mark welcome as completed
      timer4 = setTimeout(() => {
        setWelcomeState("completed");
        sessionStorage.setItem("byte_welcome_shown", "true");
      }, 1000);
    }

    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      if (timer4) clearTimeout(timer4);
    };
  }, [welcomeState]);

  // Determine state values
  const isMoving = welcomeState === "moving_in" || welcomeState === "talking" || welcomeState === "moving_out";
  const overridePosition = isMoving ? targetPosition : null;
  const welcomeActive = welcomeState !== "idle" && welcomeState !== "completed";
  const showBubble = welcomeState === "talking";

  const expression = welcomeState === "talking" ? "look-left" : "happy";
  const gesture = welcomeState === "talking" ? "point-left" : "none";

  return {
    welcomeActive,
    welcomeState,
    overridePosition,
    showBubble,
    expression,
    gesture,
    cancelWelcome,
  };
}
