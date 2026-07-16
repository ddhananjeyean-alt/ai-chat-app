import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteEvents } from "./DeleteEvents";

export default function UndoDeleteAnimationController({ conversations, setConversations, activeChatId, setActiveChatId }) {
  const [activeUndo, setActiveUndo] = useState(null); // { chatId, title, origCoords, index }
  const [timeLeft, setTimeLeft] = useState(8000);

  const queueRef = useRef([]); // holds tasks: { id, type: 'DELETE'|'UNDO'|'TIMEOUT', chatId, coords, title }
  const isAnimatingRef = useRef(false);
  const conversationsRef = useRef(conversations);
  const temporaryStorageRef = useRef({}); // chatId -> { chat, origIndex, coords, timerId }
  const activeChatIdRef = useRef(activeChatId);

  // Keep activeChatId ref synchronized
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Keep conversations ref synchronized to avoid closing over stale state in callbacks
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    // 1. Listen to delete requests from sidebar or app
    const handleRequest = ({ chatId }) => {
      // Find the chat in active list
      const chat = conversationsRef.current.find((c) => c.id === chatId);
      if (!chat) {
        // If chat doesn't exist, cancel gracefully
        DeleteEvents.publish(DeleteEvents.DELETE_CHAT_STORED, { chatId });
        return;
      }

      // Prevent duplicate animations / duplicate queueing
      if (
        queueRef.current.some((t) => t.chatId === chatId) ||
        temporaryStorageRef.current[chatId]
      ) {
        return;
      }

      // Add DELETE task to queue
      queueRef.current.push({
        id: Math.random(),
        type: "DELETE",
        chatId,
        title: chat.title || "Untitled Chat",
      });

      processQueue();
    };

    // 2. Listen to visual deletion completion from Byte
    const handleStored = ({ chatId }) => {
      const chat = conversationsRef.current.find((c) => c.id === chatId);
      if (!chat) {
        // Chat no longer in conversations (already processed)
        finishActiveTask(chatId);
        return;
      }

      const origIndex = conversationsRef.current.findIndex((c) => c.id === chatId);

      // Get target coordinate for where the card was deleted to return it exactly
      const element =
        document.getElementById(`chat-wheel-item-${chatId}`) ||
        document.getElementById(`search-result-item-${chatId}`);
      let origCoords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      if (element) {
        const rect = element.getBoundingClientRect();
        origCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }

      // Clear any existing snackbar/timer for this chat (safety)
      if (temporaryStorageRef.current[chatId]) {
        clearTimeout(temporaryStorageRef.current[chatId].timerId);
      }

      // Create the 8-second timeout timer
      const timerId = setTimeout(() => {
        // Queue a TIMEOUT action
        queueRef.current.push({
          id: Math.random(),
          type: "TIMEOUT",
          chatId,
        });
        processQueue();
      }, 8000);

      // Store chat temporarily
      temporaryStorageRef.current[chatId] = {
        chat,
        origIndex,
        origCoords,
        timerId,
        timestamp: Date.now(),
        wasActive: activeChatIdRef.current === chatId,
      };

      // Remove the chat from visible Recent Chats in UI (Stage 1 deletion)
      setConversations((prev) => prev.filter((c) => c.id !== chatId));

      // Display the Snackbar for this chat
      setActiveUndo({
        chatId,
        title: chat.title || "Untitled Chat",
        origCoords,
        index: origIndex,
      });
      setTimeLeft(8000);
    };

    // 3. Listen to undo request triggers
    const handleUndo = ({ chatId }) => {
      const stored = temporaryStorageRef.current[chatId];
      if (!stored) return; // already expired or processed

      // Cancel the permanent deletion timeout
      clearTimeout(stored.timerId);

      // Hide the snackbar immediately
      setActiveUndo(null);

      // Queue an UNDO animation task
      queueRef.current.push({
        id: Math.random(),
        type: "UNDO",
        chatId,
        title: stored.chat.title || "Untitled Chat",
        coords: stored.origCoords,
      });

      processQueue();
    };

    // 4. Listen to restored completion (after Byte finishes placing the card)
    const handleRestored = ({ chatId }) => {
      const stored = temporaryStorageRef.current[chatId];
      if (!stored) {
        finishActiveTask(chatId);
        return;
      }

      // Restore chat back into conversations at its original index
      setConversations((prev) => {
        const next = [...prev];
        // Insert at original index if index is within bounds, otherwise push
        if (stored.origIndex >= 0 && stored.origIndex <= next.length) {
          next.splice(stored.origIndex, 0, stored.chat);
        } else {
          next.push(stored.chat);
        }
        return next;
      });

      // Restore active selection if the chat was active before deletion
      if (stored.wasActive && setActiveChatId) {
        setActiveChatId(chatId);
      }

      // Clean up temporary storage entry
      delete temporaryStorageRef.current[chatId];
    };

    // 5. Listen to permanent timeout animation completion
    const handleTimeoutComplete = ({ chatId }) => {
      const stored = temporaryStorageRef.current[chatId];
      if (stored) {
        // Execute permanent delete (e.g. database cleanups for images)
        executePermanentDelete(stored.chat);
        delete temporaryStorageRef.current[chatId];
      }

      // Clear undo state if it was for this chat
      setActiveUndo((prev) => (prev?.chatId === chatId ? null : prev));

      finishActiveTask(chatId);
    };

    const handleDeleteSequenceComplete = ({ chatId }) => {
      finishActiveTask(chatId);
    };

    const handleUndoSequenceComplete = ({ chatId }) => {
      finishActiveTask(chatId);
    };

    // Subscribe to all delete/undo events
    const unsubRequest = DeleteEvents.subscribe(DeleteEvents.DELETE_CHAT_REQUEST, handleRequest);
    const unsubStored = DeleteEvents.subscribe(DeleteEvents.DELETE_CHAT_STORED, handleStored);
    const unsubUndo = DeleteEvents.subscribe(DeleteEvents.DELETE_CHAT_UNDO, handleUndo);
    const unsubRestored = DeleteEvents.subscribe(DeleteEvents.DELETE_CHAT_RESTORED, handleRestored);
    const unsubComplete = DeleteEvents.subscribe(DeleteEvents.BYTE_VACUUM_COMPLETE, handleTimeoutComplete);
    const unsubDeleteSeqComplete = DeleteEvents.subscribe(DeleteEvents.DELETE_SEQUENCE_COMPLETE, handleDeleteSequenceComplete);
    const unsubUndoSeqComplete = DeleteEvents.subscribe(DeleteEvents.UNDO_SEQUENCE_COMPLETE, handleUndoSequenceComplete);

    return () => {
      unsubRequest();
      unsubStored();
      unsubUndo();
      unsubRestored();
      unsubComplete();
      unsubDeleteSeqComplete();
      unsubUndoSeqComplete();
    };
  }, [setConversations]);

  // Handle task completion and transition
  const finishActiveTask = (chatId) => {
    queueRef.current = queueRef.current.filter((t) => t.chatId !== chatId);
    isAnimatingRef.current = false;
    // Process next action in queue
    setTimeout(processQueue, 350);
  };

  // Main task queue processor
  const processQueue = () => {
    if (isAnimatingRef.current || queueRef.current.length === 0) return;

    const task = queueRef.current[0];
    isAnimatingRef.current = true;

    if (task.type === "DELETE") {
      // Find where the card is in the DOM
      const element =
        document.getElementById(`chat-wheel-item-${task.chatId}`) ||
        document.getElementById(`search-result-item-${task.chatId}`);
      let coords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      if (element) {
        const rect = element.getBoundingClientRect();
        coords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }

      // Trigger visual vacuum sequence on Byte
      DeleteEvents.publish(DeleteEvents.TRIGGER, { chatId: task.chatId, coords });
    } 
    else if (task.type === "UNDO") {
      // Trigger undo reverse vacuum animation sequence on Byte
      DeleteEvents.publish(DeleteEvents.DELETE_CHAT_UNDO, {
        chatId: task.chatId,
        title: task.title,
        coords: task.coords,
      });
    } 
    else if (task.type === "TIMEOUT") {
      // Trigger timeout recycle animation sequence on Byte
      DeleteEvents.publish(DeleteEvents.DELETE_CHAT_TIMEOUT, { chatId: task.chatId });
    }
  };

  // Helper to execute permanent database & image record deletion
  const executePermanentDelete = async (chat) => {
    try {
      const imageIds = new Set();
      if (chat.imageId) imageIds.add(chat.imageId);
      if (Array.isArray(chat.messages)) {
        chat.messages.forEach((msg) => {
          if (msg && msg.imageId) imageIds.add(msg.imageId);
        });
      }

      // Dynamically load db utility to delete image records permanently
      const { deleteImageRecord } = await import("../../services/imageDB");
      await Promise.all(
        Array.from(imageIds).map((id) => deleteImageRecord(id).catch(() => {}))
      );
      console.log(`[UndoDelete] Permanently deleted chat ${chat.id} from imageDB`);
    } catch (e) {
      console.error("[UndoDelete] Permanent deletion failed:", e);
    }
  };

  // Countdown timer interval for the active Undo Snackbar
  useEffect(() => {
    if (!activeUndo) return;

    const interval = setInterval(() => {
      const stored = temporaryStorageRef.current[activeUndo.chatId];
      if (!stored) {
        setActiveUndo(null);
        clearInterval(interval);
        return;
      }

      const elapsed = Date.now() - stored.timestamp;
      const remaining = Math.max(0, 8000 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setActiveUndo(null);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activeUndo]);

  const handleUndoClick = () => {
    if (!activeUndo) return;
    DeleteEvents.publish(DeleteEvents.DELETE_CHAT_UNDO, { chatId: activeUndo.chatId });
  };

  return (
    <AnimatePresence>
      {activeUndo && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            minWidth: "340px",
            maxWidth: "480px",
            padding: "12px 18px",
            borderRadius: "14px",
            boxShadow: "0px 12px 35px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            zIndex: 999999,
            overflow: "hidden",
            fontFamily: "Inter, sans-serif",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.85)", // dark themed glassmorphism default
            color: "#ECECEC",
          }}
        >
          {/* Main content */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 500, marginRight: "24px" }}>
              Deleted "{activeUndo.title.length > 25 ? activeUndo.title.substring(0, 25) + "..." : activeUndo.title}"
            </span>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(121, 248, 255, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndoClick}
              style={{
                background: "rgba(121, 248, 255, 0.15)",
                border: "1px solid rgba(121, 248, 255, 0.4)",
                borderRadius: "8px",
                color: "#79f8ff",
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            >
              UNDO
            </motion.button>
          </div>

          {/* Progress countdown bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "3.5px",
              background: "linear-gradient(90deg, #3B82F6, #79f8ff)",
              width: `${(timeLeft / 8000) * 100}%`,
              transition: "width 0.05s linear",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
