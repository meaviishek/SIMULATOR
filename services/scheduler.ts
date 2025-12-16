import { Process, AlgorithmType, SimulationResult, ScheduledBlock, ProcessStats } from '../types';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

export const generateColor = (index: number): string => {
  return COLORS[index % COLORS.length];
};

export const calculateMetrics = (
  processes: Process[], 
  schedule: ScheduledBlock[], 
  totalTime: number
): SimulationResult => {
  const stats: ProcessStats[] = processes.map(p => {
    // Find completion time: the endTime of the last block for this process
    const processBlocks = schedule.filter(b => b.processId === p.id);
    if (processBlocks.length === 0) {
      return { processId: p.id, waitingTime: 0, turnaroundTime: 0, completionTime: 0 };
    }
    
    const completionTime = Math.max(...processBlocks.map(b => b.endTime));
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;

    return {
      processId: p.id,
      completionTime,
      turnaroundTime,
      waitingTime: Math.max(0, waitingTime) // Ensure no negative waiting time
    };
  });

  const totalWait = stats.reduce((acc, curr) => acc + curr.waitingTime, 0);
  const totalTurnaround = stats.reduce((acc, curr) => acc + curr.turnaroundTime, 0);
  
  // CPU Utilization calculation
  let busyTime = 0;
  schedule.forEach(block => {
    busyTime += (block.endTime - block.startTime);
  });
  
  // If schedule is empty, utilization is 0
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;

  return {
    schedule,
    stats,
    averageWaitingTime: processes.length > 0 ? totalWait / processes.length : 0,
    averageTurnaroundTime: processes.length > 0 ? totalTurnaround / processes.length : 0,
    cpuUtilization,
    totalTime
  };
};

export const runScheduler = (
  processes: Process[], 
  algorithm: AlgorithmType, 
  timeQuantum: number = 2
): SimulationResult => {
  // Deep copy to avoid mutating original state during simulation
  const procList = processes.map((p, index) => ({ 
    ...p, 
    remainingTime: p.burstTime,
    color: p.color || generateColor(index)
  }));

  let currentTime = 0;
  const schedule: ScheduledBlock[] = [];
  let completedCount = 0;
  const n = procList.length;
  
  // Sort by arrival time initially for all algorithms to handle the timeline correctly
  procList.sort((a, b) => a.arrivalTime - b.arrivalTime);

  if (algorithm === AlgorithmType.RoundRobin) {
    const queue: typeof procList = [];
    let processedIndex = 0;

    // Push initial processes arriving at 0
    while(processedIndex < n && procList[processedIndex].arrivalTime <= currentTime) {
      queue.push(procList[processedIndex]);
      processedIndex++;
    }

    while (completedCount < n) {
      if (queue.length === 0) {
        // Idle time
        if (processedIndex < n) {
          const nextArrival = procList[processedIndex].arrivalTime;
          if (nextArrival > currentTime) {
            currentTime = nextArrival;
          }
          while(processedIndex < n && procList[processedIndex].arrivalTime <= currentTime) {
            queue.push(procList[processedIndex]);
            processedIndex++;
          }
        } else {
          // Should not happen if completedCount < n
          break;
        }
      }

      const currentProcess = queue.shift();
      if (!currentProcess) break;

      const executeTime = Math.min(timeQuantum, currentProcess.remainingTime);
      
      schedule.push({
        processId: currentProcess.id,
        startTime: currentTime,
        endTime: currentTime + executeTime,
        color: currentProcess.color!
      });

      currentTime += executeTime;
      currentProcess.remainingTime -= executeTime;

      // Add newly arrived processes
      while(processedIndex < n && procList[processedIndex].arrivalTime <= currentTime) {
        queue.push(procList[processedIndex]);
        processedIndex++;
      }

      if (currentProcess.remainingTime > 0) {
        queue.push(currentProcess);
      } else {
        completedCount++;
      }
    }

  } else {
    // FCFS, SJF, Priority (Non-preemptive implementation for simplicity and visualization clarity)
    // To make them preemptive, we would need a tick-by-tick simulation similar to RR
    // For this demo, we will implement standard Non-Preemptive versions except FCFS which is naturally non-preemptive.
    
    // We use a ready list for available processes
    const readyList: typeof procList = [];
    const completedSet = new Set<string>();

    while (completedCount < n) {
      // Add arrived processes to ready list
      procList.forEach(p => {
        if (p.arrivalTime <= currentTime && !completedSet.has(p.id) && !readyList.find(rp => rp.id === p.id)) {
          readyList.push(p);
        }
      });

      if (readyList.length === 0) {
        // Find next arrival
        const pending = procList.filter(p => !completedSet.has(p.id));
        if (pending.length > 0) {
           // Jump time to next arrival
           const nextTime = Math.min(...pending.map(p => p.arrivalTime));
           currentTime = Math.max(currentTime, nextTime);
           continue; 
        } else {
          break; 
        }
      }

      // Selection logic
      let selectedIdx = 0;
      
      if (algorithm === AlgorithmType.SJF) {
        // Pick process with shortest burst time
        readyList.sort((a, b) => {
             if (a.burstTime === b.burstTime) return a.arrivalTime - b.arrivalTime;
             return a.burstTime - b.burstTime;
        });
      } else if (algorithm === AlgorithmType.Priority) {
        // Pick process with highest priority (assuming lower number = higher priority for this demo, standard OS often uses higher number = higher priority, let's allow user to interpret. We will sort Ascending: 1 is top priority)
        readyList.sort((a, b) => {
            if (a.priority === b.priority) return a.arrivalTime - b.arrivalTime;
            return a.priority - b.priority;
        });
      } else {
        // FCFS - just by arrival time
        readyList.sort((a, b) => a.arrivalTime - b.arrivalTime);
      }

      const p = readyList[0];
      
      // Execute
      schedule.push({
        processId: p.id,
        startTime: currentTime,
        endTime: currentTime + p.burstTime,
        color: p.color!
      });

      currentTime += p.burstTime;
      completedSet.add(p.id);
      completedCount++;
      
      // Remove from ready list
      readyList.shift();
    }
  }

  return calculateMetrics(processes, schedule, currentTime);
};