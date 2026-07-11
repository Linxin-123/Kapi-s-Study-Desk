/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Sparkles, Volume2, ShieldCheck, Heart, Keyboard, HelpCircle } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export default function Settings({ settings, onSaveSettings }: SettingsProps) {
  const [mascotName, setMascotName] = useState(settings.mascotName);
  const [userName, setUserName] = useState(settings.userName ?? '');
  const [modelUrl, setModelUrl] = useState(settings.modelUrl);
  const [speechEnabled, setSpeechEnabled] = useState(settings.speechEnabled);
  const [chimeEnabled, setChimeEnabled] = useState(settings.chimeEnabled === true);
  const [reminderFrequencyMinutes, setReminderFrequencyMinutes] = useState(settings.reminderFrequencyMinutes);
  const [workDuration, setWorkDuration] = useState(settings.workDuration);
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration);
  const [healthEnabled, setHealthEnabled] = useState(settings.healthEnabled !== false);
  const [healthFocusMinutes, setHealthFocusMinutes] = useState(settings.healthFocusMinutes ?? 50);
  const [healthBreakMinutes, setHealthBreakMinutes] = useState(settings.healthBreakMinutes ?? 5);

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      mascotName,
      userName: userName.trim(),
      modelUrl,
      speechEnabled,
      chimeEnabled,
      reminderFrequencyMinutes,
      workDuration,
      breakDuration,
      healthEnabled,
      healthFocusMinutes,
      healthBreakMinutes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      
      {/* Basic Profile */}
      <div className="bg-white border border-[#FFDEC9] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-[#725442] flex items-center gap-2 text-base">
          <Heart className="w-5 h-5 text-[#FF9E7D]" />
          Companion Profile
        </h3>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#A0836D]">Your nickname (optional)</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#FFDEC9] text-[#725442] bg-[#FFFBF8] focus:outline-hidden focus:ring-2 focus:ring-[#FF9E7D]/50 text-sm font-semibold transition-all"
            placeholder="e.g. Lynn"
            id="settings-user-name"
          />
          <p className="text-[10px] text-[#A0836D] leading-relaxed">
            Add your own name and the whole app becomes YOUR study buddy — the title at the top turns into
            "{userName.trim() ? userName.trim() : 'Lynn'}'s Study Buddy". Leave it empty to keep the companion's name up there.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#A0836D]">Give your companion a cute name</label>
          <input
            type="text"
            value={mascotName}
            onChange={(e) => setMascotName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#FFDEC9] text-[#725442] bg-[#FFFBF8] focus:outline-hidden focus:ring-2 focus:ring-[#FF9E7D]/50 text-sm font-semibold transition-all"
            placeholder="e.g. Kapi, Koko, Huhu..."
            required
            id="settings-mascot-name"
          />
          <p className="text-[10px] text-[#A0836D] leading-relaxed">
            This name will be used in all dialogue and daily reports. Your companion will adopt this sweet identity to accompany you!
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50/40 rounded-2xl border border-[#FFEADA] mt-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4.5 h-4.5 text-[#FF9E7D]" />
            <div>
              <h4 className="text-xs font-bold text-[#725442]">Spoken Voice Assistance (TTS)</h4>
              <p className="text-[10px] text-[#A0836D]">OFF by default. Turn on only if you want the browser voice to read messages aloud.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
              speechEnabled ? 'bg-[#8EAC50]' : 'bg-stone-200'
            }`}
            id="settings-speech-toggle"
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform duration-200 ${
                speechEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50/40 rounded-2xl border border-[#FFEADA]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4.5 h-4.5 text-[#FF9E7D]" />
            <div>
              <h4 className="text-xs font-bold text-[#725442]">Alert Chime Sounds</h4>
              <p className="text-[10px] text-[#A0836D]">OFF by default. Turn on to hear a soft chime for oranges, session start and break time.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChimeEnabled(!chimeEnabled)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
              chimeEnabled ? 'bg-[#8EAC50]' : 'bg-stone-200'
            }`}
            id="settings-chime-toggle"
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform duration-200 ${
                chimeEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Teachable Machine Settings */}
      <div className="bg-white border border-[#FFDEC9] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-[#725442] flex items-center gap-2 text-base">
          <ShieldCheck className="w-5 h-5 text-[#FF9E7D]" />
          Custom Teachable Machine Configuration
        </h3>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#A0836D]">Teachable Machine Shared Link (Model URL)</label>
          <input
            type="url"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#FFDEC9] text-[#725442] bg-[#FFFBF8] focus:outline-hidden focus:ring-2 focus:ring-[#FF9E7D]/50 text-xs font-mono transition-all"
            placeholder="https://teachablemachine.withgoogle.com/models/xxxx/"
            id="settings-model-url"
          />
          <p className="text-[10px] text-[#A0836D] leading-relaxed">
            Provide the TensorFlow.js model sharing URL exported from Google Teachable Machine. We load this model dynamically inside your browser. No video frames or images are ever uploaded to any cloud server, ensuring 100% local privacy.
          </p>
        </div>

        {/* Short guide */}
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-[#FFDEC9] space-y-2">
          <h4 className="text-xs font-bold text-[#725442] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#FF9E7D]" />
            Quick Training Guide (3 Classes)
          </h4>
          <ol className="text-[10px] text-[#A0836D] space-y-1 list-decimal list-inside leading-relaxed pl-1">
            <li>
              Go to{' '}
              <a
                href="https://teachablemachine.withgoogle.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#FF9E7D] underline font-bold"
              >
                Teachable Machine
              </a>{' '}
              and click <strong>Image Project</strong> (Standard Image Model).
            </li>
            <li>
              Add three custom class labels: <code className="bg-amber-100/50 px-1 rounded">Focus</code> (studying/reading at desk),{' '}
              <code className="bg-amber-100/50 px-1 rounded">Distracted</code> (on phone, looking away, or head down), and{' '}
              <code className="bg-amber-100/50 px-1 rounded">Absent</code> (empty chair/out of frame).
            </li>
            <li>Use your laptop/desktop webcam to capture ~200 samples for each class in various lighting environments for optimal accuracy.</li>
            <li>Click <strong>Train Model</strong>, wait for completion, click <strong>Export Model</strong>, select <strong>Upload (shareable link)</strong>, and copy the generated link into the field above!</li>
          </ol>
        </div>
      </div>

      {/* Pomodoro Duration Settings */}
      <div className="bg-white border border-[#FFDEC9] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-[#725442] flex items-center gap-2 text-base">
          <Keyboard className="w-5 h-5 text-[#FF9E7D]" />
          Orange & Reminder Configurations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#A0836D]">Focus Minutes per Orange 🍊</label>
              <span className="text-xs font-bold font-mono text-[#FF9E7D]">{workDuration} mins</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={workDuration}
              onChange={(e) => setWorkDuration(Number(e.target.value))}
              className="w-full accent-[#FF9E7D]"
              id="settings-work-duration"
            />
            <p className="text-[10px] text-[#A0836D]">
              Every {workDuration} minutes of accumulated focus drops one orange into your hot spring.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#FFF2E6]">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-xs font-bold text-[#725442]">Smartphone Warning Threshold</label>
              <p className="text-[10px] text-[#A0836D]">Interval of continuous phone usage before your companion issues a gentle spoken reminder.</p>
            </div>
            <span className="text-xs font-bold font-mono text-[#FF9E7D]">{reminderFrequencyMinutes} {reminderFrequencyMinutes === 1 ? 'min' : 'mins'}</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={reminderFrequencyMinutes}
            onChange={(e) => setReminderFrequencyMinutes(Number(e.target.value))}
            className="w-full accent-[#FF9E7D]"
            id="settings-reminder-freq"
          />
        </div>
      </div>

      {/* Health Guard */}
      <div className="bg-white border border-[#FFDEC9] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-[#725442] flex items-center gap-2 text-base">
          <Heart className="w-5 h-5 text-[#8EAC50]" />
          Health Guard 🌱
        </h3>
        <p className="text-[11px] text-[#A0836D] leading-relaxed -mt-2">
          If you focus for too long without a real break, {mascotName || 'Kapi'} will gently remind you
          to stand up, stretch, and drink some water.
        </p>

        <label className="flex items-center justify-between bg-[#FFFBF8] border border-[#FFE4CF] rounded-2xl px-4 py-3 cursor-pointer">
          <span className="text-xs font-bold text-[#725442]">Enable break reminders</span>
          <input
            type="checkbox"
            checked={healthEnabled}
            onChange={(e) => setHealthEnabled(e.target.checked)}
            className="w-5 h-5 accent-[#8EAC50] cursor-pointer"
            id="settings-health-enabled"
          />
        </label>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${healthEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#A0836D]">Remind after focusing</label>
              <span className="text-xs font-bold font-mono text-[#8EAC50]">{healthFocusMinutes} mins</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              step="5"
              value={healthFocusMinutes}
              onChange={(e) => setHealthFocusMinutes(Number(e.target.value))}
              className="w-full accent-[#8EAC50]"
              id="settings-health-focus"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#A0836D]">A real break means resting</label>
              <span className="text-xs font-bold font-mono text-[#8EAC50]">{healthBreakMinutes} mins</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={healthBreakMinutes}
              onChange={(e) => setHealthBreakMinutes(Number(e.target.value))}
              className="w-full accent-[#8EAC50]"
              id="settings-health-break"
            />
            <p className="text-[10px] text-[#A0836D]">
              Counted within each focus interval: if distracted + absent time stays under {healthBreakMinutes} min by the time the interval completes, the reminder fires. Resting more than {healthBreakMinutes} min restarts the interval fresh.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {saved && (
          <span className="text-xs font-bold text-[#8EAC50] flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-4 h-4" />
            Preferences updated!
          </span>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all duration-200 cursor-pointer text-sm"
          id="settings-save-button"
        >
          <Save className="w-4.5 h-4.5" />
          Save Settings
        </button>
      </div>
    </form>
  );
}
