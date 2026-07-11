/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel serverless function: POST /api/gemini/companion
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

  const {
    type,
    mascotName = 'Kapi',
    streak = 1,
    distractionCount = 0,
    focusMinutes = 0,
    pomodorosCompleted = 0,
  } = req.body || {};

  if (!type) {
    res.status(400).json({ error: 'Missing conversation type parameter' });
    return;
  }

  if (!hasApiKey()) {
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
    let prompt = '';
    const systemInstruction = `You play the role of ${mascotName}, an adorable, extremely warm, gentle, and sleepy Capybara.
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
3. Keep it to strictly ONE short sentence, MAXIMUM 20 words total.
4. Include 1 cute emoji.
5. Must be written in English.`;
        break;

      case 'pomodoro':
        prompt = `The user just successfully finished 1 Pomodoro study session!
Please write a short praise as their Kiwi companion, encouraging them to take a sip of water or stretch a bit.
Requirements:
1. Highly encouraging, sweet, and proud tone.
2. Keep it to strictly ONE short sentence, MAXIMUM 20 words total.
3. Must be written in English with 1 warm, cute emoji.`;
        break;

      case 'distract':
        prompt = `The user was just detected looking at their phone or getting distracted. This is distraction #${distractionCount} today. So far they have focused for ${focusMinutes} minutes.
Please say something supportive and gentle to guide them back.
Requirements:
1. Absolutely do NOT use harsh or robotic monitoring terms like "detected", "warning", "violation", "monitoring", or "distracted".
2. Tone must be sweet, curious, or comforting. For example, gently ask "Shall we study together for just 5 more minutes?" or "Are you feeling tired? Let me give you a virtual massage."
3. Keep it to strictly ONE short sentence, MAXIMUM 20 words, comforting and pressure-free.
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

    const response = await generateWithRetry({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        // Summaries need room (80-120 words); every other bubble stays tiny.
        maxOutputTokens: type === 'summary' ? 400 : 60,
      },
    });

    const text = response.text || '';
    res.json({ text: text.trim(), isMock: false });
  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    // Never surface raw API errors to the user — reply with a warm fallback.
    res.json({
      text: `Kapi's thoughts drifted off to the clouds for a second... but I'm still right here with you! Let's keep going 🍵`,
      isMock: true,
    });
  }
}
