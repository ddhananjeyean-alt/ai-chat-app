const listeners = {};

export const RestoreEvents = {
  ARCHIVE_RESTORE_REQUEST: "archive-restore:request",
  ARCHIVE_RESTORE_COMPLETE: "archive-restore:complete",
  TRIGGER_ANIMATION: "archive-restore:trigger-animation",
  RESTORE_SEQUENCE_COMPLETE: "archive-restore:sequence-complete",

  subscribe(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    };
  },

  publish(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach((cb) => cb(data));
  },
};
