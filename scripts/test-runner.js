const fs = require('fs');
const path = require('path');

// Import individual test modules
const { runAllTests: runBasicTests } = require('./test-basic-functions');
const { runAllTests: runComputationTests } = require('./test-computation-functions');

// Import analysis modules
const AnalysisCoordinator = require('./analysis/analysis-coordinator');

/**
 * Performance Test Orchestrator
 * Coordinates execution of specialized test scripts and generates comprehensive reports
 */
class PerformanceTestRunner {
    constructor(options = {}) {
        this.testResults = {
            timestamp: new Date().toISOString(),
            basicFunctions: null,
            computationFunctions: null,
            summary: {}
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
            blendedScenarios: options.blendedScenarios || [0.05, 0.10, 0.20, 0.50] // 5%, 10%, 20%, 50%
        };

        // Initialize analysis coordinator
        this.analysisCoordinator = new AnalysisCoordinator(this.config);
    }

    async init() {
        console.log('🚀 Initializing Performance Test Orchestrator...');
        console.log('📋 This runner coordinates test execution and generates comprehensive reports');
        console.log(`💰 Using Lambda pricing: $${this.config.lambdaPricePerGbSecond} per GB-second`);
        console.log(`📊 Default blended cost model: ${(this.config.defaultColdStartPercentage * 100)}% cold starts`);
        console.log(`📈 Cost calculation scale: per ${this.config.costCalculationScale.toLocaleString()} invocations`);
        console.log('✅ Performance Test Runner initialized successfully');
    }

