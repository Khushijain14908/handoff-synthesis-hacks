import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, ShieldAlert, MessageSquare } from 'lucide-react';

// Import our components
import VolunteerChat from './components/intake/VolunteerChat';
import OperationsDashboard from './components/dashboard/OperationsDashboard';
import IncidentAssistant from './components/dashboard/IncidentAssistant';

type ViewState = 'dashboard' | 'intake';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 font-sans selection:bg-violet-200">
      
      {/* Global Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo area */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
                Community Response OS
              </span>
            </div>

            {/* View Switcher Controls */}
            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  currentView === 'dashboard' ? 'text-violet-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {currentView === 'dashboard' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Operations
                </span>
              </button>

              <button
                onClick={() => setCurrentView('intake')}
                className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  currentView === 'intake' ? 'text-violet-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {currentView === 'intake' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  AI Intake
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Smooth Crossfading */}
      <main className="w-full h-[calc(100vh-4rem)] relative">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <OperationsDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="intake"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center p-4 md:p-8"
            >
              <VolunteerChat />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Coordinator Assistant (Only shows on Dashboard) */}
        <AnimatePresence>
          {currentView === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <IncidentAssistant />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}