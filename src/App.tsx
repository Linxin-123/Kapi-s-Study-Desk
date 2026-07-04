/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kapi Companion — minimal, warm study desk.
 * Count-UP timer (not countdown): tracks how long you've studied and how
 * long you spent in each state. Every N focused minutes = one orange. 🍊
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FocusState, PomodoroStatus, UserSettings, DailyStats, FocusSnapshot } from './types';
import CompanionMascot from './components/CompanionMascot';
import WebcamClassifier from './components/WebcamClassifier';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AnimatedBackground from './components/AnimatedBackground';
import ChatPanel from './components/ChatPanel';
import SoundPanel from './components/SoundPanel';
import OrangeTree from './components/OrangeTree';
import { speakText } from './utils/speech';
import {
  Play,
  Pause,
  Square,
  BookOpen,
  PieChart,
  Settings as SettingsIcon,
  HelpCircle,
  X,
  Smartphone,
  DoorOpen,
  Moon,
  Sparkles,
} from 'lucide-react';

// Get today's date string YYYY-MM-DD
const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

// Default User Settings — workDuration now means "focused minutes per orange"
const DEFAULT_SETTINGS: UserSettings = {
  mascotName: 'Kapi',
  modelUrl: '',
  speechEnabled: true,
  reminderFrequencyMinutes: 3,
  workDuration: 25,
  breakDuration: 5,
};

// Tibetan Singing Bowl Synthesizer Sound for alerts
const playCozyChime = (highPitch: boolean = false) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    const baseFreq = highPitch ? 659.25 : 523.25; // E5 or C5
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.8);
    osc2.stop(now + 1.8);
  } catch (err) {
    console.warn('AudioContext failed to start:', err);
  }
};

type SessionState = 'idle' | 'running' | 'paused';

const emptyStats = (date: string): DailyStats => ({
  date,
  totalFocusTime: 0,
  totalPhoneTime: 0,
  totalAwayTime: 0,
  totalTiredTime: 0,
  totalStretchTime: 0,
  distractionCount: 0,
  pomodorosCompleted: 0,
  longestStreakMinutes: 0,
  snapshots: [],
});

