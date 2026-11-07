import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, FileDown } from 'lucide-react';
import { getAuditLogApi } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const AuditLogPage: React.FC = () => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');

  const { data: events = [] } = useQuery({
    queryKey: ['auditLog', eventTypeFilter],
    queryFn: () => getAuditLogApi({ event_type: eventTypeFilter || undefined }),
    refetchInterval: 5000,
  });

  const exportAuditCsv = () => {
    if (!events.length) return;
    const headers = ['ID', 'Alert ID', 'Event Type', 'Details', 'Timestamp'];
    const rows = events.map((e) => [
      e.id,
      e.alert_id,
      e.event_type,
      `"${e.details.replace(/"/g, '""')}"`,
      e.timestamp,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `coldguard-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            System Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable chronological record of alert transitions, acknowledgements, and officer escalations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Event Types</option>
            <option value="OPENED">OPENED</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="REMINDER">REMINDER</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <Button variant="outline" size="sm" onClick={exportAuditCsv}>
            <FileDown className="w-3.5 h-3.5 mr-1" /> Export Audit CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Alert Ref</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Audit Details & Action Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      #{e.id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono">Alert #{e.alert_id}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          e.event_type === 'OPENED'
                            ? 'amber'
                            : e.event_type === 'ESCALATED'
                            ? 'rose'
                            : e.event_type === 'ACKNOWLEDGED'
                            ? 'teal'
                            : e.event_type === 'RESOLVED'
                            ? 'green'
                            : 'slate'
                        }
                      >
                        {e.event_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {e.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

