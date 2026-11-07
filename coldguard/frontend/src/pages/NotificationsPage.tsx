import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Terminal, Send, Mail, Search, CheckCircle2, XCircle } from 'lucide-react';
import { getNotificationsApi } from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const NotificationsPage: React.FC = () => {
  const [channelFilter, setChannelFilter] = useState<string>('');

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', channelFilter],
    queryFn: () => getNotificationsApi({ channel: channelFilter || undefined }),
    refetchInterval: 4000,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Multi-Channel Notification Dispatch
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time delivery log across Console, Telegram Bot, and SMTP Email channels
          </p>
        </div>

        {/* Channel Filter */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500 self-start"
        >
          <option value="">All Channels</option>
          <option value="CONSOLE">Console (Always Active)</option>
          <option value="TELEGRAM">Telegram Bot</option>
          <option value="EMAIL">SMTP Email</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Message Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No dispatch records found.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      L{n.level}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        {n.channel === 'TELEGRAM' ? (
                          <Send className="w-3.5 h-3.5 text-sky-500" />
                        ) : n.channel === 'EMAIL' ? (
                          <Mail className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Terminal className="w-3.5 h-3.5 text-teal-600" />
                        )}
                        <span>{n.channel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {n.recipient}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={n.status === 'SENT' ? 'green' : 'rose'}>
                        {n.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 max-w-md truncate text-slate-700 dark:text-slate-300">
                      {n.message}
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

