/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel serverless function: GET /api/health
 * Quick check that serverless functions are deployed and whether the
 * Gemini API key is configured (never reveals the key itself).
 */

export default function handler(req: any, res: any) {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
  });
}
