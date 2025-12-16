import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SimulationResult } from '../types';

interface MetricsPanelProps {
  results: SimulationResult;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ results }) => {
  const data = results.stats.map(s => ({
    name: s.processId,
    Waiting: s.waitingTime,
    Turnaround: s.turnaroundTime,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Avg Waiting Time</p>
            <p className="text-2xl font-bold text-primary mt-1">{results.averageWaitingTime.toFixed(2)} <span className="text-xs text-slate-500">ms</span></p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Avg Turnaround Time</p>
            <p className="text-2xl font-bold text-secondary mt-1">{results.averageTurnaroundTime.toFixed(2)} <span className="text-xs text-slate-500">ms</span></p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm col-span-2">
            <p className="text-slate-400 text-sm font-medium">CPU Utilization</p>
            <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full"
                        style={{ width: `${results.cpuUtilization}%` }}
                    ></div>
                </div>
                <span className="text-lg font-bold text-white">{results.cpuUtilization.toFixed(1)}%</span>
            </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm h-64">
        <h4 className="text-sm font-medium text-slate-400 mb-4">Process Comparison</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
            <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="Waiting" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Waiting Time" />
            <Bar dataKey="Turnaround" fill="#10b981" radius={[4, 4, 0, 0]} name="Turnaround Time" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsPanel;