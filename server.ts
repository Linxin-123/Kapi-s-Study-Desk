/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables (.env.local takes priority, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Lazy-initialize Gemini API Client with Telemetry Headers
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('WARNING: GEMINI_API_KEY is not defined in the environment. Falling back to empty or offline responses.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// Kapi Companion AI Speech Generator
app.post('/api/gemini/companion', async (req: express.Request, res: express.Response): Promise<void> => {
  const {
    type,
    mascotName = 'Kapi',
    streak = 1,
    distractionCount = 0,
    focusMinutes = 0,
    pomodorosCompleted = 0,
  } = req.body;

  if (!type) {
    res.status(400).json({ error: 'Missing conversation type parameter' });
    return;
  }

  // Double check if API Key is actually configured. If not, return beautiful pre-cooked supportive offline messages
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
    // Generate lovely offline fallbacks that fit the spec perfectly
    let fallbackText = '';
    if (type === 'greet') {
      fallbackText = `Hi there! It is Day ${streak} of us studying together. Let's do our best and stay focused today! 🍵`;
    } else if (type === 'pomodoro') {
      fallbackText = `Fantastic! You just finished a Pomodoro focus session! Take a little break, ${mascotName} is so proud of you! 🌸`;
    } else if (type === 'distract') {
      fallbackText = `Hmm... ${mascotName} saw you looking away. Let's stay focused together for just a bit longer, okay? 🧸`;
    } else {
      fallbackText = `【${mascotName}'s Daily Study Report】\nToday, you studied efficiently for ${focusMinutes} minutes and completed ${pomodorosCompleted} full Pomodoros! Even though there were ${distractionCount} minor phone checks, you did an amazing job! Have some warm tea and rest well. ${mascotName} will be waiting right here for you tomorrow! Goodnight! 🌸`;
    }
    res.json({ text: fallbackText, isMock: true });
    return;
  }

  try {
    const ai = getAi();
    let prompt = '';
    let systemInstruction = `You play the role of ${mascotName}, an adorable, extremely warm, gentle, and sleepy Capybara.
You are the user's loyal study buddy. Speak in a warm, encouraging, slightly playful, and comforting anime-styled voice, using cute emojis (e.g., 🍵, 🍊, 🌸, 🧸, 📚).
ALL of your responses must be written completely in ENGLISH.
Never blame, command, lecture, or scold the user. Treat all of the user's actions with the utmost empathy and warm support. Your primary goal is to help them study without anxiety and feel happy.`;

    switch (type) {
      case 'greet':
        prompt = `The user just opened the app to start today's study. It is Day ${streak} of their streak.
Please give them an extremely warm, encouraging, and friendly greeting!
Requirements:
1. Tone must be like a sweet companion, highly soothing.
2. Absolutely no lecturing or commanding.
3. Keep it strictly to 1 or 2 sentences.
4. Include 1 or 2 cute emojis.
5. Must be written in English.`;
        break;

      case 'pomodoro':
        prompt = `The user just successfully finished 1 Pomodoro study session!
Please write a short praise as their Kiwi companion, encouraging them to take a sip of water or stretch a bit.
Requirements:
1. Highly encouraging, sweet, and proud tone.
2. Keep it strictly to 1 or 2 sentences.
3. Must be written in English with warm, cute emojis.`;
        break;

      case 'distract':
        prompt = `The user was just detected looking at their phone or getting distracted. This is distraction #${distractionCount} today. So far they have focused for ${focusMinutes} minutes.
Please say something supportive and gentle to guide them back.
Requirements:
1. Absolutely do NOT use harsh or robotic monitoring terms like "detected", "warning", "violation", "monitoring", or "distracted".
2. Tone must be sweet, curious, or comforting. For example, gently ask "Shall we study together for just 5 more minutes?" or "Are you feeling tired? Let me give you a virtual massage."
3. Keep it strictly to 1 or 2 sentences, comforting and pressure-free.
4. Must be written in English.`;
        break;

      case 'summary':
        prompt = `The study session is complete. Here are the user's statistics for today:
- Total Focus Time: ${focusMinutes} minutes
- Pomodoros Completed: ${pomodorosCompleted}
- Phone/Distraction Count: ${distractionCount} times
Please write a warm, heartwarming daily letter summarizing their efforts.
Requirements:
1. Acknowledge and praise their focus time (encourage them no matter how short).
2. Gently and lightheartedly soothe/excuse the phone checks, ensuring they feel no guilt.
3. Offer a sweet blessing or wishes for tomorrow.
4. Keep the length strictly around 80-120 words. Write it as a comforting personal letter from ${mascotName}. No markdown headers, just flowing paragraphs.
5. Must be written in English.`;
        break;

      default:
        prompt = `Say something warm to wish them a wonderful study session in English.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const text = response.text || '';
    res.json({ text: text.trim(), isMock: false });
  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    res.status(500).json({ error: `Kapi's thoughts drifted away (${err.message}). Please check API Key and try again.` });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Kapi Study Chat — Q&A tutor for study questions
app.post('/api/gemini/chat', async (req: express.Request, res: express.Response): Promise<void> => {
  const { messages = [], mascotName = 'Kapi' } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing messages' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
    res.json({
      text: `${mascotName} would love to help, but my thinking cap (the Gemini API key) isn't set up yet! Ask the desk owner to add GEMINI_API_KEY to .env.local ~ 🍵`,
      isMock: true,
    });
    return;
  }

  try {
    const ai = getAi();
    const systemInstruction = `You are ${mascotName}, an adorable, warm capybara study buddy sitting at the user's desk, AND a genuinely knowledgeable tutor.
The user will ask real study questions (math, statistics, programming, languages, essay help, concepts...). Your job:
1. Answer correctly and clearly FIRST — real substance, worked steps for math, runnable snippets for code.
2. Keep it concise: prefer short paragraphs; use simple lists only when steps truly help. No markdown headers.
3. Keep the warm capybara personality light — at most one gentle touch or emoji (🍊/🍵/📚) per reply, never at the cost of clarity.
4. Reply in the SAME language the user used (Chinese in → Chinese out, English in → English out).
5. If a question is ambiguous, briefly state your assumption and answer anyway.`;

    const contents = messages.slice(-16).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '') }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const text = response.text || '';
    res.json({ text: text.trim(), isMock: false });
  } catch (err: any) {
    console.error('Gemini chat call failed:', err);
    res.status(500).json({ error: `Kapi's thoughts drifted away (${err.message}). Please try again.` });
  }
});

// ---------------------------------------------------------
// FRONTEND STATIC / DEV MIDDLES
// ---------------------------------------------------------

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dev Mode with Vite HMR disabled
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kapi Companion] Server running on http://localhost:${PORT}`);
  });
}

setupServer();
