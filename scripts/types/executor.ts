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
    memoryLimit: number;
    requestId: string;
  };
}

export interface TestRequestResult {
  requestNumber: number;
  duration: number;
  memoryMB: number;
  requestId: string;
  isColdStart: boolean;
  timestamp: string;
}
