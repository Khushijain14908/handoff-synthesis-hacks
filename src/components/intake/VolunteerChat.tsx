//test

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { parseVolunteerMessage } from '../../lib/gemini';
import { useVolunteers } from '../../lib/firebase';

interface Message {
  id: string;
  role: 'system' | 'user';
  content: string;
}

export default function VolunteerChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: "Hi there! I'm the Community Response assistant. I'm here to help you register as a volunteer so we can match you with community needs. To get started, what is your name, your contact info, and what kind of skills or equipment can you offer today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize our real-time Firebase hook
  const { addVolunteer } = useVolunteers();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRegistered) return;

    const userText = input.trim();
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Send the conversation history to Gemini to extract structured JSON
      const extractedData = await parseVolunteerMessage(newHistory);

      if (extractedData) {
        // Only finalize and save if we have the critical fields (name and contact)
        const isDataSufficient = !!(extractedData.name && extractedData.contact);

        if (isDataSufficient) {
          // 2. Save the extracted JSON directly to Firestore
          await addVolunteer(extractedData);

          // 3. Generate a dynamic conversational response based on what Gemini found
          const name = extractedData.name || 'friend';
          const skillsCount = extractedData.skills.length + extractedData.equipment.length;

          // Simple logic to "assign" a role based on skills
          let assignedRole = "General Support";
          const allCapabilities = [...extractedData.skills, ...extractedData.equipment].map(s => s.toLowerCase());
          
          if (allCapabilities.some(c => c.includes('medic') || c.includes('nurse') || c.includes('first aid'))) {
            assignedRole = "Medical Response Team";
          } else if (allCapabilities.some(c => c.includes('truck') || c.includes('van') || c.includes('transport'))) {
            assignedRole = "Logistics & Supply Chain";
          } else if (allCapabilities.some(c => c.includes('chainsaw') || c.includes('tools') || c.includes('shovels'))) {
            assignedRole = "Debris Clearance & Infrastructure";
          } else if (allCapabilities.some(c => c.includes('cook') || c.includes('food') || c.includes('water'))) {
            assignedRole = "Mass Care & Nutrition";
          }

          setIsRegistered(true);
          
          let aiResponseText = `Thank you, ${name}! I've officially assigned you to our **${assignedRole}** unit. `;
          
          if (skillsCount > 0) {
            aiResponseText += `I've noted your specific capabilities: ${[...extractedData.skills, ...extractedData.equipment].join(', ')}. `;
          }
          aiResponseText += "We will reach out the moment a task matches your profile.";

          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'system',
            content: aiResponseText
          }]);
        } else {
        // The AI successfully parsed the message but didn't find enough info yet
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'system',
          content: "I'm starting to build your profile, but I still need your name and a way to contact you (email or phone) to finish the registration. Could you provide those?"
          }]);
        }
      } else {
        // Fallback if the AI fails to parse the message entirely
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: "I had a little trouble processing that. Could you please clearly state your name, contact information, and what skills or equipment you have?"
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: "Oops! We encountered a network issue. Please try sending your message again."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(167,139,250,0.25)] border border-white/60 bg-white/40 backdrop-blur-xl">
      
      {/* Decorative Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-violet-200/40 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-orange-100/40 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      {/* Header */}
      <div className="px-6 py-4 bg-white/50 border-b border-white/50 backdrop-blur-md flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-violet-400 to-sky-300 text-white shadow-md">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Volunteer Intake</h2>
          <p className="text-sm text-slate-500 font-medium">AI Assistant is online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                msg.role === 'system' 
                  ? 'bg-gradient-to-tr from-violet-100 to-fuchsia-100 text-violet-600' 
                  : 'bg-gradient-to-tr from-emerald-100 to-sky-100 text-emerald-600'
              }`}>
                {msg.role === 'system' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'system'
                  ? 'bg-white/80 text-slate-700 rounded-2xl rounded-tl-sm border border-white/50'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl rounded-tr-sm'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-4 flex-row"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-violet-100 to-fuchsia-100 text-violet-600 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-5 py-4 bg-white/80 rounded-2xl rounded-tl-sm border border-white/50 shadow-sm flex items-center gap-1.5">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-violet-400 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-violet-400 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-violet-400 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/60 border-t border-white/50 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-white/80 text-slate-800 placeholder:text-slate-400 px-6 py-4 rounded-full border border-white/60 focus:outline-none focus:ring-4 focus:ring-violet-200/50 shadow-inner transition-all"
            disabled={isTyping || isRegistered}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping || isRegistered}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}