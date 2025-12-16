import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize, X, Clock, Zap, ArrowRight, MousePointerClick } from 'lucide-react';
import { SimulationResult, Process } from '../types';

interface GanttChartProps {
  results: SimulationResult;
  processes: Process[];
}

const GanttChart: React.FC<GanttChartProps> = ({ results, processes }) => {
  const { schedule, stats, totalTime } = results;
  const [zoom, setZoom] = useState(1);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoom(1);

  if (schedule.length === 0) return (
    <div className="h-32 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
      No schedule data generated yet.
    </div>
  );

  const selectedBlock = selectedBlockIndex !== null ? schedule[selectedBlockIndex] : null;
  const selectedProcess = selectedBlock ? processes.find(p => p.id === selectedBlock.processId) : null;
  const selectedStats = selectedBlock ? stats.find(s => s.processId === selectedBlock.processId) : null;

  return (
    <div className="w-full mt-6 flex flex-col gap-4 animate-fadeIn">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                Execution Timeline
            </h3>
            
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
                    <MousePointerClick size={14} />
                    <span>Click blocks for details</span>
                 </div>
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button onClick={handleZoomOut} disabled={zoom <= 1} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-mono w-12 text-center text-slate-300">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} disabled={zoom >= 5} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                        <ZoomIn size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Reset View">
                        <Maximize size={16} />
                    </button>
                </div>
            </div>
        </div>

      {/* Chart Container */}
      <div 
        ref={containerRef}
        className="relative w-full bg-slate-900/50 rounded-xl overflow-x-auto border border-slate-700 shadow-inner"
        style={{ height: '140px' }} 
      >
        <div 
            className="h-full relative transition-all duration-300 ease-out min-w-full"
            style={{ width: `${zoom * 100}%` }}
        >
            {/* Blocks Bar */}
            <div className="absolute top-8 left-0 right-0 h-16 flex items-center px-4">
                <div className="w-full h-12 bg-slate-800 rounded-lg overflow-hidden flex relative shadow-sm ring-1 ring-slate-700/50">
                    {schedule.map((block, index) => {
                         const widthPercent = ((block.endTime - block.startTime) / totalTime) * 100;
                         return (
                             <button
                                key={index}
                                onClick={() => setSelectedBlockIndex(index)}
                                className="h-full relative group transition-all hover:brightness-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-white/50"
                                style={{ width: `${widthPercent}%`, backgroundColor: block.color }}
                                title={`Process ${block.processId}: ${block.startTime}-${block.endTime}s`}
                             >
                                {widthPercent * zoom > 3 && (
                                    <span className="text-xs font-bold text-white drop-shadow-md truncate px-1 block w-full">
                                        {block.processId}
                                    </span>
                                )}
                             </button>
                         )
                    })}
                </div>
            </div>

             {/* Time Markers */}
            <div className="absolute top-24 left-0 right-0 h-6 px-4">
                <div className="relative w-full h-full text-xs text-slate-500 font-mono">
                     <span className="absolute left-0 -translate-x-1/2">0</span>
                     <span className="absolute right-0 translate-x-1/2">{totalTime}</span>
                     {schedule.map((block, idx) => (
                         <div 
                            key={idx} 
                            className="absolute top-0 bottom-0 border-l border-slate-700/30 flex flex-col items-center group"
                            style={{ left: `${(block.endTime / totalTime) * 100}%` }}
                         >
                            <span className="mt-1 transform -translate-x-1/2 bg-slate-900/80 px-1 rounded text-slate-600 group-hover:text-slate-300 transition-colors">
                                {block.endTime}
                            </span>
                         </div>
                     ))}
                </div>
            </div>
        </div>
      </div>

      {/* Detail Overlay/Modal */}
      {selectedBlock && selectedProcess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedBlockIndex(null)}>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setSelectedBlockIndex(null)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                  >
                      <X size={20} />
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg" style={{ backgroundColor: selectedBlock.color }}>
                          {selectedBlock.processId}
                      </div>
                      <div>
                          <h4 className="text-xl font-bold text-white">Process Details</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                             <div className="flex items-center gap-1">
                                <span className="text-xs uppercase tracking-wider font-semibold text-slate-600">Priority</span>
                                <span className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">{selectedProcess.priority}</span>
                             </div>
                             <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                             <div className="flex items-center gap-1">
                                <span className="text-xs uppercase tracking-wider font-semibold text-slate-600">Arrival</span>
                                <span className="text-slate-200">{selectedProcess.arrivalTime}s</span>
                             </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Selected Time Slice</p>
                          <div className="flex items-center gap-2 text-sm font-mono text-slate-200">
                              {selectedBlock.startTime}s <ArrowRight size={12} className="text-slate-600"/> {selectedBlock.endTime}s
                          </div>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Slice Duration</p>
                          <div className="flex items-center gap-2 text-sm font-mono text-slate-200">
                               <Zap size={12} className="text-yellow-500"/>
                              {selectedBlock.endTime - selectedBlock.startTime}s
                          </div>
                      </div>
                  </div>

                  {selectedStats && (
                      <div className="space-y-3 pt-5 border-t border-slate-800">
                           <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Total Performance Metrics</h5>
                           <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 mb-1">Waiting</div>
                                    <div className="font-bold text-blue-400 text-lg">{selectedStats.waitingTime}<span className="text-xs ml-0.5 opacity-50">s</span></div>
                                </div>
                                <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 mb-1">Turnaround</div>
                                    <div className="font-bold text-green-400 text-lg">{selectedStats.turnaroundTime}<span className="text-xs ml-0.5 opacity-50">s</span></div>
                                </div>
                                <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 mb-1">Completion</div>
                                    <div className="font-bold text-purple-400 text-lg">{selectedStats.completionTime}<span className="text-xs ml-0.5 opacity-50">s</span></div>
                                </div>
                           </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default GanttChart;