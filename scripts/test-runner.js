const fs = require('fs');
const path = require('path');

// Import individual test modules
const { runAllTests: runBasicTests } = require('./test-basic-functions');
const { runAllTests: runComputationTests } = require('./test-computation-functions');

// Import analysis modules
const AnalysisCoordinator = require('./analysis/analysis-coordinator');

// Import reporting modules
const ReportGenerator = require('./reporting/report-generator');

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
        
        // Initialize report generator
        this.reportGenerator = new ReportGenerator(this.config, this.analysisCoordinator);
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
        
        // Save summary report as text using report generator
        const summaryFilename = `${resultsDir}/summary-report-${timestamp}.txt`;
        const reportContent = this.reportGenerator.generateReportText(this.testResults);
        
        // Add the header to the text file
        const fullReportContent = '📊 Comprehensive Performance Report\n' + 
                                '='.repeat(80) + '\n' + 
                                reportContent;
        
        fs.writeFileSync(summaryFilename, fullReportContent);
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
        testRunner.reportGenerator.generateComprehensiveReport(results);
        
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
