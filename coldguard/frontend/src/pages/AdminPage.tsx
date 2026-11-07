import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  PhoneCall,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  getUsersApi,
  createUserApi,
  deleteUserApi,
  getContactsApi,
  createContactApi,
  deleteContactApi,
  getSettingsApi,
  updateSettingApi,
} from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Role } from '../types';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'users' | 'contacts' | 'settings'>('users');

  // New user form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<Role>('STAFF');

  // New contact form state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTelegram, setContactTelegram] = useState('');
  const [contactLevel, setContactLevel] = useState<number>(1);

  // Settings editing state
  const [settingValues, setSettingValues] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Queries
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsersApi });
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: getContactsApi });
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const data = await getSettingsApi();
      const initial: Record<string, string> = {};
      data.forEach((s) => (initial[s.key] = s.value));
      setSettingValues(initial);
      return data;
    },
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddUserOpen(false);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const createContactMutation = useMutation({
    mutationFn: createContactApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsAddContactOpen(false);
      setContactName('');
      setContactRole('');
      setContactPhone('');
      setContactEmail('');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: deleteContactApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSettingApi(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          System Administration & Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage operator accounts, emergency escalation hierarchy, and runtime timing parameters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            tab === 'users'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Operators & Roles
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            tab === 'contacts'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" /> Escalation Hierarchy
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            tab === 'settings'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Thresholds & Timings
        </button>
      </div>

      {/* Tab 1: Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Users authenticated with bcrypt passwords & signed JWT tokens.
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsAddUserOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add User
            </Button>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'ADMIN' ? 'teal' : 'slate'}>{u.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.is_active ? 'green' : 'rose'}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          if (confirm(`Delete user ${u.name}?`)) {
                            deleteUserMutation.mutate(u.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 2: Contacts / Escalation Hierarchy */}
      {tab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Emergency personnel notified at Level 1, Level 2, and Level 3 escalations.
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsAddContactOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Emergency Contact
            </Button>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <Badge variant={c.escalation_level === 3 ? 'rose' : c.escalation_level === 2 ? 'amber' : 'teal'}>
                        Level {c.escalation_level}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="py-3 px-4">{c.role}</td>
                    <td className="py-3 px-4 font-mono">{c.phone || '-'}</td>
                    <td className="py-3 px-4">{c.email || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          if (confirm(`Remove contact ${c.name}?`)) {
                            deleteContactMutation.mutate(c.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 3: Runtime Settings */}
      {tab === 'settings' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Thresholds & Escalation Timing Parameters
              </h3>
              <p className="text-xs text-slate-500">
                These settings are saved directly in the SQLite database and take effect immediately.
              </p>
            </div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved Successfully
              </span>
            )}
          </div>

          <div className="space-y-4">
            {settings.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    {s.key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.description}</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settingValues[s.key] ?? s.value}
                    onChange={(e) =>
                      setSettingValues({ ...settingValues, [s.key]: e.target.value })
                    }
                    className="w-24 px-3 py-1.5 text-xs text-center font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSettingMutation.mutate({
                        key: s.key,
                        value: settingValues[s.key] ?? s.value,
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Create User Account">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createUserMutation.mutate({
              name: userName,
              email: userEmail,
              password: userPassword,
              role: userRole,
            });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Verma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@coldguard.local"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Role Permission</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as Role)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="STAFF">STAFF (View & Acknowledge)</option>
              <option value="MANAGER">MANAGER (Manage, Acknowledge, Reports)</option>
              <option value="MEDICAL_OFFICER">MEDICAL_OFFICER (Critical Recipient)</option>
              <option value="ADMIN">ADMIN (Full Access)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createUserMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        title="Add Escalation Recipient"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createContactMutation.mutate({
              name: contactName,
              role: contactRole,
              phone: contactPhone,
              email: contactEmail,
              telegram_chat_id: contactTelegram,
              escalation_level: contactLevel,
            });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">Contact Name</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Anita Sharma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Role / Job Title</label>
            <input
              type="text"
              required
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              placeholder="e.g. Chief Cold Chain Officer"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Escalation Tier</label>
            <select
              value={contactLevel}
              onChange={(e) => setContactLevel(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={1}>Level 1: Store Staff (Immediate on Trip)</option>
              <option value={2}>Level 2: Store Manager (10 min Unacknowledged)</option>
              <option value={3}>Level 3: Medical Officer (20 min or Critical)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91-9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="officer@hospital.org"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsAddContactOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createContactMutation.isPending}>
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

