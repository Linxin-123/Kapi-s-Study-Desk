/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OrangeTree — the core loop, visible on the main screen.
 * Every N focused minutes, one orange grows on the tree with a happy pop.
 */

import React from 'react';
import { motion } from 'motion/react';

// Fixed fruit positions among the foliage (up to 12 visible)
const SPOTS: Array<[number, number]> = [
  [96, 74], [138, 60], [172, 82], [70, 100], [120, 100],
  [158, 112], [196, 100], [88, 132], [180, 136], [132, 140],
  [58, 74], [204, 70],
];

export default function OrangeTree({ count }: { count: number }) {
  const visible = Math.min(count, SPOTS.length);
  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-[#FFDEC9] p-4 shadow-sm">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#B99C86] font-bold">orange tree</p>
        <p className="text-[10px] font-bold text-[#C9A886]">{count === 0 ? 'grow your first 🍊' : `${count} grown today`}</p>
      </div>

      <svg viewBox="0 0 260 190" className="w-full mt-1" role="img" aria-label={`Orange tree with ${count} oranges`}>
        {/* Ground */}
        <ellipse cx="130" cy="176" rx="86" ry="9" fill="#EFDCC2" />
        {/* Trunk */}
        <path d="M124 172 C124 150 120 134 114 122 M130 172 C130 148 132 132 140 118 M127 172 L127 130"
          stroke="#A5754C" strokeWidth="11" strokeLinecap="round" fill="none" />
        {/* Foliage (sways gently) */}
        <g className="kapi-plant-sway">
          <ellipse cx="90" cy="96" rx="52" ry="42" fill="#8FB573" />
          <ellipse cx="172" cy="92" rx="54" ry="44" fill="#9DBB7B" />
          <ellipse cx="130" cy="66" rx="52" ry="40" fill="#A9C489" />
          <ellipse cx="130" cy="96" rx="46" ry="36" fill="#96B97C" />
          {/* leaf highlights */}
          <ellipse cx="112" cy="56" rx="18" ry="10" fill="#BDD3A0" opacity="0.7" />
          <ellipse cx="182" cy="72" rx="14" ry="8" fill="#BDD3A0" opacity="0.6" />

          {/* Oranges grow where you earned them */}
          {SPOTS.slice(0, visible).map(([x, y], i) => (
            <motion.g
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.05 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <circle cx={x} cy={y} r="10" fill="#F5A04A" />
              <circle cx={x - 3.5} cy={y - 3.5} r="2.5" fill="#FDBE77" />
              <path d={`M${x + 1} ${y - 9} C${x + 4} ${y - 12} ${x + 7} ${y - 10} ${x + 6} ${y - 8}`} stroke="#7BA05B" strokeWidth="2" strokeLinecap="round" fill="none" />
            </motion.g>
          ))}
        </g>

        {/* Overflow badge */}
        {count > SPOTS.length && (
          <g>
            <circle cx="228" cy="30" r="15" fill="#FF9E7D" />
            <text x="228" y="34" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
              +{count - SPOTS.length}
            </text>
          </g>
        )}

        {/* Basket hint when empty */}
        {count === 0 && (
          <text x="130" y="100" textAnchor="middle" fill="#6F8F58" fontSize="10" fontWeight="bold" opacity="0.85">
            25 focused minutes = 1 orange
          </text>
        )}
      </svg>
    </div>
  );
}
