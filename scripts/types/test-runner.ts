/**
 * Test runner specific interfaces for Lambda performance testing
 */

import { TestResults, TestConfig, ReportData } from './index';

export interface TestRunnerConfig extends TestConfig {
  saveToFile: boolean;
  outputDirectory: string;
  functionNames: {
    basic: string;
    computation: string;
  };
  memoryConfigurations: number[];
  iterationsPerTest: number;
  concurrency: number;
}

export interface TestRunnerInput {
  config: TestRunnerConfig;
}

export interface TestRunnerOutput {
  testResults: TestResults;
  reportData: ReportData;
  saved?: {
    dataFile: string;
    summaryFile: string | null;
  };
}

export interface FunctionInvocationConfig {
  functionName: string;
  memoryMB: number;
  iterations: number;
  concurrency: number;
}

export interface FunctionInvocationResult {
  memoryMB: number;
  executions: ExecutionResult[];
  errors: string[];
}

export interface ExecutionResult {
  duration: number;
  isColdStart: boolean;
  requestId: string;
  error?: string;
}

export interface TestOrchestrationConfig {
  basic: {
    enabled: boolean;
    functionName: string;
    memoryConfigurations: number[];
  };
  computation: {
    enabled: boolean;
    functionName: string;
    memoryConfigurations: number[];
  };
  iterations: number;
  concurrency: number;
}

export interface TestProgress {
  functionType: 'basic' | 'computation';
  memoryMB: number;
  currentIteration: number;
  totalIterations: number;
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface TestProgressCallback {
  (progress: TestProgress): void;
}

export interface BatchTestResult {
  functionType: 'basic' | 'computation';
  results: FunctionInvocationResult[];
  startTime: Date;
  endTime: Date;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}