    async runComprehensiveTests() {
        console.log('\n🧪 Starting Comprehensive Performance Testing...');
        console.log('=' .repeat(60));
        
        try {
            // Run basic function tests
            console.log('\n🎯 Executing Basic Function Tests...');
            this.testResults.basicFunctions = await runBasicTests();
            
            // Add delay between test suites
            console.log('\n⏱️  Waiting 30 seconds before computation tests...');
            await this.sleep(30000);
            
            // Run computation function tests
            console.log('\n🧮 Executing Heavy Computation Tests...');
            this.testResults.computationFunctions = await runComputationTests();
            
            // Generate comprehensive analysis
            this.testResults.summary = this.analysisCoordinator.generateSummaryAnalysis(this.testResults);
            
            console.log('\n✅ All tests completed successfully!');
            return this.testResults;
            
        } catch (error) {
            console.error('\n❌ Test execution failed:', error.message);
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateComprehensiveReport() {
        console.log('\n📊 Comprehensive Performance Report');
        console.log('=' .repeat(80));
        
        // Generate all analysis data objects using the analysis coordinator
        const reportData = {
            overview: this.analysisCoordinator.generateOverviewData(this.testResults),
            recommendations: this.analysisCoordinator.generateRecommendationsData(this.testResults),
            analysis: this.analysisCoordinator.generateAnalysisData(this.testResults),
            insights: this.testResults.summary.performanceInsights || [],
            scenarios: this.analysisCoordinator.generateScenarioData(this.testResults.summary.costEfficiencyAnalysis),
            dataQuality: this.analysisCoordinator.generateDataQualityData(this.testResults)
        };
        
        // Then render the visual output
        this.renderReport(reportData);
    }

    renderReport(reportData) {
        this.renderOverview(reportData.overview);
        this.renderRecommendations(reportData.recommendations);
        this.renderAnalysis(reportData.analysis);
        this.renderInsights(reportData.insights);
        this.renderScenarios(reportData.scenarios);
        this.renderDataQuality(reportData.dataQuality);
    }

    renderOverview(overview) {
        console.log('\n📋 Test Overview:');
        console.log(`  • Test Timestamp: ${overview.timestamp}`);
        console.log(`  • Total Functions Tested: ${overview.totalFunctionsTested}`);
        console.log(`  • Basic Functions: ${overview.testTypes.basic} configurations`);
        console.log(`  • Computation Functions: ${overview.testTypes.computation} configurations`);
    }

    renderRecommendations(recommendations) {
        console.log('\n🎯 Recommended Memory Configurations (Balanced):');
        console.log('─'.repeat(55));
        
        if (recommendations.basic) {
            const basic = recommendations.basic;
            console.log(`  Basic Functions: ${basic.memoryMB}MB`);
            console.log(`    • Warm Start Avg: ${basic.warmStartAvg.toFixed(2)}ms`);
            if (basic.coldStartAvg !== null) {
                console.log(`    • Cold Start Avg: ${basic.coldStartAvg.toFixed(2)}ms`);
            } else {
                console.log(`    • Cold Start Avg: N/A (no cold starts collected)`);
            }
            console.log(`    • Blended Cost: $${basic.blendedCost.toFixed(4)} per 1M invocations`);
            console.log(`    • Recommendation: ${basic.recommendation}`);
        }
        
        if (recommendations.computation) {
            const comp = recommendations.computation;
            console.log(`  Computation Functions: ${comp.memoryMB}MB`);
            console.log(`    • Warm Start Avg: ${comp.warmStartAvg.toFixed(2)}ms`);
            if (comp.coldStartAvg !== null) {
                console.log(`    • Cold Start Avg: ${comp.coldStartAvg.toFixed(2)}ms`);
            } else {
                console.log(`    • Cold Start Avg: N/A (no cold starts collected)`);
            }
            console.log(`    • Blended Cost: $${comp.blendedCost.toFixed(4)} per 1M invocations`);
            console.log(`    • Recommendation: ${comp.recommendation}`);
        }
    }

    renderAnalysis(analysis) {
        console.log('\n💰 Detailed Cost vs Performance Analysis:');
        console.log('─'.repeat(80));
        
        if (analysis.basic) {
            this.renderFunctionAnalysis('Basic Functions', analysis.basic);
        }
        
        if (analysis.computation) {
            this.renderFunctionAnalysis('Computation Functions', analysis.computation);
        }
    }

    renderFunctionAnalysis(functionType, analysisData) {
        // Warm Start Analysis
        console.log(`\n  📈 ${functionType} - Warm Start Performance:`);
        console.log(`    Memory | Warm Time | Warm Cost/1M | Perf Gain | Cost Change`);
        console.log(`    ────────────────────────────────────────────────────────────`);
        
        analysisData.warmStart.forEach(config => {
            const timeUnit = functionType.includes('Computation') ? '0' : '1';
            const costPrecision = functionType.includes('Computation') ? '2' : '4';
            
            console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${config.executionTime.toFixed(timeUnit).padStart(8)}ms | $${config.cost.toFixed(costPrecision).padStart(10)} | ${config.performanceGain >= 0 ? '+' : ''}${config.performanceGain.toFixed(1).padStart(8)}% | ${config.costChange >= 0 ? '+' : ''}${config.costChange.toFixed(1).padStart(9)}%`);
        });

        // Cold Start Analysis (if available)
        if (analysisData.hasAnyColdStart) {
            console.log(`\n  ❄️  ${functionType} - Cold Start Performance:`);
            console.log(`    Memory | Cold Time | Cold Cost/1M | Perf Gain | Cost Change`);
            console.log(`    ────────────────────────────────────────────────────────────`);
            
            analysisData.coldStart.forEach(config => {
                const costPrecision = functionType.includes('Computation') ? '2' : '4';
                console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${config.executionTime.toFixed(0).padStart(8)}ms | $${config.cost.toFixed(costPrecision).padStart(10)} | ${config.performanceGain >= 0 ? '+' : ''}${config.performanceGain.toFixed(1).padStart(8)}% | ${config.costChange >= 0 ? '+' : ''}${config.costChange.toFixed(1).padStart(9)}%`);
            });
        }

        // Blended Scenarios
        console.log(`\n  🔀 ${functionType} - Blended Cost Scenarios:`);
        const scenarioHeaders = this.config.blendedScenarios.map(p => `${(p * 100).toFixed(0)}% Cold`).join(' | ');
        console.log(`    Memory | ${scenarioHeaders} | Best Use Case`);
        console.log(`    ──────────────────────────────────────────────────────────────────────`);
        
        analysisData.blended.forEach(config => {
            const costPrecision = functionType.includes('Computation') ? '2' : '4';
            const scenarioColumns = this.config.blendedScenarios.map(p => `$${config.scenarios[p].toFixed(costPrecision)}`).join(' | ');
            console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${scenarioColumns} | ${config.useCase}`);
        });
    }

    renderInsights(insights) {
        if (insights.length > 0) {
            console.log('\n💡 Key Performance Insights:');
            console.log('─'.repeat(60));
            insights.forEach((insight, index) => {
                console.log(`  ${index + 1}. ${insight}`);
            });
        }
    }

    renderScenarios(scenarios) {
        console.log('\n🎯 Scenario-based Recommendations:');
        console.log('─'.repeat(60));
        
        if (scenarios.basic) {
            console.log(`  📈 Basic Functions:`);
            console.log(`    • High Frequency (>1000 req/min): ${scenarios.basic.warmOptimal.memoryMB}MB - Best warm start cost`);
            console.log(`    • Balanced Workload (100-1000 req/min): 512MB - Good performance/cost ratio`);
            console.log(`    • Low Frequency (<100 req/min): ${scenarios.basic.perfOptimal.memoryMB}MB - Minimize cold start impact`);
        }
        
        if (scenarios.computation) {
            console.log(`  🧮 Computation Functions:`);
            console.log(`    • High Frequency (>100 req/min): ${scenarios.computation.warmOptimal.memoryMB}MB - Best warm start cost`);
            console.log(`    • Balanced Workload (10-100 req/min): 1024MB - Good performance/cost ratio`);
            console.log(`    • Low Frequency (<10 req/min): ${scenarios.computation.perfOptimal.memoryMB}MB - Minimize cold start impact`);
        }
    }

    renderDataQuality(dataQuality) {
        console.log('\n📈 Data Collection Summary:');
        console.log('─'.repeat(50));
        
        if (dataQuality.basic) {
            console.log(`  Basic Functions: ${dataQuality.basic.totalConfigurations} memory configurations tested`);
            dataQuality.basic.configurations.forEach(config => {
                console.log(`    • ${config.memoryMB}MB: ${config.coldCount} cold starts, ${config.warmCount} warm starts`);
            });
        }
        
        if (dataQuality.computation) {
            console.log(`  Computation Functions: ${dataQuality.computation.totalConfigurations} memory configurations tested`);
            dataQuality.computation.configurations.forEach(config => {
                console.log(`    • ${config.memoryMB}MB: ${config.coldCount} cold starts, ${config.warmCount} warm starts`);
            });
        }
    }

    saveResults() {
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
        
        // Save summary report as text
        const summaryFilename = `${resultsDir}/summary-report-${timestamp}.txt`;
        const originalLog = console.log;
        let reportContent = '';
        
        console.log = (...args) => {
            reportContent += args.join(' ') + '\n';
        };
        
        this.generateComprehensiveReport();
        
        console.log = originalLog;
        fs.writeFileSync(summaryFilename, reportContent);
        
        console.log(`✅ Summary report saved to: ${summaryFilename}`);
        
        return { dataFile: filename, summaryFile: summaryFilename };
    }
}

// Main execution function
async function main() {
    const testRunner = new PerformanceTestRunner();
    
    try {
        await testRunner.init();
        
        // Run comprehensive test suite
        const results = await testRunner.runComprehensiveTests();
        
        // Generate and display comprehensive report
        testRunner.generateComprehensiveReport();
        
        // Save all results
        const savedFiles = testRunner.saveResults();
        
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

module.exports = PerformanceTestRunner;
