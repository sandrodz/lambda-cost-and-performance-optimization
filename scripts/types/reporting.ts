import type { OptimalMemoryConfig, CostAnalysisConfig } from './analysis';

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

interface ScenarioOptimizations {
  warmOptimal: CostAnalysisConfig;
  perfOptimal: CostAnalysisConfig;
}

export interface DataQualityData {
  basic?: FunctionDataQuality;
  computation?: FunctionDataQuality;
}

interface FunctionDataQuality {
  totalConfigurations: number;
  configurations: ConfigurationQuality[];
}

interface ConfigurationQuality {
  memoryMB: number;
  coldCount: number;
  warmCount: number;
}

export interface SaveResultsResponse {
  dataFile: string;
  summaryFile: string | null;
}
