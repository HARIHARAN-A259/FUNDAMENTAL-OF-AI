import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Thermometer,
  Plus,
  ArrowUpRight,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { getUnitsApi, createUnitApi, deleteUnitApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StorageUnit } from '../types';

export const UnitsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'FRIDGE' | 'FREEZER'>('FRIDGE');
  const [location, setLocation] = useState('');
  const [sensorId, setSensorId] = useState('');
  const [minTemp, setMinTemp] = useState('2.0');
  const [maxTemp, setMaxTemp] = useState('8.0');

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnitsApi,
  });

  const createMutation = useMutation({
    mutationFn: createUnitApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsAddOpen(false);
      setName('');
      setLocation('');
      setSensorId('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnitApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      type,
      location,
      sensor_id: sensorId || `SENSOR-${Date.now()}`,
      min_temp: Number(minTemp),
      max_temp: Number(maxTemp),
      warn_low: Number(minTemp) + 0.5,
      warn_high: Number(maxTemp) - 0.5,
      critical_min: Number(minTemp) - 2.0,
      critical_max: Number(maxTemp) + 2.0,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Storage Units & Sensor Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configured vaccine refrigerators, ultra-cold mRNA freezers, and telemetry bindings
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Storage Unit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <Card key={unit.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {unit.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Sensor: {unit.sensor_id || 'Virtual'}
                  </div>
                </div>
                <Badge variant={unit.type === 'FREEZER' ? 'blue' : 'teal'}>
                  {unit.type}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold">{unit.location || 'General Bay'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Safe Temperature:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {unit.min_temp}°C to {unit.max_temp}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Warning Margins:</span>
                  <span>{unit.warn_low}°C / {unit.warn_high}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Critical Limits:</span>
                  <span className="text-rose-500 font-semibold">
                    &lt;{unit.critical_min}°C or &gt;{unit.critical_max}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link
                to={`/units/${unit.id}`}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                Inspect Telemetry <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    if (confirm(`Remove ${unit.name}?`)) {
                      deleteMutation.mutate(unit.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Unit Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Storage Unit">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Unit Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fridge C (Pediatric Stock)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Unit Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as 'FRIDGE' | 'FREEZER';
                  setType(t);
                  if (t === 'FREEZER') {
                    setMinTemp('-50.0');
                    setMaxTemp('-15.0');
                  } else {
                    setMinTemp('2.0');
                    setMaxTemp('8.0');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="FRIDGE">FRIDGE (2°C to 8°C)</option>
                <option value="FREEZER">FREEZER (-50°C to -15°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Location Bay</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room 103"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Sensor Hardware ID (ESP32 / MQTT)</label>
            <input
              type="text"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              placeholder="e.g. ESP32-BAY-03"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Min Safe Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Max Safe Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Create Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