export default function App() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<'study' | 'report' | 'settings'>('study');
  const [showGuide, setShowGuide] = useState(false);

  // Application Config & Settings
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Detected states (with debounce)
  const [stableState, setStableState] = useState<FocusState>('focused');
  const [pendingState, setPendingState] = useState<FocusState>('focused');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Count-UP study session
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const sessionTickRef = useRef<number>(0);

  // Stats
  const [todayStats, setTodayStats] = useState<DailyStats>(emptyStats(getTodayDateStr()));
  const [streakDays, setStreakDays] = useState<number>(1);
  const [weeklyStatsList, setWeeklyStatsList] = useState<DailyStats[]>([]);

  // Companion speech bubble
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Session-end ceremony
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [endedSessionSeconds, setEndedSessionSeconds] = useState(0);

  // Health reminder: 50 focused minutes without a real break → gentle nudge
  const [healthReminder, setHealthReminder] = useState(false);
  const focusSinceBreakRef = useRef<number>(0);
  const restAccumRef = useRef<number>(0);

  // Orange harvest burst
  const [orangeBurst, setOrangeBurst] = useState(0);
  const prevOrangesRef = useRef<number>(-1);
  useEffect(() => {
    if (prevOrangesRef.current >= 0 && todayStats.pomodorosCompleted > prevOrangesRef.current) {
      setOrangeBurst((b) => b + 1);
    }
    prevOrangesRef.current = todayStats.pomodorosCompleted;
  }, [todayStats.pomodorosCompleted]);

  // Trackers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phoneDistractionTimerRef = useRef<number>(0);
  const lastReminderTimeRef = useRef<number>(0);

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------
  useEffect(() => {
    const cachedSettings = localStorage.getItem('kapi_settings');
    if (cachedSettings) {
      try {
        setSettings(JSON.parse(cachedSettings));
      } catch (e) {
        console.error('Failed to parse cached settings', e);
      }
    }

    const todayDate = getTodayDateStr();
    const cachedStats = localStorage.getItem(`kapi_stats_${todayDate}`);
    if (cachedStats) {
      try {
        setTodayStats(JSON.parse(cachedStats));
      } catch (e) {
        console.error('Failed to parse today stats', e);
      }
    } else {
      const newStats = emptyStats(todayDate);
      setTodayStats(newStats);
      localStorage.setItem(`kapi_stats_${todayDate}`, JSON.stringify(newStats));
    }

    calculateWeeklyAndStreak();

    setTimeout(() => {
      triggerKapiSpeech('greet', { streak: streakDays });
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Recalculate streak days and weekly records
  const calculateWeeklyAndStreak = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('kapi_stats_'));
    keys.sort();

    const list: DailyStats[] = [];
    keys.forEach((k) => {
      try {
        list.push(JSON.parse(localStorage.getItem(k) || ''));
      } catch (e) {
        console.error(e);
      }
    });
    setWeeklyStatsList(list);

    if (list.length === 0) {
      setStreakDays(1);
      return;
    }
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 15; i++) {
      const dateStr = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}-${checkDate.getDate().toString().padStart(2, '0')}`;
      const hasRecord = localStorage.getItem(`kapi_stats_${dateStr}`);
      if (hasRecord) {
        streak++;
      } else {
        if (i > 0) break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    setStreakDays(streak || 1);
  };

  // Save current stats to localStorage
  const saveStats = (updated: DailyStats) => {
    setTodayStats(updated);
    localStorage.setItem(`kapi_stats_${updated.date}`, JSON.stringify(updated));
  };

  // ---------------------------------------------------------
  // GEMINI COMPANION SPEECH TRIGGER
  // ---------------------------------------------------------
  const triggerKapiSpeech = async (type: 'greet' | 'pomodoro' | 'distract' | 'summary', params: any = {}) => {
    try {
      const res = await fetch('/api/gemini/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          mascotName: settings.mascotName,
          ...params,
        }),
      });

      if (!res.ok) throw new Error('Companion endpoint failed');
      const data = await res.json();

      setSpeechBubble(data.text);
      speakText(data.text, settings.speechEnabled);
    } catch (err) {
      console.warn('Fallback to offline speech:', err);
      let fallback = '';
      if (type === 'greet') {
        fallback = `Hi there! Day ${params.streak || 1} of studying together. Let's do our best today! 🍵`;
      } else if (type === 'pomodoro') {
        fallback = `Yay! Another orange for the hot spring! Stretch a little, then let's keep going~ 🍊`;
      } else if (type === 'distract') {
        fallback = `Hmm... ${settings.mascotName} noticed the phone. Let's study together just a little longer, okay? 🧸`;
      } else {
        fallback = `You did wonderfully today! Rest your eyes and sleep early. See you tomorrow! 💤`;
      }
      setSpeechBubble(fallback);
      speakText(fallback, settings.speechEnabled);
    }
  };

  // ---------------------------------------------------------
  // COUNT-UP SESSION LOOP (1 tick = 1 second)
  // ---------------------------------------------------------
  useEffect(() => {
    if (sessionState === 'running') {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
        sessionTickRef.current += 1;

        const updated: DailyStats = { ...todayStats };
        const orangeSecs = Math.max(5, settings.workDuration) * 60;

        if (stableState === 'focused') {
          updated.totalFocusTime += 1;
          // Harvest an orange every N focused minutes 🍊
          if (updated.totalFocusTime > 0 && updated.totalFocusTime % orangeSecs === 0) {
            updated.pomodorosCompleted += 1;
            playCozyChime(true);
            triggerKapiSpeech('pomodoro');
          }
        } else if (stableState === 'phone') {
          updated.totalPhoneTime += 1;
        } else if (stableState === 'away') {
          updated.totalAwayTime += 1;
        } else if (stableState === 'tired') {
          updated.totalTiredTime += 1;
        } else if (stableState === 'stretch') {
          updated.totalStretchTime += 1;
        }

        const elapsedFocusMins = Math.floor(updated.totalFocusTime / 60);
        if (elapsedFocusMins > updated.longestStreakMinutes) {
          updated.longestStreakMinutes = elapsedFocusMins;
        }

        // --- Health guard: 50 min of focus without ≥5 min of away/stretch → nudge ---
        if (stableState === 'focused') {
          focusSinceBreakRef.current += 1;
        } else if (stableState === 'away' || stableState === 'stretch') {
          restAccumRef.current += 1;
        }
        if (restAccumRef.current >= 5 * 60) {
          // a real break happened — reset the guard
          focusSinceBreakRef.current = 0;
          restAccumRef.current = 0;
        }
        if (focusSinceBreakRef.current >= 50 * 60) {
          focusSinceBreakRef.current = 0;
          restAccumRef.current = 0;
          setHealthReminder(true);
          playCozyChime(false);
          setSpeechBubble(`50 minutes of pure focus! Amazing... but let's stand up and stretch, okay? 🍊`);
        }

        // Persist every 10 seconds; update in-memory otherwise
        if (sessionTickRef.current % 10 === 0) {
          const newSnap: FocusSnapshot = { timestamp: Date.now(), state: stableState };
          updated.snapshots = [...(updated.snapshots || []), newSnap];
          saveStats(updated);
        } else {
          setTodayStats(updated);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, stableState, todayStats, settings]);

  // Handle phone distraction reminders (gentle, throttled)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (sessionState === 'running') {
      interval = setInterval(() => {
        if (stableState === 'phone') {
          phoneDistractionTimerRef.current += 5;

          const limitSeconds = settings.reminderFrequencyMinutes * 60;
          const nowMs = Date.now();

          if (
            phoneDistractionTimerRef.current >= limitSeconds &&
            nowMs - lastReminderTimeRef.current >= 15 * 60 * 1000
          ) {
            lastReminderTimeRef.current = nowMs;
            const elapsedFocusMins = Math.round(todayStats.totalFocusTime / 60);
            triggerKapiSpeech('distract', {
              distractionCount: todayStats.distractionCount,
              focusMinutes: elapsedFocusMins,
            });
          }
        } else {
          phoneDistractionTimerRef.current = 0;
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stableState, sessionState, todayStats, settings]);

  // ---------------------------------------------------------
  // SENSOR DETECTION & DEBOUNCE (state must persist ~5s to switch)
  // ---------------------------------------------------------
  const handleSensorDetected = (detectedState: FocusState) => {
    if (detectedState === stableState) {
      setPendingState(detectedState);
      setPendingCount(0);
      return;
    }

    if (detectedState === pendingState) {
      const nextCount = pendingCount + 1;
      setPendingCount(nextCount);

      if (nextCount >= 10) {
        setStableState(detectedState);
        setPendingCount(0);

        const nowMs = Date.now();

        if (detectedState === 'phone') {
          const updatedStats = {
            ...todayStats,
            distractionCount: todayStats.distractionCount + 1,
            snapshots: [
              ...(todayStats.snapshots || []),
              { timestamp: nowMs, state: 'phone' as FocusState },
            ],
          };
          saveStats(updatedStats);
          playCozyChime(false);
          setSpeechBubble(`A notification? Let's check it after we finish~ 🧡`);
        } else if (detectedState === 'away') {
          setSpeechBubble(`${settings.mascotName} will nap right here and wait for you zZZ`);
        } else if (detectedState === 'stretch') {
          setSpeechBubble(`Great stretch!! ${settings.mascotName} is proud of you! 💮`);
        } else if (detectedState === 'tired') {
          setSpeechBubble(`Here, an orange for you. Let's rest our eyes a moment~ 🍊`);
        } else if (detectedState === 'focused') {
          setSpeechBubble(`Welcome back! Let's keep going~ 🚀`);
        }
      }
    } else {
      setPendingState(detectedState);
      setPendingCount(1);
    }
  };

  // ---------------------------------------------------------
  // SESSION ACTIONS
  // ---------------------------------------------------------
  const startSession = () => {
    playCozyChime(true);
    setSessionState('running');
    setSessionSeconds(0);
    sessionTickRef.current = 0;
    setSpeechBubble(`Session started! ${settings.mascotName} and Luna are right here with you. 🐾`);
    speakText(`Session started! Let's focus together.`, settings.speechEnabled);
  };

  const pauseSession = () => {
    setSessionState('paused');
    setSpeechBubble(`Paused~ ${settings.mascotName} will guard the page. Take your time 🍵`);
  };
  const resumeSession = () => {
    setSessionState('running');
    setSpeechBubble(`Welcome back! Picking up right where we left off ✨`);
  };

  const endSession = async () => {
    setSessionState('idle');
    saveStats({ ...todayStats });
    setEndedSessionSeconds(sessionSeconds);
    setSummaryText(null);
    setShowSummary(true);
    speakText(`Session finished, well done!`, settings.speechEnabled);

    // Fetch a warm one-liner for the ceremony
    try {
      const res = await fetch('/api/gemini/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          mascotName: settings.mascotName,
          focusMinutes: Math.round(todayStats.totalFocusTime / 60),
          pomodorosCompleted: todayStats.pomodorosCompleted,
          distractionCount: todayStats.distractionCount,
        }),
      });
      const data = await res.json();
      setSummaryText(data.text || null);
    } catch {
      setSummaryText(`You showed up and put in the time — that's what counts. ${settings.mascotName} and Luna are proud of you! 🍊`);
    }
  };

  const saveUserSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('kapi_settings', JSON.stringify(newSettings));
  };

  const generateDiagnosticSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const elapsedFocusMins = Math.round(todayStats.totalFocusTime / 60);
      const res = await fetch('/api/gemini/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          mascotName: settings.mascotName,
          focusMinutes: elapsedFocusMins,
          pomodorosCompleted: todayStats.pomodorosCompleted,
          distractionCount: todayStats.distractionCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      saveStats({ ...todayStats, aiSummary: data.text });
    } catch (err: any) {
      console.error(err);
      const elapsedFocusMins = Math.round(todayStats.totalFocusTime / 60);
      saveStats({
        ...todayStats,
        aiSummary: `【${settings.mascotName}'s Study Summary】\nToday you spent a wonderful ${elapsedFocusMins} minutes in deep focus and harvested ${todayStats.pomodorosCompleted} oranges! ${todayStats.distractionCount} little phone peeks didn't stop your progress. Rest well — I'll be waiting at the desk corner tomorrow! 🍵`,
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Formatting helpers
  const formatHMS = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };
  const formatMins = (seconds: number): string => {
    const m = Math.round(seconds / 60);
    return `${m}m`;
  };

  const stateChips: Array<{ key: FocusState; icon: React.ComponentType<any>; secs: number }> = [
    { key: 'focused', icon: BookOpen, secs: todayStats.totalFocusTime },
    { key: 'phone', icon: Smartphone, secs: todayStats.totalPhoneTime },
    { key: 'away', icon: DoorOpen, secs: todayStats.totalAwayTime },
    { key: 'tired', icon: Moon, secs: todayStats.totalTiredTime },
    { key: 'stretch', icon: Sparkles, secs: todayStats.totalStretchTime },
  ];

  return (
    <div className="min-h-screen text-[#725442] flex flex-col font-sans relative">
      <AnimatedBackground />
      {/* Focus-mode shift: the room quiets down while you study */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-[1500ms] bg-[#2E2013] ${
          sessionState === 'running' ? 'opacity-[0.13]' : 'opacity-0'
        }`}
        style={{ zIndex: -5 }}
      />

      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-[#FFE4CF]">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍊</span>
            <h1 className="text-sm font-extrabold tracking-tight">{settings.mascotName}'s Study Desk</h1>
          </div>

          <nav className="flex items-center gap-1">
            {[
              { id: 'study' as const, icon: BookOpen, label: 'Study' },
              { id: 'report' as const, icon: PieChart, label: 'Report' },
              { id: 'settings' as const, icon: SettingsIcon, label: 'Settings' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentPage === id
                    ? 'bg-[#FF9E7D] text-white shadow-sm'
                    : 'text-[#A0836D] hover:bg-amber-50/60 hover:text-[#725442]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowGuide(true)}
              className="ml-1 p-1.5 rounded-xl text-[#A0836D] hover:bg-amber-50/60 hover:text-[#725442] transition-colors cursor-pointer"
              title="How to use"
              id="guide-button"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* PAGE 1: STUDY */}
          {currentPage === 'study' && (
            <motion.div
              key="study-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start"
            >
              {/* LEFT — time tracking + orange tree */}
              <div className="order-2 md:order-1 md:col-span-3 space-y-4">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#FFDEC9] p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
                {/* Hero orange counter */}
                <div className="w-full flex items-center justify-between">
                  <motion.div
                    key={todayStats.pomodorosCompleted}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <svg viewBox="0 0 40 40" className="w-9 h-9">
                      <circle cx="20" cy="22" r="15" fill="#F5A04A" />
                      <circle cx="15" cy="17" r="4" fill="#FDBE77" />
                      <path d="M20 8 C20 4 24 1 28 2" stroke="#7BA05B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M28 2 C33 1 35 5 33 8 C29 11 24 8 28 2 Z" fill="#8FBC6F" />
                    </svg>
                    <div>
                      <div className="text-2xl font-black text-[#725442] leading-none">{todayStats.pomodorosCompleted}</div>
                      <div className="text-[9px] uppercase tracking-[0.18em] text-[#B99C86] font-bold mt-0.5">oranges</div>
                    </div>
                  </motion.div>

                  <div className="text-right">
                    <div className="text-sm font-black text-[#725442] leading-none">🔥 {streakDays}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#B99C86] font-bold mt-0.5">day streak</div>
                  </div>
                </div>

                {/* "+1" harvest burst */}
                <AnimatePresence>
                  {orangeBurst > 0 && (
                    <motion.div
                      key={orangeBurst}
                      initial={{ opacity: 0, y: 10, scale: 0.6 }}
                      animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1.1 }}
                      transition={{ duration: 1.6 }}
                      className="absolute top-12 left-8 text-sm font-black text-[#F5A04A] pointer-events-none"
                    >
                      +1 🍊
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Session elapsed time */}
                <div className="mt-5 text-center">
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#B99C86] font-bold">
                    {sessionState === 'running' ? 'studying' : sessionState === 'paused' ? 'paused' : 'session'}
                  </div>
                  <div className={`text-5xl font-black font-mono tracking-tight leading-none mt-1 transition-colors ${
                    sessionState === 'running' ? 'text-[#FF8D66]' : 'text-[#725442]'
                  }`}>
                    {formatHMS(sessionSeconds)}
                  </div>
                </div>

                {/* Per-state accumulated times, stacked */}
                <div className="w-full mt-5 space-y-1.5">
                  {stateChips.map((c) => {
                    const Icon = c.icon;
                    const active = stableState === c.key;
                    return (
                      <div
                        key={c.key}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? 'bg-[#FF9E7D] text-white border-[#FF9E7D] shadow-sm'
                            : 'bg-[#FFF8F0] text-[#A0836D] border-[#FFE4CF]'
                        }`}
                      >
                        <span className="flex items-center gap-2 capitalize">
                          <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#C9A886]'}`} />
                          {c.key}
                        </span>
                        <span className="font-mono">{formatMins(c.secs)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Controls */}
                <div className="w-full mt-4 space-y-2">
                  {sessionState === 'idle' && (
                    <button
                      onClick={startSession}
                      className="w-full py-3 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                      id="start-session-button"
                    >
                      <Play className="w-4 h-4" />
                      Start Studying
                    </button>
                  )}
                  {sessionState === 'running' && (
                    <>
                      <button
                        onClick={pauseSession}
                        className="w-full py-2.5 bg-[#FFF2E6] hover:bg-[#FFE8D6] border border-[#FFDEC9] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </button>
                      <button
                        onClick={endSession}
                        className="w-full py-2.5 border border-[#FFDEC9] text-[#A0836D] hover:text-[#725442] hover:bg-stone-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Square className="w-3 h-3" />
                        End
                      </button>
                    </>
                  )}
                  {sessionState === 'paused' && (
                    <>
                      <button
                        onClick={resumeSession}
                        className="w-full py-2.5 bg-[#8EAC50] hover:bg-[#7D9B40] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Resume
                      </button>
                      <button
                        onClick={endSession}
                        className="w-full py-2.5 border border-[#FFDEC9] text-[#A0836D] hover:text-[#725442] hover:bg-stone-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Square className="w-3 h-3" />
                        End
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* The orange tree — core loop, always visible */}
              <OrangeTree count={todayStats.pomodorosCompleted} />
              </div>

              {/* CENTER — the big companion */}
              <div className="order-1 md:order-2 md:col-span-6">
                <CompanionMascot
                  state={stableState}
                  status={sessionState === 'running' ? ('work' as PomodoroStatus) : ('idle' as PomodoroStatus)}
                  mascotName={settings.mascotName}
                  speechBubble={speechBubble}
                />
              </div>

              {/* RIGHT — the ML focus lens */}
              <div className="order-3 md:col-span-3">
                <WebcamClassifier
                  modelUrl={settings.modelUrl}
                  onStateDetected={handleSensorDetected}
                  currentState={stableState}
                />
              </div>
            </motion.div>
          )}

          {/* PAGE 2: REPORT */}
          {currentPage === 'report' && (
            <motion.div
              key="report-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Dashboard
                stats={todayStats}
                weeklyStats={weeklyStatsList}
                mascotName={settings.mascotName}
                onGenerateSummary={generateDiagnosticSummary}
                isGeneratingSummary={isGeneratingSummary}
              />
            </motion.div>
          )}

          {/* PAGE 3: SETTINGS */}
          {currentPage === 'settings' && (
            <motion.div
              key="settings-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Settings settings={settings} onSaveSettings={saveUserSettings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tiny footer */}
      <footer className="py-4 flex justify-center">
        <span className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-[#FFE4CF] text-[10px] font-bold text-[#8A6B54] shadow-sm">
          Study with {settings.mascotName} <span className="text-rose-400">♥</span> all camera frames stay on your device
        </span>
      </footer>

      {/* Floating ambient sounds + study-question chat */}
      <SoundPanel />
      <ChatPanel mascotName={settings.mascotName} />

      {/* HEALTH REMINDER TOAST — warm nudge after 50 min without a break */}
      <AnimatePresence>
        {healthReminder && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92vw]"
          >
            <div className="bg-[#FFFDF9] border border-[#FFDEC9] rounded-3xl shadow-2xl px-5 py-4 flex items-start gap-3">
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1 }}
              >
                🍊
              </motion.span>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-[#725442]">Time for a little break!</p>
                <p className="text-[11px] text-[#A0836D] leading-relaxed mt-0.5">
                  You've focused for 50 minutes straight — {settings.mascotName} is so proud!
                  Stand up, stretch tall, sip some water. Your tree will wait for you~ 🌱
                </p>
                <button
                  onClick={() => setHealthReminder(false)}
                  className="mt-2.5 px-4 py-1.5 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white text-[11px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Okay, stretching now~ 🙆
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SESSION-END CEREMONY */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#5B4230]/35 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-[#FFFDF9] rounded-3xl border border-[#FFDEC9] shadow-2xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B99C86] font-bold">session complete</div>
              <div className="text-4xl font-black font-mono text-[#725442] mt-1">{formatHMS(endedSessionSeconds)}</div>

              {/* Today's numbers */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[
                  { label: 'focus today', value: formatMins(todayStats.totalFocusTime) },
                  { label: 'oranges', value: `${todayStats.pomodorosCompleted} 🍊` },
                  { label: 'best streak', value: `${todayStats.longestStreakMinutes}m` },
                ].map((s) => (
                  <div key={s.label} className="bg-[#FFF8F0] border border-[#FFE4CF] rounded-2xl py-2.5">
                    <div className="text-sm font-black text-[#725442]">{s.value}</div>
                    <div className="text-[8px] uppercase tracking-[0.15em] text-[#B99C86] font-bold mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini hot spring with today's oranges */}
              <svg viewBox="0 0 280 90" className="w-full mt-4" aria-hidden="true">
                <ellipse cx="140" cy="58" rx="110" ry="26" fill="#D8C3AC" />
                <ellipse cx="140" cy="55" rx="92" ry="19" fill="#BFE3E0" />
                <ellipse cx="140" cy="53.5" rx="92" ry="17.5" fill="#D2EEEB" />
                <path d="M92 30 C89 23 95 20 92 13 M140 26 C137 19 143 16 140 9 M188 30 C185 23 191 20 188 13" stroke="#E8D5C4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
                {Array.from({ length: Math.min(todayStats.pomodorosCompleted, 7) }).map((_, i) => {
                  const px = [110, 150, 178, 92, 132, 196, 74][i];
                  const py = [52, 57, 49, 56, 46, 54, 50][i];
                  return (
                    <g key={i}>
                      <circle cx={px} cy={py} r="8.5" fill="#F5A04A" />
                      <circle cx={px - 3} cy={py - 3} r="2" fill="#FDBE77" />
                    </g>
                  );
                })}
                {todayStats.pomodorosCompleted === 0 && (
                  <text x="140" y="58" textAnchor="middle" fill="#8FB5B1" fontSize="10" fontWeight="bold">
                    the spring awaits your first orange
                  </text>
                )}
                {todayStats.pomodorosCompleted > 7 && (
                  <g>
                    <circle cx="232" cy="40" r="12" fill="#FF9E7D" />
                    <text x="232" y="44" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                      +{todayStats.pomodorosCompleted - 7}
                    </text>
                  </g>
                )}
              </svg>

              {/* Companion's one-liner */}
              <div className="mt-3 min-h-[40px] text-xs text-[#725442] leading-relaxed font-medium px-1">
                {summaryText || (
                  <span className="text-[#B99C86]">
                    {settings.mascotName} is thinking of something nice to say
                    <span className="inline-block animate-bounce">.</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowSummary(false)}
                className="mt-4 w-full py-2.5 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Rest well 🍵
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GUIDE MODAL — all the explanations live here, hidden until asked */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#5B4230]/30 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-[#FFFDF9] rounded-3xl border border-[#FFDEC9] shadow-xl max-w-md w-full p-6 relative max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A0836D] hover:bg-amber-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-extrabold text-[#725442] flex items-center gap-2 text-base">
                🍊 How {settings.mascotName} works
              </h2>

              <div className="mt-4 space-y-4 text-xs text-[#725442] leading-relaxed">
                <div>
                  <h3 className="font-extrabold mb-1">1 · {settings.mascotName} watches over you (privately)</h3>
                  <p className="text-[#A0836D]">
                    Turn on the <b>Focus Lens</b> and face your screen as usual. Your Teachable Machine
                    model runs entirely in your browser — no video ever leaves your device.
                  </p>
                </div>

                <div>
                  <h3 className="font-extrabold mb-1">2 · Five states it understands</h3>
                  <p className="text-[#A0836D]">
                    📖 focused · 📱 on phone · 🚪 away · 💤 tired · 🙆 stretching.
                    A state must last ~5 seconds before {settings.mascotName} reacts, so quick
                    movements won't disturb you.
                  </p>
                </div>

                <div>
                  <h3 className="font-extrabold mb-1">3 · Time counts up, oranges add up</h3>
                  <p className="text-[#A0836D]">
                    Press <b>Start Studying</b> and the clock counts upward, tracking how long you
                    spend in each state. Every {settings.workDuration} focused minutes drops one
                    orange 🍊 into your hot spring — see it in the Report page.
                  </p>
                </div>

                <div>
                  <h3 className="font-extrabold mb-1">4 · Set up your model (first time only)</h3>
                  <p className="text-[#A0836D]">
                    Train a <b>Pose Project</b> on Teachable Machine with the five class names above,
                    export as Tensorflow.js (Upload), then paste the shareable link into Settings.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
