import { useState, useEffect } from 'react';
import { subscribeToCBTStore, getStoredExams, getStoredSubmissions, getRealtimeActivities } from '@/lib/cbt-store';
import { Wifi, Activity, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function RealTimeSyncStatus({ title = "Tare Pet CBT & LMS Real-Time Engine" }: { title?: string }) {
  const [examCount, setExamCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  const refreshSync = () => {
    const exams = getStoredExams();
    const subs = getStoredSubmissions();
    const acts = getRealtimeActivities();

    setExamCount(exams.length);
    setActiveCount(exams.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED').length);
    setSubmissionCount(subs.length);

    if (acts.length > 0) {
      setLastActivity(`${acts[0].title} — ${new Date(acts[0].timestamp).toLocaleTimeString()}`);
    }

    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1200);
  };

  useEffect(() => {
    refreshSync();
    const unsub = subscribeToCBTStore(refreshSync);
    return () => unsub();
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 shadow-lg border border-emerald-500/30 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
      <div className="flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 relative">
          <Wifi className={`w-5 h-5 ${isPulsing ? 'animate-bounce' : ''}`} />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm sm:text-base leading-tight">{title}</h4>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Real-time Live
            </span>
          </div>
          {lastActivity && (
            <p className="text-emerald-200/80 text-xs font-mono truncate max-w-md mt-0.5">
              Latest Event: {lastActivity}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs z-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-center">
          <span className="text-emerald-400 font-bold text-sm block leading-none">{activeCount}</span>
          <span className="text-slate-300 text-[11px]">Active CBT Exams</span>
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-center">
          <span className="text-teal-400 font-bold text-sm block leading-none">{submissionCount}</span>
          <span className="text-slate-300 text-[11px]">LMS Submissions</span>
        </div>
        <button 
          onClick={refreshSync}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-2 rounded-xl transition-all shadow-md flex items-center gap-1"
          title="Manual Force Sync"
        >
          <RefreshCw className={`w-4 h-4 ${isPulsing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_50%_0px,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
    </div>
  );
}
