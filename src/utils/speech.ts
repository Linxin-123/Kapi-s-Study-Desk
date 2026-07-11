/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Speaks a text phrase using Web Speech API synthesis.
 * Falls back gracefully if speech synthesis is not supported.
 */
export function speakText(text: string, enabled: boolean = true) {
  if (!enabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  try {
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Try to find a warm, natural Chinese or friendly voice
    const voices = window.speechSynthesis.getVoices();
    
    // Prioritize English voices as the mascot speaks English by default
    const enVoice = voices.find(
      (v) => v.lang.includes('en') || v.lang.includes('EN') || v.name.includes('English')
    );
    if (enVoice) {
      utterance.voice = enVoice;
    }

    utterance.rate = 1.0; // Normal rate
    utterance.pitch = 1.2; // Slightly higher pitch for a cute mascot feel

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Error during speech synthesis:', err);
  }
}
