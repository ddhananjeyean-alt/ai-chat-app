import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, Paper, Dialog, DialogContent, Snackbar, Alert } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/layout/Header";
import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/chat/ChatInput";
import { analyzeImage } from "./services/imageAnalysis";
import { getAIResponse, generateConversationTitle } from "./services/groq";
import { generateImage } from "./services/imageGenerator";
import { shareChat } from "./services/shareChat";
import { aiEngine } from "./ai/AIEngine";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { useThemeContext } from "./theme/ThemeContext";
import SettingsDialog from "./components/SettingsDialog";
import ProfileDialog from "./components/ProfileDialog";
import ByteWelcomeGuide from "./companion/byte/ByteWelcomeGuide";
import { ThemeEvents } from "./companion/byte/ThemeEvents";
import ThemeRope from "./companion/byte/ThemeRope";
import ThemeTransitionOverlay from "./companion/byte/ThemeTransitionOverlay";
import { DeleteEvents } from "./companion/byte/DeleteEvents";
import { ArchiveEvents } from "./companion/byte/ArchiveEvents";
import { RestoreEvents } from "./companion/byte/RestoreEvents";
import RestoreAnimationController from "./companion/byte/RestoreAnimationController";
import UndoDeleteAnimationController from "./companion/byte/UndoDeleteAnimationController";
import ShareAnimationController from "./companion/byte/ShareAnimationController";
import { ShareEvents } from "./companion/byte/ShareEvents";
import { useByte, BYTE_STATES } from "./context/ByteContext";
import CompanionNaming from "./companion/byte/CompanionNaming";

import {
  saveImageBlob,
  getImageRecord,
  deleteImageRecord,
  migrateLegacyConversations,
} from "./services/imageDB";

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const safeSaveConversations = (conversations, uid) => {
  try {
    if (!Array.isArray(conversations)) return;
    const sanitized = conversations.map((chat) => {
      if (!chat || !chat.id) return null;
      return {
        id: chat.id,
        title: chat.title || "Untitled Chat",
        archived: Boolean(chat.archived),
        userRenamed: Boolean(chat.userRenamed),
        imageId: chat.imageId || null,
        imageName: chat.imageName || null,
        messages: Array.isArray(chat.messages)
          ? chat.messages.map((msg) => {
              const inferredType = msg.type || (msg.image || msg.imageUrl ? "image" : (msg.imageId ? "attachment" : "text"));
              return {
                id: msg.id || "",
                sender: msg.sender,
                role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
                text: msg.text || "",
                imageId: msg.imageId || null,
                imageName: msg.imageName || null,
                image: msg.image || null,
                imageUrl: msg.imageUrl || msg.image || null,
                imagePrompt: msg.imagePrompt || msg.imageName || null,
                generationModel: msg.generationModel || null,
                type: inferredType,
                createdAt: msg.createdAt || null,
                status: msg.status || "success",
                metadata: msg.metadata || {},
              };
            })
          : [],
      };
    }).filter(Boolean);

    if (uid) {
      localStorage.setItem("conversations_" + uid, JSON.stringify(sanitized));
    } else {
      localStorage.setItem("conversations", JSON.stringify(sanitized));
    }
  } catch (error) {
    console.error("safeSaveConversations failed:", error);
  }
};

