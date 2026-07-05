/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CompanionMascot — Kapi & Luna as a LIVING layered vector character.
 * Not a photo: the eyes blink, ears twitch, Luna's tail wags, and each of
 * the five states changes real facial features and poses — the Duolingo way.
 * Art direction follows the user's illustrated reference sheet.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FocusState, PomodoroStatus } from '../types';

interface CompanionMascotProps {
  state: FocusState;
  status: PomodoroStatus;
  mascotName: string;
  speechBubble: string | null;
}

const INK = '#4A3524';
const BLUSH = '#F6A98F';

// Per-state whole-body idle motion
const stateMotion: Record<FocusState, { animate: any; transition: any }> = {
  focused: { animate: { y: [0, -6, 0] }, transition: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } },
  phone: { animate: { y: [0, -4, 0], x: 8 }, transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
  away: { animate: { y: [3, 7, 3] }, transition: { duration: 4.6, repeat: Infinity, ease: 'easeInOut' } },
  tired: { animate: { y: [4, 8, 4] }, transition: { duration: 2.9, repeat: Infinity, ease: 'easeInOut' } },
  stretch: { animate: { y: [0, -14, 0], scale: [1, 1.04, 1] }, transition: { duration: 0.95, repeat: Infinity, ease: 'easeOut' } },
};

const CAPTIONS: Record<FocusState, (name: string) => string> = {
  focused: (n) => `Deep focus — ${n} and Luna are reading beside you`,
  phone: () => `Hmm? A notification? Let's check it later`,
  away: (n) => `${n} and Luna are napping while they wait for you`,
  tired: () => `Here, have an orange — let's rest our eyes a moment`,
  stretch: () => `Great stretch!! You're doing amazing`,
};

/* ============================ KAPI ============================ */

