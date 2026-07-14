import { useState, useRef } from "react";
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
import { useThemeContext } from "../../theme/ThemeContext";

export default function MessageBubble({
  message,
  isUser,
  onCopy,
  onRegenerate,
  onEdit,
  onImageClick,
  darkMode = true,
  messageIndex,
}) {
  const theme = useTheme();
  const { fontSize } = useThemeContext();
  const isLight = theme.palette.mode === "light";

  const resolvedFontSize =
    fontSize === "small"
      ? 14
      : fontSize === "large"
      ? 18
      : 16;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message?.text || "");
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

  const startEdit = () => {
    setEditValue(content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(content);
  };

  const saveEdit = () => {
    if (onEdit) onEdit(messageIndex, editValue);
    setIsEditing(false);
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
        {isEditing ? (
          <Box sx={{ width: 500, maxWidth: "100%" }}>
            <TextField
              multiline
              fullWidth
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: theme.palette.text.primary,
                  fontFamily: "Inter, sans-serif",
                  fontSize: resolvedFontSize,
                  background: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(30, 30, 35, 0.9)",
                  borderRadius: "20px",
                  backdropFilter: "blur(12px)",
                  "& fieldset": { 
                    borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" 
                  },
                  "&:hover fieldset": { 
                    borderColor: isLight ? "rgba(30,64,175,0.3)" : "rgba(121,248,255,0.3)" 
                  },
                  "&.Mui-focused fieldset": { 
                    borderColor: isLight ? theme.palette.primary.main : "#79f8ff" 
                  },
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
              <Button
                onClick={cancelEdit}
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  borderRadius: "999px",
                  px: 2.5,
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                size="small"
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "999px",
                  px: 2.5,
                  background: isLight ? theme.palette.primary.main : "#79f8ff",
                  color: isLight ? "#ffffff" : "#0a0b10",
                  "&:hover": { 
                    background: isLight ? theme.palette.primary.dark : "#a78bfa" 
                  },
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        ) : (
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
              <Box
                component="img"
                src={image}
                alt="attachment"
                onClick={() => onImageClick && onImageClick(image)}
                sx={{
                  maxWidth: 340,
                  maxHeight: 340,
                  borderRadius: "18px",
                  cursor: "pointer",
                  display: "block",
                  mb: content ? 1.5 : 0,
                  objectFit: "cover",
                  boxShadow: isLight
                    ? "0 4px 16px rgba(0, 0, 0, 0.05)"
                    : "0 4px 25px rgba(0, 0, 0, 0.35)",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.015)",
                  },
                }}
              />
            )}

            {/* Bubble styling */}
            {content && (
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
                        border: isLight ? "1px solid rgba(220, 228, 240, 0.8)" : "none",
                        px: 2.4,
                        py: 1.3,
                        fontFamily: "Inter, sans-serif",
                        fontSize: resolvedFontSize,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                        boxShadow: isLight
                          ? "0 4px 12px rgba(0, 0, 0, 0.04)"
                          : "0 4px 25px rgba(99, 102, 241, 0.22)",
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
                      Byte
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
            )}
          </motion.div>
        )}

        {/* Action icons below messages */}
        {!isEditing && (
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
            {isUser ? (
              <>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={startEdit} 
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