const isRawOrPlaceholderTitle = (title, messages) => {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  const placeholders = ["new chat", "new conversation", "untitled chat", "untitled", ""];
  if (placeholders.includes(t)) {
    return true;
  }
  if (Array.isArray(messages) && messages.length > 0) {
    const firstUserMsg = messages.find(m => m.sender === "user" || m.role === "user");
    if (firstUserMsg && firstUserMsg.text) {
      const promptText = firstUserMsg.text.trim().toLowerCase();
      const titleWithoutEllipsis = t.endsWith("...") ? t.slice(0, -3) : t;
      if (promptText.startsWith(titleWithoutEllipsis)) {
        return true;
      }
    }
  }
  return false;
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
  const imageAbortControllerRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadedConversations, setLoadedConversations] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState(null);
  const selectedImageSrcRef = useRef(null);
  const [hasImageSelected, setHasImageSelected] = useState(false);

  // Document attachment states
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [selectedDocumentSize, setSelectedDocumentSize] = useState(null);
  const [isPreparingDocument, setIsPreparingDocument] = useState(false);

  const documentTextRef = useRef("");

  const imageCacheRef = useRef({});
  const [imageLoadTrigger, setImageLoadTrigger] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const textAbortControllerRef = useRef(null);
  
  const removeDocument = useCallback(() => {
    setSelectedDocumentName(null);
    setSelectedDocumentType(null);
    setSelectedDocumentSize(null);
    setIsPreparingDocument(false);
    documentTextRef.current = "";
  }, []);

  const lastSyncedConversationsRef = useRef({});
  const initialLoadDoneRef = useRef(null);
  const pendingImageLoadsRef = useRef(new Set());
  const migrationTriggeredRef = useRef(false);

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
    updateCompanionDisplayName,
  } = useAuth();
  const triggerAutoRename = useCallback(async (chatId, userText, responseText) => {
    try {
      console.log(`[Auto Rename] Generating title for chat ${chatId}...`);
      const generatedTitle = await generateConversationTitle(userText, responseText);
      if (generatedTitle) {
        console.log(`[Auto Rename] Generated title: "${generatedTitle}"`);
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id === chatId && !c.userRenamed) {
              return { ...c, title: generatedTitle };
            }
            return c;
          });
          safeSaveConversations(next, currentUser?.uid);
          return next;
        });
      }
    } catch (e) {
      console.error("[Auto Rename] Error:", e);
    }
  }, [currentUser]);

  const handleImageLoadEvent = useCallback((messageId) => {
    if (pendingImageLoadsRef.current.has(messageId)) {
      pendingImageLoadsRef.current.delete(messageId);
      setByteState(BYTE_STATES.SUCCESS);
      setIsTyping(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
      console.log(`[App] Image message ${messageId} finished loading. Byte is SUCCESS.`);

      // Auto rename for first image response
      setConversations((prev) => {
        const chat = prev.find(c => c.messages.some(m => m.id === messageId));
        if (chat && chat.messages.length === 2 && !chat.userRenamed) {
          const userMsg = chat.messages.find(m => m.sender === "user");
          if (userMsg) {
            triggerAutoRename(chat.id, userMsg.text, "Image Generated");
          }
        }
        return prev;
      });
    }
  }, [triggerAutoRename]);

  const handleImageErrorEvent = useCallback((messageId) => {
    if (pendingImageLoadsRef.current.has(messageId)) {
      pendingImageLoadsRef.current.delete(messageId);
      setByteState(BYTE_STATES.ERROR);
      setIsTyping(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
      console.log(`[App] Image message ${messageId} failed to load. Byte is ERROR.`);
    }
  }, []);





  // --- 2. Derived values ---
  const activeConversation =
    conversations.find((chat) => chat.id === activeChatId) || null;

  // --- 3. Variables depending on activeConversation ---
  const messagePreviews = useMemo(() => {
    return Array.isArray(activeConversation?.messages)
      ? activeConversation.messages.map((msg) => {
          if (!msg) return null;
          return {
            ...msg,
            image: msg.image || (msg.imageId ? imageCacheRef.current[msg.imageId]?.src : null),
          };
        }).filter(Boolean)
      : [];
  }, [activeConversation?.messages, imageLoadTrigger]);

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
        ? chat.messages.map((message) => {
          const inferredType = message.type || (message.image || message.imageUrl ? "image" : (message.imageId ? "attachment" : "text"));
          return {
            id: message.id || "",
            sender: message.sender,
            role: message.role || (message.sender === "user" ? "user" : "assistant"),
            text: message.text || "",
            imageId: message.imageId || null,
            imageName: message.imageName || null,
            image: message.image || null,
            imageUrl: message.imageUrl || message.image || null,
            imagePrompt: message.imagePrompt || message.imageName || null,
            type: inferredType,
            createdAt: message.createdAt || null,
            status: message.status || "success",
            metadata: message.metadata || {},
          };
        })
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

  const isImageRequest = (prompt, history = [], messageIndex) => {
    if (!prompt?.trim()) return false;
    const normalized = prompt.trim().toLowerCase();

    // 1. Check if previous response was an image and this is a follow-up edit command.
    let isPrevImage = false;
    const msgs = Array.isArray(history) && history.length > 0 
      ? history 
      : (activeConversation?.messages || []);
      
    const limit = messageIndex !== undefined ? messageIndex : msgs.length;
    for (let i = limit - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg?.sender === "ai") {
        isPrevImage = Boolean(msg.image || msg.imageId || msg.text === "Generating image..." || msg.imageName);
        break;
      }
    }

    if (isPrevImage) {
      const editPatterns = [
        /^make\b/i,
        /^change\b/i,
        /^add\b/i,
        /^remove\b/i,
        /^replace\b/i,
        /^insert\b/i,
        /^delete\b/i,
        /^put a\b/i,
        /^put the\b/i,
        /^turn it\b/i,
        /^convert to\b/i,
        /^transform\b/i,
        /^modify\b/i,
        /^adjust\b/i,
        /^set the\b/i,
        /^give it\b/i,
        /^switch to\b/i
      ];
      if (editPatterns.some(pattern => pattern.test(normalized))) {
        return true;
      }
    }

    // 2. Scoring System
    let score = 0;
    let penalty = 0;

    // A. Strong image trigger verbs/phrases
    const triggerVerbs = ["draw", "paint", "illustrate", "sketch", "visualize", "imagine", "design", "render", "show me", "generate", "create", "make", "produce"];
    const triggers = [
      /\bdraw\b/i, /\bpaint\b/i, /\billustrate\b/i, /\bsketch\b/i, /\bvisualize\b/i,
      /\bimagine\b/i, /\bdesign\b/i, /\brender\b/i, /\bshow me\b/i, /\bgenerate image\b/i,
      /\bcreate image\b/i, /\bgenerate picture\b/i, /\bcreate picture\b/i,
      /\bgenerate artwork\b/i, /\bcreate artwork\b/i
    ];
    triggers.forEach(regex => {
      if (regex.test(normalized)) {
        score += 30;
      }
    });

    if (triggerVerbs.some(verb => normalized.startsWith(verb))) {
      score += 25;
    }

    // B. Specific Style Terminology
    const highWeightStyles = [
      /\bhyper realistic\b/i, /\bphotorealistic\b/i, /\b3d render\b/i,
      /\bpixel art\b/i, /\bwatercolor\b/i, /\boil painting\b/i, /\bpencil sketch\b/i,
      /\bconcept art\b/i
    ];
    highWeightStyles.forEach(regex => {
      if (regex.test(normalized)) {
        score += 35;
      }
    });

    const styles = [
      /\banime\b/i, /\bcomic\b/i, /\bcartoon\b/i, /\brealistic\b/i, /\bcinematic\b/i,
      /\bcyberpunk\b/i, /\bfuturistic\b/i, /\bvector art\b/i, /\bisometric\b/i,
      /\bdigital art\b/i, /\bueno-style\b/i, /\bghibli-style\b/i, /\bpixar-style\b/i,
      /\bpixar\b/i, /\bghibli\b/i, /\bueno\b/i
    ];
    styles.forEach(regex => {
      if (regex.test(normalized)) {
        score += 20;
      }
    });

    // C. Subject & Format Terminology
    const subjectFormats = [
      /\bposter\b/i, /\bwallpaper\b/i, /\blogo\b/i, /\bavatar\b/i, /\bicon\b/i,
      /\btattoo\b/i, /\bblueprint\b/i, /\binterior\b/i, /\barchitecture\b/i,
      /\blandscape\b/i, /\bportrait\b/i, /\bmascot\b/i, /\bvehicle\b/i, /\bcreature\b/i,
      /\bmonster\b/i, /\bfood\b/i, /\bphotography\b/i
    ];
    subjectFormats.forEach(regex => {
      if (regex.test(normalized)) {
        score += 20;
      }
    });

    // D. Camera & Composition Terminology
    const compositions = [
      /\baerial shot\b/i, /\bclose-up\b/i, /\bmacro shot\b/i, /\bwide angle\b/i,
      /\blighting\b/i, /\bdepth of field\b/i, /\bbokeh\b/i, /\bglowing\b/i,
      /\breflective\b/i, /\bneon\b/i, /\bsunrise\b/i, /\bsunset\b/i, /\bnight\b/i,
      /\bgolden hour\b/i, /\boverhead shot\b/i, /\bbird's eye view\b/i, /\bsymmetric\b/i,
      /\bhigh resolution\b/i, /\b8k\b/i, /\bunreal engine\b/i, /\boverlooking\b/i
    ];
    compositions.forEach(regex => {
      if (regex.test(normalized)) {
        score += 15;
      }
    });

    // E. Grammatical & Spatial Markers
    if (/^(a|an|the)\b/i.test(normalized)) {
      score += 20;
    }
    const spatialVerbs = [
      /\bstanding on\b/i, /\bwalking through\b/i, /\boverlooking\b/i, /\bsitting under\b/i,
      /\bfloating in\b/i, /\bwearing\b/i, /\bwith\b/i, /\bnext to\b/i, /\bin front of\b/i
    ];
    spatialVerbs.forEach(regex => {
      if (regex.test(normalized)) {
        score += 15;
      }
    });

    // Curated rich vocabulary lists
    const adjectives = [
      "majestic", "beautiful", "gorgeous", "stunning", "magnificent", "splendid", "wonderful",
      "marvelous", "spectacular", "breathtaking", "picturesque", "charming", "cute", "adorable",
      "lovely", "pretty", "elegant", "graceful", "stylish", "fashionable", "modern", "ancient",
      "old", "new", "futuristic", "cyberpunk", "steampunk", "fantasy", "magical", "mythical",
      "legendary", "mystical", "sacred", "dark", "gloomy", "bright", "luminous", "glowing",
      "vibrant", "colorful", "neon", "monochrome", "vintage", "retro", "classic", "epic",
      "dramatic", "cinematic", "mysterious", "spooky", "scary", "creepy", "scenic", "panoramic",
      "aerial", "overhead", "wide-angle", "close-up", "macro", "micro", "gigantic", "huge",
      "large", "small", "tiny", "miniature", "microscopic", "cosmic", "galactic", "interstellar",
      "luxury", "luxurious", "snowy", "rainy", "sunny", "windy", "stormy", "cloudy", "foggy",
      "misty", "dusty", "dirty", "clean", "neat", "tidy", "messy", "rusty", "shiny",
      "metallic", "wooden", "glass", "plastic", "leather", "velvet", "silk", "glowing",
      "transparent", "textured", "matte", "glossy", "rough", "smooth", "soft", "hard",
      "cozy", "warm", "cold", "frozen", "misty", "steamy", "ethereal", "dreamy", "surreal",
      "trippy", "psychedelic", "abstract", "minimalist", "maximalist", "gothic", "baroque",
      "industrial", "rustic", "sleek", "polished", "weathered", "decayed", "rotten"
    ];

    const subjects = [
      "robot", "companion", "tiger", "rainforest", "street", "night", "girl", "cherry blossoms",
      "dubai", "village", "lion", "logo", "app", "ui", "bank", "banking", "castle", "clouds",
      "portrait", "albert einstein", "einstein", "mars", "sunrise", "spacesuit", "visor",
      "megacity", "phoenix", "lava", "dragon", "person", "people", "man", "woman", "child",
      "kid", "astronaut", "knight", "wizard", "warrior", "king", "queen", "palace", "house",
      "building", "temple", "pyramid", "ruins", "ship", "boat", "airplane", "car", "motorcycle",
      "bicycle", "train", "cat", "dog", "animal", "beast", "creature", "monster", "alien",
      "dinosaur", "galaxy", "nebula", "planet", "star", "comet", "forest", "jungle", "desert",
      "tundra", "swamp", "river", "lake", "waterfall", "cave", "volcano", "fire", "ice",
      "snow", "rain", "lightning", "storm", "cloud", "sky", "sun", "moon", "tree", "flower",
      "grass", "plant", "garden", "meadow", "field", "farm", "barn", "city", "town", "skyscraper",
      "bridge", "road", "path", "alley", "market", "shop", "room", "kitchen", "bedroom",
      "bathroom", "office", "library", "museum", "classroom", "laboratory", "factory",
      "warehouse", "station", "airport", "harbor", "docks", "beach", "island", "cliff",
      "valley", "canyon", "food", "fruit", "vegetable", "meal", "dish", "drink", "beverage",
      "cup", "plate", "bowl", "spoon", "fork", "knife", "table", "chair", "bed", "sofa",
      "couch", "desk", "lamp", "light", "window", "door", "wall", "floor", "ceiling", "roof",
      "garden", "yard", "fence", "gate", "pathway", "sidewalk", "pavement", "highway", "freeway",
      "cabin", "woods", "wood", "ocean", "waves", "sea", "dunes", "sahara", "oasis", "planet",
      "phoenix", "creature", "beast", "monster", "cybernetic", "android", "cyborg", "machine"
    ];

    const placements = [
      "standing", "walking", "running", "jumping", "flying", "swimming", "sitting", "lying",
      "sleeping", "eating", "drinking", "fighting", "dancing", "singing", "playing", "working",
      "thinking", "looking", "watching", "staring", "gazing", "smiling", "laughing", "crying",
      "screaming", "holding", "carrying", "wearing", "dressed", "covered", "surrounded",
      "rising", "falling", "floating", "overlooking", "under", "above", "behind", "in front",
      "next to", "beside", "between", "near", "far", "inside", "outside", "on top", "at the bottom",
      "through", "across", "along", "into", "out of", "towards", "away from", "with", "against",
      "among", "amid", "beneath", "atop", "underneath"
    ];

    const words = normalized.split(/[^a-zA-Z0-9'\-]+/).filter(Boolean);
    const wordsSet = new Set(words);
    const checkWord = (word) => {
      if (wordsSet.has(word)) return true;
      if (word.endsWith("s") && wordsSet.has(word.slice(0, -1))) return true;
      if (wordsSet.has(word + "s")) return true;
      return false;
    };

    adjectives.forEach(adj => {
      if (checkWord(adj)) score += 15;
    });
    subjects.forEach(sub => {
      if (checkWord(sub)) score += 15;
    });
    placements.forEach(plc => {
      if (checkWord(plc)) score += 15;
    });

    const multiWords = [
      "albert einstein", "cherry blossoms", "mobile app", "living room", "spacesuit",
      "standing on", "walking through", "sitting under", "floating in", "floating on",
      "in front of", "next to", "on top of", "at the bottom of", "away from",
      "hyper realistic", "photorealistic", "3d render", "pixel art", "watercolor",
      "oil painting", "pencil sketch", "concept art", "aerial shot", "close-up",
      "macro shot", "wide angle", "depth of field", "golden hour", "overhead shot",
      "bird's eye view", "high resolution", "unreal engine"
    ];
    multiWords.forEach(phrase => {
      if (normalized.includes(phrase)) {
        score += 20;
      }
    });

    // G. Negatives / Conversational Penalties
    const negatives = [
      /\bwhat is\b/i, /\bwhat are\b/i, /\bexplain\b/i, /\bhow to\b/i, /\bhow does\b/i,
      /\bhow do\b/i, /\bwhy does\b/i, /\bwhy is\b/i, /\bcan you\b/i, /\bsummarize\b/i,
      /\btranslate\b/i, /\bwrite python\b/i, /\bwrite code\b/i, /\bpython code\b/i,
      /\bpython script\b/i, /\bjavascript\b/i, /\bhtml\b/i, /\bcss\b/i, /\bprogramming\b/i,
      /\bc\+\+\b/i, /\bjava\b/i, /\bfunction\b/i, /\bclass\b/i, /\btutorial\b/i,
      /\bessay\b/i, /\bparagraph\b/i, /\bsolve\b/i, /\bcalculate\b/i, /\bmath\b/i,
      /\bdefinition\b/i, /\bmeaning of\b/i
    ];
    negatives.forEach(regex => {
      if (regex.test(normalized)) {
        penalty += 60;
      }
    });

    if (/^(explain|summarize|translate|write|how|what|why|tell|teach|solve|calculate)\b/i.test(normalized)) {
      penalty += 40;
    }

    score = Math.max(0, score - penalty);

    // Short phrase clean-visual bonus:
    const wordCount = normalized.split(/\s+/).length;
    if (penalty === 0 && wordCount <= 10 && score > 0) {
      score += 15;
    }

    // Guarantee trigger verbs with 0 penalty trigger image generation
    if (triggerVerbs.some(verb => normalized.startsWith(verb)) && penalty === 0) {
      score += 40;
    }

    const confidence = (score / 60) * 100;
    console.log(`[Image Intent Detector] Prompt: "${prompt}", Score: ${score}, Penalty: ${penalty}, Confidence: ${confidence.toFixed(1)}%`);
    
    return confidence >= 70;
  };

  const refineImagePrompt = async (rawPrompt, history = []) => {
    try {
      const SYSTEM_PROMPT = `You are a premium, state-of-the-art prompt engineer for Gemini image generation models.
Your goal is to rewrite the user's raw prompt into a highly descriptive, professional prompt that yields stunning visual quality.

You must analyze the user's prompt for:
- Subject, actions, and relationships.
- Emotions and facial expressions.
- Clothing, appearance, and physical features.
- Environment, background, weather, and lighting.
- Camera angle, composition, depth, and perspective.
- Colors, textures, materials, shadows, and reflections.
- Realism level and artistic style (e.g. Photorealistic, Cinematic, Anime, 3D Render, Illustration, Concept Art, Fantasy, Oil Painting, Watercolor, Sketch, Pixel Art, Minimal, Comic, Cyberpunk, Sci-Fi).
- Requested text (if any) or aspect ratios.

Rules for Refinement:
1. **Prompt Expansion (Short Prompts)**: If the prompt is short or simple (e.g. "Robot", "Cute cat"), expand it into a highly detailed, professional visual description. Specify composition, lighting, environment, textures, and style to maximize visual appeal.
2. **Preserve Instructions (Detailed Prompts)**: If the user's prompt is already detailed, do NOT overwrite or discard their instructions. Only improve clarity, scene coherence, detail sharpness, and phrasing. Never change the requested core subject or user intent.
3. **Negative Handling**: Strictly respect negative instructions (e.g. "without helmet", "no text"). Ensure the refined description explicitly avoids these elements (e.g. do not describe a helmet, or mention any text or signs).
4. **Accuracy & Quality**: Maximize prompt accuracy (include all requested objects), composition, anatomical accuracy (especially hands, faces, eyes), textures, depth of field, and reflections.
5. **Consistency**: Improve coherence for multiple characters, body proportions, symmetry, and perspective.
6. **Output format**: Output ONLY the final enhanced prompt. Do NOT wrap it in quotes, do NOT write markdown backticks, and do NOT include any introductory or conversational text.`;

      const refined = await aiEngine.generateText(`Refine this request into a clean image description: "${rawPrompt}"`, {
        systemPrompt: SYSTEM_PROMPT,
        history: history,
        timeout: 10000,
      });

      if (refined) {
        return refined;
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
        if (imageCacheRef.current[imageId]?.src !== src) {
          imageCacheRef.current[imageId] = { src, status: "loaded" };
          setImageLoadTrigger((prev) => prev + 1);
        }
        return src;
      } catch (error) {
        if (imageCacheRef.current[imageId]?.status !== "missing") {
          imageCacheRef.current[imageId] = { src: null, status: "missing" };
          setImageLoadTrigger((prev) => prev + 1);
        }
        return null;
      }
    },
    []
  );
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setActiveChatId(null);
      setLoadedConversations(false);
      lastSyncedConversationsRef.current = {};
      initialLoadDoneRef.current = null;
      return;
    }

    // Skip re-fetching if uid hasn't changed.
    // This prevents companion rename or settings save from clearing the local state.
    if (initialLoadDoneRef.current === currentUser.uid && loadedConversations) {
      return;
    }

    if (initialLoadDoneRef.current !== currentUser.uid) {
      setConversations([]);
      setActiveChatId(null);
      setLoadedConversations(false);
      lastSyncedConversationsRef.current = {};
    }

    const loadUserChats = async () => {
      const uid = currentUser.uid;
      let cached = [];
      try {
        const saved = localStorage.getItem("conversations_" + uid);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const { conversations: initialConversations } = await migrateLegacyConversations(parsed);
            cached = initialConversations;
          }
        }
      } catch (e) {
        console.warn("Failed to load cached conversations for user:", uid, e);
      }

      setConversations(cached);
      setLoadedConversations(true);
      initialLoadDoneRef.current = uid;

      try {
        const chatsRef = collection(db, "users", uid, "chats");
        const q = query(chatsRef, orderBy("updatedAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const firestoreChats = [];
        querySnapshot.forEach((doc) => {
          firestoreChats.push(doc.data());
        });

        if (firestoreChats.length > 0) {
          setConversations(firestoreChats);
          const syncedMap = {};
          firestoreChats.forEach((chat) => {
            syncedMap[chat.id] = JSON.stringify(chat);
          });
          lastSyncedConversationsRef.current = syncedMap;
          safeSaveConversations(firestoreChats, uid);
        } else if (cached.length > 0) {
          for (const chat of cached) {
            const chatDocRef = doc(db, "users", uid, "chats", String(chat.id));
            const sanitizedMessages = Array.isArray(chat.messages)
              ? chat.messages.map((msg) => {
                  const inferredType = msg.type || (msg.image || msg.imageUrl ? "image" : (msg.imageId ? "attachment" : "text"));
                  return {
                    id: msg.id || "",
                    sender: msg.sender || "",
                    role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
                    text: msg.text || "",
                    imageId: msg.imageId || null,
                    imageName: msg.imageName || null,
                    image: msg.image || null,
                    imageUrl: msg.imageUrl || msg.image || null,
                    imagePrompt: msg.imagePrompt || msg.imageName || null,
                    type: inferredType,
                    createdAt: msg.createdAt || null,
                    status: msg.status || "success",
                    metadata: msg.metadata || {},
                  };
                })
              : [];
            await setDoc(chatDocRef, {
              id: chat.id,
              title: chat.title || "Untitled Chat",
              archived: Boolean(chat.archived),
              userRenamed: Boolean(chat.userRenamed),
              imageId: chat.imageId || null,
              imageName: chat.imageName || null,
              messages: sanitizedMessages,
              updatedAt: Date.now()
            });
            lastSyncedConversationsRef.current[chat.id] = JSON.stringify(chat);
          }
        }
      } catch (err) {
        console.error("Failed to load fresh chats from Firestore:", err);
      }
    };

    loadUserChats();
  }, [currentUser, loadedConversations]);

  useEffect(() => {
    if (loadedConversations && conversations.length > 0 && !migrationTriggeredRef.current) {
      migrationTriggeredRef.current = true;
      
      const runMigration = async () => {
        const chatsToMigrate = conversations.filter(c => {
          if (c.userRenamed) return false;
          return isRawOrPlaceholderTitle(c.title, c.messages);
        });

        if (chatsToMigrate.length === 0) return;

        console.log(`[Migration] Found ${chatsToMigrate.length} chats that need title migration.`);

        for (const chat of chatsToMigrate) {
          const userMsg = Array.isArray(chat.messages) && chat.messages.find(m => m.sender === "user" || m.role === "user");
          if (userMsg && userMsg.text) {
            try {
              console.log(`[Migration] Running AI title generation for chat ${chat.id}...`);
              const assistantMsg = chat.messages.find(m => m.sender === "assistant" || m.role === "assistant");
              const assistantText = assistantMsg ? assistantMsg.text : "";
              const newTitle = await generateConversationTitle(userMsg.text, assistantText);
              if (newTitle) {
                setConversations((prev) => {
                  const next = prev.map((c) => {
                    if (c.id === chat.id && !c.userRenamed) {
                      return { ...c, title: newTitle };
                    }
                    return c;
                  });
                  safeSaveConversations(next, currentUser?.uid);
                  return next;
                });
                console.log(`[Migration] Successfully updated chat ${chat.id} title to "${newTitle}"`);
              }
            } catch (err) {
              console.error(`[Migration] Failed to migrate chat ${chat.id}:`, err);
            }
          }
        }
      };

      runMigration();
    }
  }, [loadedConversations, conversations, currentUser]);

  useEffect(() => {
    if (!currentUser || !loadedConversations || initialLoadDoneRef.current !== currentUser.uid) return;
    
    // Save to user-scoped localStorage immediately
    safeSaveConversations(conversations, currentUser.uid);
    
    // Debounce Firestore sync
    const timer = setTimeout(async () => {
      try {
        for (const chat of conversations) {
          const lastSynced = lastSyncedConversationsRef.current[chat.id];
          const serialized = JSON.stringify(chat);
          if (lastSynced !== serialized) {
            const chatDocRef = doc(db, "users", currentUser.uid, "chats", String(chat.id));
            const sanitizedMessages = Array.isArray(chat.messages)
              ? chat.messages.map((msg) => {
                  const inferredType = msg.type || (msg.image || msg.imageUrl ? "image" : (msg.imageId ? "attachment" : "text"));
                  return {
                    id: msg.id || "",
                    sender: msg.sender || "",
                    role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
                    text: msg.text || "",
                    imageId: msg.imageId || null,
                    imageName: msg.imageName || null,
                    image: msg.image || null,
                    imageUrl: msg.imageUrl || msg.image || null,
                    imagePrompt: msg.imagePrompt || msg.imageName || null,
                    type: inferredType,
                    createdAt: msg.createdAt || null,
                    status: msg.status || "success",
                    metadata: msg.metadata || {},
                  };
                })
              : [];
            await setDoc(chatDocRef, {
              id: chat.id,
              title: chat.title || "Untitled Chat",
              archived: Boolean(chat.archived),
              userRenamed: Boolean(chat.userRenamed),
              imageId: chat.imageId || null,
              imageName: chat.imageName || null,
              messages: sanitizedMessages,
              updatedAt: Date.now(),
            });
            lastSyncedConversationsRef.current[chat.id] = serialized;
          }
        }
      } catch (err) {
        console.error("Error syncing to Firestore:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [conversations, currentUser, loadedConversations]);
  useEffect(() => {
    if (editingMessageIndex !== null) return;
    if (activeConversation?.messages?.length > 0) {
      setSelectedImageId((prev) => (prev !== null ? null : prev));
      setSelectedImageName((prev) => (prev !== null ? null : prev));
      selectedImageSrcRef.current = null;
      setHasImageSelected(false);
      return;
    }

    if (!activeConversation?.imageId) {
      setSelectedImageId((prev) => (prev !== null ? null : prev));
      setSelectedImageName((prev) => (prev !== null ? null : prev));
      selectedImageSrcRef.current = null;
      setHasImageSelected(false);
      return;
    }
    const imageId = activeConversation.imageId;
    setSelectedImageId((prev) => {
      if (prev !== imageId) {
        setSelectedImageName(activeConversation.imageName || null);
        loadImageSrc(imageId).then((src) => {
          selectedImageSrcRef.current = src;
          setHasImageSelected(Boolean(src));
        });
        return imageId;
      }
      return prev;
    });
  }, [activeConversation?.id, activeConversation?.imageId, activeConversation?.imageName, activeConversation?.messages?.length, loadImageSrc, editingMessageIndex]);

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
    selectedImageSrcRef.current = null;
    setHasImageSelected(false);
    removeDocument();
  }, [activeChatId, removeDocument]);

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // 1. Workspace switching: Alt + Shift + W or Ctrl/Cmd + Shift + W
      if ((e.altKey && e.shiftKey && e.code === "KeyW") ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyW")) {
        e.preventDefault();
        setConversations((prevChats) => {
          const activeChats = prevChats.filter(c => !c.archived);
          if (activeChats.length <= 1) return prevChats;
          const activeIndex = activeChats.findIndex(c => c.id === activeChatId);
          const nextIndex = (activeIndex + 1) % activeChats.length;
          const nextChat = activeChats[nextIndex];
          if (nextChat) {
            setActiveChatId(nextChat.id);
          }
          return prevChats;
        });
      }

      // 2. Cancel generation: Escape
      if (e.key === "Escape" && isGeneratingRef.current) {
        e.preventDefault();
        handleStopGeneration();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [activeChatId, handleStopGeneration]);

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
      const cached = imageCacheRef.current[imageId];
      if (!cached?.src && cached?.status !== "missing" && cached?.status !== "loading") {
        imageCacheRef.current[imageId] = { src: null, status: "loading" };
        loadImageSrc(imageId).catch(() => {});
        setImageLoadTrigger((prev) => prev + 1);
      }
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

      const isImage = file.type.startsWith("image/");
      
      if (!isImage) {
        // Document upload routing
        const ext = file.name.split(".").pop().toLowerCase();
        const allowedExts = ["pdf", "docx", "txt", "md", "csv", "json", "xlsx", "xls"];
        if (!allowedExts.includes(ext)) {
          alert(`Unsupported file format. Supported formats: ${allowedExts.join(", ")}`);
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          alert("Document size must be smaller than 10MB.");
          return;
        }

        // Show upload card immediately
        setSelectedDocumentName(file.name);
        setSelectedDocumentType(ext);
        setSelectedDocumentSize(file.size);
        setIsPreparingDocument(true);
        setByteState(BYTE_STATES.ANALYZING);
        
        documentTextRef.current = "";

        // Asynchronously process the file to avoid blocking the main UI thread
        (async () => {
          try {
            const { DocumentParser } = await import("./utils/DocumentParser");
            const text = await DocumentParser.parse(file);
            
            // Limit/chunk very large documents to 40,000 characters to prevent memory/token blowouts
            const maxChars = 40000;
            let finalDocText = text || "";
            if (finalDocText.length > maxChars) {
              finalDocText = finalDocText.substring(0, maxChars) + "\n\n[Document truncated due to context limits]";
            }

            documentTextRef.current = finalDocText;
            setIsPreparingDocument(false);
            setByteState(BYTE_STATES.SUCCESS);
          } catch (err) {
            console.error("Async document parsing error:", err);
            alert(`Failed to parse document: ${err.message}`);
            removeDocument();
            setByteState(BYTE_STATES.ERROR);
          }
        })();

        return;
      }

      // Existing image upload pathway
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
      selectedImageSrcRef.current = imageSrc;
      setHasImageSelected(true);
      imageCacheRef.current[imageId] = { src: imageSrc, status: "loaded" };
      setImageLoadTrigger((prev) => prev + 1);

    } catch (error) {
      console.error("Failed to process file upload:", error);
      alert("Failed to process the uploaded file. Please try again.");
      setIsPreparingDocument(false);
      setByteState(BYTE_STATES.ERROR);
    }
  };
  const handleRemoveImage = async () => {
    const imageIdToRemove = selectedImageId;

    setSelectedImageId(null);
    setSelectedImageName(null);
    selectedImageSrcRef.current = null;
    setHasImageSelected(false);

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
                safeSaveConversations(next, currentUser?.uid);
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

  const triggerAutoSummarization = async (chatId, currentMessages) => {
    if (currentMessages.length <= 8) return;
    
    const chat = conversations.find(c => c.id === chatId);
    if (chat && chat.lastSummarizedLength === currentMessages.length) return;
    
    console.log(`[Auto Summarize] Running background summarization for chat ${chatId}...`);
    const olderMessages = currentMessages.slice(0, -4);
    const summaryPrompt = olderMessages
      .map(m => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");
      
    try {
      const { aiEngine } = await import("./ai/AIEngine");
      const summary = await aiEngine.providers.groq.summarize(summaryPrompt);
      if (summary) {
        console.log(`[Auto Summarize] Generated summary: "${summary.substring(0, 100)}..."`);
        setConversations(prev => prev.map(c => 
          c.id === chatId ? { ...c, summary, lastSummarizedLength: currentMessages.length } : c
        ));
      }
    } catch (err) {
      console.warn("[Auto Summarize] Background summarization failed:", err);
    }
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
    const hasDocument = Boolean(selectedDocumentName);
    
    if (isPreparingDocument) return;
    if ((!prompt && !hasImage && !hasDocument) || isGenerating || isGeneratingRef.current) return;
    
    if (textAbortControllerRef.current) {
      console.log("[handleSend] Aborting previous active text generation...");
      textAbortControllerRef.current.abort();
    }
    textAbortControllerRef.current = new AbortController();

    isGeneratingRef.current = true;
    setIsGenerating(true);
    
    let currentChatId = activeChatId;
    let currentChat = conversations.find((chat) => chat.id === currentChatId);

    // Save editing state details locally and immediately clear editing mode state
    const isEditingMessage = editingMessageIndex !== null;
    const messageIdx = editingMessageIndex;
    if (isEditingMessage) {
      setEditingMessageIndex(null);
    }

    if (!currentChatId) {
      const newChat = {
        id: Date.now(),
        title: "New Conversation",
        archived: false,
        imageId: selectedImageId,
        imageName: selectedImageName,
        messages: [],
        userRenamed: false,
        summary: "",
      };
      setConversations((prev) => [newChat, ...prev]);
      currentChatId = newChat.id;
      setActiveChatId(newChat.id);
      currentChat = newChat;
    }

    const originalMsg = isEditingMessage ? currentChat?.messages?.[messageIdx] : null;
    const userMessage = {
      id: originalMsg ? originalMsg.id : `user-msg-${Date.now()}`,
      sender: "user",
      role: "user",
      text: prompt,
      imageId: selectedImageId,
      imageName: selectedImageName,
      type: selectedImageId ? "attachment" : (selectedDocumentName ? "document" : "text"),
      createdAt: Date.now(),
      status: "success",
      metadata: selectedDocumentName ? {
        documentName: selectedDocumentName,
        documentType: selectedDocumentType,
        documentSize: selectedDocumentSize,
        documentText: documentTextRef.current,
      } : {},
    };

    const tempImageMessageId = `temp-image-${Date.now()}`;
    const generatingMessage = {
      id: tempImageMessageId,
      sender: "ai",
      role: "assistant",
      text: "Generating image...",
      imageId: null,
      imageName: null,
      type: "image",
      imageUrl: null,
      imagePrompt: prompt,
      createdAt: Date.now(),
      status: "generating",
      metadata: {},
    };

    setMessage("");
    setSelectedImageId(null);
    setSelectedImageName(null);
    selectedImageSrcRef.current = null;
    setHasImageSelected(false);
    removeDocument();

    const isImageQuery = isImageRequest(prompt, currentChat?.messages);
    setIsTyping(true);

    if (isImageQuery) {
      setByteState(BYTE_STATES.GENERATING);
      setConversations((prev) =>
        prev.map((chat) => {
          if (chat.id !== currentChatId) return chat;
          let updatedMessages = [...chat.messages];
          let newTitle = chat.title;
          if (isEditingMessage) {
            updatedMessages[messageIdx] = userMessage;
            updatedMessages = updatedMessages.slice(0, messageIdx + 1);
            if (messageIdx === 0) {
              newTitle = prompt ? (prompt.length > 35 ? `${prompt.substring(0, 35)}...` : prompt) : "New Image Chat";
            }
          } else {
            updatedMessages.push(userMessage);
          }
          updatedMessages.push(generatingMessage);
          return {
            ...chat,
            title: newTitle,
            messages: updatedMessages,
          };
        })
      );

      try {
        imageAbortControllerRef.current = new AbortController();
        let textHistory;
        if (isEditingMessage) {
          const slicedMessages = currentChat.messages.slice(0, messageIdx);
          textHistory = [...slicedMessages, userMessage].filter(
            (msg, idx, arr) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text, arr, idx)
          );
        } else {
          textHistory = (currentChat?.messages || []).filter(
            (msg, idx, arr) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text, arr, idx)
          );
        }
        const refinedPrompt = await refineImagePrompt(prompt, textHistory);
        
        if (!isGeneratingRef.current) return;

        pendingImageLoadsRef.current.add(tempImageMessageId);

        const { imageUrl: generatedSource, modelUsed } = await generateImage(
          refinedPrompt,
          imageAbortControllerRef.current.signal,
          (statusText) => {
            setConversations((prev) => {
              const next = prev.map((chat) =>
                chat.id === currentChatId
                  ? {
                    ...chat,
                    messages: chat.messages.map((msg) =>
                      msg.id === tempImageMessageId
                        ? { ...msg, text: statusText }
                        : msg
                    ),
                  }
                  : chat
              );
              safeSaveConversations(next, currentUser?.uid);
              return next;
            });
          }
        );

        if (!isGeneratingRef.current) {
          pendingImageLoadsRef.current.delete(tempImageMessageId);
          return;
        }

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
                      imageUrl: generatedSource,
                      imagePrompt: prompt,
                      imageName: prompt,
                      generationModel: modelUsed,
                      type: "image",
                      status: "success",
                      createdAt: msg.createdAt || Date.now(),
                      role: "assistant",
                      metadata: {
                        enhancedPrompt: refinedPrompt,
                        generationModel: modelUsed,
                        createdAt: Date.now(),
                      },
                    }
                    : msg
                ),
              }
              : chat
          );
          safeSaveConversations(next, currentUser?.uid);
          return next;
        });
      } catch (error) {
        pendingImageLoadsRef.current.delete(tempImageMessageId);
        console.error(error);
        if (!isGeneratingRef.current) return;
        setSnackbar({
          open: true,
          message: error?.message || "⚠️ Image generation failed. Please try again.",
          severity: "error",
        });
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
                      type: "image",
                      imageUrl: null,
                      imagePrompt: prompt,
                      status: "error",
                      createdAt: msg.createdAt || Date.now(),
                      role: "assistant",
                      metadata: {},
                    }
                    : msg
                ),
              }
              : chat
          );
          safeSaveConversations(next, currentUser?.uid);
          return next;
        });
      } finally {
        setIsTyping(false);
        setIsGenerating(false);
        isGeneratingRef.current = false;
        imageAbortControllerRef.current = null;
      }

      return;
    }

    const tempAiMessageId = `ai-msg-${Date.now()}`;
    const initialAiMessage = {
      id: tempAiMessageId,
      sender: "ai",
      role: "assistant",
      text: "",
      type: "text",
      createdAt: Date.now(),
      status: "generating",
      metadata: {},
    };

    try {
      let history;

      if (isEditingMessage) {
        history = [...currentChat.messages];
        history[messageIdx] = userMessage;
        history = history.slice(0, messageIdx + 1);
      } else {
        history = currentChat
          ? [...currentChat.messages, userMessage]
          : [userMessage];
      }

      setConversations((prev) =>
        prev.map((chat) => {
          if (chat.id !== currentChatId) return chat;

          let updatedMessages = [...chat.messages];
          let newTitle = chat.title;

          if (isEditingMessage) {
            updatedMessages[messageIdx] = userMessage;
            updatedMessages = updatedMessages.slice(
              0,
              messageIdx + 1
            );
            if (messageIdx === 0) {
              newTitle = prompt ? (prompt.length > 35 ? `${prompt.substring(0, 35)}...` : prompt) : "New Image Chat";
            }
          } else {
            updatedMessages.push(userMessage);
          }

          updatedMessages.push(initialAiMessage);

          return {
            ...chat,
            title: newTitle,
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
        (msg, idx, arr) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text, arr, idx)
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
        const lastMsg = filteredHistory[filteredHistory.length - 1];
        const docName = lastMsg?.metadata?.documentName;
        const docText = lastMsg?.metadata?.documentText;
        const summary = currentChat?.summary;

        aiReply = await getAIResponse(
          filteredHistory,
          summary,
          textAbortControllerRef.current?.signal,
          docName,
          docText
        );
      }

      if (!isGeneratingRef.current) return;

      await streamMessageText(currentChatId, tempAiMessageId, aiReply, () => {
        setByteState(BYTE_STATES.SUCCESS);
        setConversations((prev) => {
          const chat = prev.find(c => c.id === currentChatId);
          if (chat) {
            if (chat.messages.length === 2 && !chat.userRenamed) {
              const userMsg = chat.messages.find(m => m.sender === "user");
              if (userMsg) {
                triggerAutoRename(currentChatId, userMsg.text, aiReply);
              }
            }
            triggerAutoSummarization(currentChatId, chat.messages);
          }
          return prev;
        });
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
                    ? { ...msg, text: error?.message || "⚠️ Something went wrong.", status: "error", type: "text" }
                    : msg
                ),
              }
            : chat
        );
        safeSaveConversations(next, currentUser?.uid);
        return next;
      });
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
      textAbortControllerRef.current = null;
    }
  };

  function handleStopGeneration() {
    if (imageAbortControllerRef.current) {
      console.log("[Stop Generation] Aborting active image request...");
      imageAbortControllerRef.current.abort();
      imageAbortControllerRef.current = null;
    }
    if (textAbortControllerRef.current) {
      console.log("[Stop Generation] Aborting active text request...");
      textAbortControllerRef.current.abort();
      textAbortControllerRef.current = null;
    }
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
      safeSaveConversations(prev, currentUser?.uid);
      return prev;
    });
  }

  const handleRegenerate = async (messageIndex) => {
    if (!activeConversation || isGenerating || isGeneratingRef.current) return;
    const messages = activeConversation.messages;
    if (!Array.isArray(messages)) return;
    const messageToRegenerate = messages[messageIndex];
    if (!messageToRegenerate || messageToRegenerate.sender !== "ai") {
      return;
    }

    const isImageMsg = messageToRegenerate.type === "image" ||
                       Boolean(messageToRegenerate.image) ||
                       Boolean(messageToRegenerate.imageUrl) ||
                       Boolean(messageToRegenerate.imagePrompt) ||
                       (messageToRegenerate.sender === "ai" && 
                        (messageToRegenerate.text === "Generating image..." || 
                         (!messageToRegenerate.text && messageToRegenerate.imageName)));

    if (isImageMsg) {
      const imagePrompt = messageToRegenerate.imagePrompt ||
                          messageToRegenerate.imageName ||
                          (messages[messageIndex - 1]?.text) ||
                          "draw a robot";

      isGeneratingRef.current = true;
      setIsGenerating(true);
      setIsTyping(true);
      setByteState(BYTE_STATES.GENERATING);

      const originalImage = messageToRegenerate.image || messageToRegenerate.imageUrl;
      const originalImageId = messageToRegenerate.imageId;
      const originalImageName = messageToRegenerate.imageName;

      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.map((msg, idx) =>
                  idx === messageIndex
                    ? {
                        ...msg,
                        text: "Generating image...",
                        image: null,
                        imageUrl: null,
                        type: "image",
                        status: "generating",
                        createdAt: msg.createdAt || Date.now(),
                        role: "assistant",
                      }
                    : msg
                ),
              }
            : chat
        )
      );

      try {
        imageAbortControllerRef.current = new AbortController();
        const historyBefore = messages.slice(0, messageIndex).filter(
          (msg, idx, arr) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text, arr, idx)
        );
        const refinedPrompt = await refineImagePrompt(imagePrompt, historyBefore);
        
        if (!isGeneratingRef.current) return;

        const { imageUrl: generatedSource, modelUsed } = await generateImage(refinedPrompt, imageAbortControllerRef.current.signal);

        if (!isGeneratingRef.current) return;

        setConversations((prev) => {
          const next = prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg, idx) =>
                    idx === messageIndex
                      ? {
                          ...msg,
                          text: "",
                          image: generatedSource,
                          imageUrl: generatedSource,
                          imagePrompt: imagePrompt,
                          imageName: imagePrompt,
                          generationModel: modelUsed,
                          type: "image",
                          status: "success",
                          createdAt: msg.createdAt || Date.now(),
                          role: "assistant",
                          metadata: {
                            enhancedPrompt: refinedPrompt,
                            generationModel: modelUsed,
                            createdAt: Date.now(),
                          },
                        }
                      : msg
                  ),
                }
              : chat
          );
          safeSaveConversations(next, currentUser?.uid);
          return next;
        });
        setByteState(BYTE_STATES.SUCCESS);
      } catch (error) {
        console.error("Image regeneration failed:", error);
        setByteState(BYTE_STATES.ERROR);
        setConversations((prev) => {
          const next = prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg, idx) =>
                    idx === messageIndex
                      ? {
                          ...msg,
                          text: error?.message || "⚠️ Couldn't regenerate the image. Please try again.",
                          image: originalImage,
                          imageUrl: originalImage,
                          imageId: originalImageId,
                          imageName: originalImageName,
                          imagePrompt: imagePrompt,
                          type: "image",
                          status: "success",
                          createdAt: msg.createdAt || Date.now(),
                          role: "assistant",
                          metadata: {},
                        }
                      : msg
                  ),
                }
              : chat
          );
          safeSaveConversations(next, currentUser?.uid);
          return next;
        });
        setSnackbar({
          open: true,
          message: error?.message || "⚠️ Couldn't regenerate the image. Please try again.",
          severity: "error",
        });
      } finally {
        setIsTyping(false);
        setIsGenerating(false);
        isGeneratingRef.current = false;
        imageAbortControllerRef.current = null;
      }
      return;
    }

    // Original Text or Image Analysis Regeneration Flow
    const userMsg = messages[messageIndex - 1];
    const turnImageId = userMsg?.imageId;

    if (turnImageId) {
      isGeneratingRef.current = true;
      setIsGenerating(true);
      setIsTyping(true);
      setByteState(BYTE_STATES.ANALYZING);

      try {
        const imageRecord = await getImageRecord(turnImageId);
        const imageBase64 = imageRecord ? await blobToBase64(imageRecord.blob) : null;
        if (imageBase64) {
          const aiReply = await analyzeImage(
            imageBase64,
            userMsg.text || "Describe this image.",
            imageRecord.mimeType || "image/jpeg"
          );

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
        } else {
          throw new Error("Uploaded image could not be loaded from database.");
        }
      } catch (error) {
        console.error("Image analysis regeneration failed:", error);
        setByteState(BYTE_STATES.ERROR);
      } finally {
        setIsTyping(false);
        setIsGenerating(false);
        isGeneratingRef.current = false;
      }
      return;
    }

    // Original Text Regeneration Flow
    const history = messages.slice(0, messageIndex);
    const filteredHistory = history.filter(
      (msg, idx, arr) => !msg.image && msg.text !== "Generating image..." && !isImageRequest(msg.text, arr, idx)
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
        setConversations((prev) => {
          const chat = prev.find(c => c.id === activeChatId);
          if (chat && chat.messages.length === 2 && !chat.userRenamed) {
            const userMsg = chat.messages.find(m => m.sender === "user");
            if (userMsg) {
              triggerAutoRename(activeChatId, userMsg.text, aiReply);
            }
          }
          return prev;
        });
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
  const handleEdit = async (messageIndex, text) => {
    if (!activeConversation) return;

    const messageToEdit = activeConversation.messages[messageIndex];

    if (!messageToEdit || messageToEdit.sender !== "user") return;

    setEditingMessageIndex(messageIndex);
    setMessage(text);

    if (messageToEdit.imageId) {
      setSelectedImageId(messageToEdit.imageId);
      setSelectedImageName(messageToEdit.imageName);
      const src = await loadImageSrc(messageToEdit.imageId);
      selectedImageSrcRef.current = src;
      setHasImageSelected(true);
    } else {
      setSelectedImageId(null);
      setSelectedImageName(null);
      selectedImageSrcRef.current = null;
      setHasImageSelected(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setMessage("");
    setSelectedImageId(null);
    setSelectedImageName(null);
    selectedImageSrcRef.current = null;
    setHasImageSelected(false);
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
    const uid = currentUser?.uid;
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

    if (uid) {
      localStorage.removeItem("conversations_" + uid);
      localStorage.removeItem("sharedChats_" + uid);
    }
    lastSyncedConversationsRef.current = {};
    initialLoadDoneRef.current = null;

    await logout();
  }, [logout, currentUser]);

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
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "chats", String(chatId)));
        delete lastSyncedConversationsRef.current[chatId];
      } catch (err) {
        console.error("Failed to delete chat from Firestore:", err);
      }
    }
  };
  const renameChat = (chatId, newTitle) => {
    if (!newTitle?.trim()) return;
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle.trim(), userRenamed: true } : chat
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

    if (currentUser) {
      try {
        const batch = writeBatch(db);
        conversations.forEach((chat) => {
          const docRef = doc(db, "users", currentUser.uid, "chats", String(chat.id));
          batch.delete(docRef);
        });
        await batch.commit();
      } catch (err) {
        console.error("Failed to delete all chats from Firestore:", err);
      }
      localStorage.removeItem("conversations_" + currentUser.uid);
    } else {
      localStorage.removeItem("conversations");
    }

    lastSyncedConversationsRef.current = {};
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
    if (window.ByteShareOverlayActive) {
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
        sharedBy: currentUser?.displayName || currentUser?.email || "AI Companion User",
      };

      conversationToShare.messages = conversationToShare.messages.map(msg => {
        if (!msg) return msg;
        const resolvedImage = msg.image || msg.imageUrl || (msg.imageId ? imageCacheRef.current[msg.imageId]?.src : null);
        return {
          ...msg,
          image: resolvedImage || null,
          imageUrl: resolvedImage || null,
        };
      });

      // Save to Firestore so anyone with the link can view it cross-device/browser
      const shareId = await shareChat(conversationToShare);

      const storageKey = currentUser ? `sharedChats_${currentUser.uid}` : "sharedChats";
      const sharedChats = JSON.parse(localStorage.getItem(storageKey)) || {};
      sharedChats[shareId] = conversationToShare;
      localStorage.setItem(storageKey, JSON.stringify(sharedChats));

      const shareUrl = `${window.location.origin}/share/${shareId}`;

      // Get the coordinates of the selected chat list item
      const selectedItem = document.getElementById("selected-chat-item");
      let shareCoords = null;
      if (selectedItem) {
        const rect = selectedItem.getBoundingClientRect();
        shareCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      } else {
        const shareBtn = document.getElementById("header-share-button");
        if (shareBtn) {
          const rect = shareBtn.getBoundingClientRect();
          shareCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        } else {
          shareCoords = { x: 100, y: 150 };
        }
      }

      // Publish the Share link ready event
      ShareEvents.publish(ShareEvents.SHARE_LINK_READY, {
        shareUrl,
        shareCoords,
      });
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

  const companionName = currentUser ? (currentUser.companionDisplayName || localStorage.getItem(`companionName_${currentUser.uid}`)) : null;
  const showOnboarding = currentUser && !companionName;

  console.log("Current message state:", message);

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <CompanionNaming
            key="companion-naming-onboarding"
            onComplete={(name) => {
              updateCompanionDisplayName(name);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renameDialogOpen && (
          <CompanionNaming
            isDialog
            key="companion-rename-dialog"
            onComplete={(name) => {
              updateCompanionDisplayName(name);
              setRenameDialogOpen(false);
            }}
            onClose={() => setRenameDialogOpen(false)}
          />
        )}
      </AnimatePresence>
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
              chatTitle={activeConversation?.title || "New Conversation"}
              onShare={handleShareChat}
              darkMode={darkMode}
              onToggleTheme={toggleTheme}
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
                imageCache={imageCacheRef.current}
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
                editingMessageIndex={editingMessageIndex}
                onImageLoad={handleImageLoadEvent}
                onImageError={handleImageErrorEvent}
              />


              {activeChatId !== "search" && (
                <ChatInput
                  darkMode={darkMode}
                  message={message}
                  setMessage={setMessage}
                  handleSend={handleSend}
                  handleImageUpload={handleImageUpload}
                  selectedImage={selectedImageSrcRef.current}
                  selectedImageName={selectedImageName}
                  removeImage={handleRemoveImage}
                  isGenerating={isGenerating}
                  onStopGeneration={handleStopGeneration}
                  editingMessageIndex={editingMessageIndex}
                  onCancelEdit={handleCancelEdit}
                  activeChatId={activeChatId}
                  selectedDocumentName={selectedDocumentName}
                  selectedDocumentType={selectedDocumentType}
                  selectedDocumentSize={selectedDocumentSize}
                  removeDocument={removeDocument}
                  isPreparingDocument={isPreparingDocument}
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
        setActiveChatId={setActiveChatId}
      />
      <UndoDeleteAnimationController
        conversations={conversations}
        setConversations={setConversations}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
      />
      <ShareAnimationController />
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: 1400 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
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
        onRenameCompanion={() => {
          setSettingsOpen(false);
          setRenameDialogOpen(true);
        }}
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
