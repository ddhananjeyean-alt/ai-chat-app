import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton, TextareaAutosize, Tooltip, useTheme, Typography, CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CloseIcon from "@mui/icons-material/Close";
import { useByte, BYTE_STATES } from "../../context/ByteContext";

export default function ChatInput({
  message,
  setMessage,
  handleSend,
  handleImageUpload,
  selectedImage,
  selectedImageName,
  removeImage,
  darkMode = true,
  isGenerating = false,
  onStopGeneration,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (selectedImage) {
      setIsPreparing(false);
    }
  }, [selectedImage]);
  const { setByteState } = useByte();

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const MIN_HEIGHT = 22;
  const MAX_HEIGHT = 160;

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
  }, [message, autoResize]);

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
      setByteState(BYTE_STATES.IDLE);
    };

    recognitionRef.current = recognition;
  }, [setMessage, setByteState]);

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const isSendingRef = useRef(false);

  const handleKeyDown = async (e) => {
    if (e.key !== "Enter" || e.shiftKey || isSendingRef.current || isGenerating) return;

    e.preventDefault();
    isSendingRef.current = true;

    try {
      await handleSend();
    } finally {
      setTimeout(() => {
        isSendingRef.current = false;
      }, 300);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPreparing(true);
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

        setIsPreparing(true);
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
      setByteState(BYTE_STATES.IDLE);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      setByteState(BYTE_STATES.LISTENING);
    }
  };

  const glassBg = isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(13, 15, 23, 0.6)";
  const glassBorder = isLight ? "1px solid rgba(220, 228, 240, 0.9)" : "1px solid rgba(255, 255, 255, 0.05)";
  const textColor = theme.palette.text.primary;
  const placeholderColor = isLight ? "#8A94A6" : "rgba(255,255,255,0.38)";
  const iconColor = isLight ? "#475467" : theme.palette.text.secondary;

  const canSend = Boolean(message?.trim() || selectedImage) && !isGenerating && !isPreparing;

  // Send button styling
  const sendBtnBg = isLight 
    ? "linear-gradient(135deg, #0EA5FF 0%, #2563EB 100%)" 
    : "#79f8ff";
  const sendBtnColor = isLight ? "#ffffff" : "#0a0b10";
  const sendBtnHoverBg = isLight 
    ? "linear-gradient(135deg, #1eaeff, #3b82f6 100%)" 
    : "#ffffff";
  const sendBtnShadow = canSend
    ? (isLight 
        ? "0 4px 14px rgba(14, 165, 255, 0.35)" 
        : "0 0 20px rgba(121, 248, 255, 0.6)")
    : "none";

  // Focused drop shadow glow
  const wrapperShadow = isFocused
    ? (isLight
        ? "0 12px 28px rgba(31, 41, 55, 0.08), 0 0 0 3px rgba(14, 165, 255, 0.25)"
        : "0 16px 40px rgba(0, 0, 0, 0.45), 0 0 0 3px rgba(121, 248, 255, 0.12)")
    : (isLight
        ? "0 6px 22px rgba(31, 41, 55, 0.04)"
        : "0 10px 35px rgba(0, 0, 0, 0.35)");

  return (
    <Box
      sx={{
        position: "absolute",
        left: { xs: 16, sm: 24, md: 32 },
        right: { xs: 16, sm: 24, md: 32 },
        bottom: 24, // Floats slightly above the bottom
        display: "flex",
        justifyContent: "flex-start",
        zIndex: 100,
        pointerEvents: "none",
        px: 0,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          pointerEvents: "auto",
        }}
      >
        {/* Upload Image Preview bubble */}
        <AnimatePresence>
          {(selectedImage || isPreparing) && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                  p: 1,
                  pl: 1.5,
                  pr: 1.5,
                  position: "absolute",
                  bottom: "100%",
                  left: 12,
                  background: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(18, 20, 30, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: glassBorder,
                  borderRadius: "16px",
                  boxShadow: isLight 
                    ? "0 4px 16px rgba(0, 0, 0, 0.05)" 
                    : "0 8px 24px rgba(0, 0, 0, 0.4)",
                  zIndex: 10,
                }}
              >
                <Box sx={{ position: "relative", width: 44, height: 44, borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(128,128,128,0.1)" }}>
                  {isPreparing ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularProgress size={20} sx={{ color: isLight ? theme.palette.primary.main : "#79f8ff" }} />
                    </Box>
                  ) : (
                    <Box
                      component="img"
                      src={selectedImage}
                      alt="upload preview"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: "flex", flexDirection: "column", maxWidth: 150 }}>
                  <Typography variant="caption" sx={{ color: textColor, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
                    {isPreparing ? "Preparing image..." : (selectedImageName || "Uploaded image")}
                  </Typography>
                  {!isPreparing && (
                    <Typography variant="caption" sx={{ color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)", fontSize: "10px", fontFamily: "Inter, sans-serif" }}>
                      Ready to send
                    </Typography>
                  )}
                </Box>

                <IconButton
                  onClick={() => {
                    setIsPreparing(false);
                    removeImage?.();
                  }}
                  aria-label="Remove image"
                  size="small"
                  sx={{
                    width: 22,
                    height: 22,
                    background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
                    color: textColor,
                    "&:hover": { background: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.18)" },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer Capsule container with glassmorphism */}
        <motion.div
          animate={{
            boxShadow: wrapperShadow,
            borderColor: isFocused
              ? (isLight ? "rgba(37, 99, 235, 0.55)" : "rgba(121, 248, 255, 0.4)")
              : (isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.05)"),
          }}
          whileHover={{
            borderColor: isFocused
              ? (isLight ? "rgba(37, 99, 235, 0.55)" : "rgba(121, 248, 255, 0.4)")
              : (isLight ? "rgba(0, 0, 0, 0.28)" : "rgba(255, 255, 255, 0.12)"),
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: glassBg,
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            border: "1px solid",
            borderRadius: "32px",
            padding: "8px 12px",
            minHeight: 56,
            boxSizing: "border-box",
          }}
        >
          {/* File Attachment Button */}
          <Tooltip title="Attach image">
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                color: iconColor,
                transition: "background 0.2s ease, transform 0.15s ease",
                "&:hover": {
                  background: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
                  transform: "scale(1.05)",
                  color: isLight ? theme.palette.primary.main : "#79f8ff",
                },
              }}
            >
              <AddIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Autoresizing premium text area */}
          <TextareaAutosize
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Byte anything..."
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
              fontSize: "15px",
              lineHeight: "22px",
              height: "22px",
              minHeight: "22px",
              maxHeight: MAX_HEIGHT,
              padding: "4px 4px 4px 2px",
            }}
          />

          <style>{`
            textarea::placeholder { 
              color: ${placeholderColor}; 
              font-weight: 500;
              opacity: 0.75;
            }
          `}</style>

          {/* Voice Input Button */}
          <Tooltip title={isRecording ? "Stop recording" : "Voice input"}>
            <IconButton
              onClick={toggleVoice}
              aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                color: isRecording ? "#FF4B4B" : iconColor,
                position: "relative",
                transition: "background 0.2s ease, transform 0.15s ease",
                "&:hover": {
                  background: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
                  transform: "scale(1.05)",
                  color: isRecording ? "#FF4B4B" : (isLight ? theme.palette.primary.main : "#79f8ff"),
                },
              }}
            >
              {isRecording && (
                <motion.span
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "rgba(255,75,75,0.25)",
                  }}
                />
              )}
              <MicNoneRoundedIcon sx={{ position: "relative", zIndex: 1, fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          {/* Send or Stop Message Button */}
          <motion.div 
            whileHover={true} 
            whileTap={{ scale: 0.95 }}
          >
            <IconButton
              onClick={async () => {
                if (isGenerating) {
                  onStopGeneration?.();
                  return;
                }
                if (isSendingRef.current) return;
                isSendingRef.current = true;
                try {
                  await handleSend();
                } finally {
                  setImage(null);
                  setImagePreview(null);
                  setTimeout(() => {
                    isSendingRef.current = false;
                  }, 300);
                }
              }}
              disabled={!isGenerating && !canSend}
              aria-label={isGenerating ? "Stop generation" : "Send message"}
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                background: isGenerating 
                  ? (isLight ? "rgba(220, 38, 38, 0.9)" : "rgba(239, 68, 68, 0.9)")
                  : sendBtnBg,
                color: isGenerating ? "#ffffff" : sendBtnColor,
                boxShadow: isGenerating 
                  ? "0 0 15px rgba(239, 68, 68, 0.4)" 
                  : sendBtnShadow,
                transition: "background 0.25s ease, box-shadow 0.25s ease",
                "&:hover": {
                  background: isGenerating 
                    ? (isLight ? "rgba(220, 38, 38, 1)" : "rgba(239, 68, 68, 1)")
                    : sendBtnHoverBg,
                  boxShadow: isGenerating 
                    ? "0 0 20px rgba(239, 68, 68, 0.6)" 
                    : sendBtnShadow,
                },
                "&.Mui-disabled": {
                  background: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
                  color: isLight ? "rgba(0, 0, 0, 0.26)" : "rgba(255, 255, 255, 0.2)",
                  boxShadow: "none",
                },
              }}
            >
              {isGenerating ? (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "2px",
                    backgroundColor: "currentColor",
                  }}
                />
              ) : (
                <ArrowUpwardRoundedIcon sx={{ fontSize: 20, fontWeight: 700 }} />
              )}
            </IconButton>
          </motion.div>
        </motion.div>
      </Box>
    </Box>
  );
}
