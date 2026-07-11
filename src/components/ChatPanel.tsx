/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ChatPanel — a floating "Ask Kapi" bubble. Opens a small warm chat window
 * where the user can ask real study questions mid-session.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircleQuestion, X, SendHorizonal } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  mascotName: string;
}

export default function ChatPanel({ mascotName }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, mascotName }),
      });
      const data = await res.json();
      const reply = data.text || data.error || 'Hmm, my thoughts drifted away... could you ask again? 🍵';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I could not reach my thinking cloud just now — please try again in a moment. 🍵' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating bubble button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#FF9E7D] hover:bg-[#FF8D66] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
        title={`Ask ${mascotName} a study question`}
        id="chat-bubble-button"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircleQuestion className="w-7 h-7" />}
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-5 z-50 w-[min(92vw,360px)] h-[460px] bg-[#FFFDF9] border border-[#FFDEC9] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-[#FFF2E6] border-b border-[#FFDEC9] flex items-center gap-2">
              <span className="text-lg">🍊</span>
              <div>
                <h3 className="text-xs font-extrabold text-[#725442]">Ask {mascotName}</h3>
                <p className="text-[10px] text-[#A0836D]">Stuck on something? Ask me while you study~</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="text-center text-[11px] text-[#B99C86] mt-10 leading-relaxed px-6">
                  Ask me anything — a math step, a confusing concept,
                  a bit of code, or how to phrase a sentence. 📚
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#FF9E7D] text-white rounded-br-md'
                        : 'bg-white border border-[#FFE4CF] text-[#725442] rounded-bl-md'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#FFE4CF] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-xs text-[#A0836D]">
                    {mascotName} is thinking
                    <span className="inline-block animate-bounce">.</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#FFE4CF] bg-white/70 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type your question..."
                className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-[#FFDEC9] bg-white text-xs text-[#725442] placeholder-[#C9AC98] focus:outline-none focus:border-[#FF9E7D] max-h-24"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="p-2.5 rounded-xl bg-[#FF9E7D] hover:bg-[#FF8D66] text-white disabled:opacity-40 transition-colors cursor-pointer"
                id="chat-send-button"
              >
                <SendHorizonal className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
