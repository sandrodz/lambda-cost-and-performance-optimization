/**
 * Analysis-specific interfaces for Lambda performance testing
 */

import {
  TestResults,
  FunctionTestResult,
  TestConfig,
  CostAnalysisConfig,
  OptimalMemoryConfig,
  TestExecutionResult
} from './index';

export interface AnalysisInput {
  testResults: TestResults;
  config: TestConfig;
}

export interface CostAnalyzerInput {
  functionResults: FunctionTestResult[];
  config: TestConfig;
}

export interface CostAnalyzerOutput {
  mostCostEfficient: CostAnalysisConfig;
  leastCostEfficient: CostAnalysisConfig;
  allConfigurations: CostAnalysisConfig[];
}

export interface PerformanceInsightsInput {
  testResults: TestResults;
  config: TestConfig;
}

export interface PerformanceInsightsOutput {
  insights: string[];
  optimalConfigurations: OptimalMemoryConfigurations;
}

export interface OptimalMemoryConfigurations {
  basic?: OptimalMemoryConfig;
  computation?: OptimalMemoryConfig;
}

export interface CostCalculationInput {
  memoryMB: number;
  executionTime: number;
  coldStartTime: number | null;
  pricePerGbSecond: number;
  coldStartPercentage: number;
  scale: number;
}

export interface CostCalculationOutput {
  costPer1MInvocations: number;
  coldStartCostPer1M: number;
  blendedCostPer1M: number;
  costEfficiencyScore: number;
}

export interface PerformanceMetric {
  memoryMB: number;
  warmStart: TestExecutionResult | null;
  coldStart: TestExecutionResult | null;
  errors?: string[];
}

export interface OptimizationSuggestion {
  type: 'memory' | 'architecture' | 'configuration';
  message: string;
  impact: 'high' | 'medium' | 'low';
  category: 'cost' | 'performance' | 'reliability';
}

export interface AnalysisCoordinatorInput {
  testResults: TestResults;
  config: TestConfig;
}

export interface AnalysisCoordinatorOutput {
  costEfficiencyAnalysis: {
    basic?: CostAnalyzerOutput;
    computation?: CostAnalyzerOutput;
  };
  performanceInsights: string[];
  optimalMemoryConfigurations: OptimalMemoryConfigurations;
}
