/**
 * petStorage.js
 * ------------------------------------------------------------------
 * Companion Engine V1
 *
 * Pet persistence layer.
 *
 * Responsibilities:
 * - Save
 * - Load
 * - Delete
 * * Uses localStorage for V1.
 * Can later be replaced with IndexedDB/Firebase
 * without changing the rest of the engine.
 */

import { createPet } from "./petDefaults";

const STORAGE_KEY = "companion-engine-pets";
const STORAGE_VERSION = 1;

function clone(value) {
  return structuredClone(value);
}

function buildPayload(pets) {
  return {
    version: STORAGE_VERSION,
    savedAt: Date.now(),
    pets: clone(pets),
  };
}

export function savePets(pets) {
  try {
    const payload = buildPayload(pets);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(payload)
    );

    return true;
  } catch (error) {
    console.error(
      "[PetStorage] Failed to save pets:",
      error
    );

    return false;
  }
}

export function loadPets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [createPet()];
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      parsed.version !== STORAGE_VERSION ||
      !Array.isArray(parsed.pets)
    ) {
      return [createPet()];
    }

    return clone(parsed.pets);
  } catch (error) {
    console.error(
      "[PetStorage] Failed to load pets:",
      error
    );

    return [createPet()];
  }
}

export function savePet(pet) {
  const pets = loadPets();

  const index = pets.findIndex(
    (p) => p.id === pet.id
  );

  if (index >= 0) {
    pets[index] = clone(pet);
  } else {
    pets.push(clone(pet));
  }

  return savePets(pets);
}

export function loadPet(id) {
  const pets = loadPets();

  return (
    pets.find((pet) => pet.id === id) ??
    null
  );
}

export function deletePet(id) {
  const pets = loadPets().filter(
    (pet) => pet.id !== id
  );

  return savePets(pets);
}

export function clearPetStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error(
      "[PetStorage] Failed to clear storage:",
      error
    );

    return false;
  }
}

export function petStorageExists() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getStorageMetadata() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return {
      version: parsed.version,
      savedAt: parsed.savedAt,
      petCount: Array.isArray(parsed.pets)
        ? parsed.pets.length
        : 0,
    };
  } catch {
    return null;
  }
}