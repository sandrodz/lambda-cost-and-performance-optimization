/**
 * Analysis-specific interfaces for Lambda performance testing
 */

// === OPTIMIZATION AND COST ANALYSIS TYPES ===

/**
 * Optimal configurations for different function types
 */
export interface OptimalMemoryConfigurations {
  basic?: OptimalMemoryConfig;
  computation?: OptimalMemoryConfig;
}

/**
 * Optimal memory configuration with performance and cost metrics
 */
export interface OptimalMemoryConfig {
  memoryMB: number;
  warmStartAvg: number;
  coldStartAvg: number | null;
  blendedCost: number;
  recommendation: string;
}

/**
 * Cost efficiency analysis for all function types
 */
export interface CostEfficiencyAnalysis {
  basic?: FunctionCostAnalysis;
  computation?: FunctionCostAnalysis;
}

/**
 * Detailed cost analysis for a function type
 */
export interface FunctionCostAnalysis {
  mostCostEfficient: CostAnalysisConfig;
  leastCostEfficient: CostAnalysisConfig;
  allConfigurations: CostAnalysisConfig[];
}

/**
 * Cost analysis configuration with detailed metrics
 */
export interface CostAnalysisConfig {
  memoryMB: number;
  avgExecutionTime: number;
  coldStartTime: number | null;
  costPer1MInvocations: number;
  coldStartCostPer1M: number;
  blendedCostPer1M: number;
  costEfficiencyScore: number;
}

// === ANALYSIS PIPELINE TYPES ===

// Forward type references (actual types defined in test-runner.ts)
type TestResults = import('./test-runner').TestResults;
type TestConfig = import('./test-runner').TestConfig;
type FunctionTestResult = import('./test-runner').FunctionTestResult;

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
