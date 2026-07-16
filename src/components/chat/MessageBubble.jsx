import { useState, useRef, memo } from "react";
import { Box, Typography, IconButton, Tooltip, TextField, Button, Avatar, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ReplayIcon from "@mui/icons-material/Replay";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useThemeContext } from "../../theme/ThemeContext";
import { useByte } from "../../context/ByteContext";

function MessageBubble({
  message,
  isUser,
  onCopy,
  onRegenerate,
  onEdit,
  onImageClick,
  darkMode = true,
  messageIndex,
  isEditingThis,
  onImageLoad,
  onImageError,
  readOnly = false,
}) {
  const theme = useTheme();
  const { fontSize } = useThemeContext();
  const isLight = theme.palette.mode === "light";
  const { displayName } = useByte();

  const resolvedFontSize =
    fontSize === "small"
      ? 14
      : fontSize === "large"
      ? 18
      : 16;

  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hoverRef = useRef(null);

  const content = message?.text || "";
  const image = message?.image || message?.imageUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    if (onCopy) onCopy(message);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegenerate = () => {
    if (onRegenerate) onRegenerate(messageIndex);
  };

  const downloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      
      const now = new Date();
      const pad = (num) => String(num).padStart(2, "0");
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const day = pad(now.getDate());
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      
      link.download = `AI_Image_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <Box
      ref={hoverRef}
      sx={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 2,
        width: "100%",
        maxWidth: "100%",
        px: { xs: 1, sm: 2 },
        boxSizing: "border-box",
        "&:hover .msg-actions": {
          opacity: 1,
        },
      }}
    >
      {/* AI Icon Avatar */}
      {!isUser && (
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: isLight ? "rgba(30, 64, 175, 0.06)" : "rgba(121, 248, 255, 0.06)",
            border: isLight ? "1px solid rgba(30, 64, 175, 0.12)" : "1px solid rgba(121, 248, 255, 0.12)",
            color: isLight ? "#1e40af" : "#79f8ff",
            boxShadow: isLight 
              ? "0 4px 10px rgba(30, 64, 175, 0.04)" 
              : "0 4px 12px rgba(121, 248, 255, 0.1)",
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 18 }} />
        </Avatar>
      )}

      {/* Message Core Panel */}
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          width: isUser ? "auto" : "100%", 
          maxWidth: isUser ? { xs: "85%", sm: "70%" } : "100%",
          alignItems: isUser ? "flex-end" : "flex-start",
          marginLeft: isUser ? "auto" : 0,
        }}
      >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            style={{ width: isUser ? "auto" : "100%" }}
          >
            {/* Attachment preview */}
            {image && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: 340, mb: content ? 1.5 : 0 }}>
                <Box sx={{ position: "relative", display: "inline-block", maxWidth: 340, maxHeight: 340, width: "100%" }}>
                  <Box
                    component="img"
                    src={image}
                    alt="attachment"
                    onClick={() => onImageClick && onImageClick(image)}
                    onLoad={() => {
                      setImageLoaded(true);
                      if (onImageLoad) onImageLoad(message.id);
                    }}
                    onError={() => {
                      if (onImageError) onImageError(message.id);
                    }}
                    sx={{
                      maxWidth: 340,
                      maxHeight: 340,
                      width: "100%",
                      borderRadius: "18px",
                      cursor: "pointer",
                      display: "block",
                      objectFit: "cover",
                      boxShadow: isLight
                        ? "0 4px 16px rgba(0, 0, 0, 0.05)"
                        : "0 4px 25px rgba(0, 0, 0, 0.35)",
                      opacity: imageLoaded ? 1 : 0,
                      transition: "opacity 0.5s ease, transform 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.015)",
                      },
                    }}
                  />
                  {imageLoaded && (
                    <Tooltip title="Download Image">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image);
                        }}
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          background: "rgba(15, 18, 36, 0.65)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#ffffff",
                          padding: "8px",
                          borderRadius: "50%",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            background: "rgba(15, 18, 36, 0.85)",
                            transform: "scale(1.1)",
                          },
                        }}
                      >
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {/* Debug Mode: Expose Refined Prompt & Model */}
                {imageLoaded && localStorage.getItem("debug") === "true" && message?.metadata?.enhancedPrompt && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: "14px",
                      backgroundColor: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.03)",
                      border: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.06)",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        display: "block",
                        mb: 0.5,
                        color: isLight ? "#1e40af" : "#79f8ff",
                        fontFamily: "Inter, sans-serif",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Optimized Prompt (Debug)
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontStyle: "italic",
                        color: theme.palette.text.secondary,
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px",
                        lineHeight: 1.35,
                        display: "block",
                        wordBreak: "break-word"
                      }}
                    >
                      "{message.metadata.enhancedPrompt}"
                    </Typography>
                    {message.metadata?.generationModel && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          display: "block",
                          mt: 1,
                          color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "9px"
                        }}
                      >
                        Model: {message.metadata.generationModel}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
            {/* Document attachment card */}
            {isUser && message.metadata?.documentName && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: "14px",
                  background: isLight ? "rgba(37, 99, 235, 0.05)" : "rgba(255, 255, 255, 0.08)",
                  border: isLight ? "1px solid rgba(37, 99, 235, 0.12)" : "1px solid rgba(255, 255, 255, 0.12)",
                  maxWidth: 320,
                  alignSelf: "flex-end",
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isLight ? "#EEF6FF" : "rgba(121, 248, 255, 0.1)",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {message.metadata.documentType === "pdf" ? "📄" : "📝"}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: isLight ? "#1F2937" : "#FFFFFF",
                      display: "block",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {message.metadata.documentName}
                  </Typography>
                  {message.metadata.documentSize && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "10px",
                        color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {(message.metadata.documentSize / 1024).toFixed(1)} KB • Document
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Bubble styling */}
            {message.type === "image" && message.status === "error" ? (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 340,
                  p: 3,
                  borderRadius: "18px",
                  background: isLight 
                    ? "rgba(239, 68, 68, 0.04)" 
                    : "rgba(239, 68, 68, 0.02)",
                  border: isLight 
                    ? "1px dashed rgba(239, 68, 68, 0.3)" 
                    : "1px dashed rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  textAlign: "center",
                  boxShadow: isLight
                    ? "0 4px 12px rgba(0, 0, 0, 0.02)"
                    : "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              >
                <WarningAmberIcon sx={{ color: "#ef4444", fontSize: 32 }} />
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: isLight ? "#1F2937" : "#F3F4F6",
                    lineHeight: 1.5,
                    fontWeight: 500
                  }}
                >
                  {content || "Image generation failed."}
                </Typography>
                <Button
                  onClick={handleRegenerate}
                  variant="outlined"
                  size="small"
                  startIcon={<ReplayIcon />}
                  sx={{
                    borderColor: isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)",
                    color: isLight ? "#1F2937" : "#F3F4F6",
                    fontSize: "11px",
                    textTransform: "none",
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: isLight ? "#000000" : "#ffffff",
                      background: "transparent",
                    }
                  }}
                >
                  Regenerate
                </Button>
              </Box>
            ) : (
              content && (
                <Box
                  sx={
                    isUser
                      ? {
                          // User message: pill rounded tint in light mode
                          background: isLight
                            ? "#EEF6FF"
                            : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          color: isLight ? "#1F2937" : "#ffffff",
                          borderRadius: "22px",
                          border: isEditingThis 
                            ? (isLight ? "2px solid #2563EB" : "2px solid #79f8ff")
                            : (isLight ? "1px solid rgba(220, 228, 240, 0.8)" : "none"),
                          px: 2.4,
                          py: 1.3,
                          fontFamily: "Inter, sans-serif",
                          fontSize: resolvedFontSize,
                          lineHeight: 1.45,
                          wordBreak: "break-word",
                          boxShadow: isEditingThis
                            ? (isLight ? "0 0 12px rgba(37, 99, 235, 0.3)" : "0 0 16px rgba(121, 248, 255, 0.35)")
                            : (isLight ? "0 4px 12px rgba(0, 0, 0, 0.04)" : "0 4px 25px rgba(99, 102, 241, 0.22)"),
                          transition: "border 0.25s ease, box-shadow 0.25s ease",
                        }
                      : {
                          // AI message: glass card / white panel in light mode
                          position: "relative",
                          background: isLight ? "#FFFFFF" : "rgba(20, 24, 34, 0.45)",
                          border: isLight ? "1px solid rgba(220, 228, 240, 0.8)" : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "22px",
                          p: "22px",
                          backdropFilter: isLight ? "blur(20px)" : "blur(22px) saturate(180%)",
                          WebkitBackdropFilter: isLight ? "blur(20px)" : "blur(22px) saturate(180%)",
                          boxShadow: isLight
                            ? "0 8px 30px rgba(31, 41, 55, 0.05)"
                            : "0 12px 40px rgba(0, 0, 0, 0.45), 0 0 30px rgba(0, 180, 255, 0.08)",
                          width: "100%",
                          maxWidth: 850,
                          boxSizing: "border-box",
                          animation: message.playCompleteEffect ? "bubbleCompletePulse 0.3s ease-out" : "none",
                          "@keyframes bubbleCompletePulse": {
                            "0%": { transform: "scale(1)" },
                            "50%": { transform: "scale(1.01)" },
                            "100%": { transform: "scale(1)" }
                          }
                        }
                  }
                >
                  {/* AI Completion Glow Ripple Overlay */}
                  {!isUser && message.playCompleteEffect && (
                    <motion.div
                      initial={{ opacity: 0.6, scale: 0.95 }}
                      animate={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        inset: -2,
                        borderRadius: "18px",
                        border: isLight ? "2px solid rgba(59, 130, 246, 0.6)" : "2px solid rgba(121, 248, 255, 0.6)",
                        boxShadow: isLight
                          ? "0 0 15px rgba(59, 130, 246, 0.4)"
                          : "0 0 20px rgba(121, 248, 255, 0.5)",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  )}
                  {isUser ? (
                    <Typography
                      sx={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: resolvedFontSize,
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                        m: 0,
                      }}
                    >
                      {content}
                    </Typography>
                  ) : (
                    <>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: isLight ? "#98A2B3" : "rgba(255, 255, 255, 0.5)",
                          mb: 1.5,
                          fontFamily: "Inter, sans-serif",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase"
                        }}
                      >
                        {displayName}
                      </Typography>
                      <MarkdownContent
                        content={content}
                        darkMode={darkMode}
                        fontSize={resolvedFontSize}
                        isBot={true}
                      />
                    </>
                  )}
                </Box>
              )
            )}
          </motion.div>

        {/* Action icons below messages */}
        {!readOnly && (
          <Box
            className="msg-actions"
            sx={{
              display: "flex",
              gap: 0.5,
              mt: 0.75,
              opacity: 0,
              transition: "opacity 0.2s ease",
            }}
          >
            {isUser && !isEditingThis ? (
              <>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => onEdit && onEdit(messageIndex, content)} 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      opacity: 0.65, 
                      transition: "color 0.2s, transform 0.15s",
                      "&:hover": { opacity: 1, scale: 1.12, color: isLight ? theme.palette.primary.main : "#79f8ff" } 
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={copied ? "Copied" : "Copy"}>
                  <IconButton 
                    size="small" 
                    onClick={handleCopy} 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      opacity: 0.65, 
                      transition: "color 0.2s, transform 0.15s",
                      "&:hover": { opacity: 1, scale: 1.12, color: isLight ? theme.palette.primary.main : "#79f8ff" } 
                    }}
                  >
                    {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title={copied ? "Copied" : "Copy"}>
                  <IconButton 
                    size="small" 
                    onClick={handleCopy} 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      opacity: 0.65, 
                      transition: "color 0.2s, transform 0.15s",
                      "&:hover": { opacity: 1, scale: 1.12, color: isLight ? theme.palette.primary.main : "#79f8ff" } 
                    }}
                  >
                    {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate">
                  <IconButton 
                    size="small" 
                    onClick={handleRegenerate} 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      opacity: 0.65, 
                      transition: "color 0.2s, transform 0.15s",
                      "&:hover": { opacity: 1, scale: 1.12, color: isLight ? theme.palette.primary.main : "#79f8ff" } 
                    }}
                  >
                    <ReplayIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* User Icon Avatar */}
      {isUser && (
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)",
            border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
            color: theme.palette.text.primary,
            boxShadow: isLight 
              ? "0 4px 10px rgba(0,0,0,0.03)" 
              : "0 4px 12px rgba(0,0,0,0.2)",
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          <PersonIcon sx={{ fontSize: 18 }} />
        </Avatar>
      )}
    </Box>
  );
}

// Markdown Content Parser Component
function MarkdownContent({ content, _darkMode, fontSize = 16, isBot = false }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const textColor = isBot ? (isLight ? "#1F2937" : "#ffffff") : theme.palette.text.primary;
  const linkColor = isLight ? "#0EA5FF" : "#79f8ff";
  const quoteBorderColor = isLight ? "#2563EB" : "rgba(121, 248, 255, 0.3)";
  const quoteBgColor = isLight ? "rgba(37, 99, 235, 0.04)" : "rgba(121, 248, 255, 0.02)";
  const dividerColor = isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <Typography
            component="p"
            sx={{
              fontFamily: "Inter, sans-serif",
              color: textColor,
              fontSize: fontSize,
              lineHeight: 1.7,
              mb: 1.8,
              "&:last-child": { mb: 0 },
            }}
          >
            {children}
          </Typography>
        ),

        h1: ({ children }) => (
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: "Outfit, Inter, sans-serif", 
              fontWeight: 700, 
              color: textColor,
              mt: 3.5, 
              mb: 1.5,
              letterSpacing: "-0.015em"
            }}
          >
            {children}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: "Outfit, Inter, sans-serif", 
              fontWeight: 700, 
              color: textColor,
              mt: 3.2, 
              mb: 1.4,
              letterSpacing: "-0.015em"
            }}
          >
            {children}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: "Outfit, Inter, sans-serif", 
              fontWeight: 700, 
              color: textColor,
              mt: 2.8, 
              mb: 1.2,
              letterSpacing: "-0.01em"
            }}
          >
            {children}
          </Typography>
        ),
        ul: ({ children }) => (
          <Box 
            component="ul"
            sx={{ 
              pl: 2.5, 
              mb: 1.8, 
              "& li": { mb: 0.8 }, 
              fontSize: fontSize, 
              lineHeight: 1.7,
              color: textColor 
            }}
          >
            {children}
          </Box>
        ),
        ol: ({ children }) => (
          <Box 
            component="ol"
            sx={{ 
              pl: 2.5, 
              mb: 1.8, 
              "& li": { mb: 0.8 }, 
              fontSize: fontSize, 
              lineHeight: 1.7,
              color: textColor 
            }}
          >
            {children}
          </Box>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: "6px" }}>
            {children}
          </li>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              color: linkColor, 
              fontWeight: 500,
              textDecoration: "none",
              borderBottom: `1.5px solid ${linkColor}`
            }}
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <Box
            component="blockquote"
            sx={{
              borderLeft: `3.5px solid ${quoteBorderColor}`,
              background: quoteBgColor,
              pl: 2,
              pr: 1,
              py: 0.8,
              ml: 0,
              my: 2.2,
              color: isBot ? "rgba(255, 255, 255, 0.72)" : theme.palette.text.secondary,
              fontStyle: "italic",
              borderRadius: "0 8px 8px 0",
            }}
          >
            {children}
          </Box>
        ),
        hr: () => <Box component="hr" sx={{ border: 0, borderTop: `1px solid ${dividerColor}`, my: 2.8 }} />,
        table: ({ children }) => (
          <Box 
            sx={{ 
              overflowX: "auto", 
              mb: 2, 
              borderRadius: "12px", 
              border: `1px solid ${dividerColor}` 
            }}
          >
            <Box
              component="table"
              sx={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: 14,
                color: textColor,
                "& th, & td": {
                  borderBottom: `1px solid ${dividerColor}`,
                  px: 2,
                  py: 1.2,
                  textAlign: "left",
                },
                "& th": { 
                  background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", 
                  fontWeight: 600 
                },
                "& tr:last-child td": {
                  borderBottom: "none"
                }
              }}
            >
              {children}
            </Box>
          </Box>
        ),
        img: ({ src, alt }) => (
          <Box 
            component="img"
            src={src} 
            alt={alt} 
            sx={{ 
              maxWidth: "100%", 
              borderRadius: "14px", 
              my: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }} 
          />
        ),
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (inline) {
            return (
              <Box
                component="code"
                sx={{
                  background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)",
                  color: isLight ? "#D6336C" : "#79f8ff",
                  px: 0.8,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: 13.5,
                  fontWeight: 500,
                  fontFamily: '"Fira Code", monospace',
                }}
                {...props}
              >
                {children}
              </Box>
            );
          }

          return <CodeBlock language={match ? match[1] : ""} codeString={codeString} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Custom CodeBlock Component
function CodeBlock({ language, codeString }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box
      sx={{
        borderRadius: "14px",
        overflow: "hidden",
        my: 2.2,
        border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
        maxWidth: "100%",
        boxShadow: isLight ? "0 8px 24px rgba(0,0,0,0.05)" : "0 12px 28px rgba(0,0,0,0.35)",
      }}
    >
      {/* CodeBlock Header bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isLight ? "#F8FAFC" : "#1e1e24",
          borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.05)",
          px: 2.5,
          py: 1,
        }}
      >
        <Typography 
          sx={{ 
            fontSize: 12, 
            color: "rgba(255,255,255,0.5)", 
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontFamily: '"Fira Code", monospace' 
          }}
        >
          {language || "text"}
        </Typography>
        <Tooltip title={copied ? "Copied!" : "Copy Code"}>
          <IconButton 
            size="small" 
            onClick={handleCopy} 
            sx={{ 
              color: isLight ? "#667085" : "rgba(255,255,255,0.5)", 
              "&:hover": { color: "#79f8ff" } 
            }}
          >
            {copied ? <CheckIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code Text Area */}
      <Box sx={{ overflowX: "auto", maxWidth: "100%" }}>
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "20px",
            fontSize: 13.5,
            lineHeight: 1.6,
            background: "#0d0e12",
            borderRadius: 0,
          }}
          wrapLongLines={false}
        >
          {codeString}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
}

export default memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.message?.id === nextProps.message?.id &&
    prevProps.message?.text === nextProps.message?.text &&
    prevProps.message?.status === nextProps.message?.status &&
    prevProps.message?.image === nextProps.message?.image &&
    prevProps.message?.imageUrl === nextProps.message?.imageUrl &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.darkMode === nextProps.darkMode &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.messageIndex === nextProps.messageIndex &&
    prevProps.isEditingThis === nextProps.isEditingThis &&
    prevProps.readOnly === nextProps.readOnly
  );
});