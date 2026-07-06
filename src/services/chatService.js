import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// Create Conversation
export async function createConversation(uid, conversation) {
  const ref = collection(db, "users", uid, "conversations");

  const docRef = await addDoc(ref, {
    ...conversation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Get All Conversations
export async function getConversations(uid) {
  const ref = collection(db, "users", uid, "conversations");

  const q = query(ref, orderBy("updatedAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    firestoreId: d.id,
    ...d.data(),
  }));
}

// Update Conversation
export async function updateConversation(
  uid,
  firestoreId,
  conversation
) {
  const ref = doc(
    db,
    "users",
    uid,
    "conversations",
    firestoreId
  );

  await updateDoc(ref, {
    ...conversation,
    updatedAt: serverTimestamp(),
  });
}

// Delete Conversation
export async function deleteConversation(
  uid,
  firestoreId
) {
  const ref = doc(
    db,
    "users",
    uid,
    "conversations",
    firestoreId
  );

  await deleteDoc(ref);
}