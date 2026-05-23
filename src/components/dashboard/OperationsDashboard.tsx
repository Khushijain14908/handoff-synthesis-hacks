import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Megaphone,
  HeartHandshake
} from 'lucide-react';

// --- Mock Data ---
const MOCK_INCIDENTS = [
  {
    id: 'inc-1',
    title: 'Downtown Flooding Support',
    description: 'Sandbag distribution and road clearing needed near Main Street.',
    urgency: 'high',
    status: 'active',
    volunteersDispatched: 12
  },
  {
    id: 'inc-2',
    title: 'Community Center Shelter Setup',
    description: 'Organizing cots and distributing hot meals to displaced families.',
    urgency: 'medium',
    status: 'active',
    volunteersDispatched: 5
  },
  {
    id: 'inc-3',
    title: 'Power Outage Wellness Checks',
    description: 'Door-to-door wellness checks for elderly residents in the North district.',
    urgency: 'low',
    status: 'monitoring',
    volunteersDispatched: 2
  }
];

const MOCK_VOLUNTEERS = [
  { id: 'v-1', name: 'Alex Chen', skills: ['First Aid', 'Vehicle'], time: '2 mins ago' },
  { id: 'v-2', name: 'Maria Garcia', skills: ['Translation', 'Logistics'], time: '5 mins ago' },
  { id: 'v-3', name: 'Sam Taylor', skills: ['Heavy Lifting', 'Chainsaw'], time: '12 mins ago' },
  { id: 'v-4', name: 'Jordan Smith', skills: ['Food Service', 'Organization'], time: '18 mins ago' },
  { id: 'v-5', name: 'Casey Washington', skills: ['Medical', 'Comms'], time: '24 mins ago' }
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function OperationsDashboard() {
  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] relative overflow-hidden font-sans p-4 md:p-8">
      {/* Soft Background Globs for Optimistic Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-[80px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-peach-100/40 bg-orange-100/40 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-sky-100/50 rounded-full blur-[80px] mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-violet-500" />
              Operations Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">
              Live coordination and community dispatch.
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white/80 backdrop-blur-md border border-white/60 shadow-sm px-6 py-3 rounded-full text-violet-600 font-semibold flex items-center gap-2 hover:bg-white transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            Generate Public Update
          </motion.button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Column: Active Incidents */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-800">Active Incidents</h2>
              <span className="bg-white/60 px-3 py-1 rounded-full text-sm font-semibold text-slate-600 border border-white/40 shadow-sm">
                3 Total
              </span>
            </div>

            <motion.div 
              variants={containerVariants} 
              initial="hidden" 
              animate="show"
              className="space-y-4"
            >
              {MOCK_INCIDENTS.map((incident) => (
                <motion.div 
                  key={incident.id}
                  variants={itemVariants}
                  className="group bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getUrgencyStyles(incident.urgency)}`}>
                          {incident.urgency} Priority
                        </span>
                        <span className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                          {incident.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{incident.title}</h3>
                      <p className="text-slate-600 mb-4">{incident.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-xl border border-white/40">
                          <Users className="w-4 h-4 text-violet-500" />
                          {incident.volunteersDispatched} volunteers dispatched
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-xl border border-white/40">
                          <MapPin className="w-4 h-4 text-sky-500" />
                          Local District
                        </div>
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="shrink-0 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-200 transition-colors shadow-sm"
                    >
                      <HeartHandshake className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar: Volunteer Dispatch Queue */}
          <div className="xl:col-span-1">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 lg:p-8 shadow-[0_20px_50px_-12px_rgba(167,139,250,0.15)] sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Dispatch Queue</h2>
                  <p className="text-sm text-slate-500 font-medium">Pending AI Matches</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {MOCK_VOLUNTEERS.map((volunteer) => (
                  <motion.div 
                    key={volunteer.id}
                    variants={itemVariants}
                    className="bg-white/70 border border-white/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    {/* Avatar Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-200 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner shrink-0">
                      {volunteer.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-semibold text-slate-800 truncate">{volunteer.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {volunteer.time}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {volunteer.skills.map(skill => (
                          <span key={skill} className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-[0_8px_20px_rgb(167,139,250,0.4)] flex items-center justify-center gap-2 border border-white/20"
              >
                <CheckCircle2 className="w-5 h-5" />
                Auto-Match All
              </motion.button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}