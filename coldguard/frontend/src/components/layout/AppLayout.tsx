import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { SimulationDrawer } from '../simulator/SimulationDrawer';

export const AppLayout: React.FC = () => {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar onOpenSimulator={() => setIsSimulatorOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <SimulationDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};

