/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FocusState = 'focused' | 'distracted' | 'absent' | 'stretch';

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
  healthBreakMinutes?: number; // absent+stretch minutes that count as a real break (default 5)
}

export interface FocusSnapshot {
  timestamp: number; // ms timestamp
  state: FocusState;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalFocusTime: number; // seconds
  totalDistractedTime: number; // seconds (Distracted class from model)
  totalAbsentTime: number; // seconds (Absent class from model)
  totalStretchTime: number; // seconds (simulator/manual stretch)
  distractionCount: number; // instances of switching to distracted
  pomodorosCompleted: number;
  longestStreakMinutes: number;
  snapshots: FocusSnapshot[];
  aiSummary?: string;
}

export interface SpeechBubble {
  text: string;
  timestamp: number;
}


