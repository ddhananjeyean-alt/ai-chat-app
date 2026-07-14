import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// Conversation Collection
const conversationCollection = (uid) =>
  collection(db, "users", uid, "conversations");

// Save new conversation
export async function saveConversation(uid, conversation) {
  const ref = doc(db, "users", uid, "conversations", String(conversation.id));

  await setDoc(ref, {
    ...conversation,
    updatedAt: serverTimestamp(),
  });
}

// Update conversation
export async function updateConversation(uid, conversation) {
  const ref = doc(db, "users", uid, "conversations", String(conversation.id));

  await updateDoc(ref, {
    ...conversation,
    updatedAt: serverTimestamp(),
  });
}

// Load all conversations
export async function loadConversations(uid) {
  const q = query(
    conversationCollection(uid),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Load one conversation
export async function loadConversation(uid, conversationId) {
  const ref = doc(
    db,
    "users",
    uid,
    "conversations",
    String(conversationId)
  );

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

// Delete conversation
export async function deleteConversation(uid, conversationId) {
  await deleteDoc(
    doc(
      db,
      "users",
      uid,
      "conversations",
      String(conversationId)
    )
  );
}