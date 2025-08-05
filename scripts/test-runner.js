const fs = require('fs');
const path = require('path');

// Import individual test modules
const { runAllTests: runBasicTests } = require('./test-basic-functions');
const { runAllTests: runComputationTests } = require('./test-computation-functions');

/**
 * Performance Test Orchestrator
 * Coordinates execution of specialized test scripts and generates comprehensive reports
 */
class PerformanceTestRunner {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            basicFunctions: null,
            computationFunctions: null,
            summary: {}
        };
    }

    async init() {
        console.log('🚀 Initializing Performance Test Orchestrator...');
        console.log('📋 This runner coordinates test execution and generates comprehensive reports');
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
            this.generateSummaryAnalysis();
            
            console.log('\n✅ All tests completed successfully!');
            return this.testResults;
            
        } catch (error) {
            console.error('\n❌ Test execution failed:', error.message);
            throw error;
        }
    }

    generateSummaryAnalysis() {
        console.log('\n📊 Generating Summary Analysis...');
        
        const summary = {
            totalFunctionsTested: 0,
            optimalMemoryConfigurations: {},
            costEfficiencyAnalysis: {},
            performanceInsights: {}
        };

        // Analyze basic functions
        if (this.testResults.basicFunctions) {
            summary.totalFunctionsTested += this.testResults.basicFunctions.length;
            summary.optimalMemoryConfigurations.basic = this.findOptimalMemoryConfig(this.testResults.basicFunctions);
            summary.costEfficiencyAnalysis.basic = this.analyzeCostEfficiency(this.testResults.basicFunctions, 'basic');
        }

        // Analyze computation functions
        if (this.testResults.computationFunctions) {
            summary.totalFunctionsTested += this.testResults.computationFunctions.length;
            summary.optimalMemoryConfigurations.computation = this.findOptimalMemoryConfig(this.testResults.computationFunctions);
            summary.costEfficiencyAnalysis.computation = this.analyzeCostEfficiency(this.testResults.computationFunctions, 'computation');
        }

        // Generate performance insights
        summary.performanceInsights = this.generatePerformanceInsights(summary);

        this.testResults.summary = summary;
    }

    findOptimalMemoryConfig(results) {
        if (!results || results.length === 0) return null;

        let bestConfig = null;
        let bestScore = 0;

        // First, calculate cost efficiency for each configuration
        const costAnalysis = this.analyzeCostEfficiency(results, 'temp');
        if (!costAnalysis) return null;

        results.forEach(result => {
            if (result.warmStart) {
                // Find the corresponding cost analysis for this memory configuration
                const costData = costAnalysis.allConfigurations.find(c => c.memoryMB === result.memoryMB);
                if (!costData) return;

                // Performance score (higher for faster execution)
                const performanceScore = 1000 / result.warmStart.average;
                
                // Cost efficiency score (higher for better cost efficiency)
                const costEfficiencyScore = costData.costEfficiencyScore / 10000; // More conservative normalization
                
                // Cold start improvement bonus (if available)
                let coldStartBonus = 0;
                if (result.coldStart) {
                    // Bonus for better cold start performance (lower cold start time)
                    coldStartBonus = 1000 / result.coldStart.average;
                }
                
                // Balanced score: 50% performance, 30% cost efficiency, 20% cold start
                const totalScore = (performanceScore * 0.5) + (costEfficiencyScore * 0.3) + (coldStartBonus * 0.2);
                
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestConfig = {
                        memoryMB: result.memoryMB,
                        warmStartAvg: result.warmStart.average,
                        coldStartAvg: result.coldStart ? result.coldStart.average : null,
                        blendedCost: costData.blendedCostPer1M,
                        recommendation: 'Balanced performance and cost efficiency'
                    };
                }
            }
        });

        return bestConfig;
    }

    analyzeCostEfficiency(results, functionType) {
        if (!results || results.length === 0) return null;

        const costAnalysis = [];

        results.forEach(result => {
            if (result.warmStart) {
                // AWS Lambda pricing: $0.0000166667 per GB-second
                const warmGbSeconds = (result.memoryMB / 1024) * (result.warmStart.average / 1000);
                const warmCostPer1MInvocations = warmGbSeconds * 0.0000166667 * 1000000;
                
                let coldGbSeconds = 0;
                let coldCostPer1MInvocations = 0;
                let blendedCostPer1MInvocations = warmCostPer1MInvocations; // Default to warm cost
                
                // Calculate cold start cost if data is available
                if (result.coldStart && result.coldStart.average > 0) {
                    coldGbSeconds = (result.memoryMB / 1024) * (result.coldStart.average / 1000);
                    coldCostPer1MInvocations = coldGbSeconds * 0.0000166667 * 1000000;
                    
                    // Blended cost assuming 10% cold starts, 90% warm starts (typical for many workloads)
                    blendedCostPer1MInvocations = (coldCostPer1MInvocations * 0.1) + (warmCostPer1MInvocations * 0.9);
                }
                
                costAnalysis.push({
                    memoryMB: result.memoryMB,
                    avgExecutionTime: result.warmStart.average,
                    coldStartTime: result.coldStart ? result.coldStart.average : null,
                    costPer1MInvocations: warmCostPer1MInvocations,
                    coldStartCostPer1M: coldCostPer1MInvocations,
                    blendedCostPer1M: blendedCostPer1MInvocations,
                    costEfficiencyScore: 1000000 / blendedCostPer1MInvocations // Higher is better, using blended cost
                });
            }
        });

        // Sort by memory size for easier comparison
        costAnalysis.sort((a, b) => a.memoryMB - b.memoryMB);

        return {
            mostCostEfficient: costAnalysis.reduce((best, current) => 
                current.costEfficiencyScore > best.costEfficiencyScore ? current : best),
            leastCostEfficient: costAnalysis.reduce((worst, current) => 
                current.costEfficiencyScore < worst.costEfficiencyScore ? current : worst),
            allConfigurations: costAnalysis
        };
    }

    generatePerformanceInsights(summary) {
        const insights = [];

        if (this.testResults.basicFunctions && this.testResults.computationFunctions) {
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

        // Add cost-performance trade-off insights
        if (summary.costEfficiencyAnalysis.basic) {
            const basicCost = summary.costEfficiencyAnalysis.basic;
            const baseline = basicCost.allConfigurations[0]; // 128MB
            const fastest = basicCost.allConfigurations.reduce((fastest, current) => 
                current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest);
            const mostCostEfficient = basicCost.mostCostEfficient;
            
            if (fastest.memoryMB !== baseline.memoryMB) {
                const perfImprovement = ((baseline.avgExecutionTime - fastest.avgExecutionTime) / baseline.avgExecutionTime * 100);
                const costIncrease = ((fastest.blendedCostPer1M - baseline.blendedCostPer1M) / baseline.blendedCostPer1M * 100);
                insights.push(`For basic functions: ${fastest.memoryMB}MB is ${perfImprovement.toFixed(1)}% faster than ${baseline.memoryMB}MB but costs ${costIncrease.toFixed(1)}% more (blended cost)`);
            }
            
            if (mostCostEfficient.memoryMB !== baseline.memoryMB) {
                const costSavings = ((baseline.blendedCostPer1M - mostCostEfficient.blendedCostPer1M) / baseline.blendedCostPer1M * 100);
                if (costSavings > 0) {
                    insights.push(`Most cost-efficient basic config: ${mostCostEfficient.memoryMB}MB saves ${costSavings.toFixed(1)}% blended cost vs 128MB baseline`);
                }
            }
        }

        if (summary.costEfficiencyAnalysis.computation) {
            const compCost = summary.costEfficiencyAnalysis.computation;
            const baseline = compCost.allConfigurations[0]; // 128MB
            const fastest = compCost.allConfigurations.reduce((fastest, current) => 
                current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest);
            const mostCostEfficient = compCost.mostCostEfficient;
            
            if (fastest.memoryMB !== baseline.memoryMB) {
                const perfImprovement = ((baseline.avgExecutionTime - fastest.avgExecutionTime) / baseline.avgExecutionTime * 100);
                const costIncrease = ((fastest.blendedCostPer1M - baseline.blendedCostPer1M) / baseline.blendedCostPer1M * 100);
                insights.push(`For computation functions: ${fastest.memoryMB}MB is ${perfImprovement.toFixed(1)}% faster than ${baseline.memoryMB}MB but costs ${costIncrease.toFixed(1)}% more (blended cost)`);
            }
            
            if (mostCostEfficient.memoryMB !== baseline.memoryMB) {
                const costSavings = ((baseline.blendedCostPer1M - mostCostEfficient.blendedCostPer1M) / baseline.blendedCostPer1M * 100);
                if (costSavings > 0) {
                    insights.push(`Most cost-efficient computation config: ${mostCostEfficient.memoryMB}MB saves ${costSavings.toFixed(1)}% blended cost vs 128MB baseline`);
                }
            }
        }

        return insights;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateComprehensiveReport() {
        console.log('\n📊 Comprehensive Performance Report');
        console.log('=' .repeat(80));
        
        // Test Overview
        console.log('\n📋 Test Overview:');
        console.log(`  • Test Timestamp: ${new Date(this.testResults.timestamp).toLocaleString()}`);
        console.log(`  • Total Functions Tested: ${this.testResults.summary.totalFunctionsTested}`);
        
        // Optimal Memory Configurations
        console.log('\n🎯 Recommended Memory Configurations (Balanced):');
        console.log('─'.repeat(55));
        
        if (this.testResults.summary.optimalMemoryConfigurations.basic) {
            const basic = this.testResults.summary.optimalMemoryConfigurations.basic;
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
        
        if (this.testResults.summary.optimalMemoryConfigurations.computation) {
            const comp = this.testResults.summary.optimalMemoryConfigurations.computation;
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
        
        // Cost Efficiency Analysis
        console.log('\n💰 Detailed Cost vs Performance Analysis:');
        console.log('─'.repeat(80));
        
        if (this.testResults.summary.costEfficiencyAnalysis.basic) {
            const basicCost = this.testResults.summary.costEfficiencyAnalysis.basic;
            
            // Warm Start Analysis
            console.log(`\n  📈 Basic Functions - Warm Start Performance:`);
            console.log(`    Memory | Warm Time | Warm Cost/1M | Perf Gain | Cost Change`);
            console.log(`    ────────────────────────────────────────────────────────────`);
            
            const warmBaseline = basicCost.allConfigurations[0];
            basicCost.allConfigurations.forEach(config => {
                const perfGain = warmBaseline.avgExecutionTime > 0 ? 
                    (((warmBaseline.avgExecutionTime - config.avgExecutionTime) / warmBaseline.avgExecutionTime) * 100) : 0;
                const costChange = warmBaseline.costPer1MInvocations > 0 ? 
                    (((config.costPer1MInvocations - warmBaseline.costPer1MInvocations) / warmBaseline.costPer1MInvocations) * 100) : 0;
                
                console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${config.avgExecutionTime.toFixed(1).padStart(8)}ms | $${config.costPer1MInvocations.toFixed(4).padStart(10)} | ${perfGain >= 0 ? '+' : ''}${perfGain.toFixed(1).padStart(8)}% | ${costChange >= 0 ? '+' : ''}${costChange.toFixed(1).padStart(9)}%`);
            });

            // Cold Start Analysis (if data available)
            const hasAnyColdStart = basicCost.allConfigurations.some(config => config.coldStartTime !== null);
            if (hasAnyColdStart) {
                console.log(`\n  ❄️  Basic Functions - Cold Start Performance:`);
                console.log(`    Memory | Cold Time | Cold Cost/1M | Perf Gain | Cost Change`);
                console.log(`    ────────────────────────────────────────────────────────────`);
                
                const coldConfigs = basicCost.allConfigurations.filter(config => config.coldStartTime !== null);
                if (coldConfigs.length > 0) {
                    const coldBaseline = coldConfigs[0];
                    coldConfigs.forEach(config => {
                        const perfGain = coldBaseline.coldStartTime > 0 ? 
                            (((coldBaseline.coldStartTime - config.coldStartTime) / coldBaseline.coldStartTime) * 100) : 0;
                        const costChange = coldBaseline.coldStartCostPer1M > 0 ? 
                            (((config.coldStartCostPer1M - coldBaseline.coldStartCostPer1M) / coldBaseline.coldStartCostPer1M) * 100) : 0;
                        
                        console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${config.coldStartTime.toFixed(0).padStart(8)}ms | $${config.coldStartCostPer1M.toFixed(4).padStart(10)} | ${perfGain >= 0 ? '+' : ''}${perfGain.toFixed(1).padStart(8)}% | ${costChange >= 0 ? '+' : ''}${costChange.toFixed(1).padStart(9)}%`);
                    });
                }
            }

            // Blended Scenarios
            console.log(`\n  🔀 Basic Functions - Blended Cost Scenarios:`);
            console.log(`    Memory | 5% Cold | 10% Cold | 20% Cold | 50% Cold | Best Use Case`);
            console.log(`    ──────────────────────────────────────────────────────────────────────`);
            
            basicCost.allConfigurations.forEach(config => {
                let blended5 = config.costPer1MInvocations; // Default to warm cost
                let blended10 = config.costPer1MInvocations;
                let blended20 = config.costPer1MInvocations;
                let blended50 = config.costPer1MInvocations;
                
                if (config.coldStartCostPer1M > 0) {
                    blended5 = (config.coldStartCostPer1M * 0.05) + (config.costPer1MInvocations * 0.95);
                    blended10 = (config.coldStartCostPer1M * 0.10) + (config.costPer1MInvocations * 0.90);
                    blended20 = (config.coldStartCostPer1M * 0.20) + (config.costPer1MInvocations * 0.80);
                    blended50 = (config.coldStartCostPer1M * 0.50) + (config.costPer1MInvocations * 0.50);
                }
                
                // Determine best use case
                let useCase = 'High frequency';
                if (config.memoryMB >= 1024) useCase = 'Balanced workload';
                if (config.memoryMB >= 2048) useCase = 'Cold start sensitive';
                
                console.log(`    ${config.memoryMB.toString().padStart(4)}MB | $${blended5.toFixed(4)} | $${blended10.toFixed(4)} | $${blended20.toFixed(4)} | $${blended50.toFixed(4)} | ${useCase}`);
            });
        }
        
        if (this.testResults.summary.costEfficiencyAnalysis.computation) {
            const compCost = this.testResults.summary.costEfficiencyAnalysis.computation;
            
            // Warm Start Analysis
            console.log(`\n  📈 Computation Functions - Warm Start Performance:`);
            console.log(`    Memory | Warm Time | Warm Cost/1M | Perf Gain | Cost Change`);
            console.log(`    ────────────────────────────────────────────────────────────`);
            
            const warmBaseline = compCost.allConfigurations[0];
            compCost.allConfigurations.forEach(config => {
                const perfGain = warmBaseline.avgExecutionTime > 0 ? 
                    (((warmBaseline.avgExecutionTime - config.avgExecutionTime) / warmBaseline.avgExecutionTime) * 100) : 0;
                const costChange = warmBaseline.costPer1MInvocations > 0 ? 
                    (((config.costPer1MInvocations - warmBaseline.costPer1MInvocations) / warmBaseline.costPer1MInvocations) * 100) : 0;
                
                console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${config.avgExecutionTime.toFixed(0).padStart(8)}ms | $${config.costPer1MInvocations.toFixed(2).padStart(10)} | ${perfGain >= 0 ? '+' : ''}${perfGain.toFixed(1).padStart(8)}% | ${costChange >= 0 ? '+' : ''}${costChange.toFixed(1).padStart(9)}%`);
            });

            // Cold Start Analysis (if data available)
            const hasAnyColdStart = compCost.allConfigurations.some(config => config.coldStartTime !== null);
            if (hasAnyColdStart) {
                console.log(`\n  ❄️  Computation Functions - Cold Start Performance:`);
                console.log(`    Memory | Cold Time | Cold Cost/1M | Perf Gain | Cost Change`);
                console.log(`    ────────────────────────────────────────────────────────────`);
                
                const coldConfigs = compCost.allConfigurations.filter(config => config.coldStartTime !== null);
                if (coldConfigs.length > 0) {
                    const coldBaseline = coldConfigs[0];
                    coldConfigs.forEach(config => {
                        const perfGain = coldBaseline.coldStartTime > 0 ? 
                            (((coldBaseline.coldStartTime - config.coldStartTime) / coldBaseline.coldStartTime) * 100) : 0;
                        const costChange = coldBaseline.coldStartCostPer1M > 0 ? 
                            (((config.coldStartCostPer1M - coldBaseline.coldStartCostPer1M) / coldBaseline.coldStartCostPer1M) * 100) : 0;
                        
                        console.log(`    ${config.memoryMB.toString().padStart(4)}MB | ${config.coldStartTime.toFixed(0).padStart(8)}ms | $${config.coldStartCostPer1M.toFixed(2).padStart(10)} | ${perfGain >= 0 ? '+' : ''}${perfGain.toFixed(1).padStart(8)}% | ${costChange >= 0 ? '+' : ''}${costChange.toFixed(1).padStart(9)}%`);
                    });
                }
            }

            // Blended Scenarios
            console.log(`\n  🔀 Computation Functions - Blended Cost Scenarios:`);
            console.log(`    Memory | 5% Cold | 10% Cold | 20% Cold | 50% Cold | Best Use Case`);
            console.log(`    ──────────────────────────────────────────────────────────────────────`);
            
            compCost.allConfigurations.forEach(config => {
                let blended5 = config.costPer1MInvocations; // Default to warm cost
                let blended10 = config.costPer1MInvocations;
                let blended20 = config.costPer1MInvocations;
                let blended50 = config.costPer1MInvocations;
                
                if (config.coldStartCostPer1M > 0) {
                    blended5 = (config.coldStartCostPer1M * 0.05) + (config.costPer1MInvocations * 0.95);
                    blended10 = (config.coldStartCostPer1M * 0.10) + (config.costPer1MInvocations * 0.90);
                    blended20 = (config.coldStartCostPer1M * 0.20) + (config.costPer1MInvocations * 0.80);
                    blended50 = (config.coldStartCostPer1M * 0.50) + (config.costPer1MInvocations * 0.50);
                }
                
                // Determine best use case
                let useCase = 'High frequency';
                if (config.memoryMB >= 1024) useCase = 'Balanced workload';
                if (config.memoryMB >= 2048) useCase = 'Cold start sensitive';
                
                console.log(`    ${config.memoryMB.toString().padStart(4)}MB | $${blended5.toFixed(2)} | $${blended10.toFixed(2)} | $${blended20.toFixed(2)} | $${blended50.toFixed(2)} | ${useCase}`);
            });
        }
        
        // Performance Insights
        if (this.testResults.summary.performanceInsights.length > 0) {
            console.log('\n💡 Key Performance Insights:');
            console.log('─'.repeat(60));
            this.testResults.summary.performanceInsights.forEach((insight, index) => {
                console.log(`  ${index + 1}. ${insight}`);
            });
        }

        // Scenario-based Recommendations
        console.log('\n🎯 Scenario-based Recommendations:');
        console.log('─'.repeat(60));
        
        if (this.testResults.summary.costEfficiencyAnalysis.basic) {
            const basicCost = this.testResults.summary.costEfficiencyAnalysis.basic;
            const warmOptimal = basicCost.allConfigurations.reduce((best, current) => 
                current.costPer1MInvocations < best.costPer1MInvocations ? current : best);
            const perfOptimal = basicCost.allConfigurations.reduce((fastest, current) => 
                current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest);
            
            console.log(`  📈 Basic Functions:`);
            console.log(`    • High Frequency (>1000 req/min): ${warmOptimal.memoryMB}MB - Best warm start cost`);
            console.log(`    • Balanced Workload (100-1000 req/min): 512MB - Good performance/cost ratio`);
            console.log(`    • Low Frequency (<100 req/min): ${perfOptimal.memoryMB}MB - Minimize cold start impact`);
        }
        
        if (this.testResults.summary.costEfficiencyAnalysis.computation) {
            const compCost = this.testResults.summary.costEfficiencyAnalysis.computation;
            const warmOptimal = compCost.allConfigurations.reduce((best, current) => 
                current.costPer1MInvocations < best.costPer1MInvocations ? current : best);
            const perfOptimal = compCost.allConfigurations.reduce((fastest, current) => 
                current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest);
            
            console.log(`  🧮 Computation Functions:`);
            console.log(`    • High Frequency (>100 req/min): ${warmOptimal.memoryMB}MB - Best warm start cost`);
            console.log(`    • Balanced Workload (10-100 req/min): 1024MB - Good performance/cost ratio`);
            console.log(`    • Low Frequency (<10 req/min): ${perfOptimal.memoryMB}MB - Minimize cold start impact`);
        }
        
        // Data Quality Summary
        console.log('\n📈 Data Collection Summary:');
        console.log('─'.repeat(50));
        
        if (this.testResults.basicFunctions) {
            console.log(`  Basic Functions: ${this.testResults.basicFunctions.length} memory configurations tested`);
            this.testResults.basicFunctions.forEach(result => {
                const coldCount = result.coldStart ? result.coldStart.count : 0;
                const warmCount = result.warmStart ? result.warmStart.count : 0;
                console.log(`    • ${result.memoryMB}MB: ${coldCount} cold starts, ${warmCount} warm starts`);
            });
        }
        
        if (this.testResults.computationFunctions) {
            console.log(`  Computation Functions: ${this.testResults.computationFunctions.length} memory configurations tested`);
            this.testResults.computationFunctions.forEach(result => {
                const coldCount = result.coldStart ? result.coldStart.count : 0;
                const warmCount = result.warmStart ? result.warmStart.count : 0;
                console.log(`    • ${result.memoryMB}MB: ${coldCount} cold starts, ${warmCount} warm starts`);
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
