/**
 * Reporting-specific interfaces for Lambda performance testing
 */

import {
  TestResults,
  TestConfig,
  ReportData,
  SaveResultsResponse
} from './index';

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
  formatter?: (value: any) => string;
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
  generator: (input: ReportGeneratorInput) => SectionConfig;
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
