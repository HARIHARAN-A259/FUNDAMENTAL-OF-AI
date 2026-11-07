import React from 'react';
import { Bell, Moon, Sun, Volume2, VolumeX, LogOut, Radio } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';

interface NavbarProps {
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSimulator }) => {
  const { user, logout, theme, toggleTheme, isMuted, toggleMute } = useAuthStore();
  const { isConnected } = useWebSocket();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-400/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
            ❄️
          </div>
          <span>ColdGuard</span>
        </div>

        {/* Live WS indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-600 dark:text-slate-400">
            {isConnected ? 'Live Telemetry' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Simulator floating trigger button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
        >
          <Radio className="w-3.5 h-3.5 animate-spin" />
          <span>Simulation Controls</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Alarms' : 'Mute Alarms'}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {user.name}
              </div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium tracking-wide">
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

