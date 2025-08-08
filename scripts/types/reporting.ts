import type { TestResults, TestConfig } from './test-runner';
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

export interface ReportGeneratorInput {
  testResults: TestResults;
  config: TestConfig;
}

export interface ReportGeneratorOutput {
  reportData: ReportData;
}

export interface ConsoleRendererInput {
  reportData: ReportData;
}

export interface ConsoleRendererOutput {
  rendered: string;
}

export interface ResultsSaverInput {
  testResults: TestResults;
  config: TestConfig;
}

export interface ResultsSaverOutput extends SaveResultsResponse {
  dataFile: string;
  summaryFile: string | null;
}

export interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  formatter?: (_value: any) => string;
}

export interface TableRow {
  [key: string]: any;
}

export interface TableConfig {
  columns: TableColumn[];
  rows: TableRow[];
  title?: string;
  style?: 'bordered' | 'simple' | 'compact';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter';
  title: string;
  xAxis: string;
  yAxis: string;
  data: ChartDataPoint[];
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  series?: string;
}

export interface SectionConfig {
  title: string;
  level: number;
  content: SectionContent[];
}

export type SectionContent =
  | { type: 'text'; value: string }
  | { type: 'table'; value: TableConfig }
  | { type: 'chart'; value: ChartConfig }
  | { type: 'list'; value: string[] }
  | { type: 'code'; value: string; language?: string };

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  generator: (_input: ReportGeneratorInput) => SectionConfig;
}

export interface FormattingOptions {
  currency: {
    symbol: string;
    precision: number;
  };
  percentage: {
    precision: number;
  };
  duration: {
    unit: 'ms' | 's';
    precision: number;
  };
  memory: {
    unit: 'MB' | 'GB';
    precision: number;
  };
}
