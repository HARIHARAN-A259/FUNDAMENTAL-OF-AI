import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Zap,
  Clock,
  FileCheck2,
  BellRing,
  Activity,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold text-2xl text-teal-600 dark:text-teal-400">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-xl">
            ❄️
          </div>
          <span>ColdGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="primary">
              Live Monitor <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 text-center lg:pt-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
          Autonomous Vaccine Cold-Chain Protection
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligent Cold-Chain Monitoring &{' '}
          <span className="text-teal-600 dark:text-teal-400">Automated Escalation</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Zero vaccine wastage. Guard critical vaccines and biologics with real-time temperature
          tracking, rate-of-change predictive diagnostics, and multi-tier emergency escalation.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/dashboard">
            <Button size="lg" className="px-8 shadow-teal-500/25 shadow-lg">
              Launch Live Dashboard
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Explore Demo Logins
            </Button>
          </Link>
        </div>

        {/* Live Graphic Mockup */}
        <div className="mt-16 max-w-5xl mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-xs font-medium text-slate-500">Fridge A (Vaccine Main)</div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                4.2 °C
              </div>
              <div className="text-xs text-emerald-600/90 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal (2.0°C - 8.0°C)
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-xs font-medium text-slate-500">Fridge B (Emergency Bay)</div>
              <div className="text-3xl font-extrabold text-amber-500 mt-2">7.6 °C</div>
              <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Warning Zone (Buffer active)
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-xs font-medium text-slate-500">Ultra-Low Freezer C (mRNA)</div>
              <div className="text-3xl font-extrabold text-sky-500 mt-2">-28.4 °C</div>
              <div className="text-xs text-sky-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal (-50°C - -15°C)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Standard Matrix */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          WHO / Gavi Standard Cold-Chain Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-4" />
            <h3 className="font-semibold text-base mb-2">2°C – 8°C Safe Band</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard vaccine storage range with warning thresholds at 2.5°C & 7.5°C, critical at &lt;0°C or &gt;10°C.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <Clock className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="font-semibold text-base mb-2">5-Min Door Excursion Filter</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Prevents false alarms during normal stock retrieval. Excursions only alert if prolonged past 5 minutes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <BellRing className="w-8 h-8 text-rose-500 mb-4" />
            <h3 className="font-semibold text-base mb-2">3-Tier Auto-Escalation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Level 1: Store Staff → Level 2: Store Manager (10 min) → Level 3: Medical Officer (20 min or Critical).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <FileCheck2 className="w-8 h-8 text-sky-500 mb-4" />
            <h3 className="font-semibold text-base mb-2">Compliance & MKT Reports</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mean Kinetic Temperature (MKT) calculations, immutable audit trail, and printable daily PDF logbooks.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        ColdGuard – Vaccine Cold-Chain Monitoring and Escalation Agent • Built with FastAPI & React
      </footer>
    </div>
  );
};

