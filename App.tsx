import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  RotateCcw, 
  BrainCircuit, 
  Cpu, 
  BarChart3,
  Sparkles,
  Zap,
  Layers,
  Timer,
  ArrowRight
} from 'lucide-react';
import { AlgorithmType, Process, SimulationResult } from './types';
import { runScheduler, generateColor } from './services/scheduler';
import { analyzeSimulation, generateScenarios } from './services/geminiService';
import GanttChart from './components/GanttChart';
import MetricsPanel from './components/MetricsPanel';

const INITIAL_PROCESSES: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 1, color: generateColor(0) },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 2, color: generateColor(1) },
  { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 3, color: generateColor(2) },
];

const PRESET_SCENARIOS = [
  {
    name: "Convoy Effect",
    description: "Long process delaying short ones",
    algorithm: AlgorithmType.FCFS,
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 30, priority: 1 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 1 },
      { id: 'P4', arrivalTime: 3, burstTime: 2, priority: 1 },
    ]
  },
  {
    name: "SJF Optimal",
    description: "Minimizes waiting time",
    algorithm: AlgorithmType.SJF,
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 10, priority: 1 },
      { id: 'P2', arrivalTime: 2, burstTime: 2, priority: 1 },
      { id: 'P3', arrivalTime: 3, burstTime: 1, priority: 1 },
      { id: 'P4', arrivalTime: 4, burstTime: 4, priority: 1 },
    ]
  },
  {
    name: "Round Robin Fairness",
    description: "Time sharing for equal bursts",
    algorithm: AlgorithmType.RoundRobin,
    processes: [
      { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 1 },
      { id: 'P2', arrivalTime: 1, burstTime: 8, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 1 },
    ]
  },
  {
    name: "Priority Starvation",
    description: "High priority blocking low",
    algorithm: AlgorithmType.Priority,
    processes: [
      { id: 'LowP', arrivalTime: 0, burstTime: 20, priority: 10 }, 
      { id: 'High1', arrivalTime: 1, burstTime: 5, priority: 1 },
      { id: 'High2', arrivalTime: 2, burstTime: 5, priority: 1 },
      { id: 'High3', arrivalTime: 3, burstTime: 5, priority: 2 },
    ]
  }
];

