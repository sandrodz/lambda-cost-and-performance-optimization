/**
 * Analysis Coordinator
 * Orchestrates all analysis operations using specialized analyzers
 */

import CostAnalyzer from './cost-analyzer';
import PerformanceInsightsAnalyzer from './performance-insights-analyzer';
import { TestConfig, TestResults, TestSummary } from '../types/test-runner';
import { CostAnalyzerOutput, CostEfficiencyAnalysis } from '../types/analysis';
import {
  FunctionAnalysisData,
  PerformanceDataPoint,
  BlendedDataPoint,
  OverviewData,
  RecommendationsData,
  AnalysisData,
  ScenarioData,
  DataQualityData,
} from '../types/reporting';

class AnalysisCoordinator {
  private config: TestConfig;
  private costAnalyzer: CostAnalyzer;
  private insightsAnalyzer: PerformanceInsightsAnalyzer;

  constructor(config: TestConfig) {
    this.config = config;
    this.costAnalyzer = new CostAnalyzer(config);
    this.insightsAnalyzer = new PerformanceInsightsAnalyzer(config);
  }

  /**
   * Generate comprehensive summary analysis
   */
  generateSummaryAnalysis(testResults: TestResults): TestSummary {
    console.log('\n📊 Generating Summary Analysis...');

    const summary: TestSummary = {
      totalFunctionsTested: 0,
      optimalMemoryConfigurations: {},
      costEfficiencyAnalysis: {},
      performanceInsights: [],
    };

    // Analyze basic functions
    if (testResults.basicFunctions) {
      summary.totalFunctionsTested += testResults.basicFunctions.length;
      const basicOptimal = this.costAnalyzer.findOptimalMemoryConfig(testResults.basicFunctions);
      if (basicOptimal) {
        summary.optimalMemoryConfigurations.basic = basicOptimal;
      }
      const basicCostAnalysis = this.costAnalyzer.analyzeCostEfficiency(testResults.basicFunctions);
      if (basicCostAnalysis) {
        summary.costEfficiencyAnalysis.basic = basicCostAnalysis;
      }
    }

    // Analyze computation functions
    if (testResults.computationFunctions) {
      summary.totalFunctionsTested += testResults.computationFunctions.length;
      const computationOptimal = this.costAnalyzer.findOptimalMemoryConfig(
        testResults.computationFunctions
      );
      if (computationOptimal) {
        summary.optimalMemoryConfigurations.computation = computationOptimal;
      }
      const computationCostAnalysis = this.costAnalyzer.analyzeCostEfficiency(
        testResults.computationFunctions
      );
      if (computationCostAnalysis) {
        summary.costEfficiencyAnalysis.computation = computationCostAnalysis;
      }
    }

    // Generate performance insights
    summary.performanceInsights = this.insightsAnalyzer.generatePerformanceInsights(
      summary,
      testResults
    );

    return summary;
  }

