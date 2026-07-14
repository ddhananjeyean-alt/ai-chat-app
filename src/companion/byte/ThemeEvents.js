/**
 * ThemeEvents.js
 * 
 * Simple Event Bus utilizing standard DOM CustomEvents to decouple 
 * the Header toggle button, the ThemeRope component, and the Byte companion.
 */

export const ThemeEvents = {
  // Event Names
  TRIGGER: "theme-pull:trigger",           // Fired when the user clicks the theme button
  ROPE_DROPPED: "theme-pull:rope-dropped",   // Fired when the rope finishes dropping and settles
  BYTE_REACHED: "theme-pull:byte-reached",   // Fired when Byte reaches the rope and is ready to pull
  BYTE_GRABBED: "theme-pull:byte-grabbed",   // Fired when Byte grabs the rope
  PULL_UPDATE: "theme-pull:pull-update",     // Continuous pull animation progress (0 to 100px)
  BYTE_PULLED: "theme-pull:byte-pulled",     // Fired when Byte finishes pulling the rope down
  THEME_CHANGED: "theme-pull:theme-changed", // Fired after the theme context actually updates
  COMPLETE: "theme-pull:complete",           // Fired when the entire sequence finishes and Byte returns home

  subscribe(event, callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  },

  publish(event, detail) {
    const customEvent = new CustomEvent(event, { detail });
    window.dispatchEvent(customEvent);
  }
};
