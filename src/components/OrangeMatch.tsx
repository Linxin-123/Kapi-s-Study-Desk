/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OrangeMatch — a cozy match-3 break game.
 * Swap adjacent tiles to line up 3+; cascades chain for bonus points.
 * 90-second rounds, best score remembered.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Play } from 'lucide-react';

const SIZE = 7;
const TYPES = ['🍊', '🍵', '📖', '⭐', '💗'];
const ROUND_SECONDS = 300; // 5-minute rounds — a proper break-length game

interface Tile { id: number; type: string; }
let nextId = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const idx = (r: number, c: number) => r * SIZE + c;

function randomType(exclude: string[] = []): string {
  const pool = TYPES.filter((t) => !exclude.includes(t));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Build a board with no pre-made matches
function freshBoard(): Tile[] {
  const board: Tile[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const avoid: string[] = [];
      if (c >= 2 && board[idx(r, c - 1)].type === board[idx(r, c - 2)].type) avoid.push(board[idx(r, c - 1)].type);
      if (r >= 2 && board[idx(r - 1, c)].type === board[idx(r - 2, c)].type) avoid.push(board[idx(r - 1, c)].type);
      board.push({ id: nextId++, type: randomType(avoid) });
    }
  }
  return board;
}

function findMatches(board: (Tile | null)[]): Set<number> {
  const hit = new Set<number>();
  // rows
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      const same = c < SIZE && board[idx(r, c)] && board[idx(r, c - 1)] && board[idx(r, c)]!.type === board[idx(r, c - 1)]!.type;
      if (same) run++;
      else {
        if (run >= 3) for (let k = c - run; k < c; k++) hit.add(idx(r, k));
        run = 1;
      }
    }
  }
  // cols
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      const same = r < SIZE && board[idx(r, c)] && board[idx(r - 1, c)] && board[idx(r, c)]!.type === board[idx(r - 1, c)]!.type;
      if (same) run++;
      else {
        if (run >= 3) for (let k = r - run; k < r; k++) hit.add(idx(k, c));
        run = 1;
      }
    }
  }
  return hit;
}

