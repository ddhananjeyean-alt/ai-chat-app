const listeners = {};

export const DeleteEvents = {
  TRIGGER: "delete-chat:trigger",
  BYTE_REACHED: "delete-chat:byte-reached",
  BYTE_VACUUM_COMPLETE: "delete-chat:vacuum-complete",

  DELETE_CHAT_REQUEST: "delete-chat:request",
  DELETE_CHAT_STORED: "delete-chat:stored",
  DELETE_CHAT_UNDO: "delete-chat:undo",
  DELETE_CHAT_TIMEOUT: "delete-chat:timeout",
  DELETE_CHAT_RESTORED: "delete-chat:restored",
  DELETE_SEQUENCE_COMPLETE: "delete-chat:sequence-complete",
  UNDO_SEQUENCE_COMPLETE: "delete-chat:undo-sequence-complete",

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

