export interface OptimalMemoryConfigurations {
  basic?: OptimalMemoryConfig;
  computation?: OptimalMemoryConfig;
}

export interface OptimalMemoryConfig {
  memoryMB: number;
  warmStartAvg: number;
  coldStartAvg: number | null;
  blendedCost: number;
  recommendation: string;
}

export interface CostEfficiencyAnalysis {
  basic?: FunctionCostAnalysis;
  computation?: FunctionCostAnalysis;
}

interface FunctionCostAnalysis {
  mostCostEfficient: CostAnalysisConfig;
  leastCostEfficient: CostAnalysisConfig;
  allConfigurations: CostAnalysisConfig[];
}

export interface CostAnalysisConfig {
  memoryMB: number;
  avgExecutionTime: number;
  coldStartTime: number | null;
  costPer1MInvocations: number;
  coldStartCostPer1M: number;
  blendedCostPer1M: number;
  costEfficiencyScore: number;
}

export interface CostAnalyzerOutput {
  mostCostEfficient: CostAnalysisConfig;
  leastCostEfficient: CostAnalysisConfig;
  allConfigurations: CostAnalysisConfig[];
}
