import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  DoorOpen,
  ZapOff,
  WifiOff,
  ThermometerSnowflake,
  CheckCircle2,
} from 'lucide-react';
import {
  getUnitsApi,
  getSimulatorStateApi,
  injectSimulatorFaultApi,
  setSimulatorSpeedApi,
  pauseSimulatorApi,
  resumeSimulatorApi,
  resetSimulatorApi,
} from '../../api/client';
import { Button } from '../ui/Button';

interface SimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnitsApi,
  });

  const { data: simState } = useQuery({
    queryKey: ['simulatorState'],
    queryFn: getSimulatorStateApi,
    refetchInterval: 2000,
  });

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const injectMutation = useMutation({
    mutationFn: ({ unitId, scenario }: { unitId: number; scenario: string }) =>
      injectSimulatorFaultApi(unitId, scenario),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['simulatorState'] });
      queryClient.invalidateQueries({ queryKey: ['summaryStats'] });
      showFeedback(`Injected "${vars.scenario}" into unit #${vars.unitId}`);
    },
  });

  const speedMutation = useMutation({
    mutationFn: (speed: number) => setSimulatorSpeedApi(speed),
    onSuccess: (_, speed) => {
      queryClient.invalidateQueries({ queryKey: ['simulatorState'] });
      showFeedback(`Simulation speed set to ${speed}x`);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => (simState?.paused ? resumeSimulatorApi() : pauseSimulatorApi()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulatorState'] });
      showFeedback(simState?.paused ? 'Simulation resumed' : 'Simulation paused');
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetSimulatorApi,
    onSuccess: () => {
      queryClient.invalidateQueries();
      showFeedback('All simulators reset to normal');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Simulation Panel
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inject test faults and adjust clock rate
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Target Unit Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Storage Unit to Inject
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.id} - {u.name} ({u.min_temp}°C to {u.max_temp}°C)
                </option>
              ))}
            </select>
          </div>

          {/* Fault Scenario Injections */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Inject Fault Scenarios
            </div>

            <button
              onClick={() => injectMutation.mutate({ unitId: selectedUnitId, scenario: 'door_open' })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Door Open (Brief Spike)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Spikes temp for ~3-4 mins, then auto-closes. No alert!
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => injectMutation.mutate({ unitId: selectedUnitId, scenario: 'power_failure' })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                  <ZapOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Power Failure (Steady Rise)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Rises ~0.1°C/min. Escalates L1 → L2 → L3!
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => injectMutation.mutate({ unitId: selectedUnitId, scenario: 'sensor_offline' })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Sensor Offline
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Cuts sensor data. Triggers Offline alert after 10 mins.
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => injectMutation.mutate({ unitId: selectedUnitId, scenario: 'freezer_warming' })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
                  <ThermometerSnowflake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Freezer Warming
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Slow warming inside mRNA ultra-low freezer.
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => injectMutation.mutate({ unitId: selectedUnitId, scenario: 'recover' })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Recover to Normal
                  </div>
                  <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    Cool back into safe range (auto-resolves alerts).
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Speed & Pause Controls */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Simulation Speed ({simState?.speed || 1}x)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                1 tick = 1 sim min
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={simState?.speed || 1}
              onChange={(e) => speedMutation.mutate(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex gap-2">
              <Button
                variant={simState?.paused ? 'primary' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => pauseMutation.mutate()}
              >
                {simState?.paused ? (
                  <>
                    <Play className="w-3.5 h-3.5" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={() => {
                  if (confirm('Reset all units and clear demo state?')) {
                    resetMutation.mutate();
                  }
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

