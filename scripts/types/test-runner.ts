import type { OptimalMemoryConfigurations, CostEfficiencyAnalysis } from './analysis';

export interface TestExecutionResult {
  average: number;
  count: number;
  min?: number;
  max?: number;
  standardDeviation?: number;
}

export interface FunctionTestResult {
  memoryMB: number;
  warmStart: TestExecutionResult | null;
  coldStart: TestExecutionResult | null;
  errors?: string[];
}

export interface TestResults {
  timestamp: string;
  basicFunctions: FunctionTestResult[] | null;
  computationFunctions: FunctionTestResult[] | null;
  summary: TestSummary;
}

export interface TestSummary {
  totalFunctionsTested: number;
  optimalMemoryConfigurations: OptimalMemoryConfigurations;
  costEfficiencyAnalysis: CostEfficiencyAnalysis;
  performanceInsights: string[];
}

export interface TestConfig {
  lambdaPricePerGbSecond: number;
  defaultColdStartPercentage: number;
  costCalculationScale: number;
  blendedScenarios: number[];
}
