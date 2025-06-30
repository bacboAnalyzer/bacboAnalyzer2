// Centralized type definitions for Bac Bo application

// Backend API result format (from server/index.cjs)
export interface BacBoApiResult {
  casa: number;
  visitante: number;
  winner: 'Casa' | 'Visitante' | 'Empate';
  timestamp: string;
  content?: string;
  source: string;
}

// Frontend display format (for components)
export interface BacBoDisplayResult {
  player: number;
  banker: number;
  winner: 'Player' | 'Banker' | 'Tie';
  timestamp: string;
  createdAt: string;
}

// CSV export format
export interface CSVBacBoResult {
  id: number;
  created_at: string;
  player: number;
  banker: number;
  winner: 'Player' | 'Banker' | 'Tie';
}

// ML Prediction interface
export interface MLPrediction {
  nextValue: 'Player' | 'Banker' | 'Tie';
  accuracy: number;
  confidence: number;
  lastValue: 'Player' | 'Banker' | 'Tie';
  state: 'Green' | 'g1' | 'g2' | 'Red' | '';
}

// Game statistics interface
export interface GameStats {
  g0: number;
  g1: number;
  g2: number;
  red: number;
  totalSignals: number;
  accuracy: number;
}

// Game mode interface
export interface GameMode {
  id: 'normal' | 'medium' | 'advanced';
  name: string;
  color: string;
  bgColor: string;
  riskLevel: string;
  betPercentage: number;
  accuracyRate: number;
  expectedReturn: number;
  description: string;
}

// Utility function to convert API result to display result
export function convertApiToDisplay(apiResult: BacBoApiResult): BacBoDisplayResult {
  return {
    player: apiResult.casa,
    banker: apiResult.visitante,
    winner: apiResult.winner === 'Casa' ? 'Player' : 
            apiResult.winner === 'Visitante' ? 'Banker' : 'Tie',
    timestamp: apiResult.timestamp,
    createdAt: apiResult.timestamp
  };
}

// Utility function to convert display result to CSV result
export function convertDisplayToCSV(displayResult: BacBoDisplayResult, id: number): CSVBacBoResult {
  return {
    id,
    created_at: displayResult.createdAt,
    player: displayResult.player,
    banker: displayResult.banker,
    winner: displayResult.winner
  };
}