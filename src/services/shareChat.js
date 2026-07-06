import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export async function shareChat(conversation) {
  const docRef = await addDoc(collection(db, "sharedChats"), {
    title: conversation.title,
    model: conversation.model || "gemini",
    messages: conversation.messages,
    createdAt: Date.now(),
  });

  return docRef.id;
}