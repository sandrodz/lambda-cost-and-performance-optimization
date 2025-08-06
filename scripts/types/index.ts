/**
 * Core data structures for Lambda performance testing system
 */

// Re-export specialized type modules
export * from './analysis';
export * from './reporting';
export * from './test-runner';

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

export interface FunctionCostAnalysis {
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

export interface TestConfig {
  lambdaPricePerGbSecond: number;
  defaultColdStartPercentage: number;
  costCalculationScale: number;
  blendedScenarios: number[];
}

export interface ReportData {
  overview: OverviewData;
  recommendations: RecommendationsData;
  analysis: AnalysisData;
  insights: string[];
  scenarios: ScenarioData;
  dataQuality: DataQualityData;
}

export interface OverviewData {
  timestamp: string;
  totalFunctionsTested: number;
  testTypes: {
    basic: number;
    computation: number;
  };
}

export interface RecommendationsData {
  basic?: OptimalMemoryConfig;
  computation?: OptimalMemoryConfig;
}

export interface AnalysisData {
  basic?: FunctionAnalysisData;
  computation?: FunctionAnalysisData;
}

export interface FunctionAnalysisData {
  warmStart: PerformanceDataPoint[];
  coldStart: PerformanceDataPoint[];
  blended: BlendedDataPoint[];
  hasAnyColdStart: boolean;
}

export interface PerformanceDataPoint {
  memoryMB: number;
  executionTime: number;
  cost: number;
  performanceGain: number;
  costChange: number;
}

export interface BlendedDataPoint {
  memoryMB: number;
  scenarios: { [coldPercentage: number]: number };
  useCase: string;
}

export interface ScenarioData {
  basic?: ScenarioOptimizations;
  computation?: ScenarioOptimizations;
}

export interface ScenarioOptimizations {
  warmOptimal: CostAnalysisConfig;
  perfOptimal: CostAnalysisConfig;
}

export interface DataQualityData {
  basic?: FunctionDataQuality;
  computation?: FunctionDataQuality;
}

export interface FunctionDataQuality {
  totalConfigurations: number;
  configurations: ConfigurationQuality[];
}

export interface ConfigurationQuality {
  memoryMB: number;
  coldCount: number;
  warmCount: number;
}

export interface SaveResultsResponse {
  dataFile: string;
  summaryFile: string | null;
}
