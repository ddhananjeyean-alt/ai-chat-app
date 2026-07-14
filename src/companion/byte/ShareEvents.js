const listeners = {};

export const ShareEvents = {
  SHARE_LINK_READY: "share-chat:link-ready",
  SHARE_GENERATION_FAILED: "share-chat:generation-failed",
  ENVELOPE_THROWN: "share-chat:envelope-thrown",
  ENVELOPE_RETURN_REQUEST: "share-chat:envelope-return-request",
  LAND_ANIMATION: "share-chat:land-animation",

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
