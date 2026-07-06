import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton, TextareaAutosize, Tooltip } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CloseIcon from "@mui/icons-material/Close";

export default function ChatInput({
  message,
  setMessage,
  handleSend,
  handleImageUpload,
  selectedImage,
  selectedImageName,
  removeImage,
  darkMode = true,
}) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const MIN_HEIGHT = 20;
  const MAX_HEIGHT = 180;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    autoResize();
  },[message, autoResize]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

   recognition.onresult = (event) => {
  let transcript = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    transcript += event.results[i][0].transcript;
  }

  setMessage((prev) => (prev ? prev + " " : "") + transcript);
};

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [setMessage]);

  const handleChange = (e) => {
   setMessage(e.target.value)
  };

const isSendingRef = useRef(false);

const handleKeyDown = async (e) => {
  if (e.key !== "Enter" || e.shiftKey || isSendingRef.current) return;

  e.preventDefault();

  isSendingRef.current = true;

  try {
    await handleSend();
  } finally {
    setImage(null);
    setImagePreview(null);
    removeImage?.();
    setTimeout(() => {
      isSendingRef.current = false;
    }, 300);
  }
};



  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    handleImageUpload?.({
  target: {
    files: [file],
  },
});
    e.target.value = "";
  };



  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        handleImageUpload?.({
          target: {
            files: [file],
          },
        });
      }
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const bg = darkMode ? "#2F2F2F" : "#FFFFFF";
  const border = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const textColor = darkMode ? "#ECECEC" : "#111111";
  const placeholderColor = darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const iconColor = darkMode ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";

const canSend = Boolean(message?.trim() || image);  
return (
<Box
  sx={{
position: "absolute",
left: 24,
right: 24,
bottom: 16,

    display: "flex",
    justifyContent: "center",

    zIndex: 100,

    pointerEvents: "none",

    px: 2,
  }}
>
   <Box
  sx={{
    width: "100%",
    maxWidth: "780px",
    pointerEvents: "auto",
  }}
>
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
           <Box
  sx={{
    display: "flex",
    mb: 1,
    pl: 1,
    position: "absolute",
    bottom: "100%",
    left: 12,
  }}
>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="upload preview"
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: "14px",
                    border: `1px solid ${border}`,
                  }}
                />
                <IconButton
                  onClick={() => {
  setImage(null);
  setImagePreview(null);
  removeImage?.();
}}
                  aria-label="Remove image"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,    
                    height: 20,
                    background: "#000000",
                    color: "#fff",
                    "&:hover": { background: "#1a1a1a" },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 3px rgba(90,130,255,0.18), 0 4px 18px rgba(0,0,0,0.25)"
            : "0 2px 10px rgba(0,0,0,0.18)",
        }}
        transition={{ duration: 0.2 }}
       style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  width: "100%",
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 28,
  padding: "4px 8px",
  minHeight: 52,
  boxSizing: "border-box",
}}
      >
        <Tooltip title="Attach">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              color: iconColor,
              transition: "background 0.15s ease, transform 0.15s ease",
              "&:hover": {
                background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                transform: "scale(1.05)",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <TextareaAutosize
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything"
          aria-label="Message"
          minRows={1}
          style={{
  flex: 1,
  resize: "none",
  border: "none",
  outline: "none",
  background: "transparent",
  color: textColor,
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "20px",
  height: "20px",
  minHeight: "20px",
  maxHeight: MAX_HEIGHT,
  padding: 0,
}}
        />

        <style>{`textarea::placeholder { color: ${placeholderColor}; }`}</style>

        <Tooltip title={isRecording ? "Stop recording" : "Voice input"}>
          <IconButton
            onClick={toggleVoice}
            aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              color: isRecording ? "#FF4B4B" : iconColor,
              position: "relative",
              transition: "background 0.15s ease, transform 0.15s ease",
              "&:hover": {
                background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                transform: "scale(1.05)",
              },
            }}
          >
            {isRecording && (
              <motion.span
                animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,75,75,0.4)",
                }}
              />
            )}
            <MicNoneRoundedIcon sx={{ position: "relative", zIndex: 1 }} />
          </IconButton>
        </Tooltip>

        <motion.div whileHover={canSend ? { scale: 1.06 } : {}} whileTap={canSend ? { scale: 0.94 } : {}}>
          <IconButton
onClick={async () => {
  if (isSendingRef.current) return;

  isSendingRef.current = true;

  try {
    await handleSend();
  } finally {
    setImage(null);
    setImagePreview(null);
    removeImage?.();

    setTimeout(() => {
      isSendingRef.current = false;
    }, 300);
  }
}}
            disabled={!canSend}
            aria-label="Send message"
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              background: darkMode ? "#ECECEC" : "#111111",
              color: darkMode ? "#111111" : "#FFFFFF",
              "&:hover": {
                background: darkMode ? "#FFFFFF" : "#000000",
              },
              "&.Mui-disabled": {
                background: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
                color: darkMode ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
              },
            }}
          >
            <ArrowUpwardRoundedIcon fontSize="small" />
          </IconButton>
        </motion.div>
      </motion.div>
    </Box>
    </Box>  
  );
}
