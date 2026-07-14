export const PET_STATES = Object.freeze({
  IDLE: "idle",
  WALK: "walk",
  SLEEP: "sleep",
  EAT: "eat",
  HAPPY: "happy",
  FOLLOW: "follow",
  DRAG: "drag",
});

export const PET_SPECIES = Object.freeze({
  DEFAULT: "default",
});

export const PET_LIMITS = Object.freeze({
  hunger: 100,
  happiness: 100,
  energy: 100,
});

export function createPet({
  id = crypto.randomUUID(),
  name = "Companion",
  species = PET_SPECIES.DEFAULT,
} = {}) {
  return {
    id,

    name,

    species,

    state: PET_STATES.IDLE,

    position: {
      x: 250,
      y: 250,
    },

    velocity: {
      x: 0,
      y: 0,
    },

    direction: 1,

    target: null,

    dragging: false,

    stats: {
      hunger: 100,
      happiness: 100,
      energy: 100,
    },

    timers: {
      idle: 0,
      sleep: 0,
      eat: 0,
      happy: 0,
      wander: 0,
    },

    animation: {
      name: "idle",
      frame: 0,
      elapsed: 0,
    },

    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}

export function clonePet(pet) {
  return structuredClone(pet);
}