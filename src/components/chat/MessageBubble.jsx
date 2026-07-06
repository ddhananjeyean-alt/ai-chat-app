import React, { useState, useRef } from "react";
import { Box, Typography, IconButton, Tooltip, TextField, Button, Avatar } from "@mui/material";
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

  const { fontSize } = useThemeContext();

  const resolvedFontSize =
  fontSize === "small"
    ? 14
    : fontSize === "large"
    ? 18
    : 16;
  console.log("MessageBubble Font:", fontSize, resolvedFontSize);
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
        gap: 1.5,
        width: isUser ? "fit-content" : "100%",
        maxWidth: isUser ? "520px" : "100%",
        marginLeft: isUser ? "auto" : 0,
        "&:hover .msg-actions": {
          opacity: 1,
        },
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#10A37F",
            fontSize: 16,
            flexShrink: 0,
            mt: 0.3,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", width: isUser ? "auto" : "100%", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {isEditing ? (
          <Box sx={{ width: 420, maxWidth: "100%" }}>
            <TextField
              multiline
              fullWidth
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: darkMode ? "#ECECEC" : "#111827",
                  fontFamily: "Inter, sans-serif",
                  fontSize: resolvedFontSize,
                  background: "#2F2F2F",
                  borderRadius: "16px",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&.Mui-focused fieldset": { borderColor: "#6d8dff" },
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
              <Button
                onClick={cancelEdit}
                size="small"
                sx={{
                  textTransform: "none",
                  color: "#ECECEC",
                  borderRadius: "999px",
                  px: 2,
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
                  borderRadius: "999px",
                  px: 2,
                  background: "#ECECEC",
                  color: "#171717",
                  "&:hover": { background: "#d9d9d9" },
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ width: isUser ? "auto" : "100%" }}
          >
            {image && (
              <Box
                component="img"
                src={image}
                alt="attachment"
                onClick={() => onImageClick && onImageClick(image)}
                sx={{
                  maxWidth: 320,
                  maxHeight: 320,
                  borderRadius: "16px",
                  cursor: "pointer",
                  display: "block",
                  mb: content ? 1 : 0,
                  objectFit: "cover",
                }}
              />
            )}

            {content && (
              <Box
                sx={
                  isUser
                    ?{
  background: "#2F6FED",
  color: "#fff",
  borderRadius: "18px",
  px: 1.6,
  py: 0.5,
  fontFamily: "Inter, sans-serif",
  fontSize: resolvedFontSize,
  lineHeight: 1.3,
  wordBreak: "break-word",
}
                    : {
    color: darkMode ? "#ECECEC" : "#111827",
    fontFamily: "Inter, sans-serif",
    fontSize: resolvedFontSize,
    lineHeight: 1.8,
    width: "100%",
}
                }
              >
                {isUser ? (
<Typography
  sx={{
    fontSize: resolvedFontSize,
    lineHeight: 1.3,
    whiteSpace: "pre-wrap",
    m: 0,
  }}
>
  {content}
</Typography>
                ) : (
<MarkdownContent
  content={content}
  darkMode={darkMode}
  fontSize={resolvedFontSize}
/>                )}
              </Box>
            )}
          </motion.div>
        )}

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
                  <IconButton size="small" onClick={startEdit} sx={{ color: "rgba(255,255,255,0.55)" }}>
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={copied ? "Copied" : "Copy"}>
                  <IconButton size="small" onClick={handleCopy} sx={{ color: "rgba(255,255,255,0.55)" }}>
                    {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title={copied ? "Copied" : "Copy"}>
                  <IconButton size="small" onClick={handleCopy} sx={{ color: "rgba(255,255,255,0.55)" }}>
                    {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate">
                  <IconButton size="small" onClick={handleRegenerate} sx={{ color: "rgba(255,255,255,0.55)" }}>
                    <ReplayIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      </Box>

      {isUser && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#5C5C5C",
            fontSize: 16,
            flexShrink: 0,
            mt: 0.3,
          }}
        >
          <PersonIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
    </Box>
  );
}

function MarkdownContent({
  content,
  darkMode,
  fontSize = 16,
}) {  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
  <Typography
    sx={{
      color: darkMode ? "#ECECEC" : "#111827",
      fontSize: fontSize,
      lineHeight: 1.8,
      mb: 1.6,
      "&:last-child": { mb: 0 },
    }}
  >
    {children}
  </Typography>
),

        h1: ({ children }) => (
          <Typography sx={{ fontSize: 26, fontWeight: 700, mt: 2.5, mb: 1.2 }}>{children}</Typography>
        ),
        h2: ({ children }) => (
          <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 2.2, mb: 1.1 }}>{children}</Typography>
        ),
        h3: ({ children }) => (
          <Typography sx={{ fontSize: 18, fontWeight: 700, mt: 2, mb: 1 }}>{children}</Typography>
        ),
    ul: ({ children }) => (
  <Box component="ul" sx={{ pl: 3, mb: 1.6, "& li": { mb: 0.6 }, fontSize: fontSize, lineHeight: 1.8 }}>
            {children}
          </Box>
        ),
        ol: ({ children }) => (
  <Box component="ol" sx={{ pl: 3, mb: 1.6, "& li": { mb: 0.6 }, fontSize: fontSize, lineHeight: 1.8 }}>            {children}
          </Box>
        ),
        li: ({ children }) => <li>{children}</li>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" style={{ color: "#5B9BFF", textDecoration: "underline" }}>
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <Box
            component="blockquote"
            sx={{
              borderLeft: "3px solid rgba(255,255,255,0.25)",
              pl: 2,
              ml: 0,
              my: 1.6,
              color: "rgba(255,255,255,0.75)",
              fontStyle: "italic",
            }}
          >
            {children}
          </Box>
        ),
        hr: () => <Box component="hr" sx={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.15)", my: 2.5 }} />,
        table: ({ children }) => (
          <Box sx={{ overflowX: "auto", mb: 1.6 }}>
            <Box
              component="table"
              sx={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: 14.5,
                "& th, & td": {
                  border: "1px solid rgba(255,255,255,0.15)",
                  px: 1.5,
                  py: 0.8,
                  textAlign: "left",
                },
                "& th": { background: "rgba(255,255,255,0.05)", fontWeight: 600 },
              }}
            >
              {children}
            </Box>
          </Box>
        ),
        img: ({ src, alt }) => (
          <Box component="img" src={src} alt={alt} sx={{ maxWidth: "100%", borderRadius: "12px", my: 1.5 }} />
        ),
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (inline) {
            return (
              <Box
                component="code"
                sx={{
                  background: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  color: darkMode ? "#F5A9B8" : "#D6336C",
                  px: 0.7,
                  py: 0.2,
                  borderRadius: "6px",
                  fontSize: 13.5,
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
        borderRadius: "12px",
        overflow: "hidden",
        my: 1.8,
        border: "1px solid rgba(255,255,255,0.08)",
        maxWidth: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#2A2A2A",
          px: 2,
          py: 0.8,
        }}
      >
        <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", fontFamily: '"Fira Code", monospace' }}>
          {language || "text"}
        </Typography>
        <Tooltip title={copied ? "Copied" : "Copy code"}>
          <IconButton size="small" onClick={handleCopy} sx={{ color: "rgba(255,255,255,0.6)" }}>
            {copied ? <CheckIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ overflowX: "auto", maxWidth: "100%" }}>
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "16px",
            fontSize: 13.5,
            background: "#1E1E1E",
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