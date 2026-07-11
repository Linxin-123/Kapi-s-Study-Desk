/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AnimatedBackground — the illustrated study room made cinematic.
 * The artwork itself moves: a slow Ken Burns camera drift (pan + zoom),
 * breathing window light, pulsing warm glow, and drifting golden dust.
 * The dog & cat buddies rest on the armchair, gently breathing.
 * No fake overlay plants — the room's own art stays untouched.
 */

import React from 'react';

const bgArt = new URL('../assets/images/room_bg_hd.png', import.meta.url).href;

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* The artwork with a slow cinematic camera drift — shown as-is, no blur */}
      <div className="absolute inset-0 kapi-kenburns">
        <img
          src={bgArt}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Vignette: gently darkened corners frame the content */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(70,48,28,0.12) 100%)' }}
      />

      {/* Breathing sunlight from the window side */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFD79A]/30 via-transparent to-transparent kapi-sunbeam" />
      {/* A second warm pulse from the top, like lamp glow */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#FFC98A]/20 to-transparent kapi-lampglow" />

      {/* Drifting golden dust in the air */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {[
          { x: 300, y: 660, d: 0 }, { x: 560, y: 600, d: 2.2 }, { x: 840, y: 680, d: 4.5 },
          { x: 1060, y: 560, d: 1.3 }, { x: 1240, y: 640, d: 3.4 }, { x: 420, y: 480, d: 5.2 },
          { x: 960, y: 460, d: 2.8 }, { x: 160, y: 560, d: 4.0 }, { x: 700, y: 380, d: 6.1 },
        ].map((s, i) => (
          <circle
            key={i}
            cx={s.x} cy={s.y} r={i % 2 ? 4 : 3}
            fill={i % 3 === 0 ? '#FFE3B0' : '#FFD1BC'}
            className="kapi-sparkle-drift"
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}
      </svg>

      {/* Soft readability veil so cards stay legible */}
      <div className="absolute inset-0 bg-[#FFF8F0]/30" />
    </div>
  );
}
