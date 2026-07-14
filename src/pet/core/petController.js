/**
 * petController.js
 * ------------------------------------------------------------------
 * Companion Engine V2
 *
 * Central update controller.
 *
 * Update Order:
 * 1. Behaviour
 * 2. Stats
 * 3. State Machine
 * 4. Movement
 * 5. Animation Sync
 * 6. Animation Playback
 * 7. Auto Save
 */

import { createPet } from "./petDefaults";
import { updateBehavior } from "./petBehavior";
import { updatePetStats, feedPet, playWithPet } from "./petStats";
import { updatePetState } from "./petStateMachine";
import { updatePetMovement } from "./petMovement";
import { syncPetAnimation } from "./petAnimationAdapter";
import { updateAnimation } from "../animation/animationPlayer";
import { savePets, loadPets } from "./petStorage";

const AUTO_SAVE_INTERVAL = 5;

export class PetController {
  constructor(bounds) {
    this.bounds = bounds;

    this.pets = loadPets();

    if (!this.pets.length) {
      this.pets = [createPet()];
    }

    this.saveTimer = 0;
  }

  update(deltaTime) {
    for (const pet of this.pets) {
      // AI Behaviour
      updateBehavior(pet, deltaTime);

      // Stats
      updatePetStats(pet, deltaTime);

      // State Machine
      updatePetState(pet, deltaTime);

      // Movement
      updatePetMovement(
        pet,
        deltaTime,
        this.bounds
      );

      // Animation Selection
      syncPetAnimation(pet);

      // Frame Playback
      updateAnimation(
        pet,
        deltaTime
      );

      pet.metadata.updatedAt = Date.now();
    }

    this.saveTimer += deltaTime;

    if (this.saveTimer >= AUTO_SAVE_INTERVAL) {
      this.save();
      this.saveTimer = 0;
    }
  }

  save() {
    savePets(this.pets);
  }

  load() {
    this.pets = loadPets();
  }

  getPets() {
    return this.pets;
  }

  getPrimaryPet() {
    return this.pets[0] ?? null;
  }

  getPet(id) {
    return (
      this.pets.find((pet) => pet.id === id) ??
      null
    );
  }

  addPet(options = {}) {
    const pet = createPet(options);

    this.pets.push(pet);

    this.save();

    return pet;
  }

  removePet(id) {
    this.pets = this.pets.filter(
      (pet) => pet.id !== id
    );

    this.save();
  }

  feed(id) {
    const pet = this.getPet(id);

    if (!pet) return;

    feedPet(pet);

    this.save();
  }

  play(id) {
    const pet = this.getPet(id);

    if (!pet) return;

    playWithPet(pet);

    this.save();
  }

  setBounds(bounds) {
    this.bounds = bounds;
  }

  forEach(callback) {
    this.pets.forEach(callback);
  }

  clear() {
    this.pets = [];
  }

  destroy() {
    this.save();
  }
}