function App() {
  const [processes, setProcesses] = useState<Process[]>(INITIAL_PROCESSES);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(AlgorithmType.FCFS);
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [newPid, setNewPid] = useState('');
  const [newArrival, setNewArrival] = useState(0);
  const [newBurst, setNewBurst] = useState(1);
  const [newPriority, setNewPriority] = useState(1);

  // Calculate results whenever inputs change
  useEffect(() => {
    if (processes.length > 0) {
      const res = runScheduler(processes, algorithm, timeQuantum);
      setResults(res);
      // Clear analysis when data changes to avoid stale AI insights
      setAiAnalysis(''); 
    } else {
      setResults(null);
    }
  }, [processes, algorithm, timeQuantum]);

  const addProcess = () => {
    const id = newPid || `P${processes.length + 1}`;
    const newProcess: Process = {
      id,
      arrivalTime: Number(newArrival),
      burstTime: Number(newBurst),
      priority: Number(newPriority),
      color: generateColor(processes.length)
    };
    setProcesses([...processes, newProcess]);
    setNewPid('');
  };

  const removeProcess = (id: string) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const loadScenario = (scenario: typeof PRESET_SCENARIOS[0]) => {
    const coloredProcesses = scenario.processes.map((p, i) => ({
      ...p,
      color: generateColor(i)
    }));
    setProcesses(coloredProcesses);
    setAlgorithm(scenario.algorithm);
    if (scenario.algorithm === AlgorithmType.RoundRobin) {
      setTimeQuantum(2);
    }
  };

  const handleGenerateScenario = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateScenarios();
      const colored = generated.map((p, i) => ({ ...p, color: generateColor(i) }));
      setProcesses(colored);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!results) return;
    setIsAnalyzing(true);
    const analysis = await analyzeSimulation(algorithm, processes, results);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Intelligent CPU Scheduler</h1>
              <p className="text-xs text-slate-400">Simulator & Analyzer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={handleGenerateScenario}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-600/50 hover:bg-purple-600/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
                {isGenerating ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/> : <Sparkles size={16} />}
                AI Generate Scenario
            </button>
            <a href="https://github.com/google/generative-ai-js" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-300">
                Powered by Gemini 2.5
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Controls & Input */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Configuration Card */}
            <div className="bg-card rounded-xl border border-slate-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-500"/> Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Algorithm</label>
                  <select 
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    {Object.values(AlgorithmType).map(algo => (
                      <option key={algo} value={algo}>{algo}</option>
                    ))}
                  </select>
                </div>

                {algorithm === AlgorithmType.RoundRobin && (
                   <div className="animate-fadeIn">
                     <label className="block text-sm font-medium text-slate-400 mb-2">Time Quantum</label>
                     <input 
                        type="number" 
                        min="1"
                        value={timeQuantum}
                        onChange={(e) => setTimeQuantum(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                   </div>
                )}
              </div>
            </div>

            {/* Process Input Card */}
            <div className="bg-card rounded-xl border border-slate-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus size={18} className="text-green-500"/> Add Process
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <div>
                    <label className="text-xs text-slate-500">ID (Optional)</label>
                    <input type="text" placeholder="P#" value={newPid} onChange={e => setNewPid(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1" />
                 </div>
                 <div>
                    <label className="text-xs text-slate-500">Priority</label>
                    <input type="number" min="1" value={newPriority} onChange={e => setNewPriority(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1" />
                 </div>
                 <div>
                    <label className="text-xs text-slate-500">Arrival Time</label>
                    <input type="number" min="0" value={newArrival} onChange={e => setNewArrival(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1" />
                 </div>
                 <div>
                    <label className="text-xs text-slate-500">Burst Time</label>
                    <input type="number" min="1" value={newBurst} onChange={e => setNewBurst(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1" />
                 </div>
              </div>
              
              <button 
                onClick={addProcess}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                Add Process
              </button>
            </div>

            {/* Process List */}
            <div className="bg-card rounded-xl border border-slate-800 overflow-hidden shadow-sm flex flex-col h-96">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h2 className="font-semibold text-sm">Process Queue</h2>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{processes.length} items</span>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {processes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                            <p>No processes.</p>
                        </div>
                    ) : (
                        processes.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 group hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ background: p.color }}></div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-200">{p.id}</p>
                                        <p className="text-xs text-slate-500">Arr: {p.arrivalTime} | Burst: {p.burstTime} | Prio: {p.priority}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeProcess(p.id)} className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                {processes.length > 0 && (
                    <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                        <button onClick={() => setProcesses([])} className="w-full text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-2 py-1">
                            <RotateCcw size={12}/> Clear All
                        </button>
                    </div>
                )}
            </div>

          </div>

          {/* RIGHT COLUMN: Visualization & Stats */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Quick Scenarios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESET_SCENARIOS.map((scenario) => (
                    <button
                        key={scenario.name}
                        onClick={() => loadScenario(scenario)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 p-3 rounded-xl text-left transition-all group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-slate-200">{scenario.name}</span>
                            <ArrowRight size={12} className="text-slate-500 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all"/>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">{scenario.description}</p>
                    </button>
                ))}
            </div>
            
            {/* Visualization Card */}
            <div className="bg-card rounded-xl border border-slate-800 p-6 shadow-sm min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="text-primary" /> Simulation Results
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Algorithm: <span className="text-white font-medium">{algorithm}</span> {algorithm === AlgorithmType.RoundRobin && `(Q=${timeQuantum})`}</p>
                    </div>
                    
                    <button 
                        onClick={handleAnalyze}
                        disabled={!results || isAnalyzing}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <BrainCircuit size={18} />}
                        Gemini Analysis
                    </button>
                </div>

                {/* AI Analysis Section */}
                {aiAnalysis && (
                    <div className="mb-6 bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4 text-sm text-indigo-200 relative overflow-hidden animate-fadeIn">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <h3 className="font-semibold text-indigo-100 flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-indigo-400"/> AI Insight
                        </h3>
                        <p className="leading-relaxed">{aiAnalysis}</p>
                    </div>
                )}

                {/* Simulation Output */}
                {results ? (
                    <div className="animate-fadeIn">
                        {/* Key prop ensures the Gantt Chart resets completely when algorithm changes */}
                        <GanttChart key={algorithm} results={results} processes={processes} />
                        <MetricsPanel results={results} />
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <Play size={48} className="mb-4 opacity-50" />
                        <p>Add processes to start simulation</p>
                    </div>
                )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;