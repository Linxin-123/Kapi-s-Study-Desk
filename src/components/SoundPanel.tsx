/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SoundPanel — floating music button beside the chat bubble.
 * Opens a tiny warm popover: Rain / Fireplace / Quiet, all synthesized
 * on-device with Web Audio (no files, no network).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, CloudRain, Flame, VolumeX } from 'lucide-react';
import { startRain, stopRain, startFire, stopFire } from '../utils/ambient';

type Mode = 'off' | 'rain' | 'fire';

export default function SoundPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('off');

  const select = (m: Mode) => {
    stopRain();
    stopFire();
    if (m === 'rain') startRain();
    if (m === 'fire') startFire();
    setMode(m);
  };

  const options: Array<{ id: Mode; icon: React.ComponentType<any>; label: string; on: string }> = [
    { id: 'rain', icon: CloudRain, label: 'Rain', on: 'bg-[#9BB8C9] border-[#9BB8C9] text-white' },
    { id: 'fire', icon: Flame, label: 'Fireplace', on: 'bg-[#E8946A] border-[#E8946A] text-white' },
    { id: 'off', icon: VolumeX, label: 'Quiet', on: 'bg-[#C9B29B] border-[#C9B29B] text-white' },
  ];

  return (
    <>
      {/* Floating button, sits left of the chat bubble */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-[5.5rem] z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
          mode !== 'off' ? 'bg-[#8EAC50] text-white' : 'bg-white border border-[#FFDEC9] text-[#C9A886] hover:text-[#725442]'
        }`}
        title="Ambient sounds"
        id="sound-panel-button"
      >
        <Music className="w-6 h-6" />
        {mode !== 'off' && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FF9E7D] rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-[5.5rem] z-50 bg-[#FFFDF9] border border-[#FFDEC9] rounded-3xl shadow-2xl p-3 w-44"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#B99C86] font-bold px-1 mb-2">study sounds</p>
            <div className="space-y-1.5">
              {options.map((o) => {
                const Icon = o.icon;
                const active = mode === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => select(o.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      active ? o.on : 'bg-[#FFF8F0] border-[#FFE4CF] text-[#A0836D] hover:bg-[#FFF2E6]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {o.label}
                    {active && o.id !== 'off' && <span className="ml-auto text-[9px] opacity-90">playing</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
