import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Thermometer,
  AlertTriangle,
  Bell,
  FileText,
  ShieldCheck,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/units', label: 'Storage Units', icon: Thermometer },
    { to: '/alerts', label: 'Alerts & Escalation', icon: AlertTriangle },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/reports', label: 'Daily Reports', icon: FileText },
    { to: '/audit', label: 'Audit Log', icon: ShieldCheck },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ to: '/admin', label: 'Admin Settings', icon: SettingsIcon });
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between py-6 px-4 transition-colors shrink-0">
      <div className="space-y-1">
        <div className="px-3 mb-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Monitoring Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Vaccine Store Cold-Chain Rule Tag */}
      <div className="p-3.5 rounded-xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-300">
        <div className="font-semibold flex items-center gap-1.5 mb-1">
          <span>❄️ Safe Range Standard</span>
        </div>
        <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80 leading-relaxed">
          Fridge: 2.0°C – 8.0°C<br />
          5-minute excursion buffer<br />
          Auto-escalation L1 → L2 → L3
        </p>
      </div>
    </aside>
  );
};

