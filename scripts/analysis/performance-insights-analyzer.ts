/**
 * Performance Insights Generator
 * Analyzes test results and generates actionable insights
 */

import {
    TestConfig,
    TestResults,
    TestSummary,
    CostEfficiencyAnalysis,
    CostAnalyzerOutput,
    ScenarioData,
    DataQualityData
} from '../types';

class PerformanceInsightsAnalyzer {
    constructor(_config: TestConfig) {
        // Config stored but not currently used in this analyzer
    }

    /**
     * Generate performance insights from summary data
     */
    generatePerformanceInsights(summary: TestSummary, testResults: TestResults): string[] {
        const insights: string[] = [];

        // Compare basic vs computation optimal configurations
        if (testResults.basicFunctions && testResults.computationFunctions) {
            const basicOptimal = summary.optimalMemoryConfigurations.basic;
            const computationOptimal = summary.optimalMemoryConfigurations.computation;

            if (basicOptimal && computationOptimal) {
                if (basicOptimal.memoryMB !== computationOptimal.memoryMB) {
                    insights.push(`Different workloads require different memory configurations: Basic functions perform best at ${basicOptimal.memoryMB}MB, while computation functions perform best at ${computationOptimal.memoryMB}MB`);
                } else {
                    insights.push(`Both basic and computation functions perform optimally at ${basicOptimal.memoryMB}MB`);
                }
            }
        }

        // Add cost-performance trade-off insights for basic functions
        if (summary.costEfficiencyAnalysis.basic) {
            this.addFunctionInsights(insights, summary.costEfficiencyAnalysis.basic, 'basic');
        }

        // Add cost-performance trade-off insights for computation functions
        if (summary.costEfficiencyAnalysis.computation) {
            this.addFunctionInsights(insights, summary.costEfficiencyAnalysis.computation, 'computation');
        }

        return insights;
    }

    /**
     * Add function-specific insights (private method)
     */
    private addFunctionInsights(insights: string[], costAnalysis: CostAnalyzerOutput, functionType: string): void {
        const baseline = costAnalysis.allConfigurations[0]; // 128MB
        const fastest = costAnalysis.allConfigurations.reduce((fastest, current) => 
            current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest);
        const mostCostEfficient = costAnalysis.mostCostEfficient;
        
        // Performance vs cost trade-off insight
        if (fastest.memoryMB !== baseline.memoryMB) {
            const perfImprovement = ((baseline.avgExecutionTime - fastest.avgExecutionTime) / baseline.avgExecutionTime * 100);
            const costIncrease = ((fastest.blendedCostPer1M - baseline.blendedCostPer1M) / baseline.blendedCostPer1M * 100);
            insights.push(`For ${functionType} functions: ${fastest.memoryMB}MB is ${perfImprovement.toFixed(1)}% faster than ${baseline.memoryMB}MB but costs ${costIncrease.toFixed(1)}% more (blended cost)`);
        }
        
        // Cost optimization insight
        if (mostCostEfficient.memoryMB !== baseline.memoryMB) {
            const costSavings = ((baseline.blendedCostPer1M - mostCostEfficient.blendedCostPer1M) / baseline.blendedCostPer1M * 100);
            if (costSavings > 0) {
                insights.push(`Most cost-efficient ${functionType} config: ${mostCostEfficient.memoryMB}MB saves ${costSavings.toFixed(1)}% blended cost vs 128MB baseline`);
            }
        }
    }

    /**
     * Generate scenario-based optimization recommendations
     */
    generateScenarioOptimizations(costEfficiencyAnalysis: CostEfficiencyAnalysis): ScenarioData {
        const scenarios: ScenarioData = {};
        
        if (costEfficiencyAnalysis.basic) {
            const basicCost = costEfficiencyAnalysis.basic;
            scenarios.basic = {
                warmOptimal: basicCost.allConfigurations.reduce((best, current) => 
                    current.costPer1MInvocations < best.costPer1MInvocations ? current : best),
                perfOptimal: basicCost.allConfigurations.reduce((fastest, current) => 
                    current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest)
            };
        }
        
        if (costEfficiencyAnalysis.computation) {
            const compCost = costEfficiencyAnalysis.computation;
            scenarios.computation = {
                warmOptimal: compCost.allConfigurations.reduce((best, current) => 
                    current.costPer1MInvocations < best.costPer1MInvocations ? current : best),
                perfOptimal: compCost.allConfigurations.reduce((fastest, current) => 
                    current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest)
            };
        }
        
        return scenarios;
    }

    /**
     * Analyze data quality and collection completeness
     */
    analyzeDataQuality(testResults: TestResults): DataQualityData {
        const dataQuality: DataQualityData = {};
        
        if (testResults.basicFunctions) {
            dataQuality.basic = {
                totalConfigurations: testResults.basicFunctions.length,
                configurations: testResults.basicFunctions.map((result) => ({
                    memoryMB: result.memoryMB,
                    coldCount: result.coldStart ? result.coldStart.count : 0,
                    warmCount: result.warmStart ? result.warmStart.count : 0
                }))
            };
        }
        
        if (testResults.computationFunctions) {
            dataQuality.computation = {
                totalConfigurations: testResults.computationFunctions.length,
                configurations: testResults.computationFunctions.map((result) => ({
                    memoryMB: result.memoryMB,
                    coldCount: result.coldStart ? result.coldStart.count : 0,
                    warmCount: result.warmStart ? result.warmStart.count : 0
                }))
            };
        }
        
        return dataQuality;
    }
}

export default PerformanceInsightsAnalyzer;
