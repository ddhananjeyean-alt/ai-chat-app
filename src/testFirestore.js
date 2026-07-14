import { db } from "./firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function testFirestore() {
  try {
    await setDoc(doc(db, "test", "hello"), {
      message: "Hello Firestore",
    });

    console.log("Firestore works!");
  } catch (err) {
    console.error(err);
  }
}