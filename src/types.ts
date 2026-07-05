/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FocusState = 'focused' | 'phone' | 'away' | 'tired' | 'stretch';

export type PomodoroStatus = 'idle' | 'work' | 'break';

export interface UserSettings {
  mascotName: string;
  modelUrl: string;
  speechEnabled: boolean;
  reminderFrequencyMinutes: number;
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  healthEnabled?: boolean; // health break guard on/off
  healthFocusMinutes?: number; // focused minutes before a break reminder (default 50)
  healthBreakMinutes?: number; // away+stretch minutes that count as a real break (default 5)
}

export interface FocusSnapshot {
  timestamp: number; // ms timestamp
  state: FocusState;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalFocusTime: number; // seconds
  totalPhoneTime: number; // seconds
  totalAwayTime: number; // seconds
  totalTiredTime: number; // seconds
  totalStretchTime: number; // seconds
  distractionCount: number; // instances of switching to phone/tired
  pomodorosCompleted: number;
  longestStreakMinutes: number;
  snapshots: FocusSnapshot[];
  aiSummary?: string;
}

export interface SpeechBubble {
  text: string;
  timestamp: number;
}


