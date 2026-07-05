/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SoundPanel — study-sounds player.
 * Built-in loops (Gentle Rain, Forest Breeze, original Cozy Piano) plus a
 * "My Music" folder: pick your own audio files and they play as a playlist.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, CloudRain, TreePine, Piano, VolumeX, Volume2, FolderOpen, Trash2, SkipForward } from 'lucide-react';

const BUILTIN = [
  { id: 'rain', label: 'Gentle Rain', icon: CloudRain, src: new URL('../assets/audio/rain.mp3', import.meta.url).href, activeCls: 'bg-[#9BB8C9] border-[#9BB8C9] text-white' },
  { id: 'forest', label: 'Forest Breeze', icon: TreePine, src: new URL('../assets/audio/forest.mp3', import.meta.url).href, activeCls: 'bg-[#8EAC50] border-[#8EAC50] text-white' },
  { id: 'piano', label: 'Cozy Piano', icon: Piano, src: new URL('../assets/audio/piano.mp3', import.meta.url).href, activeCls: 'bg-[#C99BB0] border-[#C99BB0] text-white' },
] as const;

interface UserTrack { name: string; url: string; }

export default function SoundPanel() {
  const [open, setOpen] = useState(false);
  const [builtinId, setBuiltinId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<UserTrack[]>([]);
  const [playlistIdx, setPlaylistIdx] = useState<number>(-1); // -1 = playlist not active
  const [volume, setVolume] = useState(0.65);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playlistRef = useRef<UserTrack[]>([]);
  const idxRef = useRef(-1);
  playlistRef.current = playlist;
  idxRef.current = playlistIdx;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.onended = () => {
      // advance through the user playlist (built-ins use loop=true instead)
      const list = playlistRef.current;
      if (idxRef.current >= 0 && list.length > 0) {
        const next = (idxRef.current + 1) % list.length;
        playUser(next);
      }
    };
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
      playlistRef.current.forEach((t) => URL.revokeObjectURL(t.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const stopAll = () => {
    audioRef.current?.pause();
    setBuiltinId(null);
    setPlaylistIdx(-1);
  };

  const playBuiltin = (id: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (builtinId === id) { stopAll(); return; }
    const t = BUILTIN.find((b) => b.id === id)!;
    audio.loop = true;
    audio.src = t.src;
    audio.volume = volume;
    audio.play().catch((e) => console.warn('Audio blocked:', e));
    setBuiltinId(id);
    setPlaylistIdx(-1);
  };

  const playUser = (idx: number) => {
    const audio = audioRef.current;
    const list = playlistRef.current;
    if (!audio || !list[idx]) return;
    audio.loop = false;
    audio.src = list[idx].url;
    audio.volume = volume;
    audio.play().catch((e) => console.warn('Audio blocked:', e));
    setBuiltinId(null);
    setPlaylistIdx(idx);
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = (Array.from(e.target.files || []) as File[]).filter(
      (f: File) => f.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav|flac)$/i.test(f.name)
    );
    if (files.length === 0) return;
    const tracks = files.map((f: File) => ({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) }));
    setPlaylist((prev) => {
      const merged = [...prev, ...tracks];
      return merged;
    });
    // auto-play the first newly added track if nothing is playing
    setTimeout(() => {
      if (idxRef.current < 0 && !audioRef.current?.src.includes('assets')) playUser(playlistRef.current.length - tracks.length);
      else if (idxRef.current < 0 && builtinId === null) playUser(playlistRef.current.length - tracks.length);
    }, 50);
    e.target.value = '';
  };

  const clearPlaylist = () => {
    if (playlistIdx >= 0) stopAll();
    playlist.forEach((t) => URL.revokeObjectURL(t.url));
    setPlaylist([]);
    setPlaylistIdx(-1);
  };

  const playing = builtinId !== null || playlistIdx >= 0;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-[5.5rem] z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
          playing ? 'bg-[#8EAC50] text-white' : 'bg-white border border-[#FFDEC9] text-[#C9A886] hover:text-[#725442]'
        }`}
        title="Study sounds"
        id="sound-panel-button"
      >
        <Music className="w-6 h-6" />
        {playing && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FF9E7D] rounded-full border-2 border-white animate-pulse" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-[5.5rem] z-50 bg-[#FFFDF9] border border-[#FFDEC9] rounded-3xl shadow-2xl p-3.5 w-64"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#B99C86] font-bold px-1 mb-2">study sounds</p>

            {/* Built-in ambient tracks */}
            <div className="space-y-1.5">
              {BUILTIN.map((t) => {
                const Icon = t.icon;
                const active = builtinId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => playBuiltin(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                      active ? t.activeCls : 'bg-[#FFF8F0] border-[#FFE4CF] text-[#A0836D] hover:bg-[#FFF2E6]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.id === 'piano' && <span className={`text-[8px] font-bold ${active ? 'opacity-90' : 'text-[#C9A886]'}`}>4:33 · original</span>}
                    {active && (
                      <span className="ml-auto flex items-end gap-[2px] h-3">
                        {[0, 0.2, 0.4].map((d) => (
                          <motion.span key={d} className="w-[3px] bg-white/90 rounded-full"
                            animate={{ height: ['30%', '100%', '45%'] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* My Music — the user's own study playlist */}
            <div className="mt-3 pt-3 border-t border-[#FFE9D6]">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#B99C86] font-bold">my music</p>
                {playlist.length > 0 && (
                  <button onClick={clearPlaylist} className="text-[#C9A886] hover:text-[#B0684F] cursor-pointer" title="Clear playlist">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={onPickFiles} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-dashed border-[#FFC9A3] text-[#C9885F] bg-[#FFF8F0] hover:bg-[#FFF2E6] transition-all active:scale-95 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                {playlist.length === 0 ? 'Add music from your computer' : 'Add more tracks'}
              </button>
              <p className="text-[9px] text-[#C9A886] px-1 mt-1 leading-relaxed">
                Pick your favourite study songs (mp3/m4a...). They play in order and repeat.
              </p>

              {playlist.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1 pr-0.5">
                  {playlist.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => playUser(i)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                        playlistIdx === i ? 'bg-[#FF9E7D] text-white' : 'bg-[#FFF8F0] text-[#A0836D] hover:bg-[#FFF2E6]'
                      }`}
                    >
                      <span className="truncate flex-1">{t.name}</span>
                      {playlistIdx === i && (
                        <span className="flex items-end gap-[2px] h-3 shrink-0">
                          {[0, 0.2, 0.4].map((d) => (
                            <motion.span key={d} className="w-[3px] bg-white/90 rounded-full"
                              animate={{ height: ['30%', '100%', '45%'] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
                          ))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {playlistIdx >= 0 && playlist.length > 1 && (
                <button
                  onClick={() => playUser((playlistIdx + 1) % playlist.length)}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#FFF2E6] text-[#A0836D] hover:bg-[#FFE8D6] cursor-pointer"
                >
                  <SkipForward className="w-3 h-3" /> Next track
                </button>
              )}
            </div>

            {/* Quiet + volume */}
            <div className="mt-3 pt-3 border-t border-[#FFE9D6]">
              <button
                onClick={stopAll}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                  !playing ? 'bg-[#C9B29B] border-[#C9B29B] text-white' : 'bg-[#FFF8F0] border-[#FFE4CF] text-[#A0836D] hover:bg-[#FFF2E6]'
                }`}
              >
                <VolumeX className="w-4 h-4" />
                Quiet
              </button>
              <div className="flex items-center gap-2 mt-2.5 px-1">
                <Volume2 className="w-3.5 h-3.5 text-[#C9A886] shrink-0" />
                <input type="range" min="0" max="1" step="0.05" value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-[#FF9E7D]" id="ambient-volume" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
