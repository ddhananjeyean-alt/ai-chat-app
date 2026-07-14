const listeners = {};

export const ShareEnvelopeEvents = {
  START_ANIMATION: "share-envelope:start",
  UPDATE_BYTE_STATE: "share-envelope:update-byte-state",
  ENVELOPE_THROWN: "share-envelope:thrown",
  ENVELOPE_LANDED: "share-envelope:landed",
  ENVELOPE_OPENED: "share-envelope:opened",
  RESET_ANIMATION: "share-envelope:reset",
  LAUNCH_AIRPLANE: "share-envelope:launch-airplane",

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
