import { GoogleGenAI } from "@google/genai";
import { AlgorithmType, Process, SimulationResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSimulation = async (
  algorithm: AlgorithmType,
  processes: Process[],
  results: SimulationResult
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key missing. Cannot generate analysis.";

  const prompt = `
    Act as an Operating Systems expert. Analyze the following CPU scheduling simulation results.
    
    Algorithm Used: ${algorithm}
    
    Input Processes:
    ${JSON.stringify(processes.map(p => ({ id: p.id, arrival: p.arrivalTime, burst: p.burstTime, priority: p.priority })))}
    
    Results:
    Average Waiting Time: ${results.averageWaitingTime.toFixed(2)}
    Average Turnaround Time: ${results.averageTurnaroundTime.toFixed(2)}
    CPU Utilization: ${results.cpuUtilization.toFixed(2)}%
    
    Please provide a concise analysis (max 3 sentences) explaining why this performance occurred based on the input characteristics (e.g., convoy effect, starvation, good mix of IO/CPU). 
    Then, suggest which algorithm might perform better for this specific batch and why (max 2 sentences).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate analysis due to an error.";
  }
};

export const generateScenarios = async (): Promise<Process[]> => {
  const ai = getClient();
  if (!ai) throw new Error("API Key missing");

  const prompt = `
    Generate a JSON array of 5 CPU processes for a scheduling simulation. 
    Make the scenario interesting (e.g., a mix of short and long jobs, different arrival times).
    
    Schema:
    [
      { "id": "P1", "arrivalTime": number (0-10), "burstTime": number (1-20), "priority": number (1-10) }
    ]
    
    Return ONLY the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) return [];
    
    const processes = JSON.parse(text);
    // Ensure IDs are strings and values are numbers
    return processes.map((p: any) => ({
      id: String(p.id),
      arrivalTime: Number(p.arrivalTime),
      burstTime: Number(p.burstTime),
      priority: Number(p.priority)
    }));
  } catch (error) {
    console.error("Gemini Scenario Gen Error:", error);
    // Fallback data
    return [
      { id: 'P1', arrivalTime: 0, burstTime: 10, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 4 },
      { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 },
      { id: 'P5', arrivalTime: 4, burstTime: 8, priority: 5 },
    ];
  }
};