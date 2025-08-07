/**
 * Lambda test executor specific types
 */

export interface LambdaTestConfig {
  apiBaseUrl: string;
  targetColdStarts: number;
  targetWarmStarts: number;
  maxConcurrentRequests: number;
  requestDelay: number;
  configs: number[];
  functionType: string;
  maxRequests: number;
  warmupDelay: number;
}

export interface LambdaFunctionResponse {
  performance: {
    totalExecutionTime: number;
  };
  executionEnvironment: {
    coldStart: boolean;
    memoryLimit: number; // Keep as memoryLimit since this is the Lambda response format
    requestId: string;
  };
}

export interface TestRequestResult {
  requestNumber: number;
  duration: number; // Standardized from executionTime to match ExecutionResult
  memoryMB: number; // Standardized from memoryLimit for consistency
  requestId: string;
  isColdStart: boolean;
  timestamp: string;
}
