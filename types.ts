export enum AlgorithmType {
  FCFS = 'FCFS',
  SJF = 'SJF',
  RoundRobin = 'Round Robin',
  Priority = 'Priority'
}

export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color?: string;
}

export interface ScheduledBlock {
  processId: string;
  startTime: number;
  endTime: number;
  color: string;
}

export interface ProcessStats {
  processId: string;
  waitingTime: number;
  turnaroundTime: number;
  completionTime: number;
}

export interface SimulationResult {
  schedule: ScheduledBlock[];
  stats: ProcessStats[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  cpuUtilization: number;
  totalTime: number;
}

export interface AIAnalysisResult {
  analysis: string;
  suggestion: string;
}