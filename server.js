const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Google Gemini SDK Initialize karein (Strictly from .env)
const apiKey = process.env.GEMINI_API_KEY;

// Agar .env file mein key nahi mili, toh server securely ruk jayega aur warning dega
if (!apiKey) {
  console.error("🚨 FATAL ERROR: GEMINI_API_KEY is missing in .env file!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey.trim());

// Default Route
app.get("/", (req, res) => {
  res.send("Fem-care AI Backend is Live with Official SDK! 🚀");
});

// Real-Time AI Chat API Route (With SDK & Memory)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, cycleDay, phase, history = [], tone = "Tum" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // BFF Persona mein tone ka rule add kar diya!
    const systemInstruction = `Act as a super friendly, caring, and supportive best friend (BFF) for the 'Fem-care' app. Do NOT act like a formal AI or doctor. 
    Talk in a very casual, warm tone using Hinglish (Hindi + English). 
    IMPORTANT STRICT RULE: Always address the user using the '${tone}' pronoun. (For example, if tone is 'Aap', say 'Aap kaise ho?', if 'Tum', say 'Tum kaisi ho?').
    Context: Your friend (the user) is currently on Day ${cycleDay} of their cycle (${phase}). 
    Keep your replies short, sweet, engaging, and remember the chat history perfectly.`;

    // Fast aur sahi model set kiya hai
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction: systemInstruction,
    });

    // History ko official SDK format mein convert karein
    const formattedHistory = history.map((msg) => ({
      role: msg.isMe ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Chat start karein aur naya message bhejein
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const aiReply = result.response.text();

    res.status(200).json({ reply: aiReply });
  } catch (error) {
    console.error("Gemini SDK Error:", error);
    // Ab proper error message aayega terminal aur app mein
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Fem-care Server is running at http://localhost:${port}`);
});
