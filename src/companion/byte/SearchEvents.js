const listeners = {};

export const SearchEvents = {
  TRIGGER: "search-chat:trigger",
  PLACE_BAR: "search-chat:place-bar",
  COMPLETE: "search-chat:complete",
  TYPING: "search-chat:typing",

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
