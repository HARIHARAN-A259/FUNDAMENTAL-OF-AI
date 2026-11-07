import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  Clock,
  Thermometer,
  Zap,
  Activity,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getUnitApi, getUnitAnalyticsApi, getUnitReadingsApi } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const UnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const unitId = Number(id);
  const [hours, setHours] = useState<number>(24);

  const { data: unit } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => getUnitApi(unitId),
  });

  const { data: analytics } = useQuery({
    queryKey: ['unitAnalytics', unitId],
    queryFn: () => getUnitAnalyticsApi(unitId),
    refetchInterval: 3000,
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['unitReadings', unitId, hours],
    queryFn: () => getUnitReadingsApi(unitId, hours),
    refetchInterval: 3000,
  });

  if (!unit) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading storage unit telemetry...
      </div>
    );
  }

  // Format readings chronologically for Recharts
  const chartData = [...readings].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: r.temperature,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {unit.name}
              </h1>
              <Badge variant={unit.type === 'FREEZER' ? 'blue' : 'teal'}>
                {unit.type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sensor ID: {unit.sensor_id || 'Virtual'} • Location: {unit.location || 'Cold-Bay'}
            </p>
          </div>
        </div>

        {/* Time-Range Toggles */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[1, 6, 24].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                hours === h
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Last {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Analytics & Predictive Diagnostic Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Current Temp</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {analytics?.current_temp !== null && analytics?.current_temp !== undefined
              ? `${analytics.current_temp.toFixed(1)}°C`
              : '-'}
          </div>
          <div className="text-[11px] text-teal-600 mt-0.5">
            Safe: {unit.min_temp}°C - {unit.max_temp}°C
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">MKT (24h)</div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {analytics?.mkt_24h ?? '-'}°C
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mean Kinetic Temp</div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">24h Min / Max</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {analytics?.min_temp_24h ?? '-'}° / {analytics?.max_temp_24h ?? '-'}°
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Avg: {analytics?.avg_temp_24h ?? '-'}°C
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Health Score</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {analytics?.health_score ?? 100}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">In-spec ratio</div>
        </Card>
      </div>

      {/* Smart Predictive Warning & Rate of Change Cause */}
      {(analytics?.minutes_to_limit || analytics?.probable_cause) && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              {analytics?.probable_cause && (
                <span className="font-bold uppercase tracking-wide mr-2">
                  Probable Cause: {analytics.probable_cause}
                </span>
              )}
              {analytics?.minutes_to_limit && (
                <span>Linear trend estimates boundary cross in ~{analytics.minutes_to_limit} minutes.</span>
              )}
            </div>
          </div>
          <Badge variant="amber">Predictive Early Warning</Badge>
        </div>
      )}

      {/* Live Temperature Recharts Visualizer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Live Temperature Trend Line
            </h3>
            <p className="text-xs text-slate-500">
              Shaded band denotes optimal vaccine safe storage zone ({unit.min_temp}°C to {unit.max_temp}°C)
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Awaiting temperature readings from sensor...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                {/* Safe Range Shaded Area */}
                <ReferenceArea
                  y1={unit.min_temp}
                  y2={unit.max_temp}
                  fill="#0d9488"
                  fillOpacity={0.08}
                />
                {/* Warning & Critical Reference Lines */}
                <ReferenceLine
                  y={unit.warn_high}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'Warn High', fill: '#f59e0b', fontSize: 10 }}
                />
                <ReferenceLine
                  y={unit.warn_low}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'Warn Low', fill: '#f59e0b', fontSize: 10 }}
                />
                <ReferenceLine
                  y={unit.critical_max}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  label={{ value: 'Critical High', fill: '#e11d48', fontSize: 10 }}
                />
                <ReferenceLine
                  y={unit.critical_min}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  label={{ value: 'Critical Low', fill: '#e11d48', fontSize: 10 }}
                />

                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  domain={[
                    Math.floor(Math.min(unit.critical_min - 2, ...chartData.map((d) => d.temperature))),
                    Math.ceil(Math.max(unit.critical_max + 2, ...chartData.map((d) => d.temperature))),
                  ]}
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  unit="°C"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Recent Telemetry Readings Table */}
      <Card className="p-6">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-3">
          Telemetry Readings History ({readings.length} records)
        </h3>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Reading ID</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Temperature</th>
                <th className="py-2.5 px-4">Boundary Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {readings.slice(0, 30).map((r) => {
                const inSafe = r.temperature >= unit.min_temp && r.temperature <= unit.max_temp;
                const isCrit = r.temperature < unit.critical_min || r.temperature > unit.critical_max;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 font-mono text-[11px]">#{r.id}</td>
                    <td className="py-2 px-4">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {r.temperature.toFixed(2)} °C
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant={isCrit ? 'rose' : inSafe ? 'green' : 'amber'}>
                        {isCrit ? 'CRITICAL EXCURSION' : inSafe ? 'OPTIMAL' : 'WARNING EXCURSION'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

