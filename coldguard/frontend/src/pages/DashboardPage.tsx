import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Thermometer,
  AlertTriangle,
  Activity,
  HeartPulse,
  ArrowUpRight,
  CheckCircle,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getSummaryStatsApi,
  getUnitsApi,
  getActiveAlertsApi,
  getUnitAnalyticsApi,
  acknowledgeAlertApi,
} from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StorageUnit, Alert } from '../types';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [ackModalAlert, setAckModalAlert] = useState<Alert | null>(null);
  const [ackNote, setAckNote] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['summaryStats'],
    queryFn: getSummaryStatsApi,
    refetchInterval: 3000,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnitsApi,
    refetchInterval: 5000,
  });

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['activeAlerts'],
    queryFn: getActiveAlertsApi,
    refetchInterval: 3000,
  });

  const ackMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      acknowledgeAlertApi(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['summaryStats'] });
      setAckModalAlert(null);
      setAckNote('');
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Vaccine Cold-Chain Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time thermal monitoring, excursion alerts, and auto-escalation status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" className="px-3 py-1 text-xs">
            Simulation {stats?.simulation_speed || 1}x speed
          </Badge>
          {stats?.simulation_paused && (
            <Badge variant="amber" className="px-3 py-1 text-xs">
              Simulation Paused
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Monitored Units</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {stats?.total_units ?? units.length} Units
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5 font-medium">
              100% active telemetry
            </div>
          </div>
        </Card>

        <Card
          className={`p-5 flex items-center gap-4 ${
            (stats?.active_alerts ?? 0) > 0
              ? 'border-rose-400 dark:border-rose-800'
              : ''
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              (stats?.active_alerts ?? 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Alerts</div>
            <div
              className={`text-2xl font-bold mt-0.5 ${
                (stats?.active_alerts ?? 0) > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {stats?.active_alerts ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats?.critical_alerts ?? 0} Critical (Level 3)
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Excursion Units</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {stats?.units_in_excursion ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Outside safe boundary</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">System Health Score</div>
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-0.5">
              {stats?.system_health ?? 100}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Vaccine stock safety index</div>
          </div>
        </Card>
      </div>

      {/* Storage Units Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Storage Units Status
          </h2>
          <span className="text-xs text-slate-500">Refreshes automatically</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} activeAlerts={activeAlerts} />
          ))}
        </div>
      </div>

      {/* Active Escalation Alerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Active Alerts & Escalations
            </h2>
            {activeAlerts.length > 0 && (
              <Badge variant="rose">{activeAlerts.length} Unresolved</Badge>
            )}
          </div>
          <Link
            to="/alerts"
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            View Alert History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeAlerts.length === 0 ? (
          <Card className="p-8 text-center bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/30">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              All Units Normal
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No excursions or sensor dropouts detected. Temperatures are within safe WHO parameters.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="p-5 border-l-4 border-l-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Alert #{alert.id}
                    </span>
                    <Badge variant={alert.severity === 'CRITICAL' ? 'rose' : 'amber'}>
                      Level {alert.level}
                    </Badge>
                    <Badge variant="slate">{alert.type}</Badge>
                    {alert.probable_cause && (
                      <Badge variant="blue">Cause: {alert.probable_cause}</Badge>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {alert.message}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Opened: {new Date(alert.opened_at).toLocaleTimeString()}</span>
                    {alert.acknowledged_by ? (
                      <span className="text-teal-600 font-medium">
                        ✓ Acked by {alert.acknowledged_by}
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">Unacknowledged</span>
                    )}
                  </div>
                </div>

                {!alert.acknowledged_by && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setAckModalAlert(alert)}
                  >
                    Acknowledge Alert
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Acknowledge Modal */}
      <Modal
        isOpen={Boolean(ackModalAlert)}
        onClose={() => setAckModalAlert(null)}
        title={`Acknowledge Alert #${ackModalAlert?.id}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Acknowledging stops automated level escalations and reminders. The alert will
            automatically resolve when the temperature returns within the safe range.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corrective Action / Investigation Note (Optional)
            </label>
            <textarea
              rows={3}
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              placeholder="e.g. Door was left open during inventory audit; closed now."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
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
    </div>
  );
};

// Sub-component: Unit Card with live analytics
function UnitCard({ unit, activeAlerts }: { unit: StorageUnit; activeAlerts: Alert[] }) {
  const { data: analytics } = useQuery({
    queryKey: ['unitAnalytics', unit.id],
    queryFn: () => getUnitAnalyticsApi(unit.id),
    refetchInterval: 3000,
  });

  const hasAlert = activeAlerts.some((a) => a.unit_id === unit.id);
  const currentTemp = analytics?.current_temp;

  // Determine state color
  let statusBadgeVariant: 'green' | 'amber' | 'rose' | 'slate' = 'green';
  let glowStyle: 'none' | 'rose' | 'amber' = 'none';

  if (currentTemp === null || currentTemp === undefined) {
    statusBadgeVariant = 'slate';
  } else if (hasAlert) {
    statusBadgeVariant = 'rose';
    glowStyle = 'rose';
  } else if (currentTemp < unit.warn_low || currentTemp > unit.warn_high) {
    statusBadgeVariant = 'amber';
    glowStyle = 'amber';
  }

  return (
    <Card glow={glowStyle} className="p-6 flex flex-col justify-between hover:shadow-md transition-all">
      <div className="space-y-4">
        {/* Unit Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {unit.name}
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {unit.location || 'Cold-Room'} • {unit.sensor_id || 'Virtual Sensor'}
            </div>
          </div>
          <Badge variant={statusBadgeVariant}>
            {hasAlert ? 'ALERT ACTIVE' : currentTemp === null ? 'OFFLINE' : 'NORMAL'}
          </Badge>
        </div>

        {/* Big Temperature Display */}
        <div className="py-2">
          <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-baseline gap-2">
            {currentTemp !== null && currentTemp !== undefined ? `${currentTemp.toFixed(1)}°C` : 'Offline'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Safe Target: {unit.min_temp}°C to {unit.max_temp}°C
          </div>
        </div>

        {/* Analytics Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">MKT (24h)</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {analytics?.mkt_24h !== undefined ? `${analytics.mkt_24h}°C` : '-'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Health Score</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {analytics?.health_score ?? 100}%
            </span>
          </div>
        </div>

        {analytics?.minutes_to_limit && (
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Predicted limit cross in ~{analytics.minutes_to_limit} mins</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Min {analytics?.min_temp_24h ?? '-'}° / Max {analytics?.max_temp_24h ?? '-'}°
        </span>
        <Link
          to={`/units/${unit.id}`}
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
        >
          Inspect Chart <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}

