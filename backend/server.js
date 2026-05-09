// server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Tesseract = require("tesseract.js");

const { Mistral } = require("@mistralai/mistralai");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// MISTRAL CLIENT
// ==========================

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// ==========================
// MULTER SETUP
// ==========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ==========================
// FORMAT DATE
// ==========================

function formatLocalDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================
// IMPROVED EVENT PARSER
// ==========================

function parseEvent(text) {
  const today = new Date();

  const lower = text.toLowerCase();

  let eventDate = new Date(today);

  let time = "";

  // ==========================
  // MONTHS
  // ==========================

  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  // ==========================
  // MONTH + DATE
  // ==========================

  const monthDateMatch = lower.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/,
  );

  if (monthDateMatch) {
    const month = months[monthDateMatch[1]];

    const day = parseInt(monthDateMatch[2]);

    eventDate = new Date(today.getFullYear(), month, day);
  }

  // ==========================
  // SIMPLE DATE
  // ==========================
  else {
    const simpleDateMatch =
      lower.match(/\bon\s+(\d{1,2})\b/) ||
      lower.match(/\b(\d{1,2})(st|nd|rd|th)?\b/);

    if (simpleDateMatch) {
      const day = parseInt(simpleDateMatch[1]);

      if (day >= 1 && day <= 31) {
        eventDate = new Date(today.getFullYear(), today.getMonth(), day);
      }
    }
  }

  // ==========================
  // TOMORROW
  // ==========================

  if (lower.includes("tomorrow")) {
    eventDate.setDate(today.getDate() + 1);
  }

  // ==========================
  // TIME
  // ==========================

  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);

    const minutes = timeMatch[2] || "00";

    const period = timeMatch[3].toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    }

    if (period === "am" && hours === 12) {
      hours = 0;
    }

    time = `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // ==========================
  // CLEAN TITLE
  // ==========================

  let title = text;

  // REMOVE MONTH DATE
  title = title.replace(
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    "",
  );

  // REMOVE "on 11"
  title = title.replace(/\bon\s+\d{1,2}\b/gi, "");

  // REMOVE "11th"
  title = title.replace(/\b\d{1,2}(st|nd|rd|th)?\b/gi, "");

  // REMOVE TIME
  title = title.replace(/\d{1,2}(:\d{2})?\s*(am|pm)/gi, "");

  // REMOVE EXTRA WORDS
  title = title.replace(/\b(on|at|tomorrow|today)\b/gi, "");

  // CLEAN SPACES
  title = title.replace(/\s+/g, " ").trim();

  // CAPITALIZE
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // FALLBACK
  if (!title) {
    title = "Untitled Event";
  }

  return {
    title,
    date: formatLocalDate(eventDate),
    time,
  };
}

// ==========================
// MANUAL TEXT INPUT
// ==========================

app.post("/parse", (req, res) => {
  try {
    const text = req.body.text;

    const result = parseEvent(text);

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Parse failed",
    });
  }
});

// ==========================
// OCR + AI ROUTE
// ==========================

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // ==========================
    // OCR
    // ==========================

    const result = await Tesseract.recognize(imagePath, "eng");

    const extractedText = result.data.text;

    console.log("OCR TEXT:");

    console.log(extractedText);

    // ==========================
    // MISTRAL AI
    // ==========================

    let parsed;

    try {
      const response = await client.chat.complete({
        model: "mistral-small-latest",

        messages: [
          {
            role: "user",

            content: `
Extract the event details from this OCR text.

Return ONLY valid JSON.

Format:
{
  "title": "",
  "date": "",
  "time": ""
}

Rules:
- date must be YYYY-MM-DD
- time must be 24 hour format
- if missing use empty string

OCR TEXT:
${extractedText}
`,
          },
        ],
      });

      const aiText = response.choices[0].message.content;

      console.log("MISTRAL OUTPUT:");

      console.log(aiText);

      parsed = JSON.parse(aiText);
    } catch (aiError) {
      console.log("AI FALLBACK USED");

      parsed = parseEvent(extractedText);
    }

    res.json(parsed);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "AI poster extraction failed",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