  /**
   * Generate function analysis data for reporting
   */
  generateFunctionAnalysisData(
    costAnalysis: CostAnalyzerOutput,
    _functionType?: string
  ): FunctionAnalysisData {
    const warmBaseline = costAnalysis.allConfigurations[0];

    const warmStartData: PerformanceDataPoint[] = costAnalysis.allConfigurations.map(config => ({
      memoryMB: config.memoryMB,
      executionTime: config.avgExecutionTime,
      cost: config.costPer1MInvocations,
      performanceGain:
        warmBaseline.avgExecutionTime > 0
          ? ((warmBaseline.avgExecutionTime - config.avgExecutionTime) /
              warmBaseline.avgExecutionTime) *
            100
          : 0,
      costChange:
        warmBaseline.costPer1MInvocations > 0
          ? ((config.costPer1MInvocations - warmBaseline.costPer1MInvocations) /
              warmBaseline.costPer1MInvocations) *
            100
          : 0,
    }));

    // Cold start data (if available)
    const coldConfigs = costAnalysis.allConfigurations.filter(
      config => config.coldStartTime !== null
    );
    let coldStartData: PerformanceDataPoint[] = [];
    if (coldConfigs.length > 0) {
      const coldBaseline = coldConfigs[0];
      coldStartData = coldConfigs.map(config => ({
        memoryMB: config.memoryMB,
        executionTime: config.coldStartTime!,
        cost: config.coldStartCostPer1M,
        performanceGain:
          coldBaseline.coldStartTime! > 0
            ? ((coldBaseline.coldStartTime! - config.coldStartTime!) /
                coldBaseline.coldStartTime!) *
              100
            : 0,
        costChange:
          coldBaseline.coldStartCostPer1M > 0
            ? ((config.coldStartCostPer1M - coldBaseline.coldStartCostPer1M) /
                coldBaseline.coldStartCostPer1M) *
              100
            : 0,
      }));
    }

    // Blended scenarios data
    const blendedData: BlendedDataPoint[] = costAnalysis.allConfigurations.map(config => {
      const scenarios: { [coldPercentage: number]: number } = {};
      this.config.blendedScenarios.forEach(coldPercentage => {
        const warmPercentage = 1 - coldPercentage;
        if (config.coldStartCostPer1M > 0) {
          scenarios[coldPercentage] =
            config.coldStartCostPer1M * coldPercentage +
            config.costPer1MInvocations * warmPercentage;
        } else {
          scenarios[coldPercentage] = config.costPer1MInvocations;
        }
      });

      return {
        memoryMB: config.memoryMB,
        scenarios: scenarios,
        useCase: this.costAnalyzer.determineBestUseCase(config, costAnalysis),
      };
    });

    return {
      warmStart: warmStartData,
      coldStart: coldStartData,
      blended: blendedData,
      hasAnyColdStart: coldConfigs.length > 0,
    };
  }

  /**
   * Generate scenario optimization data
   */
  generateScenarioData(costEfficiencyAnalysis: CostEfficiencyAnalysis): ScenarioData {
    return this.insightsAnalyzer.generateScenarioOptimizations(costEfficiencyAnalysis);
  }

  /**
   * Generate data quality analysis
   */
  generateDataQualityData(testResults: TestResults): DataQualityData {
    return this.insightsAnalyzer.analyzeDataQuality(testResults);
  }

  /**
   * Generate overview data for reporting
   */
  generateOverviewData(testResults: TestResults): OverviewData {
    return {
      timestamp: testResults.timestamp,
      totalFunctionsTested: testResults.summary.totalFunctionsTested,
      testTypes: {
        basic: testResults.basicFunctions ? testResults.basicFunctions.length : 0,
        computation: testResults.computationFunctions ? testResults.computationFunctions.length : 0,
      },
    };
  }

  /**
   * Generate recommendations data for reporting
   */
  generateRecommendationsData(testResults: TestResults): RecommendationsData {
    const recommendations: RecommendationsData = {};

    if (testResults.summary.optimalMemoryConfigurations.basic) {
      recommendations.basic = testResults.summary.optimalMemoryConfigurations.basic;
    }

    if (testResults.summary.optimalMemoryConfigurations.computation) {
      recommendations.computation = testResults.summary.optimalMemoryConfigurations.computation;
    }

    return recommendations;
  }

  /**
   * Generate analysis data for reporting
   */
  generateAnalysisData(testResults: TestResults): AnalysisData {
    const analysis: AnalysisData = {};

    if (testResults.summary.costEfficiencyAnalysis.basic) {
      analysis.basic = this.generateFunctionAnalysisData(
        testResults.summary.costEfficiencyAnalysis.basic,
        'basic'

    }

    if (testResults.summary.costEfficiencyAnalysis.computation) {
      analysis.computation = this.generateFunctionAnalysisData(
        testResults.summary.costEfficiencyAnalysis.computation,
        'computation'
      );

    return analysis;
  }
}

export default AnalysisCoordinator;
