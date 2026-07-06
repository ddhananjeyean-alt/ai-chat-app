import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Dialog, DialogContent } from "@mui/material";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/chat/ChatInput";
import { analyzeImage } from "./services/imageAnalysis";
import { getAIResponse } from "./services/groq";
import { generateImage } from "./services/imageGenerator";
import Login from "./auth/Login";
import { useAuth } from "./context/AuthContext";
import { useThemeContext } from "./theme/ThemeContext";
import SettingsDialog from "./components/SettingsDialog";
import ProfileDialog from "./pages/ProfileDialog";
import {
  saveImageBlob,
  getImageRecord,
  deleteImageRecord,
  migrateLegacyConversations,
} from "./services/imageDB";
function App() {

const {
  themeName,
  changeTheme,
  currentTheme,
  fontSize,
  setFontSize,
} = useThemeContext();

  const { currentUser } = useAuth();
console.log("Current User Email:", currentUser?.email);
console.log("Current User UID:", currentUser?.uid);
  const darkMode = currentTheme?.palette?.mode === "dark";
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
const [profileOpen, setProfileOpen] = useState(false);
useEffect(() => {
  }, [profileOpen]);
  
useEffect(() => {
  console.log("Current Font Size State:", fontSize);
}, [fontSize]);

useEffect(() => {
  localStorage.setItem("fontSize", fontSize);

  document.documentElement.style.setProperty(
    "--chat-font-size",
    fontSize === "small"
      ? "14px"
      : fontSize === "large"
      ? "18px"
      : "16px"
  );
}, [fontSize]);
const [settingsOpen, setSettingsOpen] = useState(false);
const toggleTheme = () => {
  changeTheme(themeName === "light" ? "midnight" : "light");
};

  const [conversations, setConversations] = useState([]);
  const [loadedConversations, setLoadedConversations] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [imageCache, setImageCache] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);

  const activeConversation =
    conversations.find((chat) => chat.id === activeChatId) || null;

  const [searchQuery, setSearchQuery] = useState("");

 const handlePrompt = (prompt) => {
  setMessage(prompt);
};

  const serializeConversations = useCallback((chats) => {
    return chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      archived: chat.archived || false,
      imageId: chat.imageId || null,
      imageName: chat.imageName || null,
      messages: Array.isArray(chat.messages)
        ? chat.messages.map((message) => ({
            sender: message.sender,
            text: message.text,
            imageId: message.imageId || null,
            imageName: message.imageName || null,
            image: message.image || null,
          }))
        : [],
    }));
  }, []);
  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  const blobToBase64 = async (blob) => {
    const dataUrl = await blobToDataUrl(blob);
    return String(dataUrl).split(",")[1];
  };

  const getDataUrlFromSource = async (source) => {
    if (!source) {
      throw new Error("Empty image source.");
    }

    if (source.startsWith("data:")) {
      return source;
    }

    const response = await fetch(source);
    if (!response.ok) {
      throw new Error("Failed to download generated image.");
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  };

  const isImageRequest = (prompt) => {
    if (!prompt?.trim()) return false;

    const normalized = prompt.trim().toLowerCase();
    const verbMatch = /^(?:generate|create|draw|make|paint|illustrate|render|produce|design|compose)\b/i.test(
      normalized
    );
    const imageNounMatch = /\b(image|picture|photo|illustration|art|scene|portrait|landscape|logo|poster|character|creature|animal|city|dragon|cat|robot|vehicle|architecture|castle|monster|nature|fantasy|scenery)\b/i.test(
      normalized
    );
    const visualVerbMatch = /(draw|paint|illustrate|render|design)\b/i.test(normalized);
    const textOnlyIntent = /\b(summary|explain|define|translate|tell me|news|joke|story|code|function|recipe|plan|email|letter|report|paragraph|essay|lyrics|poem|tweet|presentation|debug|fix)\b/i.test(
      normalized
    );

    return !textOnlyIntent && (imageNounMatch || (verbMatch && visualVerbMatch));
  };

  const loadImageSrc = useCallback(
    async (imageId) => {
      if (!imageId) return null;
      const cached = imageCache[imageId];
      if (cached?.src) {
        return cached.src;
      }
      try {
        const record = await getImageRecord(imageId);
        if (!record?.blob) {
          throw new Error("Image record not found");
        }
        const src = await blobToDataUrl(record.blob);
        setImageCache((prev) => ({
          ...prev,
          [imageId]: { src, status: "loaded" },
        }));
        return src;
      } catch (error) {
        setImageCache((prev) => ({
          ...prev,
          [imageId]: { src: null, status: "missing" },
        }));
        return null;
      }
    },
    [imageCache]
  );
useEffect(() => {
  const saved = localStorage.getItem("conversations");

  if (!saved) {
    setLoadedConversations(true);
    return;
  }

  try {
    const parsed = JSON.parse(saved);

    (async () => {
      const {
        conversations: initialConversations,
        migrated,
      } = await migrateLegacyConversations(parsed);

      setConversations(initialConversations);

      if (migrated) {
        localStorage.setItem(
          "conversations",
          JSON.stringify(
            serializeConversations(initialConversations)
          )
        );
      }

      setLoadedConversations(true);
    })();
  } catch {
    setConversations([]);
    setLoadedConversations(true);
  }
}, [serializeConversations]);
  useEffect(() => {
  if (!loadedConversations) return;

  localStorage.setItem(
    "conversations",
    JSON.stringify(
      serializeConversations(conversations)
    )
  );
}, [
  conversations,
  loadedConversations,
  serializeConversations,
]);
  useEffect(() => {
    if (!activeConversation?.imageId) {
      setSelectedImageId(null);
      setSelectedImageName(null);
      setSelectedImageSrc(null);
      return;
    }
    const imageId = activeConversation.imageId;
    setSelectedImageId(imageId);
    setSelectedImageName(activeConversation.imageName || null);
    loadImageSrc(imageId).then((src) => setSelectedImageSrc(src));
  }, [activeConversation, loadImageSrc]);
  useEffect(() => {
    const imageIds = new Set();
    if (activeConversation?.imageId) {
      imageIds.add(activeConversation.imageId);
    }
    activeConversation?.messages?.forEach((message) => {
      if (message.imageId) {
        imageIds.add(message.imageId);
      }
    });
    imageIds.forEach((imageId) => {
      if (!imageCache[imageId]?.src && imageCache[imageId]?.status !== "missing") {
        loadImageSrc(imageId).catch(() => {});
      }
    });
  }, [activeConversation, imageCache, loadImageSrc]);
  const closeImagePreview = () => {
    setPreviewOpen(false);
    setPreviewSrc(null);
  };
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageId = await saveImageBlob(file, file.name, file.type || "image/jpeg");
    const imageSrc = await blobToDataUrl(file);
    const imageName = file.name || "Uploaded image";
    setSelectedImageId(imageId);
    setSelectedImageName(imageName);
    setSelectedImageSrc(imageSrc);
    setImageCache((prev) => ({
      ...prev,
      [imageId]: { src: imageSrc, status: "loaded" },
    }));
    if (!activeChatId) {
      const newChat = {
        id: Date.now(),
        title: "New Image Chat",
        archived: false,
        imageId,
        imageName,
        messages: [],
      };
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      return;
    }

  };
  const handleRemoveImage = async () => {
    if (!activeChatId) return;
    const imageIdToRemove = activeConversation?.imageId || selectedImageId;
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              imageId: null,
              imageName: null,
            }
          : chat
      )
    );
    setSelectedImageId(null);
    setSelectedImageName(null);
    setSelectedImageSrc(null);
    if (imageIdToRemove) {
      await deleteImageRecord(imageIdToRemove).catch(() => {});
    }
  };
    const handleSend = async (messageToSend) => {
      const prompt = (messageToSend ?? message ?? "").trim();
if (!prompt || isTyping) return;
      console.log("Prompt:", prompt);
      console.log("Image Request:", isImageRequest(prompt));
      let currentChatId = activeChatId;
      let currentChat = conversations.find((chat) => chat.id === currentChatId);

      if (!currentChatId) {
        const newChat = {
          id: Date.now(),
          title: prompt.length > 35 ? `${prompt.substring(0, 35)}...` : prompt,
          archived: false,
          imageId: null,
          imageName: null,
          messages: [],
        };
        setConversations((prev) => [newChat, ...prev]);
        currentChatId = newChat.id;
        setActiveChatId(newChat.id);
        currentChat = newChat;
      }

 const userMessage = {
  sender: "user",
  text: prompt,
  imageId: selectedImageId,
  imageName: selectedImageName,
};

    const tempImageMessageId = `temp-image-${Date.now()}`;
    const generatingMessage = {
      id: tempImageMessageId,
      sender: "ai",
      text: "Generating image...",
      imageId: null,
      imageName: null,
    };



    setMessage("");
    setSelectedImageId(null);
    setSelectedImageName(null);
    setSelectedImageSrc(null);

    const isImageQuery = isImageRequest(prompt);
    setIsTyping(true);

    if (isImageQuery) {
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, generatingMessage] }
            : chat
        )
      );

      try {
        const generatedSource = await generateImage(prompt);

        setConversations((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === tempImageMessageId
                      ? {
                          ...msg,
                          text: "",
                          image: generatedSource,
                          imageName: prompt,
                        }
                      : msg
                  ),
                }
              : chat
          )
        );
      } catch (error) {
        console.error(error);
        setConversations((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === tempImageMessageId
                      ? {
                          ...msg,
                          text:
                            error?.message ||
                            "⚠️ Image generation failed. Please try again.",
                          imageId: null,
                          imageName: null,
                        }
                      : msg
                  ),
                }
              : chat
          )
        );
      } finally {
        setIsTyping(false);
      }

      return;
    }

   try {
  let history;

  if (editingMessageIndex !== null) {
    history = [...currentChat.messages];
    history[editingMessageIndex] = userMessage;
    history = history.slice(0, editingMessageIndex + 1);
  } else {
    history = currentChat
      ? [...currentChat.messages, userMessage]
      : [userMessage];
  }

  let aiReply;

      if (currentChat?.imageId) {
        const imageRecord = await getImageRecord(currentChat.imageId);
        const imageBase64 = imageRecord ? await blobToBase64(imageRecord.blob) : null;
        if (imageBase64) {
          aiReply = await analyzeImage(
            imageBase64,
            prompt,
            imageRecord.mimeType || "image/jpeg"
          );
        } else {
          aiReply = await getAIResponse(history);
        }
      } else {
        aiReply = await getAIResponse(history);
      }

      const aiMessage = {
        sender: "ai",
        text: aiReply,
      };
setConversations((prev) =>
  prev.map((chat) => {
    if (chat.id !== currentChatId) return chat;

    let updatedMessages = [...chat.messages];

    if (editingMessageIndex !== null) {
      updatedMessages[editingMessageIndex] = userMessage;
      updatedMessages = updatedMessages.slice(
        0,
        editingMessageIndex + 1
      );
    } else {
      updatedMessages.push(userMessage);
    }

    updatedMessages.push(aiMessage);

    return {
      ...chat,
      messages: updatedMessages,
    };
  })
);

setEditingMessageIndex(null);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        sender: "ai",
        text: "⚠️ Something went wrong.",
      };
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsTyping(false);
    }
  };
  const handleRegenerate = async (messageIndex) => {
    if (!activeConversation) return;
    const messages = activeConversation.messages;
    const messageToRegenerate = messages[messageIndex];
    if (!messageToRegenerate || messageToRegenerate.sender !== "ai") {
      return;
    }
    const history = messages.slice(0, messageIndex);
    setIsTyping(true);
    try {
      const aiReply = await getAIResponse(history);
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        sender: "ai",
        text: aiReply,
      };
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId ? { ...chat, messages: updatedMessages } : chat
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };
  const handleImageClick = async (imageOrId) => {
    if (!imageOrId) return;

    if (typeof imageOrId === "string" && /^https?:\/\//.test(imageOrId)) {
      setPreviewSrc(imageOrId);
      setPreviewOpen(true);
      return;
    }

    const src = await loadImageSrc(imageOrId);
    if (src) {
      setPreviewSrc(src);
      setPreviewOpen(true);
    }
  };
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
const handleEdit = (messageIndex, text) => {
  if (!activeConversation) return;

  const messageToEdit = activeConversation.messages[messageIndex];

  if (!messageToEdit || messageToEdit.sender !== "user") return;

  setEditingMessageIndex(messageIndex);
  setMessage(text);
};
  const clearChat = () => setActiveChatId(null);
  const deleteChat = async (chatId) => {
    const chatToDelete = conversations.find((chat) => chat.id === chatId);
    if (chatToDelete) {
      const imageIds = new Set();
      if (chatToDelete.imageId) imageIds.add(chatToDelete.imageId);
      chatToDelete.messages.forEach((messageItem) => {
        if (messageItem.imageId) imageIds.add(messageItem.imageId);
      });
      await Promise.all(
        Array.from(imageIds).map((id) => deleteImageRecord(id).catch(() => {}))
      );
    }
    setConversations((prev) => prev.filter((chat) => chat.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };
const archiveChat = (chatId) => {
  setConversations((prev) => {
    const updated = prev.map((chat) =>
      chat.id === chatId
        ? { ...chat, archived: true }
        : chat
    );

    // If the archived chat was active, switch to another non-archived chat
    if (activeChatId === chatId) {
      const nextChat = updated.find(
        (chat) => !chat.archived && chat.id !== chatId
      );

      setActiveChatId(nextChat ? nextChat.id : null);
    }

    return updated;
  });
};
  const renameChat = (chatId, newTitle) => {
    if (!newTitle?.trim()) return;
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      )
    );
  };  
  const handleDeleteAllChats = async () => {
  if (conversations.length) {
    const imageIds = new Set();

    conversations.forEach((chat) => {
      if (chat.imageId) imageIds.add(chat.imageId);

      chat.messages.forEach((msg) => {
        if (msg.imageId) imageIds.add(msg.imageId);
      });
    });

    await Promise.all(
      Array.from(imageIds).map((id) =>
        deleteImageRecord(id).catch(() => {})
      )
    );
  }

  localStorage.removeItem("conversations");

  setConversations([]);
  setActiveChatId(null);

  setSettingsOpen(false);
};

