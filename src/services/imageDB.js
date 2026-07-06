const DB_NAME = "ai-chat-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

function generateImageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export async function saveImageBlob(blob, name = "image", mimeType = null) {
  const id = generateImageId();
  const record = {
    id,
    name,
    mimeType: mimeType || blob.type || "image/jpeg",
    blob,
    createdAt: Date.now(),
  };
  await withStore("readwrite", (store) => store.add(record));
  return id;
}

export async function getImageRecord(id) {
  if (!id) return null;
  return await withStore("readonly", (store) => store.get(id));
}

export async function deleteImageRecord(id) {
  if (!id) return;
  await withStore("readwrite", (store) => store.delete(id));
}

export async function saveImageDataUrl(dataUrl, name = "image") {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || (dataUrl.split(",")[0].match(/data:([^;]+);base64/)?.[1] ?? "image/jpeg");
  return saveImageBlob(blob, name, mimeType);
}

function buildDataUrlFromLegacy(image, imageBase64, imageMimeType) {
  if (typeof image === "string" && image.startsWith("data:")) {
    return image;
  }
  if (imageBase64) {
    const mime = imageMimeType || "image/jpeg";
    return `data:${mime};base64,${imageBase64}`;
  }
  return null;
}

export async function migrateLegacyConversations(conversations) {
  if (!Array.isArray(conversations)) {
    return { conversations: [], migrated: false };
  }

  let migrated = false;
  const result = [];

  for (const convo of conversations) {
    const chat = {
      id: convo.id,
      title: convo.title || "Untitled Chat",
      archived: convo.archived || false,
      imageId: convo.imageId || null,
      imageName: convo.imageName || null,
      messages: [],
    };

    const legacyChatImageDataUrl = buildDataUrlFromLegacy(
      convo.image,
      convo.imageBase64,
      convo.imageMimeType
    );

    if (!chat.imageId && legacyChatImageDataUrl) {
      chat.imageId = await saveImageDataUrl(legacyChatImageDataUrl, convo.imageName || "uploaded-image");
      chat.imageName = convo.imageName || "uploaded-image";
      migrated = true;
    }

    const legacyMessages = Array.isArray(convo.messages) ? convo.messages : [];
    for (const message of legacyMessages) {
      const migratedMessage = {
        sender: message.sender,
        text: message.text,
        imageId: message.imageId || null,
        imageName: message.imageName || null,
      };

      const legacyMessageImageDataUrl = buildDataUrlFromLegacy(
        message.image,
        message.imageBase64,
        message.imageMimeType
      );

      if (!migratedMessage.imageId && legacyMessageImageDataUrl) {
        migratedMessage.imageId = await saveImageDataUrl(
          legacyMessageImageDataUrl,
          message.imageName || "uploaded-image"
        );
        migratedMessage.imageName = message.imageName || "uploaded-image";
        migrated = true;
      }

      chat.messages.push(migratedMessage);
    }

    result.push(chat);
  }

  return { conversations: result, migrated };
}
