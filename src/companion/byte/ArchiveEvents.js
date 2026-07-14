const listeners = {};

export const ArchiveEvents = {
  TRIGGER: "archive-chat:trigger",
  BYTE_REACHED: "archive-chat:byte-reached",
  BYTE_GRABBED: "archive-chat:byte-grabbed",
  ARCHIVE_BOX_OPEN: "archive-chat:box-open",
  PLACE_COMPLETE: "archive-chat:place-complete",
  COMPLETE: "archive-chat:complete",

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
