import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Dialog, DialogContent } from "@mui/material";
import { motion } from "framer-motion";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/layout/Header";
import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/chat/ChatInput";
import { analyzeImage } from "./services/imageAnalysis";
import { getAIResponse } from "./services/groq";
import { generateImage } from "./services/imageGenerator";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { useThemeContext } from "./theme/ThemeContext";
import SettingsDialog from "./components/SettingsDialog";
import ProfileDialog from "./components/ProfileDialog";
import ByteWelcomeGuide from "./companion/byte/ByteWelcomeGuide";
import { useRef } from "react";
import { ThemeEvents } from "./companion/byte/ThemeEvents";
import ThemeRope from "./companion/byte/ThemeRope";
import ThemeTransitionOverlay from "./companion/byte/ThemeTransitionOverlay";
import { DeleteEvents } from "./companion/byte/DeleteEvents";
import { ArchiveEvents } from "./companion/byte/ArchiveEvents";
import { RestoreEvents } from "./companion/byte/RestoreEvents";
import RestoreAnimationController from "./companion/byte/RestoreAnimationController";
import UndoDeleteAnimationController from "./companion/byte/UndoDeleteAnimationController";
import ShareAnimationController from "./companion/byte/ShareAnimationController";
import ShareEnvelopeAnimationController from "./companion/byte/ShareEnvelopeAnimationController";
import ShareEnvelopeOverlay from "./companion/byte/ShareEnvelopeOverlay";
import PaperAirplaneOverlay from "./companion/byte/PaperAirplaneOverlay";
import { useByte, BYTE_STATES } from "./context/ByteContext";

import {
  saveImageBlob,
  getImageRecord,
  deleteImageRecord,
  migrateLegacyConversations,
} from "./services/imageDB";

const safeSaveConversations = (conversations) => {
  try {
    if (!Array.isArray(conversations)) return;
    const sanitized = conversations.map((chat) => {
      if (!chat || !chat.id) return null;
      return {
        id: chat.id,
        title: chat.title || "Untitled Chat",
        archived: Boolean(chat.archived),
        imageId: chat.imageId || null,
        imageName: chat.imageName || null,
        messages: Array.isArray(chat.messages)
          ? chat.messages.map((msg) => ({
              sender: msg.sender,
              text: msg.text || "",
              imageId: msg.imageId || null,
              imageName: msg.imageName || null,
              image: msg.image || null,
            }))
          : [],
      };
    }).filter(Boolean);

    localStorage.setItem("conversations", JSON.stringify(sanitized));
  } catch (error) {
    console.error("safeSaveConversations failed:", error);
  }
};

