import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  ChevronRight,
  Filter,
  Search,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { getAlertsApi, getActiveAlertsApi, acknowledgeAlertApi } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../types';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [ackModalAlert, setAckModalAlert] = useState<Alert | null>(null);
  const [ackNote, setAckNote] = useState('');
  const [selectedHistoryAlert, setSelectedHistoryAlert] = useState<Alert | null>(null);

  // Filters for History
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['activeAlerts'],
    queryFn: getActiveAlertsApi,
    refetchInterval: 3000,
  });

  const { data: historyAlerts = [] } = useQuery({
    queryKey: ['alertsHistory', statusFilter],
    queryFn: () => getAlertsApi({ status: statusFilter || undefined }),
    refetchInterval: 5000,
  });

  const ackMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      acknowledgeAlertApi(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertsHistory'] });
      setAckModalAlert(null);
      setAckNote('');
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Cold-Chain Alerts & Escalation Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Autonomous multi-tier alert engine with audit-verified acknowledgement tracking
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              tab === 'active'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>Active Incidents</span>
            {activeAlerts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'history'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Alert History & Logs
          </button>
        </div>
      </div>

      {tab === 'active' ? (
        /* Active Incidents Tab with Visual Escalation Steppers */
        <div className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card className="p-12 text-center bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/30">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Zero Active Excursions
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All storage units are operating normally within specified safe ranges. Escalation
                agents are standing by.
              </p>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <ActiveAlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => setAckModalAlert(alert)}
              />
            ))
          )}
        </div>
      ) : (
        /* Alert History Tab */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search alert message, cause, or unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="ESCALATED_L2">ESCALATED L2</option>
              <option value="ESCALATED_L3">ESCALATED L3</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Peak Level</th>
                    <th className="py-3 px-4">Opened At</th>
                    <th className="py-3 px-4">Resolved At</th>
                    <th className="py-3 px-4">Acked By</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyAlerts
                    .filter((a) =>
                      search
                        ? a.message.toLowerCase().includes(search.toLowerCase()) ||
                          a.probable_cause.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          #{a.id}
                        </td>
                        <td className="py-3 px-4">Unit #{a.unit_id}</td>
                        <td className="py-3 px-4">{a.type}</td>
                        <td className="py-3 px-4">
                          <Badge variant={a.severity === 'CRITICAL' ? 'rose' : 'amber'}>
                            {a.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              a.status === 'RESOLVED'
                                ? 'green'
                                : a.status === 'ACKNOWLEDGED'
                                ? 'teal'
                                : 'rose'
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold">Level {a.level}</td>
                        <td className="py-3 px-4">{new Date(a.opened_at).toLocaleTimeString()}</td>
                        <td className="py-3 px-4">
                          {a.resolved_at ? new Date(a.resolved_at).toLocaleTimeString() : 'Ongoing'}
                        </td>
                        <td className="py-3 px-4 text-teal-600 font-medium">
                          {a.acknowledged_by || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedHistoryAlert(a)}
                            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Acknowledge Modal */}
      <Modal
        isOpen={Boolean(ackModalAlert)}
        onClose={() => setAckModalAlert(null)}
        title={`Acknowledge Alert #${ackModalAlert?.id}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Acknowledging this incident will immediately freeze the escalation sequence and stop
            automated alerts to higher-tier officers.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corrective Action Note (Optional)
            </label>
            <textarea
              rows={3}
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              placeholder="e.g. Switched to backup generator; temperature stabilizing."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAckModalAlert(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={ackMutation.isPending}
              onClick={() => {
                if (ackModalAlert) {
                  ackMutation.mutate({ id: ackModalAlert.id, note: ackNote });
                }
              }}
            >
              Confirm Acknowledge
            </Button>
          </div>
        </div>
      </Modal>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={Boolean(selectedHistoryAlert)}
        onClose={() => setSelectedHistoryAlert(null)}
        title={`Alert #${selectedHistoryAlert?.id} Timeline & Diagnostics`}
      >
        {selectedHistoryAlert && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {selectedHistoryAlert.message}
              </div>
              <div className="text-slate-500">
                Storage Unit #{selectedHistoryAlert.unit_id} • Type: {selectedHistoryAlert.type}
              </div>
              {selectedHistoryAlert.probable_cause && (
                <div className="text-teal-600 font-semibold pt-1">
                  Probable Cause: {selectedHistoryAlert.probable_cause}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Incident Details
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Peak Level</span>
                  <span className="font-bold">Level {selectedHistoryAlert.level}</span>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Current Status</span>
                  <span className="font-bold">{selectedHistoryAlert.status}</span>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Opened At</span>
                  <span>{new Date(selectedHistoryAlert.opened_at).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Acknowledged By</span>
                  <span className="font-bold text-teal-600">
                    {selectedHistoryAlert.acknowledged_by || 'Unacknowledged'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="outline" onClick={() => setSelectedHistoryAlert(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Subcomponent: Active Alert Card with live visual Escalation Stepper
function ActiveAlertCard({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: () => void }) {
  const steps = [
    { level: 1, title: 'Level 1: Store Staff', desc: 'Notified on trip' },
    { level: 2, title: 'Level 2: Store Manager', desc: '10 min unacknowledged' },
    { level: 3, title: 'Level 3: Medical Officer', desc: '20 min or Critical' },
  ];

  return (
    <Card className="p-6 border-l-4 border-l-rose-500 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Alert #{alert.id}
            </span>
            <Badge variant={alert.severity === 'CRITICAL' ? 'rose' : 'amber'}>
              {alert.severity}
            </Badge>
            <Badge variant="slate">{alert.type}</Badge>
            {alert.probable_cause && (
              <Badge variant="blue">Cause: {alert.probable_cause}</Badge>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {alert.message}
          </h3>
          <p className="text-xs text-slate-500">
            Unit #{alert.unit_id} • Opened at {new Date(alert.opened_at).toLocaleTimeString()}
          </p>
        </div>

        {alert.status !== 'ACKNOWLEDGED' && alert.status !== 'RESOLVED' ? (
          <Button variant="primary" onClick={onAcknowledge} className="shrink-0">
            <UserCheck className="w-4 h-4 mr-1.5" /> Acknowledge Alert
          </Button>
        ) : (
          <Badge variant="teal" className="px-3 py-1 text-xs font-semibold">
            ✓ Acknowledged by {alert.acknowledged_by}
          </Badge>
        )}
      </div>

      {/* Visual Escalation Stepper */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Escalation Progress
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((s) => {
            const isPassed = alert.level >= s.level;
            const isCurrent = alert.level === s.level;
            return (
              <div
                key={s.level}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 shadow-xs'
                    : isPassed
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10 text-slate-700 dark:text-slate-300'
                    : 'border-slate-200 dark:border-slate-800 opacity-40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{s.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                    L{s.level}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

