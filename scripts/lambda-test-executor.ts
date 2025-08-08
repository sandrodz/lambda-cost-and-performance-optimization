/**
 * Lambda Test Executor
 * Provides configurable testing for any Lambda function type
 */

import https from 'https';
import { TestExecutionResult, FunctionTestResult } from './types/test-runner';
import { LambdaTestConfig, LambdaFunctionResponse, TestRequestResult } from './types/executor';

class LambdaTestExecutor {
  /**
   * Make HTTP GET request
   */
  private makeRequest(url: string): Promise<LambdaFunctionResponse> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as LambdaFunctionResponse);
          } catch (err) {
            reject(new Error(`Failed to parse response: ${(err as Error).message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.abort();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Make concurrent requests to trigger cold starts
   */
  private async makeConcurrentRequests(
    url: string,
    count: number
  ): Promise<LambdaFunctionResponse[]> {
    const requests = Array(count)
      .fill(null)
      .map(() => this.makeRequest(url));
    try {
      return await Promise.all(requests);
    } catch (error) {
      // If some requests fail, return successful ones
      const results = await Promise.allSettled(requests);
      return results
        .filter(
          (result): result is PromiseFulfilledResult<LambdaFunctionResponse> =>
            result.status === 'fulfilled'
        )
        .map(result => result.value);
    }
  }

  /**
   * Test a Lambda function with specific memory configuration
   */
  public async testFunction(
    memoryMB: number,
    config: LambdaTestConfig
  ): Promise<FunctionTestResult> {
    const url = `${config.apiBaseUrl}/${config.functionType}-${memoryMB}`;
    const coldStartResults: TestRequestResult[] = [];
    const warmStartResults: TestRequestResult[] = [];
    let totalRequestsAttempted = 0;
    let batchNumber = 1;
    let globalRequestCounter = 1; // Simple counter for individual request numbering

    console.log(
      `\nTesting ${config.functionType.charAt(0).toUpperCase() + config.functionType.slice(1)} Function ${memoryMB}MB:`
    );
    console.log(
      `Target: ${config.targetColdStarts} cold starts, ${config.targetWarmStarts} warm starts`
    );
    console.log('─'.repeat(60));

    while (
      coldStartResults.length < config.targetColdStarts ||
      warmStartResults.length < config.targetWarmStarts
    ) {
      try {
        console.log(
          `  Request batch ${batchNumber} (Cold: ${coldStartResults.length}/${config.targetColdStarts}, Warm: ${warmStartResults.length}/${config.targetWarmStarts})`
        );

        // Make concurrent requests to trigger cold starts
        const responses = await this.makeConcurrentRequests(url, config.maxConcurrentRequests);
        totalRequestsAttempted += config.maxConcurrentRequests; // Track attempts, not just successes

        // Process responses
        responses.forEach(response => {
          if (response.performance && response.executionEnvironment) {
            const isColdStart = response.executionEnvironment.coldStart || false;

            const result: TestRequestResult = {
              requestNumber: globalRequestCounter++, // Simple incremental counter
              duration: response.performance.totalExecutionTime,
              memoryMB: response.executionEnvironment.memoryLimit,
              requestId: response.executionEnvironment.requestId,
              isColdStart: response.executionEnvironment.coldStart,
              timestamp: new Date().toISOString(),
            };

            if (isColdStart && coldStartResults.length < config.targetColdStarts) {
              coldStartResults.push(result);
              console.log(`    Cold Start: ${response.performance.totalExecutionTime}ms`);
            } else if (!isColdStart && warmStartResults.length < config.targetWarmStarts) {
              warmStartResults.push(result);
              console.log(`    Warm Start: ${response.performance.totalExecutionTime}ms`);
            } else {
              // Log when we're discarding results because we have enough
              const type = isColdStart ? 'Cold' : 'Warm';
              console.log(
                `    ${type} Start (discarded - have enough): ${response.performance.totalExecutionTime}ms`
              );
            }
          } else {
            console.log(`    Error response: ${JSON.stringify(response)}`);
          }
        });

        batchNumber++; // Increment batch counter

        // Check if we have enough of both types
        if (
          coldStartResults.length >= config.targetColdStarts &&
          warmStartResults.length >= config.targetWarmStarts
        ) {
          console.log(`    ✅ Collection complete! Have enough cold and warm starts.`);
          break;
        }

        // Wait between batches to allow containers to scale down for more cold starts
        if (coldStartResults.length < config.targetColdStarts) {
          console.log(`    Waiting ${config.requestDelay}ms for potential container scaling...`);
          await new Promise(resolve => setTimeout(resolve, config.requestDelay));
        }

        // Safety break to prevent infinite loops
        if (totalRequestsAttempted > config.maxRequests) {
          console.log(`    Reached maximum request limit (${totalRequestsAttempted}), stopping...`);
          break;
        }
      } catch (error) {
        console.log(`    Batch error: ${(error as Error).message}`);
        await new Promise(resolve => setTimeout(resolve, config.warmupDelay));
      }
    }

    // Calculate statistics
    const allResults = [...coldStartResults, ...warmStartResults];

    if (allResults.length > 0) {
      console.log(`\n  Collection Summary:`);
      console.log(`    Total Requests Attempted: ${totalRequestsAttempted}`);
      console.log(`    Successful Responses: ${allResults.length}`);
      console.log(
        `    Cold Starts Collected: ${coldStartResults.length}/${config.targetColdStarts}`
      );
      console.log(
        `    Warm Starts Collected: ${warmStartResults.length}/${config.targetWarmStarts}`
      );

      // Cold start statistics
      if (coldStartResults.length > 0) {
        const coldTimes = coldStartResults.map(r => r.duration);
        const coldAvg = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length;
        const coldMin = Math.min(...coldTimes);
        const coldMax = Math.max(...coldTimes);
        console.log(
          `    Cold Start - Avg: ${coldAvg.toFixed(2)}ms, Min: ${coldMin}ms, Max: ${coldMax}ms`
        );
      }

      // Warm start statistics
      if (warmStartResults.length > 0) {
        const warmTimes = warmStartResults.map(r => r.duration);
        const warmAvg = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;
        const warmMin = Math.min(...warmTimes);
        const warmMax = Math.max(...warmTimes);
        console.log(
          `    Warm Start  - Avg: ${warmAvg.toFixed(2)}ms, Min: ${warmMin}ms, Max: ${warmMax}ms`
        );
      }
    }

    // Return standardized FunctionTestResult format
    const coldStats: TestExecutionResult | null =
      coldStartResults.length > 0
        ? {
            count: coldStartResults.length,
            average:
              coldStartResults.reduce((sum, r) => sum + r.duration, 0) / coldStartResults.length,
            min: Math.min(...coldStartResults.map(r => r.duration)),
            max: Math.max(...coldStartResults.map(r => r.duration)),
          }
        : null;

    const warmStats: TestExecutionResult | null =
      warmStartResults.length > 0
        ? {
            count: warmStartResults.length,
            average:
              warmStartResults.reduce((sum, r) => sum + r.duration, 0) / warmStartResults.length,
            min: Math.min(...warmStartResults.map(r => r.duration)),
            max: Math.max(...warmStartResults.map(r => r.duration)),
          }
        : null;

    return {
      memoryMB,
      coldStart: coldStats,
      warmStart: warmStats,
    };
  }

  /**
   * Run tests for all memory configurations
   */
  public async runTests(config: LambdaTestConfig): Promise<FunctionTestResult[]> {
    const functionName = config.functionType.charAt(0).toUpperCase() + config.functionType.slice(1);
    console.log(`🚀 Starting ${functionName} Function Performance Tests`);
    console.log('═'.repeat(60));

    const allResults: FunctionTestResult[] = [];

    for (const memoryMB of config.configs) {
      const result = await this.testFunction(memoryMB, config);
      allResults.push(result);
    }

    // Display summary
    console.log(`\n📊 ${functionName} Performance Summary:`);
    console.log('═'.repeat(80));
    console.log('Memory (MB) | Cold Starts | Warm Starts | Cold Avg (ms) | Warm Avg (ms)');
    console.log('─'.repeat(80));

    allResults.forEach(result => {
      const coldCount = result.coldStart ? result.coldStart.count : 0;
      const warmCount = result.warmStart ? result.warmStart.count : 0;
      const coldAvg = result.coldStart ? result.coldStart.average.toFixed(2) : 'N/A';
      const warmAvg = result.warmStart ? result.warmStart.average.toFixed(2) : 'N/A';

      console.log(
        `${result.memoryMB.toString().padStart(10)} | ${coldCount.toString().padStart(11)} | ${warmCount.toString().padStart(11)} | ${coldAvg.padStart(13)} | ${warmAvg.padStart(13)}`
      );
    });

    // Cold Start Analysis
    console.log('\n❄️ Cold Start Analysis:');
    console.log('═'.repeat(60));
    allResults.forEach(result => {
      if (result.coldStart) {
        console.log(
          `${result.memoryMB}MB: ${result.coldStart.average.toFixed(2)}ms (min: ${result.coldStart.min}ms, max: ${result.coldStart.max}ms)`
        );
      }
    });

    // Warm Start Analysis
    console.log('\n🔥 Warm Start Analysis:');
    console.log('═'.repeat(60));
    allResults.forEach(result => {
      if (result.warmStart) {
        console.log(
          `${result.memoryMB}MB: ${result.warmStart.average.toFixed(2)}ms (min: ${result.warmStart.min}ms, max: ${result.warmStart.max}ms)`
        );
      }
    });

    console.log(`\n✅ ${functionName} function tests completed!`);
    console.log('💡 Check X-Ray traces in AWS Console for detailed analysis');

    return allResults;
  }
}

export default LambdaTestExecutor;
