/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DailyStats, FocusState } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Smartphone,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  stats: DailyStats;
  weeklyStats: DailyStats[];
  mascotName: string;
  onGenerateSummary: () => Promise<void>;
  isGeneratingSummary: boolean;
}

// Generate beautiful, human-readable duration strings
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
};

export default function Dashboard({
  stats,
  weeklyStats,
  mascotName,
  onGenerateSummary,
  isGeneratingSummary,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');

  // Prepare Today's Hourly Timeline Data
  const getTodayTimelineData = () => {
    // If we have no snapshots, return mock illustration data so the dashboard is immediately beautiful
    if (!stats.snapshots || stats.snapshots.length === 0) {
      return [
        { hour: '09:00', Focus: 45, Distracted: 5, Absent: 10 },
        { hour: '10:00', Focus: 50, Distracted: 2, Absent: 8 },
        { hour: '11:00', Focus: 30, Distracted: 15, Absent: 15 },
        { hour: '14:00', Focus: 55, Distracted: 0, Absent: 5 },
        { hour: '15:00', Focus: 40, Distracted: 10, Absent: 10 },
        { hour: '16:00', Focus: 48, Distracted: 4, Absent: 8 },
      ];
    }

    // Process real snapshots. Group by hour.
    const hourlyBins: Record<string, Record<FocusState, number>> = {};
    
    // Initialize hours with data
    stats.snapshots.forEach((snap) => {
      const date = new Date(snap.timestamp);
      const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
      
      if (!hourlyBins[hourStr]) {
        hourlyBins[hourStr] = { focused: 0, distracted: 0, absent: 0, stretch: 0 };
      }
      // Add weight (assume snapshots represent 5-second intervals during logging)
      // Legacy snapshots from older versions may use old state names — remap them
      const stateKey =
        snap.state === ('phone' as any) || snap.state === ('tired' as any) ? 'distracted'
        : snap.state === ('away' as any) ? 'absent'
        : snap.state;
      if (hourlyBins[hourStr][stateKey] !== undefined) {
        hourlyBins[hourStr][stateKey] += 5;
      }
    });

    const hours = Object.keys(hourlyBins).sort();
    if (hours.length === 0) return [];

    return hours.map((h) => {
      const bin = hourlyBins[h];
      return {
        hour: h,
        Focus: Math.round(bin.focused / 60),
        Distracted: Math.round(bin.distracted / 60),
        Absent: Math.round(bin.absent / 60),
        Stretch: Math.round(bin.stretch / 60),
      };
    });
  };

  // Prepare Weekly Trend Data — REAL data only, current week Sunday → Saturday
  const getWeeklyTrendData = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // back to Sunday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const ds = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const rec = weeklyStats.find((w) => w.date === ds);
      return {
        name: weekdayNames[i],
        FocusTime: rec ? Math.round(rec.totalFocusTime / 60) : 0,
        Pomodoros: rec?.pomodorosCompleted || 0,
        Distractions: rec?.distractionCount || 0,
      };
    });
  };

  const todayTimeline = getTodayTimelineData();
  const weeklyTrend = getWeeklyTrendData();

  // Active statistics — Daily tab shows TODAY, Weekly tab shows the current week's totals
  const weekAgg = (() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    let focus = 0, distractions = 0, pomos = 0, bestStreak = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const ds = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const rec = ds === stats.date ? stats : weeklyStats.find((w) => w.date === ds);
      if (rec) {
        focus += rec.totalFocusTime;
        distractions += rec.distractionCount;
        pomos += rec.pomodorosCompleted;
        bestStreak = Math.max(bestStreak, rec.longestStreakMinutes);
      }
    }
    return { focus, distractions, pomos, bestStreak };
  })();

  const currentTotalFocus = activeTab === 'weekly' ? weekAgg.focus : (stats.totalFocusTime || 0);
  const currentPhoneCount = activeTab === 'weekly' ? weekAgg.distractions : (stats.distractionCount || 0);
  const currentPomos = activeTab === 'weekly' ? weekAgg.pomos : (stats.pomodorosCompleted || 0);
  const currentStreak = activeTab === 'weekly' ? weekAgg.bestStreak : (stats.longestStreakMinutes || 0);

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex bg-[#FFF2E6] p-1.5 rounded-2xl max-w-xs border border-[#FFDEC9]">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'today'
              ? 'bg-white text-[#725442] shadow-xs'
              : 'text-[#A0836D] hover:text-[#725442]'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'weekly'
              ? 'bg-white text-[#725442] shadow-xs'
              : 'text-[#A0836D] hover:text-[#725442]'
          }`}
        >
          Weekly Trends
        </button>
      </div>

      {/* AI Daily Companion Advice (Gemini Grounding) */}
      <div className="bg-gradient-to-br from-[#FFFBF7] to-[#FFF5EC] border border-[#FFE1CD] rounded-3xl p-6 relative overflow-hidden shadow-xs">
        {/* Sparkle graphic background */}
        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#FFECD6] rounded-full filter blur-xl opacity-40" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl border border-[#FFDEC9] text-[#FF9E7D]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#725442] flex items-center gap-2">
                {mascotName}'s Companion Letter
              </h3>
              <p className="text-xs text-[#A0836D] mt-0.5">
                Using Gemini AI, {mascotName} analyzes your hourly study curves to write you an exclusive warm letter!
              </p>
            </div>
          </div>
          <button
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary}
            className="px-4 py-2 bg-white hover:bg-amber-50/50 border border-[#FFDEC9] text-[#725442] text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            id="regenerate-insights-button"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
            {isGeneratingSummary ? 'Analyzing...' : 'Regenerate Insights'}
          </button>
        </div>

        {/* Diagnostic advice text box */}
        <div className="mt-5 bg-white/85 rounded-2xl p-4 border border-[#FFEDE0] text-sm text-[#725442] leading-relaxed font-semibold">
          {stats.aiSummary ? (
            <p className="font-sans whitespace-pre-line">{stats.aiSummary}</p>
          ) : (
            <p className="font-sans italic text-[#A0836D]">
              "Today was another wonderful day studying with {mascotName}! Click 'Regenerate Insights' above to let me analyze your focus patterns and write you a personalized warm letter! 🍵"
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Focus Duration */}
        <div className="bg-white border border-[#FFDEC9] rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A0836D]">Total Focus Time</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-black text-[#725442] font-mono leading-none">
              {formatDuration(currentTotalFocus)}
            </h4>
            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50/70 px-2 py-0.5 rounded-md mt-1.5 inline-block">
              Superb Focus
            </span>
          </div>
        </div>

        {/* Distractions count */}
        <div className="bg-white border border-[#FFDEC9] rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A0836D]">Distractions</span>
            <div className="p-2 bg-amber-50 rounded-xl text-[#FF9E7D] border border-amber-100">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-black text-[#725442] font-mono leading-none">
              {currentPhoneCount} {currentPhoneCount === 1 ? 'time' : 'times'}
            </h4>
            <span className="text-[9px] text-[#C68A4C] font-bold bg-amber-50 px-2 py-0.5 rounded-md mt-1.5 inline-block">
              {currentPhoneCount > 5 ? 'A bit restless today' : 'Excellent focus control'}
            </span>
          </div>
        </div>

        {/* Completed Pomodoros */}
        <div className="bg-white border border-[#FFDEC9] rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A0836D]">Pomos Completed</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-500 border border-rose-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-black text-[#725442] font-mono leading-none">
              {currentPomos} {currentPomos === 1 ? 'Pomo' : 'Pomos'}
            </h4>
            <span className="text-[9px] text-rose-700 font-bold bg-rose-50/70 px-2 py-0.5 rounded-md mt-1.5 inline-block">
              Milestone Reached
            </span>
          </div>
        </div>

        {/* Longest streak */}
        <div className="bg-white border border-[#FFDEC9] rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A0836D]">Longest Flow State</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500 border border-indigo-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-black text-[#725442] font-mono leading-none">
              {currentStreak} mins
            </h4>
            <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50/70 px-2 py-0.5 rounded-md mt-1.5 inline-block">
              Deep Flow Achieved
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Orange Orchard — one little tree per day, growth you can see */}
      <div className="bg-white border border-[#FFDEC9] rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌳</span>
            <h3 className="font-extrabold text-[#725442] text-sm">Your Orange Orchard</h3>
          </div>
          {(() => {
            const weekTotal = (() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              let t = 0;
              for (let i = 0; i < 7; i++) {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + i);
                const ds = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                const rec = ds === stats.date ? stats : weeklyStats.find((w) => w.date === ds);
                t += rec?.pomodorosCompleted || 0;
              }
              return t;
            })();
            return (
              <div className="text-right">
                <div className="text-lg font-black text-[#725442] leading-none">{weekTotal} 🍊</div>
                <div className="text-[8px] uppercase tracking-[0.15em] text-[#B99C86] font-bold mt-0.5">this week</div>
              </div>
            );
          })()}
        </div>
        <p className="text-[11px] text-[#A0836D] mb-4">
          Every day grows its own little tree. Watch your orchard fill up through the week~
        </p>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, idx) => {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Sunday
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + idx);
            const ds = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            const rec = ds === stats.date ? stats : weeklyStats.find((w) => w.date === ds);
            const oranges = rec?.pomodorosCompleted || 0;
            const isToday = ds === stats.date;
            const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx];
            // fruit spots on the mini canopy
            const spots: Array<[number, number]> = [
              [30, 26], [50, 20], [42, 36], [22, 38], [58, 34], [36, 14],
            ];
            const shown = Math.min(oranges, spots.length);
            return (
              <div
                key={ds}
                className={`rounded-2xl border p-1.5 text-center transition-all ${
                  isToday ? 'bg-[#FFF4E8] border-[#FFC9A3] shadow-sm' : 'bg-[#FFFBF6] border-[#FFE9D6]'
                }`}
              >
                <svg viewBox="0 0 80 78" className="w-full">
                  <ellipse cx="40" cy="70" rx="26" ry="4" fill="#EFDCC2" />
                  <path d="M40 69 L40 48" stroke="#A5754C" strokeWidth="5" strokeLinecap="round" />
                  <g opacity={oranges > 0 ? 1 : 0.45}>
                    <ellipse cx="30" cy="32" rx="18" ry="15" fill="#96B97C" />
                    <ellipse cx="50" cy="30" rx="18" ry="15" fill="#9DBB7B" />
                    <ellipse cx="40" cy="20" rx="17" ry="13" fill="#A9C489" />
                  </g>
                  {spots.slice(0, shown).map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="4.5" fill="#F5A04A" />
                      <circle cx={x - 1.5} cy={y - 1.5} r="1.2" fill="#FDBE77" />
                    </g>
                  ))}
                  {oranges > spots.length && (
                    <g>
                      <circle cx="66" cy="12" r="9" fill="#FF9E7D" />
                      <text x="66" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                        +{oranges - spots.length}
                      </text>
                    </g>
                  )}
                </svg>
                <div className={`text-[9px] font-bold mt-0.5 ${isToday ? 'text-[#FF8D66]' : 'text-[#B99C86]'}`}>
                  {isToday ? 'Today' : dayLabel}
                </div>
                <div className="text-[10px] font-black text-[#725442]">{oranges}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white border border-[#FFDEC9] rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-[#FF9E7D]" />
          <div>
            <h3 className="font-extrabold text-[#725442] text-sm">
              {activeTab === 'today' ? "Today's Activity Distribution" : 'Weekly Focus Trajectory'}
            </h3>
            <p className="text-[11px] text-[#A0836D] mt-0.5">
              {activeTab === 'today' 
                ? 'Detailed hourly breakdown of your focus ratios, distractions, and resting intervals.'
                : 'Comparative view of your daily focus duration vs. distractions for the past 7 days.'
              }
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {activeTab === 'today' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={todayTimeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8EAC50" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8EAC50" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorPhone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9E7D" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FF9E7D" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorAway" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C2A58F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C2A58F" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4E6DB" vertical={false} />
                <XAxis dataKey="hour" stroke="#A0836D" fontSize={11} tickLine={false} />
                <YAxis stroke="#A0836D" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFBF8',
                    border: '1px solid #FFDEC9',
                    borderRadius: '16px',
                    color: '#725442',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Focus"
                  stroke="#8EAC50"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFocus)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="Distracted"
                  stroke="#FF9E7D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPhone)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="Absent"
                  stroke="#C2A58F"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorAway)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F4E6DB" vertical={false} />
                <XAxis dataKey="name" stroke="#A0836D" fontSize={11} tickLine={false} />
                <YAxis stroke="#A0836D" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFBF8',
                    border: '1px solid #FFDEC9',
                    borderRadius: '16px',
                    color: '#725442',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="FocusTime" name="Focus Minutes" fill="#8EAC50" radius={[10, 10, 0, 0]} maxBarSize={36}>
                  {weeklyTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === weeklyTrend.length - 1 ? '#8EAC50' : '#A3B899'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="Distractions" name="Distractions (Times)" fill="#FF9E7D" radius={[10, 10, 0, 0]} maxBarSize={24}>
                  {weeklyTrend.map((entry, index) => (
                    <Cell
                      key={`cell-dist-${index}`}
                      fill="#FFB085"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 border-t border-[#FFF0E2] pt-4 text-xs font-bold text-[#725442]">
          {activeTab === 'today' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#8EAC50]" />
                <span>Effective Focus Duration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF9E7D]" />
                <span>Distracted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#C2A58F]" />
                <span>Absent / Away</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#8EAC50]" />
                <span>Daily Focus (Mins)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FFB085]" />
                <span>Distractions (Times)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Helpful tips card */}
      <div className="bg-[#FFF8F0] border border-[#FFDEC9] rounded-3xl p-5 flex gap-3 text-xs text-[#725442] leading-relaxed">
        <Info className="w-5 h-5 text-[#FF9E7D] shrink-0 mt-0.5" />
        <div className="font-semibold font-sans">
          <p className="font-extrabold text-[#725442]">💡 How to Study More Efficiently?</p>
          <p className="mt-1 text-[#A0836D] font-medium">
            We recommend adjusting your PC webcam slightly downwards to frame your textbooks or keyboard. {mascotName} will stand alert at your desk corner with a sweet tangerine balanced on its head and a cozy winter pink scarf, sleeping quietly when you step away, stretching to celebrate healthy postures, and chiming gently to soothe your anxiety if you get distracted. Let's form great habits together!
          </p>
        </div>
      </div>
    </div>
  );
}