export default function OrangeMatch({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<(Tile | null)[]>(() => freshBoard());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem('kapi_match_best') || 0));
  const busyRef = useRef(false);
  const boardRef = useRef(board);
  boardRef.current = board;

  // countdown
  useEffect(() => {
    if (!running || over) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setOver(true);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, over]);

  // persist best
  useEffect(() => {
    if (over && score > best) {
      setBest(score);
      localStorage.setItem('kapi_match_best', String(score));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const start = () => {
    nextId += SIZE * SIZE;
    setBoard(freshBoard());
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setOver(false);
    setRunning(true);
    setSelected(null);
  };

  async function resolve(b: (Tile | null)[]): Promise<void> {
    let chain = 0;
    let cur = b;
    while (true) {
      const hits = findMatches(cur);
      if (hits.size === 0) break;
      chain++;
      setScore((s) => s + hits.size * 10 * chain);
      // pop
      cur = cur.map((t, i) => (hits.has(i) ? null : t));
      setBoard(cur);
      await sleep(230);
      // gravity + refill per column
      const next = cur.slice();
      for (let c = 0; c < SIZE; c++) {
        const col: Tile[] = [];
        for (let r = SIZE - 1; r >= 0; r--) {
          const t = next[idx(r, c)];
          if (t) col.push(t);
        }
        for (let r = SIZE - 1; r >= 0; r--) {
          const fromBottom = SIZE - 1 - r;
          next[idx(r, c)] = col[fromBottom] || { id: nextId++, type: randomType() };
        }
      }
      cur = next;
      setBoard(cur);
      await sleep(260);
    }
  }

  const clickTile = async (i: number) => {
    if (!running || over || busyRef.current) return;
    if (selected === null) { setSelected(i); return; }
    if (selected === i) { setSelected(null); return; }
    const r1 = Math.floor(selected / SIZE), c1 = selected % SIZE;
    const r2 = Math.floor(i / SIZE), c2 = i % SIZE;
    const adjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    if (!adjacent) { setSelected(i); return; }

    busyRef.current = true;
    const b = boardRef.current.slice();
    [b[selected], b[i]] = [b[i], b[selected]];
    const hits = findMatches(b);
    if (hits.size === 0) {
      // invalid — shake and revert
      setBoard(b);
      await sleep(160);
      const back = b.slice();
      [back[selected], back[i]] = [back[i], back[selected]];
      setBoard(back);
      setShake(i);
      setTimeout(() => setShake(null), 350);
    } else {
      setBoard(b);
      await sleep(140);
      await resolve(b);
    }
    setSelected(null);
    busyRef.current = false;
  };

  const mm = Math.floor(timeLeft / 60);
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-[#5B4230]/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 230, damping: 20 }}
        className="bg-[#FFFDF9] rounded-3xl border border-[#FFDEC9] shadow-2xl p-5 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl text-[#A0836D] hover:bg-amber-50 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-baseline gap-2">
          <h2 className="font-extrabold text-[#725442] text-base">🍊 Orange Match</h2>
          <span className="text-[10px] text-[#B99C86] font-bold">match 3 to pop!</span>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-between mt-3 mb-3">
          <div className="text-center">
            <div className="text-xl font-black text-[#725442]">{score}</div>
            <div className="text-[8px] uppercase tracking-[0.15em] text-[#B99C86] font-bold">score</div>
          </div>
          <div className={`text-3xl font-black font-mono ${timeLeft <= 10 && running ? 'text-[#E86A5B]' : 'text-[#FF8D66]'}`}>
            {mm}:{ss}
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-[#725442]">{best}</div>
            <div className="text-[8px] uppercase tracking-[0.15em] text-[#B99C86] font-bold">best</div>
          </div>
        </div>

        {/* Board */}
        <div className="relative">
          <div className="grid grid-cols-7 gap-1 bg-[#FFF2E4] rounded-2xl p-1.5 border border-[#FFE4CF]">
            {board.map((t, i) => (
              <motion.button
                key={t ? t.id : `empty-${i}`}
                layout
                initial={{ scale: 0 }}
                animate={{
                  scale: t ? 1 : 0,
                  rotate: shake === i ? [0, -8, 8, -6, 0] : 0,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                onClick={() => clickTile(i)}
                className={`aspect-square rounded-xl text-xl sm:text-2xl flex items-center justify-center transition-colors cursor-pointer select-none ${
                  selected === i ? 'bg-[#FFD9BC] ring-2 ring-[#FF9E7D]' : 'bg-white/85 hover:bg-white'
                }`}
              >
                {t?.type}
              </motion.button>
            ))}
          </div>

          {/* Start / Game over overlays */}
          <AnimatePresence>
            {(!running || over) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#FFFDF9]/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center gap-2 overflow-y-auto py-3"
              >
                {over ? (
                  <>
                    <div className="text-3xl">🎉</div>
                    <div className="text-sm font-extrabold text-[#725442]">Time! You scored {score}</div>
                    {score >= best && score > 0 && <div className="text-[10px] font-bold text-[#FF8D66]">new best score!! ✨</div>}
                    <button onClick={start} className="mt-1 px-5 py-2.5 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" /> Play again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-3xl">🍊</div>
                    <div className="text-left text-[11px] font-bold text-[#725442] bg-white/80 border border-[#FFE4CF] rounded-2xl px-4 py-3 mx-6 space-y-1.5 leading-relaxed">
                      <p>🎯 <b>How to play:</b></p>
                      <p>1️⃣ Tap a tile, then tap a <b>neighbouring</b> tile to swap them.</p>
                      <p>2️⃣ Line up <b>3 or more</b> of the same icon (row or column) to pop them.</p>
                      <p>3️⃣ New tiles fall in — chain reactions score <b>bonus multipliers</b>!</p>
                      <p className="text-[#A0836D]">💡 Pop matches near the <b>bottom</b> to trigger big cascades. Invalid swaps bounce back — no penalty.</p>
                    </div>
                    <div className="text-[10px] font-bold text-[#B99C86]">⏱ 5 minutes per round · score = tiles × 10 × chain</div>
                    <button onClick={start} className="mt-1 px-6 py-2.5 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer" id="match-start">
                      <Play className="w-3.5 h-3.5" /> Start
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[9px] text-[#C9A886] text-center mt-2.5">a little brain-refresher between study sessions 🌱</p>
      </motion.div>
    </motion.div>
  );
}