function App() {

  // --- 1. React hooks (useState, useRef, useContext, custom hooks) ---
  const chatBoundsRef = useRef(null);
  const deleteQueueRef = useRef([]);
  const isDeletingRef = useRef(false);
  const executeActualDeleteRef = useRef(null);
  const archiveQueueRef = useRef([]);
  const isArchivingRef = useRef(false);
  const executeActualArchiveRef = useRef(null);
  const isAnimatingThemeRef = useRef(false);
  const streamingIntervalRef = useRef(null);
  const streamResolverRef = useRef(null);

  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadedConversations, setLoadedConversations] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [imageCache, setImageCache] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);

  const { 
    byteState, 
    setByteState,
    onUserTyping,
    triggerNewChatWelcome,
    triggerImageUploadSequence,
    cancelWelcome,
  } = useByte();

  const {
    themeName,
    changeTheme,
    currentTheme,
    fontSize,
    setFontSize,
  } = useThemeContext();

  const {
    currentUser,
    logout,
    loading,
    isAuthenticated,
  } = useAuth();

  // --- 2. Derived values ---
  const activeConversation =
    conversations.find((chat) => chat.id === activeChatId) || null;

  // --- 3. Variables depending on activeConversation ---
  const messagePreviews = Array.isArray(activeConversation?.messages)
    ? activeConversation.messages.map((msg) => {
        if (!msg) return null;
        return {
          ...msg,
          image: msg.image || (msg.imageId ? imageCache[msg.imageId]?.src : null),
        };
      }).filter(Boolean)
    : [];

  const darkMode = currentTheme?.palette?.mode === "dark";
  const globalBg = darkMode
    ? "linear-gradient(135deg, #07080d 0%, #0d0f17 100%)"
    : "radial-gradient(circle at 50% 50%, #F8FAFD 0%, #E9F0FA 100%)";

  console.log("Current User Email:", currentUser?.email);
  console.log("Current User UID:", currentUser?.uid);

  // --- 4. useEffect / callbacks referencing activeConversation or others ---
  useEffect(() => {
    if (message && message.trim().length > 0) {
      onUserTyping();
    }
  }, [message, onUserTyping]);

  useEffect(() => {
    if (activeConversation && activeConversation.messages && activeConversation.messages.length > 0) {
      cancelWelcome();
    }
  }, [activeConversation?.id, activeConversation?.messages?.length, cancelWelcome]);

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

  const toggleTheme = (coords) => {
    if (isAnimatingThemeRef.current || isArchivingRef.current || isDeletingRef.current) return;
    isAnimatingThemeRef.current = true;

    const x = coords?.x ?? (window.innerWidth - 100);
    const y = coords?.y ?? 56;
    const targetTheme = themeName === "light" ? "midnight" : "light";

    ThemeEvents.publish(ThemeEvents.TRIGGER, { x, y, targetTheme });
  };

  useEffect(() => {
    const unsubComplete = ThemeEvents.subscribe(ThemeEvents.COMPLETE, () => {
      isAnimatingThemeRef.current = false;
    });

    return () => {
      unsubComplete();
    };
  }, []);


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

    const imageKeywords = [
      "generate image", "create image", "generate a picture", "create a picture", 
      "draw a", "paint a", "generate an image", "create an image", "generate picture", 
      "create picture", "generate artwork", "create artwork", "show me a picture of",
      "show me an image of"
    ];
    if (imageKeywords.some(keyword => normalized.includes(keyword))) {
      return true;
    }

    const hasDrawVerb = /\b(draw|paint|generate|create|make|illustrate|render|sketch)\b/i.test(normalized);
    const hasImageNoun = /\b(image|picture|photo|illustration|drawing|painting|artwork|portrait|sketch|logo|banner|poster|render)\b/i.test(normalized);
    
    if (hasDrawVerb && hasImageNoun) {
      return true;
    }
    
    if (/^(?:draw|paint|illustrate|sketch|generate|create)\b/i.test(normalized)) {
      return true;
    }

    return false;
  };

  const refineImagePrompt = async (rawPrompt, history = []) => {
    try {
      const recentHistory = history.slice(-5);
      const formattedMessages = [
        {
          role: "system",
          content: "You are an expert prompt engineer. Convert the user's request and recent history into a clean, highly descriptive English prompt for an image generator (like Stable Diffusion). Output ONLY the refined prompt text. Do NOT wrap it in quotes, code blocks, or say 'Here is your prompt'. Do NOT include conversational reply text."
        },
        ...recentHistory.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text || ""
        })),
        {
          role: "user",
          content: `Refine this request into a clean image description: "${rawPrompt}"`
        }
      ];

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (apiKey) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: formattedMessages,
            temperature: 0.5,
            max_tokens: 150
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && !content.includes("⚠️") && content.length > 3) {
            return content.replace(/^["']|["']$/g, '').trim();
          }
        }
      }
    } catch (error) {
      console.warn("Failed to refine image prompt using AI, falling back to cleaned prompt:", error);
    }

    let clean = rawPrompt.replace(/^(generate|create|draw|make|paint|illustrate|render|design|sketch|show me)\b\s*(an?\s*(image|picture|photo|illustration|drawing|painting|artwork|portrait|sketch|logo|banner|poster|render)\s*(of)?)?/i, "");
    return clean.trim() || rawPrompt;
  };

  const loadImageSrc = useCallback(
    async (imageId) => {
      if (!imageId) return null;
      try {
        const record = await getImageRecord(imageId);
        if (!record?.blob) {
          throw new Error("Image record not found");
        }
        const src = await blobToDataUrl(record.blob);
        setImageCache((prev) => {
          if (prev[imageId]?.src === src) return prev;
          return {
            ...prev,
            [imageId]: { src, status: "loaded" },
          };
        });
        return src;
      } catch (error) {
        setImageCache((prev) => {
          if (prev[imageId]?.status === "missing") return prev;
          return {
            ...prev,
            [imageId]: { src: null, status: "missing" },
          };
        });
        return null;
      }
    },
    []
  );
  useEffect(() => {
    let saved;
    try {
      saved = localStorage.getItem("conversations");
    } catch (e) {
      console.error("Failed to read conversations from localStorage:", e);
      setLoadedConversations(true);
      return;
    }

    if (!saved) {
      setLoadedConversations(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error("Stored conversations is not an array");
      }

      (async () => {
        try {
          const {
            conversations: initialConversations,
            migrated,
          } = await migrateLegacyConversations(parsed);

          setConversations(initialConversations);

          if (migrated) {
            safeSaveConversations(initialConversations);
          }
        } catch (err) {
          console.error("Migration error, using parsed fallback:", err);
          setConversations(parsed);
        } finally {
          setLoadedConversations(true);
        }
      })();
    } catch (e) {
      console.error("JSON parsing/validation error in conversations load:", e);
      setConversations([]);
      setLoadedConversations(true);
    }
  }, []);

  useEffect(() => {
    if (!loadedConversations) return;
    safeSaveConversations(conversations);
  }, [conversations, loadedConversations]);
  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      setSelectedImageId((prev) => (prev !== null ? null : prev));
      setSelectedImageName((prev) => (prev !== null ? null : prev));
      setSelectedImageSrc((prev) => (prev !== null ? null : prev));
      return;
    }

    if (!activeConversation?.imageId) {
      setSelectedImageId((prev) => (prev !== null ? null : prev));
      setSelectedImageName((prev) => (prev !== null ? null : prev));
      setSelectedImageSrc((prev) => (prev !== null ? null : prev));
      return;
    }
    const imageId = activeConversation.imageId;
    setSelectedImageId((prev) => {
      if (prev !== imageId) {
        setSelectedImageName(activeConversation.imageName || null);
        loadImageSrc(imageId).then((src) => setSelectedImageSrc(src));
        return imageId;
      }
      return prev;
    });
  }, [activeConversation?.id, activeConversation?.imageId, activeConversation?.imageName, activeConversation?.messages?.length, loadImageSrc]);

  useEffect(() => {
    const cleanupUnsentImage = async (idToClean) => {
      if (!idToClean) return;
      
      let isReferenced = false;
      for (const chat of conversations) {
        if (chat.imageId === idToClean) {
          isReferenced = true;
          break;
        }
        if (chat.messages) {
          for (const msg of chat.messages) {
            if (msg.imageId === idToClean) {
              isReferenced = true;
              break;
            }
          }
        }
        if (isReferenced) break;
      }

      if (!isReferenced) {
        await deleteImageRecord(idToClean).catch(() => {});
      }
    };

    if (selectedImageId) {
      cleanupUnsentImage(selectedImageId);
    }

    setSelectedImageId(null);
    setSelectedImageName(null);
    setSelectedImageSrc(null);
  }, [activeChatId]);
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
      setImageCache((prev) => {
        const cached = prev[imageId];
        if (!cached?.src && cached?.status !== "missing" && cached?.status !== "loading") {
          loadImageSrc(imageId).catch(() => {});
          return {
            ...prev,
            [imageId]: { src: null, status: "loading" },
          };
        }
        return prev;
      });
    });
  }, [activeConversation?.id, activeConversation?.imageId, activeConversation?.messages?.length, loadImageSrc]);
  const closeImagePreview = () => {
    setPreviewOpen(false);
    setPreviewSrc(null);
  };
  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be smaller than 5MB.");
        return;
      }

      triggerImageUploadSequence();
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


    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to process the uploaded image. Please try again.");
    }
  };
  const handleRemoveImage = async () => {
    const imageIdToRemove = selectedImageId;

    setSelectedImageId(null);
    setSelectedImageName(null);
    setSelectedImageSrc(null);

    if (activeConversation && activeConversation.messages.length === 0 && activeConversation.imageId) {
      const chatImageId = activeConversation.imageId;
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, imageId: null, imageName: null }
            : chat
        )
      );
      if (chatImageId) {
        await deleteImageRecord(chatImageId).catch(() => { });
      }
    }

    if (imageIdToRemove) {
      await deleteImageRecord(imageIdToRemove).catch(() => { });
    }
  };

  const streamMessageText = async (chatId, messageId, fullText, onDone) => {
    const words = fullText.split(" ");
    let currentText = "";
    let wordIndex = 0;
    
    // De-assert typing so the thinking animation fades out smoothly
    setIsTyping(false);

    return new Promise((resolve) => {
      streamResolverRef.current = resolve;
      
      const interval = setInterval(() => {
        try {
          if (wordIndex >= words.length) {
            clearInterval(interval);
            streamingIntervalRef.current = null;
            streamResolverRef.current = null;
            
            // Trigger AI completion soft glow ripple ripple
            setConversations((prev) => {
              const next = prev.map((chat) =>
                chat.id === chatId
                  ? {
                      ...chat,
                      messages: chat.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, playCompleteEffect: true } : msg
                      ),
                    }
                  : chat
              );
              return next;
            });

            // Remove the complete ripple effect after 350ms
            setTimeout(() => {
              setConversations((prev) => {
                const next = prev.map((chat) =>
                  chat.id === chatId
                    ? {
                        ...chat,
                        messages: chat.messages.map((msg) =>
                          msg.id === messageId ? { ...msg, playCompleteEffect: false } : msg
                        ),
                      }
                    : chat
                );
                safeSaveConversations(next);
                return next;
              });
            }, 350);

            onDone?.();
            resolve();
            return;
          }

          // Stream 2-3 words per frame to look like AI typing
          const nextWords = words.slice(wordIndex, wordIndex + 2).join(" ");
          currentText = currentText ? `${currentText} ${nextWords}` : nextWords;
          wordIndex += 2;

          setConversations((prev) =>
            prev.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.map((msg) =>
                      msg.id === messageId ? { ...msg, text: currentText } : msg
                    ),
                  }
                : chat
            )
          );
        } catch (e) {
          console.error("Error in streaming interval:", e);
          clearInterval(interval);
          streamingIntervalRef.current = null;
          streamResolverRef.current = null;
          resolve();
        }
      }, 45);
      
      streamingIntervalRef.current = interval;
    });
  };

  const handleSend = async (messageToSend) => {
    const prompt = (messageToSend ?? message ?? "").trim();
    if (activeChatId === "search") {
      const query = prompt.toLowerCase();
      const firstMatch = conversations.filter(c => !c.archived).find(c => {
        const titleMatch = (c.title || "").toLowerCase().includes(query);
        const messageMatch = Array.isArray(c.messages) && c.messages.some(
          (m) => (m.text || "").toLowerCase().includes(query)
        );
        return titleMatch || messageMatch;
      });
      if (firstMatch) {
        setActiveChatId(firstMatch.id);
        setMessage("");
      }
      return;
    }
    const hasImage = Boolean(selectedImageId);
    
    if ((!prompt && !hasImage) || isGenerating || isGeneratingRef.current) return;
    
    isGeneratingRef.current = true;
    setIsGenerating(true);
    
    let currentChatId = activeChatId;
    let currentChat = conversations.find((chat) => chat.id === currentChatId);

    if (!currentChatId) {
      const newChat = {
        id: Date.now(),
        title: prompt ? (prompt.length > 35 ? `${prompt.substring(0, 35)}...` : prompt) : "New Image Chat",
        archived: false,
        imageId: selectedImageId,
        imageName: selectedImageName,
        messages: [],
      };
      setConversations((prev) => [newChat, ...prev]);
      currentChatId = newChat.id;
      setActiveChatId(newChat.id);
      currentChat = newChat;
    }

    const userMessage = {
      id: `user-msg-${Date.now()}`,
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
      setByteState(BYTE_STATES.GENERATING);
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, userMessage, generatingMessage] }
            : chat
        )
      );

      try {
        const textHistory = (currentChat?.messages || []).filter(
          (msg) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text)
        );
        const refinedPrompt = await refineImagePrompt(prompt, textHistory);
        
        if (!isGeneratingRef.current) return;

        const generatedSource = await generateImage(refinedPrompt);

        if (!isGeneratingRef.current) return;

        setConversations((prev) => {
          const next = prev.map((chat) =>
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
          );
          safeSaveConversations(next);
          return next;
        });
        setByteState(BYTE_STATES.SUCCESS);
      } catch (error) {
        console.error(error);
        if (!isGeneratingRef.current) return;
        setByteState(BYTE_STATES.ERROR);
        setConversations((prev) => {
          const next = prev.map((chat) =>
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
          );
          safeSaveConversations(next);
          return next;
        });
      } finally {
        setIsTyping(false);
        setIsGenerating(false);
        isGeneratingRef.current = false;
      }

      return;
    }

    const tempAiMessageId = `ai-msg-${Date.now()}`;
    const initialAiMessage = {
      id: tempAiMessageId,
      sender: "ai",
      text: "",
    };

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

          updatedMessages.push(initialAiMessage);

          return {
            ...chat,
            messages: updatedMessages,
          };
        })
      );

      let aiReply;
      let initialByteState = BYTE_STATES.THINKING;
      const turnImageId = userMessage.imageId;

      if (turnImageId) {
        initialByteState = BYTE_STATES.ANALYZING;
      } else if (
        prompt.toLowerCase().includes("search") || 
        prompt.toLowerCase().includes("google") || 
        prompt.toLowerCase().includes("weather") || 
        prompt.toLowerCase().includes("news")
      ) {
        initialByteState = BYTE_STATES.SEARCHING;
      }
      setByteState(initialByteState);

      if (initialByteState === BYTE_STATES.SEARCHING) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else if (initialByteState === BYTE_STATES.ANALYZING) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setByteState(BYTE_STATES.THINKING);
      }

      if (!isGeneratingRef.current) return;

      const filteredHistory = history.filter(
        (msg) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text)
      );

      if (turnImageId) {
        try {
          const imageRecord = await getImageRecord(turnImageId);
          const imageBase64 = imageRecord ? await blobToBase64(imageRecord.blob) : null;
          if (imageBase64) {
            aiReply = await analyzeImage(
              imageBase64,
              prompt || "Describe this image.",
              imageRecord.mimeType || "image/jpeg"
            );
          } else {
            throw new Error("Uploaded image could not be loaded from database.");
          }
        } catch (err) {
          console.error("Image analysis error:", err);
          aiReply = "⚠️ Failed to analyze the image. Please try again.";
        }
      } else {
        aiReply = await getAIResponse(filteredHistory);
      }

      setEditingMessageIndex(null);

      if (!isGeneratingRef.current) return;

      await streamMessageText(currentChatId, tempAiMessageId, aiReply, () => {
        setByteState(BYTE_STATES.SUCCESS);
      });

    } catch (error) {
      console.error(error);
      if (!isGeneratingRef.current) return;
      setByteState(BYTE_STATES.ERROR);
      setConversations((prev) => {
        const next = prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === tempAiMessageId
                    ? { ...msg, text: "⚠️ Something went wrong." }
                    : msg
                ),
              }
            : chat
        );
        safeSaveConversations(next);
        return next;
      });
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const handleStopGeneration = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    if (streamResolverRef.current) {
      streamResolverRef.current();
      streamResolverRef.current = null;
    }
    setIsTyping(false);
    setIsGenerating(false);
    isGeneratingRef.current = false;
    setByteState(BYTE_STATES.SUCCESS);

    setConversations((prev) => {
      safeSaveConversations(prev);
      return prev;
    });
  };

  const handleRegenerate = async (messageIndex) => {
    if (!activeConversation || isGenerating || isGeneratingRef.current) return;
    const messages = activeConversation.messages;
    if (!Array.isArray(messages)) return;
    const messageToRegenerate = messages[messageIndex];
    if (!messageToRegenerate || messageToRegenerate.sender !== "ai") {
      return;
    }
    const history = messages.slice(0, messageIndex);
    const filteredHistory = history.filter(
      (msg) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text)
    );
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setIsTyping(true);
    setByteState(BYTE_STATES.THINKING);
    try {
      const aiReply = await getAIResponse(filteredHistory);

      const tempAiMessageId = messageToRegenerate.id || `ai-msg-${Date.now()}`;
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.map((msg, idx) =>
                  idx === messageIndex ? { ...msg, id: tempAiMessageId, text: "" } : msg
                ),
              }
            : chat
        )
      );

      await streamMessageText(activeChatId, tempAiMessageId, aiReply, () => {
        setByteState(BYTE_STATES.SUCCESS);
      });
    } catch (error) {
      console.error(error);
      setByteState(BYTE_STATES.ERROR);
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
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
  const handleEdit = (messageIndex, text) => {
    if (!activeConversation) return;

    const messageToEdit = activeConversation.messages[messageIndex];

    if (!messageToEdit || messageToEdit.sender !== "user") return;

    setEditingMessageIndex(messageIndex);
    setMessage(text);
  };
  const clearChat = () => {
    setActiveChatId(null);
    triggerNewChatWelcome();
  };
  const deleteChat = (chatId) => {
    if (isAnimatingThemeRef.current) return;
    DeleteEvents.publish(DeleteEvents.DELETE_CHAT_REQUEST, { chatId });
  };
  const triggerArchiveAnimation = (chatId) => {
    if (isAnimatingThemeRef.current) return;
    if (isArchivingRef.current) {
      if (!archiveQueueRef.current.includes(chatId)) {
        archiveQueueRef.current.push(chatId);
      }
      return;
    }
    isArchivingRef.current = true;

    const element = document.getElementById("chat-wheel-item-" + chatId) || document.getElementById("search-result-item-" + chatId);
    if (!element) {
      // Execute immediately if DOM element not found
      executeActualArchiveRef.current?.(chatId);
      isArchivingRef.current = false;
      return;
    }

    const rect = element.getBoundingClientRect();
    const coords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    // Publish event to trigger Byte's carry animation
    ArchiveEvents.publish(ArchiveEvents.TRIGGER, { chatId, coords });
  };

  useEffect(() => {
    const unsubComplete = ArchiveEvents.subscribe(ArchiveEvents.COMPLETE, ({ chatId }) => {
      if (chatId) {
        executeActualArchiveRef.current?.(chatId);
      }
      const nextChatId = archiveQueueRef.current.shift();
      if (nextChatId) {
        setTimeout(() => {
          isArchivingRef.current = false;
          triggerArchiveAnimation(nextChatId);
        }, 300);
      } else {
        isArchivingRef.current = false;
      }
    });
    return () => unsubComplete();
  }, []);

  executeActualArchiveRef.current = (chatId) => {
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

  const handleLogout = useCallback(async () => {
    console.log("[App] handleLogout triggered");
    setActiveChatId(null);
    setConversations([]);
    setMessage("");
    setIsTyping(false);
    setIsGenerating(false);
    isGeneratingRef.current = false;
    setProfileOpen(false);
    setSettingsOpen(false);
    setArchivedDialogOpen(false);
    
    isArchivingRef.current = false;
    archiveQueueRef.current = [];
    isDeletingRef.current = false;
    deleteQueueRef.current = [];

    await logout();
  }, [logout]);

  const archiveChat = (chatId) => {
    triggerArchiveAnimation(chatId);
  };

  const restoreChat = (chatId) => {
    RestoreEvents.publish(RestoreEvents.ARCHIVE_RESTORE_REQUEST, { chatId });
  };

  const deleteChatPermanently = async (chatId) => {
    const chatToDelete = conversations.find((chat) => chat.id === chatId);
    if (chatToDelete) {
      const imageIds = new Set();
      if (chatToDelete.imageId) imageIds.add(chatToDelete.imageId);
      if (Array.isArray(chatToDelete.messages)) {
        chatToDelete.messages.forEach((messageItem) => {
          if (messageItem && messageItem.imageId) imageIds.add(messageItem.imageId);
        });
      }
      await Promise.all(
        Array.from(imageIds).map((id) => deleteImageRecord(id).catch(() => { }))
      );
    }
    setConversations((prev) => prev.filter((chat) => chat.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
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

        if (Array.isArray(chat.messages)) {
          chat.messages.forEach((msg) => {
            if (msg && msg.imageId) imageIds.add(msg.imageId);
          });
        }
      });

      await Promise.all(
        Array.from(imageIds).map((id) =>
          deleteImageRecord(id).catch(() => { })
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
    if (window.ShareEnvelopeAnimationActive) {
      console.log("[ShareChat] Share envelope animation is already active, ignoring request");
      return;
    }

    if (!activeChatId) {
      alert("No chat selected");
      return;
    }

    try {
      const currentConversation = conversations.find(
        (chat) => chat.id === activeChatId
      );

      if (!currentConversation) {
        alert("Conversation not found");
        return;
      }

      const conversationToShare = {
        ...JSON.parse(JSON.stringify(currentConversation)),
        sharedBy: currentUser?.displayName || "",
      };

      const shareId = crypto.randomUUID();
      const sharedChats = JSON.parse(localStorage.getItem("sharedChats")) || {};
      sharedChats[shareId] = conversationToShare;
      localStorage.setItem("sharedChats", JSON.stringify(sharedChats));

      const shareUrl = `${window.location.origin}/share/${shareId}`;

      // Trigger the new ShareEnvelope animation
      window.dispatchEvent(
        new CustomEvent("trigger-share-envelope-animation", {
          detail: { trigger: true, shareUrl },
        })
      );
    } catch (e) {
      console.error("Link generation failed:", e);
    }
  };

  // Show login page if the user is not authenticated
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Login />;
  }
  console.log("Current message state:", message);

  return (
    <>
      <Box
        ref={chatBoundsRef}
        sx={{
          display: "flex",
          width: "100vw",
          height: "100vh",
          background: globalBg,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Floating Ambient Drifting Light Blobs across the entire screen */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* Violet/Indigo Blob top-left */}
          <motion.div
            animate={{
              x: [0, 60, -30, 0],
              y: [0, -70, 40, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: "5%",
              left: "10%",
              width: "38vw",
              height: "38vw",
              borderRadius: "50%",
              background: darkMode
                ? "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0) 70%)"
                : "radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0) 70%)",
              filter: "blur(100px)",
            }}
          />

          {/* Cyan/Teal Blob bottom-right */}
          <motion.div
            animate={{
              x: [0, -50, 40, 0],
              y: [0, 80, -30, 0],
            }}
            transition={{
              duration: 32,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              bottom: "10%",
              right: "5%",
              width: "42vw",
              height: "42vw",
              borderRadius: "50%",
              background: darkMode
                ? "radial-gradient(circle, rgba(121, 248, 255, 0.06) 0%, rgba(121, 248, 255, 0) 70%)"
                : "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 70%)",
              filter: "blur(110px)",
            }}
          />

          {/* Soft Amber Glow behind center */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: "25%",
              left: "35%",
              width: "30vw",
              height: "30vw",
              borderRadius: "50%",
              background: darkMode
                ? "radial-gradient(circle, rgba(251, 191, 36, 0.03) 0%, rgba(251, 191, 36, 0) 70%)"
                : "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0) 70%)",
              filter: "blur(90px)",
            }}
          />
        </Box>

        <Sidebar
          chats={conversations}
          currentChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={clearChat}
          onRenameChat={renameChat}
          onDeleteChat={deleteChat}
          onArchiveChat={archiveChat}
          onRestoreChat={restoreChat}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProfile={() => {
            setProfileOpen(true);
          }}
          onOpenSettings={() => {
            setSettingsOpen(true);
          }}
          sx={{
            zIndex: 1,
            position: "relative",
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
            zIndex: 1,
            position: "relative",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              background: "transparent",
              overflow: "hidden",
              border: "none",
            }}
          >
            <Header
              onToggleSidebar={() => { }}
              chatTitle={activeConversation?.title || "New Conversation"}
              onShare={handleShareChat}
              darkMode={darkMode}
              onToggleTheme={toggleTheme}
              sidebarOpen={true}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenProfile={() => setProfileOpen(true)}
              onNewChat={clearChat}
              onOpenSettings={() => setSettingsOpen(true)}
              chats={conversations}
              currentChatId={activeChatId}
              onSelectChat={setActiveChatId}
              onRestoreChat={restoreChat}
              onDeleteChat={deleteChat}
            />

            <Box
              sx={{
                flex: 1,
                position: "relative",
                overflow: "visible",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                paddingBottom: activeChatId === "search" ? "0px" : "110px", // reserve space for ChatInput if not search
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
                activeChatId={activeChatId}
                searchQuery={message}
                conversations={conversations}
                onSelectChat={setActiveChatId}
              />


              {activeChatId !== "search" && (
                <ChatInput
                  darkMode={darkMode}
                  message={message}
                  setMessage={setMessage}
                  handleSend={handleSend}
                  handleImageUpload={handleImageUpload}
                  selectedImage={selectedImageSrc}
                  selectedImageName={selectedImageName}
                  removeImage={handleRemoveImage}
                  isGenerating={isGenerating}
                  onStopGeneration={handleStopGeneration}
                />
              )}
            </Box>
          </Box>
        </Box>
        {/* ================= BYTE ================= */}

        <Box
          sx={{
            position: "absolute",
            right: 24,
            bottom: 24,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >

        </Box>
      </Box>
      <ThemeRope />
      <ThemeTransitionOverlay />
      <RestoreAnimationController
        conversations={conversations}
        setConversations={setConversations}
      />
      <UndoDeleteAnimationController
        conversations={conversations}
        setConversations={setConversations}
      />
      <ShareAnimationController />
      <ShareEnvelopeAnimationController />
      <ShareEnvelopeOverlay />
      <PaperAirplaneOverlay />
      <ByteWelcomeGuide
        message={message}
        currentUser={currentUser}
        activeChatId={activeChatId}
        byteState={byteState}
        setByteState={setByteState}
        isTyping={isTyping}
        isGenerating={isGenerating}
        hasMessages={messagePreviews.length > 0}
      />
      <>



      </>
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
