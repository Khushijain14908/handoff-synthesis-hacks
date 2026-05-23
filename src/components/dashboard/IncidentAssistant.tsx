import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { askAssistant } from '../../lib/gemini';

interface ChatMessage {
  id: string;
  role: 'system' | 'user';
  content: string;
}

// Mock data to provide context to the AI during the demo
const MOCK_ACTIVE_INCIDENTS = [
  {
    id: 'inc-1',
    title: 'Downtown Flooding Support',
    status: 'active',
    urgency: 'high',
    volunteersDispatched: 12,
    needs: 'More sandbags and 2 trucks.'
  },
  {
    id: 'inc-2',
    title: 'Community Center Shelter Setup',
    status: 'active',
    urgency: 'medium',
    volunteersDispatched: 5,
    needs: 'Medical personnel for triage.'
  }
];

export default function IncidentAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'system',
      content: 'I am ready to help you manage the active incidents. What do you need to know?'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    
    // Add user message to UI
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Pass the user's prompt and the current state of incidents to the AI
      const incidentsJson = JSON.stringify(MOCK_ACTIVE_INCIDENTS);
      const responseText = await askAssistant(userText, incidentsJson);

      if (responseText) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: responseText
        }]);
      } else {
        throw new Error("Empty response");
      }
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: "I encountered an error connecting to the server. Please try asking your question again."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[380px] h-[500px] flex flex-col bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_-12px_rgba(139,92,246,0.25)] rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white/50 border-b border-white/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Coordinator Assistant</h3>
                  <p className="text-xs text-slate-500">Reading active incident data</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
                    msg.role === 'system' ? 'bg-violet-100 text-violet-600' : 'bg-sky-100 text-sky-600'
                  }`}>
                    {msg.role === 'system' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>
                  <div className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === 'system' 
                      ? 'bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-100' 
                      : 'bg-violet-500 text-white rounded-2xl rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 flex-row">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="px-4 py-3 bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex items-center gap-1">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Field */}
            <div className="p-3 bg-white/60 border-t border-white/50">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  disabled={isTyping}
                  className="w-full bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full shadow-[0_8px_20px_rgb(139,92,246,0.3)] border border-white/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}