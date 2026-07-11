/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel serverless function: POST /api/gemini/chat
 * Mirrors the same route in server.ts (used for local dev).
 */

import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY',
      httpOptions: { headers: { 'User-Agent': 'kapi-vercel' } },
    });
  }
  return aiClient;
}

function hasApiKey(): boolean {
  const k = process.env.GEMINI_API_KEY;
  return !!k && k !== 'MY_GEMINI_API_KEY';
}

// Call Gemini with ONE automatic retry for transient 503 overloads.
async function generateWithRetry(params: any): Promise<any> {
  const ai = getAi();
  try {
    return await ai.models.generateContent(params);
  } catch (firstErr: any) {
    console.warn('Gemini call failed, retrying once...', firstErr?.message || firstErr);
    await new Promise((r) => setTimeout(r, 1200));
    return await ai.models.generateContent(params);
  }
}


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { messages = [], mascotName = 'Kapi' } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing messages' });
    return;
  }

  if (!hasApiKey()) {
    res.json({
      text: `${mascotName} would love to help, but my thinking cap (the Gemini API key) isn't set up yet! Ask the desk owner to add GEMINI_API_KEY in the deployment settings ~ 🍵`,
      isMock: true,
    });
    return;
  }

  try {
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

    const response = await generateWithRetry({
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
    // Transient overloads (503 etc.) happen on Google's side — show the user
    // a gentle retry message, never the raw error payload.
    res.json({
      text: `Kapi's thinking cloud is a little crowded right now (the AI service is busy) — please ask me again in a moment! 🍵`,
      isMock: true,
    });
  }
}
