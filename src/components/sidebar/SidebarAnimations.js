// =============================================
// Sidebar Animations
// =============================================

export const spring = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

export const wheelSpring = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export const panelVariants = {
  closed: {
    x: -40,
    opacity: 0,
    pointerEvents: "none",
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
    },
  },

  open: {
    x: 0,
    opacity: 1,
    pointerEvents: "auto",
    transition: {
      duration: 0.28,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
};

export const wheelVariants = {
  idle: {
    scale: 1,
  },

  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },

  dragging: {
    scale: 1.03,
    cursor: "grabbing",
    transition: {
      duration: 0.08,
    },
  },
};

export const itemVariants = {
  inactive: {
    scale: 1,
    opacity: 0.7,
    transition: {
      duration: 0.18,
    },
  },

  active: {
    scale: 1.15,
    opacity: 1,
    transition: {
      duration: 0.18,
    },
  },
};

export const chatItemVariants = {
  initial: {
    opacity: 0,
    x: -10,
  },

  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.18,
    },
  },

  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15,
    },
  },

  hover: {
    x: 4,
    transition: {
      duration: 0.15,
    },
  },
};

export const menuVariants = {
  closed: {
    opacity: 0,
    scale: 0.94,
    y: -6,
    transition: {
      duration: 0.14,
    },
  },

  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.16,
    },
  },
};

export const searchVariants = {
  hidden: {
    opacity: 0,
    y: -6,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const glowAnimation = {
  animate: {
    opacity: [0.35, 0.7, 0.35],
    scale: [1, 1.03, 1],
  },

  transition: {
    duration: 2.8,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export const ringAnimation = {
  animate: {
    rotate: [0, 1.2, -1.2, 0],
  },

  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export const panelTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const fadeTransition = {
  duration: 0.18,
};

export const iconTransition = {
  type: "spring",
  stiffness: 400,
  damping: 22,
};