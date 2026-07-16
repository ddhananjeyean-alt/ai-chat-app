import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Groq API key not configured on server." });
  }

  const { messages, model, temperature, max_tokens, stream } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid or missing messages parameter." });
  }

  try {
    const groqPayload = {
      model: model || "llama-3.3-70b-versatile",
      messages,
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: max_tokens || 2048,
      stream: !!stream
    };

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        groqPayload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "stream",
          timeout: 20000,
        }
      );

      response.data.on("data", (chunk) => {
        res.write(chunk);
      });

      response.data.on("end", () => {
        res.end();
      });

      response.data.on("error", (err) => {
        console.error("Error in Groq stream proxy:", err);
        if (!res.headersSent) {
          res.status(500).end("Stream error occurred.");
        } else {
          res.end();
        }
      });
    } else {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        groqPayload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );

      return res.status(200).json(response.data);
    }
  } catch (error) {
    console.error("Groq Proxy Server Error:", error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const errorBody = error.response?.data || { error: error.message };
    return res.status(statusCode).json(errorBody);
  }
}