const exportChatPDF = async () => {
  if (!activeConversation) {
    alert("No chat selected");
    return;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(activeConversation.title || "AI Chat Export", 10, y);

  y += 15;

  let questionNumber = 1;

  for (let i = 0; i < activeConversation.messages.length; i++) {
    const msg = activeConversation.messages[i];

    if (msg.sender === "user") {
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(`Question ${questionNumber}`, 10, y);

      y += 8;

      doc.setFont(undefined, "normal");
      const questionLines = doc.splitTextToSize(msg.text, 180);
      doc.text(questionLines, 10, y);

      y += questionLines.length * 7 + 10;

      const nextMessage = activeConversation.messages[i + 1];

      if (nextMessage && nextMessage.sender === "ai") {
        doc.setFont(undefined, "bold");
        doc.text("Answer", 10, y);

        y += 8;

        doc.setFont(undefined, "normal");
        const answerLines = doc.splitTextToSize(nextMessage.text, 180);
        doc.text(answerLines, 10, y);

        y += answerLines.length * 7 + 15;
      }

      questionNumber++;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    }
  }

  doc.save(`${activeConversation.title || "AI_Chat"}.pdf`);
};

 const handleShareChat = async () => {
  if (!activeChatId) {
    alert("No chat selected");
    return;
  }

  try {
    const currentConversation = conversations.find(
      (chat) => chat.id === activeChatId
    );

    if (!currentConversation) {
      alert("Conversation not found.");
      return;
    }

    const conversationToShare = JSON.parse(
      JSON.stringify(currentConversation)
    );

    const shareId = crypto.randomUUID();

    const sharedChats =
      JSON.parse(localStorage.getItem("sharedChats")) || {};

console.log("Conversation to Share:", conversationToShare);
console.log("Messages:", conversationToShare.messages);
console.log(
  "Last Message:",
  conversationToShare.messages[conversationToShare.messages.length - 1]
);

console.log(
  "Conversation to Share:",
  JSON.stringify(conversationToShare, null, 2)
);

    sharedChats[shareId] = conversationToShare;

    localStorage.setItem(
      "sharedChats",
      JSON.stringify(sharedChats)
    );

    const shareUrl = `${window.location.origin}/share/${shareId}`;

    await navigator.clipboard.writeText(shareUrl);

    alert(`Share link copied!\n\n${shareUrl}`);
  } catch (error) {
    console.error("Share Error:", error);
    alert("Failed to share chat.");
  }
};

const messagePreviews = (activeConversation?.messages || []).map((msg) => ({
  ...msg,
  image: msg.image || (msg.imageId ? imageCache[msg.imageId]?.src : null),
}));

// Show login page if the user is not authenticated
if (!currentUser) {
  return <Login />;
}
console.log("Current message state:", message);
return (
    <>
      <Box
        sx={{ 
          display: "flex",
          width: "100vw",
          height: "100vh",
          background: darkMode ? "#212121" : "#FFFFFF",
          overflow: "hidden",
        }}
      >
<Sidebar
  chats={conversations}
  currentChatId={activeChatId}
  onSelectChat={setActiveChatId}

  onNewChat={clearChat}

  onRenameChat={renameChat}
  onDeleteChat={deleteChat}
  onArchiveChat={archiveChat}

  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}

  currentUser={currentUser}

  onOpenProfile={() => {
    setProfileOpen(true);
  }}

  onOpenSettings={() => {
    setSettingsOpen(true);
  }}
/>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
 <Paper
  elevation={0}
  sx={{
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    background: darkMode ? "#212121" : "#FFFFFF",
    overflow: "hidden",
  }}
> 
           <Header
  onToggleSidebar={() => {}}
  chatTitle={activeConversation?.title || "New Conversation"}
  onShare={handleShareChat}
  darkMode={darkMode}
  onToggleTheme={toggleTheme}
  sidebarOpen={true}
/>

<Box
  sx={{
    flex: 1,
    position: "relative",
    overflow: "visible",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    paddingBottom: "110px", // reserve space for ChatInput
  }}
>
<ChatWindow
  darkMode={darkMode}
  messages={messagePreviews}
  imageCache={imageCache}
  isTyping={isTyping}
  handleRegenerate={handleRegenerate}
  handleEdit={handleEdit}
  handleImageClick={handleImageClick}
  setMessage={setMessage}
  currentUser={currentUser}
  onSelectPrompt={handlePrompt}
  fontSize={fontSize}
/>

  <ChatInput
    darkMode={darkMode}
    message={message}
    setMessage={setMessage}
    handleSend={handleSend}
    handleImageUpload={handleImageUpload}
    selectedImage={selectedImageSrc}
    selectedImageName={selectedImageName}
    removeImage={handleRemoveImage}
  />
</Box>
          </Paper>
        </Box>
      </Box>

 console.log("profileOpen =", profileOpen);

<ProfileDialog
  open={profileOpen}
  onClose={() => setProfileOpen(false)}
  currentUser={currentUser}
/>

<SettingsDialog
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  darkMode={darkMode}
  fontSize={fontSize}
  setFontSize={setFontSize}
  onDeleteAllChats={handleDeleteAllChats}
/>


      <Dialog
        open={previewOpen}
        onClose={closeImagePreview}
        maxWidth={false}
        PaperProps={{
          sx: {
            background: "transparent",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            m: 0,
            background: "transparent",
          }}
        >
          {previewSrc && (
            <Box
              component="img"
              src={previewSrc}
              alt="preview"
              sx={{
                display: "block",
                maxWidth: "90vw",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export default App;
