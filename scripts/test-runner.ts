/**
 * Performance Test Orchestrator
 * Coordinates execution of specialized test scripts and generates comprehensive reports
 */

import fs from 'fs';

// Import modules
import AnalysisCoordinator from './analysis/analysis-coordinator';
import ReportGenerator from './reporting/report-generator';
import { LambdaTestExecutor } from './lambda-test-executor.js';

// Import types
import { TestResults, TestConfig } from './types/test-runner.js';
import { LambdaTestConfig } from './types/executor.js';
import { SaveResultsResponse } from './types/reporting.js';

export interface PerformanceTestRunnerOptions {
  lambdaPricePerGbSecond?: number;
  defaultColdStartPercentage?: number;
  costCalculationScale?: number;
  blendedScenarios?: number[];
}

class PerformanceTestRunner {
  private testResults: TestResults;
  private config: TestConfig;
  private analysisCoordinator: AnalysisCoordinator;
  private reportGenerator: ReportGenerator;
  private executor: LambdaTestExecutor;

  // Test configurations
  private readonly BASIC_CONFIG: LambdaTestConfig = {
    apiBaseUrl: 'https://wlk17iusoe.execute-api.us-east-1.amazonaws.com/Prod',
    configs: [128, 256, 512, 1024, 2048, 3008],
    targetColdStarts: 5,
    targetWarmStarts: 5,
    maxConcurrentRequests: 20,
    requestDelay: 500,
    functionType: 'basic',
    maxRequests: 100,
    warmupDelay: 1000,
  };

  private readonly COMPUTATION_CONFIG: LambdaTestConfig = {
    apiBaseUrl: 'https://wlk17iusoe.execute-api.us-east-1.amazonaws.com/Prod',
    configs: [128, 512, 1024, 3008],
    targetColdStarts: 5,
    targetWarmStarts: 5,
    maxConcurrentRequests: 20,
    requestDelay: 500,
    functionType: 'computation',
    maxRequests: 50, // Lower limit for heavy computation
    warmupDelay: 2000, // Longer warmup delay for computation functions
  };

  constructor(options: PerformanceTestRunnerOptions = {}) {
    this.testResults = {
      timestamp: new Date().toISOString(),
      basicFunctions: null,
      computationFunctions: null,
      summary: {
        totalFunctionsTested: 0,
        optimalMemoryConfigurations: {},
        costEfficiencyAnalysis: {},
        performanceInsights: [],
      },
    };

    // Configurable pricing and analysis parameters
    this.config = {
      // AWS Lambda pricing per GB-second (as of 2024)
      lambdaPricePerGbSecond: options.lambdaPricePerGbSecond || 0.0000166667,

      // Default cold start percentage for blended cost calculations
      defaultColdStartPercentage: options.defaultColdStartPercentage || 0.1, // 10%

      // Scale for cost calculations (per X invocations)
      costCalculationScale: options.costCalculationScale || 1000000, // per 1M invocations

      // Blended cost scenarios to analyze
      blendedScenarios: options.blendedScenarios || [0.05, 0.1, 0.2, 0.5], // 5%, 10%, 20%, 50%
    };

    // Initialize analysis coordinator
    this.analysisCoordinator = new AnalysisCoordinator(this.config);

    // Initialize report generator
    this.reportGenerator = new ReportGenerator(this.config, this.analysisCoordinator);

    // Initialize Lambda test executor
    this.executor = new LambdaTestExecutor();
  }

  init(): void {
    console.log('🚀 Initializing Performance Test Orchestrator...');
    console.log('📋 This runner coordinates test execution and generates comprehensive reports');
    console.log(`💰 Using Lambda pricing: $${this.config.lambdaPricePerGbSecond} per GB-second`);
    console.log(
      `📊 Default blended cost model: ${this.config.defaultColdStartPercentage * 100}% cold starts`
    );
    console.log(
      `📈 Cost calculation scale: per ${this.config.costCalculationScale.toLocaleString()} invocations`
    );
    console.log('✅ Performance Test Runner initialized successfully');
  }

  async runComprehensiveTests(): Promise<TestResults> {
    console.log('\n🧪 Starting Comprehensive Performance Testing...');
    console.log('='.repeat(60));

    try {
      // Run basic function tests
      console.log('\n🎯 Executing Basic Function Tests...');
      this.testResults.basicFunctions = await this.executor.runTests(this.BASIC_CONFIG);

      // Add delay between test suites
      console.log('\n⏱️  Waiting 30 seconds before computation tests...');
      await this.sleep(30000);

      // Run computation function tests
      console.log('\n🧮 Executing Heavy Computation Tests...');
      this.testResults.computationFunctions = await this.executor.runTests(this.COMPUTATION_CONFIG);

      // Generate comprehensive analysis
      this.testResults.summary = this.analysisCoordinator.generateSummaryAnalysis(this.testResults);

      console.log('\n✅ All tests completed successfully!');
      return this.testResults;
    } catch (error) {
      console.error('\n❌ Test execution failed:', (error as Error).message);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  saveResults(): SaveResultsResponse {
    console.log('\n💾 Saving Test Results...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = './results/comprehensive-analysis';

    // Create directory if it doesn't exist
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save comprehensive results
    const filename = `${resultsDir}/comprehensive-test-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.testResults, null, 2));

    console.log(`✅ Comprehensive results saved to: ${filename}`);

    // Save summary report as text using report generator
    const summaryFilename = `${resultsDir}/summary-report-${timestamp}.txt`;
    const reportContent = this.reportGenerator.generateReportText(this.testResults);

    // Add the header to the text file
    const fullReportContent =
      '📊 Comprehensive Performance Report\n' + '='.repeat(80) + '\n' + reportContent;

    fs.writeFileSync(summaryFilename, fullReportContent);
    console.log(`✅ Summary report saved to: ${summaryFilename}`);

    return { dataFile: filename, summaryFile: summaryFilename };
  }

  generateAndRenderReport(testResults: TestResults): void {
    this.reportGenerator.generateComprehensiveReportAndRender(testResults);
  }
}

// Main execution function
async function main(): Promise<TestResults> {
  const testRunner = new PerformanceTestRunner();

  try {
    testRunner.init();

    // Run comprehensive test suite
    const results = await testRunner.runComprehensiveTests();

    // Generate and display comprehensive report
    testRunner.generateAndRenderReport(results);

    // Save all results
    testRunner.saveResults();

    console.log('\n🎉 Comprehensive Performance Analysis Completed!');
    console.log('📋 All test data has been collected and analyzed');
    console.log('💾 Results saved for further analysis and reporting');

    return results;
  } catch (error) {
    console.error('\n❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default PerformanceTestRunner;
