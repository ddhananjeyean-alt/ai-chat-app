const listeners = {};

export const RenameEvents = {
  TRIGGER: "rename-chat:trigger",
  BYTE_REACHED: "rename-chat:byte-reached",
  CONFIRM: "rename-chat:confirm",
  CANCEL: "rename-chat:cancel",
  COMPLETE: "rename-chat:complete",

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