function KapiEyes({ state }: { state: FocusState }) {
  if (state === 'away') {
    // sleeping: soft down-curved lids
    return (
      <g>
        <path d="M121 166 C127 171 137 171 143 166" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M187 166 C193 171 203 171 209 166" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (state === 'stretch') {
    // joyful ^^
    return (
      <g>
        <path d="M121 170 L132 160 L143 170" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M187 170 L198 160 L209 170" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    );
  }
  if (state === 'tired') {
    // half-lidded droopy eyes + heavy lids
    return (
      <g>
        <ellipse cx="132" cy="169" rx="8.5" ry="7" fill={INK} />
        <ellipse cx="198" cy="169" rx="8.5" ry="7" fill={INK} />
        <path d="M121 163 C127 159 137 159 143 163 L143 168 C137 164 127 164 121 168 Z" fill="#C89C6F" />
        <path d="M187 163 C193 159 203 159 209 163 L209 168 C203 164 193 164 187 168 Z" fill="#C89C6F" />
        <circle cx="129" cy="171" r="1.8" fill="#FFF6EC" opacity="0.8" />
        <circle cx="195" cy="171" r="1.8" fill="#FFF6EC" opacity="0.8" />
        {/* droopy brows */}
        <path d="M120 152 C126 149 134 150 140 154" stroke="#8A6240" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M190 154 C196 150 204 149 210 152" stroke="#8A6240" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      </g>
    );
  }
  const wide = state === 'phone';
  const rx = wide ? 10 : 8.5;
  const ry = wide ? 11 : 9.5;
  return (
    // open glossy eyes with blink
    <g className="kapi-blink">
      <ellipse cx="132" cy="167" rx={rx} ry={ry} fill={INK} />
      <ellipse cx="198" cy="167" rx={rx} ry={ry} fill={INK} />
      <circle cx="135.5" cy="162.5" r="3" fill="#FFFFFF" />
      <circle cx="201.5" cy="162.5" r="3" fill="#FFFFFF" />
      <circle cx="128" cy="171" r="1.6" fill="#FFFFFF" opacity="0.75" />
      <circle cx="194" cy="171" r="1.6" fill="#FFFFFF" opacity="0.75" />
    </g>
  );
}

function KapiMouth({ state }: { state: FocusState }) {
  if (state === 'stretch') {
    return (
      <g>
        <path d="M156 208 C160 218 174 218 178 208 Z" fill={INK} />
        <path d="M161 214 C165 217 169 217 173 214 Z" fill="#F58BA0" />
      </g>
    );
  }
  if (state === 'phone') return <ellipse cx="167" cy="211" rx="4.5" ry="5.5" fill={INK} />;
  if (state === 'tired') return <path d="M160 212 C164 210 170 210 174 212" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />;
  // gentle smile (focused / away)
  return <path d="M158 210 C162 214 172 214 176 210" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />;
}

function Kapi({ state }: { state: FocusState }) {
  return (
    <g>
      {/* ---- Body ---- */}
      <path d="M70 265 C63 200 93 148 167 146 C241 148 271 200 264 265 C265 278 251 282 237 280 L97 280 C83 282 69 278 70 265 Z" fill="url(#kBodyOuter)" />
      <path d="M87 266 C83 220 107 182 167 180 C227 182 251 220 247 266 C247 274 237 277 227 276 L107 276 C97 277 87 274 87 266 Z" fill="url(#kBodyInner)" />
      <ellipse cx="150" cy="226" rx="42" ry="26" fill="#EBCB9F" opacity="0.25" />
      {/* fur hints */}
      <path d="M86 240 C90 236 94 236 98 240 M232 236 C236 232 240 232 244 236" stroke="#9C7148" strokeWidth="2" strokeLinecap="round" opacity="0.35" fill="none" />

      {/* Feet */}
      <ellipse cx="117" cy="276" rx="16" ry="8" fill="#B98A5E" />
      <ellipse cx="217" cy="276" rx="16" ry="8" fill="#B98A5E" />
      <path d="M113 279 L113 274 M118 279 L118 274 M123 279 L123 274" stroke="#8A6240" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M213 279 L213 274 M218 279 L218 274 M223 279 L223 274" stroke="#8A6240" strokeWidth="1.5" strokeLinecap="round" />

      {/* ---- Stretch: arms raised high ---- */}
      {state === 'stretch' && (
        <g>
          <path d="M100 210 C78 188 72 160 88 142" stroke="#CDA173" strokeWidth="19" strokeLinecap="round" fill="none" />
          <circle cx="88" cy="140" r="11" fill="#B98A5E" />
          <path d="M234 210 C256 188 262 160 246 142" stroke="#CDA173" strokeWidth="19" strokeLinecap="round" fill="none" />
          <circle cx="246" cy="140" r="11" fill="#B98A5E" />
        </g>
      )}

      {/* ---- Scarf ---- */}
      <path d="M121 214 C135 228 199 228 213 214 C221 220 221 232 213 238 C195 248 139 248 121 238 C113 232 113 220 121 214 Z" fill="url(#kScarf)" />
      <path d="M189 234 C199 236 205 244 203 258 C202 266 195 268 189 266 C181 262 179 240 189 234 Z" fill="url(#kScarf)" />
      <path d="M185 244 L201 244 M184 252 L201 252" stroke="#E58CA0" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M189 262 L189 268 M194 263 L194 269 M199 261 L199 267" stroke="#E58CA0" strokeWidth="2" strokeLinecap="round" />
      <path d="M129 218 C145 228 189 228 205 218" stroke="#E58CA0" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* ---- Head group (tilts toward you in phone state) ---- */}
      <motion.g
        animate={{ rotate: state === 'phone' ? 6 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        style={{ transformOrigin: '167px 180px' }}
      >
        {/* Ears with life */}
        <g className="kapi-ear">
          <path d="M103 138 C95 122 105 112 117 118 C125 122 127 132 123 140 Z" fill="#A87B52" />
          <path d="M108 134 C104 125 109 120 116 123 C120 125 121 130 119 135 Z" fill="#8A6240" />
        </g>
        <g className="kapi-ear" style={{ animationDelay: '2.7s' }}>
          <path d="M231 138 C239 122 229 112 217 118 C209 122 207 132 211 140 Z" fill="#A87B52" />
          <path d="M226 134 C230 125 225 120 218 123 C214 125 213 130 215 135 Z" fill="#8A6240" />
        </g>

        {/* Head */}
        <path d="M97 180 C95 142 125 122 167 122 C209 122 239 142 237 180 C237 206 209 220 167 220 C125 220 97 206 97 180 Z" fill="url(#kBodyInner)" />
        <ellipse cx="149" cy="140" rx="38" ry="15" fill="#EDCFA2" opacity="0.4" />
        {/* Muzzle */}
        <path d="M133 204 C137 188 153 180 167 180 C181 180 197 188 201 204 C203 214 193 222 167 222 C141 222 131 214 133 204 Z" fill="url(#kMuzzle)" />
        {/* Nose */}
        <ellipse cx="167" cy="193" rx="9" ry="6.5" fill={INK} />
        <path d="M167 200 L167 206" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="117" cy="190" rx="13" ry="7.5" fill={BLUSH} />
        <ellipse cx="217" cy="190" rx="13" ry="7.5" fill={BLUSH} />
        <path d="M113 188 L115 192 M119 186 L121 190" stroke="#EE8F73" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M213 188 L215 192 M219 186 L221 190" stroke="#EE8F73" strokeWidth="1.5" strokeLinecap="round" />

        <KapiEyes state={state} />
        <KapiMouth state={state} />

        {/* Orange on head (bounces when celebrating) */}
        <motion.g
          animate={state === 'stretch' ? { y: [0, -14, 0], rotate: [0, 10, 0] } : { y: 0, rotate: 0 }}
          transition={state === 'stretch' ? { duration: 0.95, repeat: Infinity, ease: 'easeOut' } : { duration: 0.3 }}
          style={{ transformOrigin: '167px 106px' }}
        >
          <circle cx="167" cy="106" r="16" fill="url(#kOrange)" />
          <circle cx="161" cy="100" r="4" fill="#FDBE77" />
          <path d="M167 90 C167 85 171 81 176 82" stroke="#7BA05B" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M176 82 C183 80 187 85 185 89 C181 93 175 91 176 82 Z" fill="#8FBC6F" />
        </motion.g>
      </motion.g>

      {/* ---- Focused: open book in paws ---- */}
      {state === 'focused' && (
        <g>
          <ellipse cx="167" cy="278" rx="44" ry="5" fill="#A87B52" opacity="0.25" />
          <path d="M125 262 C139 254 157 252 167 256 C177 252 195 254 209 262 L209 276 C195 270 177 269 167 273 C157 269 139 270 125 276 Z" fill="#8FA98B" />
          <path d="M129 260 C141 253 157 251 167 255 L167 270 C157 266 141 267 129 272 Z" fill="#FFF8EC" />
          <path d="M205 260 C193 253 177 251 167 255 L167 270 C177 266 193 267 205 272 Z" fill="#FFF4E2" />
          <path d="M137 259 C145 256 155 255 162 257 M137 264 C145 261 155 260 162 262" stroke="#D8BFA0" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M197 259 C189 256 179 255 172 257 M197 264 C189 261 179 260 172 262" stroke="#D8BFA0" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M167 255 L167 271" stroke="#7E9A7A" strokeWidth="2.5" strokeLinecap="round" />
          {/* paws holding the book */}
          <ellipse cx="130" cy="262" rx="10" ry="8" fill="#B98A5E" />
          <ellipse cx="204" cy="262" rx="10" ry="8" fill="#B98A5E" />
        </g>
      )}

      {/* ---- Tired: holding an orange to the chest ---- */}
      {state === 'tired' && (
        <g>
          <ellipse cx="196" cy="248" rx="11" ry="8" fill="#B98A5E" />
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="198" cy="232" r="13" fill="url(#kOrange)" />
            <circle cx="193" cy="227" r="3" fill="#FDBE77" />
            <path d="M198 219 C198 215 201 213 204 213" stroke="#7BA05B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M204 213 C209 212 211 216 209 218 C206 221 202 219 204 213 Z" fill="#8FBC6F" />
          </motion.g>
        </g>
      )}
    </g>
  );
}

/* ============================ LUNA ============================ */

function LunaEyes({ state }: { state: FocusState }) {
  if (state === 'away' || state === 'tired') {
    return (
      <g>
        <path d="M286 204 C289 207 294 207 297 204" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M303 204 C306 207 311 207 314 204" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (state === 'stretch') {
    return (
      <g>
        <path d="M286 206 L291.5 200 L297 206" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M303 206 L308.5 200 L314 206" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    );
  }
  return (
    <g className="kapi-blink" style={{ animationDelay: '0.8s' }}>
      <ellipse cx="291.5" cy="205" rx="4.5" ry="5" fill={INK} />
      <ellipse cx="308.5" cy="205" rx="4.5" ry="5" fill={INK} />
      <circle cx="293" cy="203" r="1.5" fill="#FFFFFF" />
      <circle cx="310" cy="203" r="1.5" fill="#FFFFFF" />
    </g>
  );
}

function Luna({ state }: { state: FocusState }) {
  // Luna cuddles closer when Kapi is tired
  const dx = state === 'tired' ? -16 : 0;
  return (
    <g transform={`translate(${dx} 0)`}>
      {/* Wagging tail */}
      <g className="kapi-tail">
        <path d="M334 246 C350 236 353 218 341 210" stroke="#EBB287" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M341 212 C346 208 348 202 345 198" stroke="#F6DDBF" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>

      {/* Body */}
      <path d="M270 276 C266 244 282 224 302 224 C322 224 336 244 332 276 C331 283 322 285 312 284 L290 284 C280 285 271 283 270 276 Z" fill="#F6DDBF" />
      <path d="M278 240 C286 228 318 228 326 240 C322 232 314 226 302 226 C290 226 282 232 278 240 Z" fill="#EBB287" />
      <ellipse cx="300" cy="266" rx="17" ry="12" fill="#FFF3E0" opacity="0.8" />

      {/* Stretch: paws up in celebration */}
      {state === 'stretch' && (
        <g>
          <path d="M284 244 C274 232 272 220 279 212" stroke="#F6DDBF" strokeWidth="11" strokeLinecap="round" fill="none" />
          <circle cx="279" cy="210" r="6.5" fill="#EBB287" />
          <path d="M318 244 C328 232 330 220 323 212" stroke="#F6DDBF" strokeWidth="11" strokeLinecap="round" fill="none" />
          <circle cx="323" cy="210" r="6.5" fill="#EBB287" />
        </g>
      )}

      {/* Head (gentle occasional tilt = alive) */}
      <g className="kapi-head-tilt">
        {/* Ears */}
        <path d="M282 188 L272 162 L294 178 Z" fill="#EBB287" />
        <path d="M284 184 L278 168 L292 179 Z" fill="#D98E5F" opacity="0.7" />
        <g className="kapi-ear" style={{ animationDelay: '4.5s' }}>
          <path d="M318 188 L328 162 L306 178 Z" fill="#EBB287" />
          <path d="M316 184 L322 168 L308 179 Z" fill="#D98E5F" opacity="0.7" />
        </g>

        <circle cx="300" cy="206" r="25" fill="#F6DDBF" />
        <path d="M277 200 C280 182 320 182 323 200 C321 188 313 180 300 180 C287 180 279 188 277 200 Z" fill="#EBB287" />
        {/* white muzzle */}
        <ellipse cx="300" cy="215" rx="11" ry="8" fill="#FFF7EC" />
        <path d="M297 211 L300 214 L303 211 Z" fill={INK} />
        <path d="M300 214 C300 217 297 218 295 217 M300 214 C300 217 303 218 305 217" stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* blush */}
        <ellipse cx="283" cy="212" rx="5" ry="3" fill={BLUSH} opacity="0.85" />
        <ellipse cx="317" cy="212" rx="5" ry="3" fill={BLUSH} opacity="0.85" />
        {/* brow dots */}
        <circle cx="291" cy="192" r="1.7" fill="#FFF7EC" opacity="0.9" />
        <circle cx="309" cy="192" r="1.7" fill="#FFF7EC" opacity="0.9" />

        <LunaEyes state={state} />
      </g>

      {/* Front paws */}
      {state !== 'stretch' && (
        <g>
          <ellipse cx="289" cy="282" rx="9" ry="5" fill="#F6DDBF" />
          <ellipse cx="311" cy="282" rx="9" ry="5" fill="#F6DDBF" />
        </g>
      )}

      {/* Tiny book when reading along */}
      {state === 'focused' && (
        <g>
          <path d="M282 262 C289 258 297 257 300 259 C303 257 311 258 318 262 L318 272 C311 268 303 268 300 270 C297 268 289 268 282 272 Z" fill="#8FA98B" />
          <path d="M285 261 C291 258 297 257 300 259 L300 268 C297 266 291 266 285 269 Z" fill="#FFF8EC" />
          <path d="M315 261 C309 258 303 257 300 259 L300 268 C303 266 309 266 315 269 Z" fill="#FFF4E2" />
          <path d="M300 259 L300 269" stroke="#7E9A7A" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

/* ============================ STAGE ============================ */

export default function CompanionMascot({
  state,
  status,
  mascotName,
  speechBubble,
}: CompanionMascotProps) {
  const expression: FocusState = state || 'focused';
  const m = stateMotion[expression];

  return (
    <div
      className="relative flex flex-col items-center justify-end p-6 pb-5 rounded-3xl border border-[#FFDEC9] shadow-md w-full mx-auto h-[520px] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFF9F0 0%, #FDEEDC 70%, #F9E3CA 100%)' }}
    >
      {/* Warm designed backdrop: glow + soft light streaks + drifting hearts */}
      <div className="absolute inset-x-10 top-16 bottom-12 rounded-full opacity-70 -z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 65%, #FFE3C0 0%, transparent 70%)' }} />
      <div className="absolute -left-8 top-6 w-40 h-72 rotate-[20deg] opacity-40 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #FFE9C8 0%, transparent 80%)' }} />
      <div className="absolute -right-4 top-10 w-28 h-60 rotate-[-16deg] opacity-30 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #FFE9C8 0%, transparent 80%)' }} />
      <span className="kapi-heart-float absolute left-8 top-32 text-[#F6A98F] text-lg pointer-events-none">♥</span>
      <span className="kapi-heart-float absolute right-10 top-44 text-[#F5C889] text-sm pointer-events-none" style={{ animationDelay: '1.8s' }}>♥</span>
      <span className="kapi-heart-float absolute left-14 bottom-28 text-[#F5C889] text-sm pointer-events-none" style={{ animationDelay: '3.1s' }}>♥</span>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        {speechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute top-4 left-5 right-5 bg-[#FFFDF9]/95 backdrop-blur-sm border border-[#FFE0CC] px-4 py-2.5 rounded-2xl text-[#725442] text-xs font-bold shadow-sm z-20"
            id="kapi-speech-bubble"
          >
            <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-[#FFFDF9] border-r border-b border-[#FFE0CC] rotate-45" />
            <p className="text-center leading-relaxed font-sans">{speechBubble}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The living character */}
      <div className="relative w-full flex-1 flex items-end justify-center min-h-0 z-10">
        <motion.svg
          viewBox="40 70 320 230"
          className="w-full max-w-[26rem] h-auto"
          animate={m.animate}
          transition={m.transition}
        >
          <defs>
            <linearGradient id="kBodyOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C79A6C" />
              <stop offset="100%" stopColor="#AC7E52" />
            </linearGradient>
            <linearGradient id="kBodyInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DBB588" />
              <stop offset="100%" stopColor="#C4986B" />
            </linearGradient>
            <linearGradient id="kMuzzle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1D6B0" />
              <stop offset="100%" stopColor="#E0BD92" />
            </linearGradient>
            <linearGradient id="kScarf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F7B7C6" />
              <stop offset="100%" stopColor="#EC9AAE" />
            </linearGradient>
            <radialGradient id="kOrange" cx="0.35" cy="0.3" r="0.9">
              <stop offset="0%" stopColor="#FFBE6E" />
              <stop offset="100%" stopColor="#F09540" />
            </radialGradient>
          </defs>

          {/* Shared ground shadow */}
          <ellipse cx="200" cy="284" rx="150" ry="13" fill="#E4C39A" opacity="0.55" />

          <Kapi state={expression} />
          <Luna state={expression} />
        </motion.svg>

        {/* ---- Floating state props ---- */}
        {expression === 'phone' && (
          <motion.div
            className="absolute top-4 right-[16%] text-5xl font-black text-[#FF8FA3] drop-shadow z-10"
            animate={{ y: [0, -12, 0], rotate: [0, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            !
          </motion.div>
        )}
        {expression === 'away' && (
          <div className="absolute top-6 right-[18%] z-10">
            {[
              { size: 'text-xl', delay: 0, x: 0 },
              { size: 'text-3xl', delay: 0.9, x: 18 },
              { size: 'text-4xl', delay: 1.8, x: 38 },
            ].map((z, i) => (
              <motion.span
                key={i}
                className={`absolute font-black text-[#A98868] drop-shadow-sm ${z.size}`}
                style={{ right: -z.x }}
                animate={{ opacity: [0, 1, 0], y: [12, -42], x: [0, 12] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: z.delay }}
              >
                Z
              </motion.span>
            ))}
          </div>
        )}
        {expression === 'tired' && (
          <motion.div
            className="absolute top-8 left-[14%] text-2xl z-10"
            animate={{ y: [0, 8, 0], opacity: [0.9, 0.5, 0.9] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            💧
          </motion.div>
        )}
        {expression === 'stretch' && (
          <>
            {[
              { icon: '✨', cls: 'top-2 left-[10%] text-4xl', dur: 1.0, delay: 0 },
              { icon: '⭐', cls: 'top-12 right-[8%] text-3xl', dur: 1.3, delay: 0.2 },
              { icon: '💛', cls: 'bottom-20 left-[6%] text-3xl', dur: 1.15, delay: 0.4 },
              { icon: '✨', cls: 'bottom-14 right-[12%] text-3xl', dur: 1.25, delay: 0.1 },
            ].map((s, i) => (
              <motion.div
                key={i}
                className={`absolute ${s.cls} drop-shadow-sm z-10`}
                animate={{ scale: [0.6, 1.4, 0.6], rotate: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
              >
                {s.icon}
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Status caption */}
      <div className="mt-3 text-center relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#B99C86] font-bold">{expression}</p>
        <h3 className="text-sm font-extrabold text-[#725442] mt-0.5" id="mascot-status-text">
          {CAPTIONS[expression](mascotName)}
        </h3>
      </div>
    </div>
  );
}
