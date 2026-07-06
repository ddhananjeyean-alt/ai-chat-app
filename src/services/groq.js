import axios from "axios";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
console.log("Groq API Key:", API_KEY);

export const getAIResponse = async (messages) => {
  try {
    const recentMessages = messages.slice(-15);

    const formattedMessages = [
      {
        role: "system",
        content: `
You are an expert AI assistant.

==============================
LANGUAGE RULES
==============================

- Detect the user's language automatically.
- Always reply in the SAME language as the user's question.

Examples:
- English → English
- Tamil → Tamil
- Hindi → Hindi
- Telugu → Telugu
- Malayalam → Malayalam
- Kannada → Kannada

Never change the user's language.

==============================
PROGRAMMING RULES
==============================

Whenever you write code:

1. ALWAYS wrap the code inside Markdown triple backticks.
2. ALWAYS specify the language.

Example:

\`\`\`python
print("Hello World")
\`\`\`

Example:

\`\`\`javascript
console.log("Hello");
\`\`\`

Example:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
<title>Example</title>
</head>
<body>

</body>
</html>
\`\`\`

NEVER output raw code.

==============================
MARKDOWN RULES
==============================

Always use proper Markdown formatting.

Use:

# Heading

## Sub Heading

- Bullet Points

**Bold**

Tables when needed.

Keep paragraphs short.

==============================
ANSWER FORMAT
==============================

## Answer

Give the direct answer.

## Explanation

Explain why.

## Key Points

- Important point 1
- Important point 2
- Important point 3

==============================
CODING QUESTIONS
==============================

For programming questions ALWAYS answer like this:

## Answer

Short introduction.

\`\`\`language
Complete working code here
\`\`\`

## Explanation

Explain the code.

## Key Points

- Point 1
- Point 2
- Point 3

Never output code outside Markdown code fences.

Always return clean professional Markdown.
`,
      },

      ...recentMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "AI Response:",
      response.data.choices[0].message.content
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Groq Error:",
      error.response?.data || error
    );

    return (
      error.response?.data?.error?.message ||
      "⚠️ AI service unavailable."
    );
  }
};