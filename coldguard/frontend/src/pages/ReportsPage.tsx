import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, FileText, Table } from 'lucide-react';
import { getUnitsApi, API_BASE_URL } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ReportsPage: React.FC = () => {
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const [downloadError, setDownloadError] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnitsApi,
  });

  const handleDownloadPdf = async () => {
    setDownloadError('');
    setIsDownloading(true);
    const token = localStorage.getItem('coldguard_token');
    const unitParam = selectedUnit ? `&unit_id=${selectedUnit}` : '';
    const url = `${API_BASE_URL}/api/reports/daily.pdf?report_date=${reportDate}${unitParam}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorText.detail || `Server returned error ${res.status}`);
      }

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `coldguard-report-${reportDate}.pdf`;
      link.click();
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download PDF report');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadReadingsCsv = async () => {
    setDownloadError('');
    const token = localStorage.getItem('coldguard_token');
    const unitParam = selectedUnit ? `?unit_id=${selectedUnit}` : '';
    const url = `${API_BASE_URL}/api/reports/readings.csv${unitParam}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `readings-export-${reportDate}.csv`;
      link.click();
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download readings CSV');
    }
  };

  const handleDownloadAlertsCsv = async () => {
    setDownloadError('');
    const token = localStorage.getItem('coldguard_token');
    const url = `${API_BASE_URL}/api/reports/alerts.csv`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `alerts-export-${reportDate}.csv`;
      link.click();
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download alerts CSV');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Compliance & Regulatory Reports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Export verified temperature records, Mean Kinetic Temperature assessments, and WHO-compliant PDF logbooks
        </p>
      </div>

      {downloadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{downloadError}</span>
          <button
            onClick={() => setDownloadError('')}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Daily Report Card */}
        <Card className="p-6 md:col-span-2 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Official Daily PDF Logbook
              </h3>
              <p className="text-xs text-slate-500">
                Includes MKT calculations, excursions, corrective action notes, and physical signature lines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Report Date
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Filter by Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Storage Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleDownloadPdf}
              isLoading={isDownloading}
              className="w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 mr-1.5" /> Download Daily Report (PDF)
            </Button>
          </div>
        </Card>

        {/* CSV Data Exports */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Table className="w-4 h-4 text-sky-500" />
              <span>Readings Raw Data</span>
            </div>
            <p className="text-xs text-slate-500">
              Full timestamped temperature logs for external audits and calibration analysis.
            </p>
            <Button variant="outline" size="sm" onClick={handleDownloadReadingsCsv} className="w-full">
              <FileDown className="w-3.5 h-3.5 mr-1" /> Export Readings (CSV)
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Table className="w-4 h-4 text-rose-500" />
              <span>Excursion Incidents</span>
            </div>
            <p className="text-xs text-slate-500">
              All triggered alert events, escalation levels, and recorded staff acknowledgements.
            </p>
            <Button variant="outline" size="sm" onClick={handleDownloadAlertsCsv} className="w-full">
              <FileDown className="w-3.5 h-3.5 mr-1" /> Export Incidents (CSV)
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

