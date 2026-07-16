import React, { useEffect, useRef } from "react";
import { RestoreEvents } from "./RestoreEvents";

export default function RestoreAnimationController({ conversations, setConversations, setActiveChatId }) {
  const queueRef = useRef([]);
  const isAnimatingRef = useRef(false);
  const conversationsRef = useRef(conversations);

  // Keep conversations ref up-to-date to avoid closing over stale state in callbacks
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const handleRestoreRequest = ({ chatId }) => {
      // Find the chat in active state
      const chat = conversationsRef.current.find((c) => c.id === chatId);
      if (!chat) {
        // Cancel gracefully if chat doesn't exist
        RestoreEvents.publish(RestoreEvents.ARCHIVE_RESTORE_COMPLETE, { chatId });
        return;
      }

      // Add to queue if not already there
      if (!queueRef.current.includes(chatId)) {
        queueRef.current.push(chatId);
      }

      processQueue();
    };

    const processQueue = () => {
      if (isAnimatingRef.current || queueRef.current.length === 0) return;

      const nextChatId = queueRef.current[0];
      const chat = conversationsRef.current.find((c) => c.id === nextChatId);

      if (!chat) {
        // Chat no longer exists, skip
        queueRef.current.shift();
        RestoreEvents.publish(RestoreEvents.ARCHIVE_RESTORE_COMPLETE, { chatId: nextChatId });
        processQueue();
        return;
      }

      isAnimatingRef.current = true;

      // Trigger the visual animation on Byte
      RestoreEvents.publish(RestoreEvents.TRIGGER_ANIMATION, {
        chatId: nextChatId,
        title: chat.title || "Archived Chat",
      });
    };

    const handleRestoreComplete = ({ chatId }) => {
      // Execute the actual restore logic (data update)
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, archived: false }
            : chat
        )
      );
      
      // Automatically make it the active conversation
      if (setActiveChatId) {
        setActiveChatId(chatId);
      }
    };

    const handleRestoreSequenceComplete = ({ chatId }) => {
      // Remove from queue
      queueRef.current = queueRef.current.filter((id) => id !== chatId);
      isAnimatingRef.current = false;

      // Process next in queue
      setTimeout(() => {
        processQueue();
      }, 300);
    };

    const unsubRequest = RestoreEvents.subscribe(
      RestoreEvents.ARCHIVE_RESTORE_REQUEST,
      handleRestoreRequest
    );

    const unsubComplete = RestoreEvents.subscribe(
      RestoreEvents.ARCHIVE_RESTORE_COMPLETE,
      handleRestoreComplete
    );

    const unsubSeqComplete = RestoreEvents.subscribe(
      RestoreEvents.RESTORE_SEQUENCE_COMPLETE,
      handleRestoreSequenceComplete
    );

    return () => {
      unsubRequest();
      unsubComplete();
      unsubSeqComplete();
    };
  }, [setConversations]);

  return null;
}
