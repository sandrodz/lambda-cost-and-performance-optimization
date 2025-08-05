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
                // Calculate warm start cost using configurable pricing
                // Convert memory from MB to GB (1 GB = 1024 MB) and execution time from ms to seconds
                const memoryGB = result.memoryMB / 1024; // MB to GB conversion
                const executionTimeSeconds = result.warmStart.average / 1000; // ms to seconds conversion
                const warmGbSeconds = memoryGB * executionTimeSeconds;
                const warmCostPer1MInvocations = warmGbSeconds * this.config.lambdaPricePerGbSecond * this.config.costCalculationScale;
                
                let coldGbSeconds = 0;
                let coldCostPer1MInvocations = 0;
                let blendedCostPer1MInvocations = warmCostPer1MInvocations; // Default to warm cost
                
                // Calculate cold start cost if data is available
                if (result.coldStart && result.coldStart.average > 0) {
                    const coldExecutionTimeSeconds = result.coldStart.average / 1000; // ms to seconds conversion
                    coldGbSeconds = memoryGB * coldExecutionTimeSeconds;
                    coldCostPer1MInvocations = coldGbSeconds * this.config.lambdaPricePerGbSecond * this.config.costCalculationScale;
                    
                    // Blended cost using configurable cold start percentage
                    const coldPercentage = this.config.defaultColdStartPercentage;
                    const warmPercentage = 1 - coldPercentage;
                    blendedCostPer1MInvocations = (coldCostPer1MInvocations * coldPercentage) + (warmCostPer1MInvocations * warmPercentage);
                }
                
                costAnalysis.push({
                    memoryMB: result.memoryMB,
                    avgExecutionTime: result.warmStart.average,
                    coldStartTime: result.coldStart ? result.coldStart.average : null,
                    costPer1MInvocations: warmCostPer1MInvocations,
                    coldStartCostPer1M: coldCostPer1MInvocations,
                    blendedCostPer1M: blendedCostPer1MInvocations,
                    costEfficiencyScore: this.config.costCalculationScale / blendedCostPer1MInvocations // Higher is better, using blended cost
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

    // Determine best use case based on actual performance characteristics
    determineBestUseCase(config, costAnalysis) {
        const allConfigs = costAnalysis.allConfigurations;
        
        // Find optimal configurations for different scenarios
        const warmOptimal = allConfigs.reduce((best, current) => 
            current.costPer1MInvocations < best.costPer1MInvocations ? current : best);
        const perfOptimal = allConfigs.reduce((fastest, current) => 
            current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest);
        const mostCostEfficient = costAnalysis.mostCostEfficient;
        
        // Determine use case based on where this config ranks
        if (config.memoryMB === warmOptimal.memoryMB) {
            return 'High frequency (best warm cost)';
        } else if (config.memoryMB === perfOptimal.memoryMB) {
            return 'Cold start sensitive (fastest)';
        } else if (config.memoryMB === mostCostEfficient.memoryMB) {
            return 'Most cost efficient (blended)';
        } else {
            // Analyze position in the cost/performance spectrum
            const costRank = allConfigs.findIndex(c => c.memoryMB === config.memoryMB);
            const totalConfigs = allConfigs.length;
            
            if (costRank < totalConfigs / 3) {
                return 'Budget focused';
            } else if (costRank > (totalConfigs * 2) / 3) {
                return 'Performance focused';
            } else {
                return 'Balanced workload';
            }
        }
    }

    generateComprehensiveReport() {
        console.log('\n📊 Comprehensive Performance Report');
        console.log('=' .repeat(80));
        
        // Generate all analysis data objects first
        const reportData = this.generateReportData();
        
        // Then render the visual output
        this.renderReport(reportData);
    }

    generateReportData() {
        const reportData = {
            overview: this.generateOverviewData(),
            recommendations: this.generateRecommendationsData(),
            analysis: this.generateAnalysisData(),
            insights: this.testResults.summary.performanceInsights || [],
            scenarios: this.generateScenarioData(),
            dataQuality: this.generateDataQualityData()
        };
        
        return reportData;
    }

    generateOverviewData() {
        return {
            timestamp: new Date(this.testResults.timestamp).toLocaleString(),
            totalFunctionsTested: this.testResults.summary.totalFunctionsTested,
            testTypes: {
                basic: this.testResults.basicFunctions ? this.testResults.basicFunctions.length : 0,
                computation: this.testResults.computationFunctions ? this.testResults.computationFunctions.length : 0
            }
        };
    }

    generateRecommendationsData() {
        const recommendations = {};
        
        if (this.testResults.summary.optimalMemoryConfigurations.basic) {
            recommendations.basic = this.testResults.summary.optimalMemoryConfigurations.basic;
        }
        
        if (this.testResults.summary.optimalMemoryConfigurations.computation) {
            recommendations.computation = this.testResults.summary.optimalMemoryConfigurations.computation;
        }
        
        return recommendations;
    }

    generateAnalysisData() {
        const analysis = {};
        
        if (this.testResults.summary.costEfficiencyAnalysis.basic) {
            analysis.basic = this.generateFunctionAnalysisData(this.testResults.summary.costEfficiencyAnalysis.basic, 'basic');
        }
        
        if (this.testResults.summary.costEfficiencyAnalysis.computation) {
            analysis.computation = this.generateFunctionAnalysisData(this.testResults.summary.costEfficiencyAnalysis.computation, 'computation');
        }
        
        return analysis;
    }

    generateFunctionAnalysisData(costAnalysis, functionType) {
        const warmBaseline = costAnalysis.allConfigurations[0];
        
        const warmStartData = costAnalysis.allConfigurations.map(config => ({
            memoryMB: config.memoryMB,
            executionTime: config.avgExecutionTime,
            cost: config.costPer1MInvocations,
            performanceGain: warmBaseline.avgExecutionTime > 0 ? 
                (((warmBaseline.avgExecutionTime - config.avgExecutionTime) / warmBaseline.avgExecutionTime) * 100) : 0,
            costChange: warmBaseline.costPer1MInvocations > 0 ? 
                (((config.costPer1MInvocations - warmBaseline.costPer1MInvocations) / warmBaseline.costPer1MInvocations) * 100) : 0
        }));

        // Cold start data (if available)
        const coldConfigs = costAnalysis.allConfigurations.filter(config => config.coldStartTime !== null);
        let coldStartData = [];
        if (coldConfigs.length > 0) {
            const coldBaseline = coldConfigs[0];
            coldStartData = coldConfigs.map(config => ({
                memoryMB: config.memoryMB,
                executionTime: config.coldStartTime,
                cost: config.coldStartCostPer1M,
                performanceGain: coldBaseline.coldStartTime > 0 ? 
                    (((coldBaseline.coldStartTime - config.coldStartTime) / coldBaseline.coldStartTime) * 100) : 0,
                costChange: coldBaseline.coldStartCostPer1M > 0 ? 
                    (((config.coldStartCostPer1M - coldBaseline.coldStartCostPer1M) / coldBaseline.coldStartCostPer1M) * 100) : 0
            }));
        }

        // Blended scenarios data
        const blendedData = costAnalysis.allConfigurations.map(config => {
            const scenarios = {};
            this.config.blendedScenarios.forEach(coldPercentage => {
                const warmPercentage = 1 - coldPercentage;
                if (config.coldStartCostPer1M > 0) {
                    scenarios[coldPercentage] = (config.coldStartCostPer1M * coldPercentage) + (config.costPer1MInvocations * warmPercentage);
                } else {
                    scenarios[coldPercentage] = config.costPer1MInvocations;
                }
            });
            
            return {
                memoryMB: config.memoryMB,
                scenarios: scenarios,
                useCase: this.determineBestUseCase(config, costAnalysis)
            };
        });

        return {
            warmStart: warmStartData,
            coldStart: coldStartData,
            blended: blendedData,
            hasAnyColdStart: coldConfigs.length > 0
        };
    }

    generateScenarioData() {
        const scenarios = {};
        
        if (this.testResults.summary.costEfficiencyAnalysis.basic) {
            const basicCost = this.testResults.summary.costEfficiencyAnalysis.basic;
            scenarios.basic = {
                warmOptimal: basicCost.allConfigurations.reduce((best, current) => 
                    current.costPer1MInvocations < best.costPer1MInvocations ? current : best),
                perfOptimal: basicCost.allConfigurations.reduce((fastest, current) => 
                    current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest)
            };
        }
        
        if (this.testResults.summary.costEfficiencyAnalysis.computation) {
            const compCost = this.testResults.summary.costEfficiencyAnalysis.computation;
            scenarios.computation = {
                warmOptimal: compCost.allConfigurations.reduce((best, current) => 
                    current.costPer1MInvocations < best.costPer1MInvocations ? current : best),
                perfOptimal: compCost.allConfigurations.reduce((fastest, current) => 
                    current.avgExecutionTime < fastest.avgExecutionTime ? current : fastest)
            };
        }
        
        return scenarios;
    }

    generateDataQualityData() {
        const dataQuality = {};
        
        if (this.testResults.basicFunctions) {
            dataQuality.basic = {
                totalConfigurations: this.testResults.basicFunctions.length,
                configurations: this.testResults.basicFunctions.map(result => ({
                    memoryMB: result.memoryMB,
                    coldCount: result.coldStart ? result.coldStart.count : 0,
                    warmCount: result.warmStart ? result.warmStart.count : 0
                }))
            };
        }
        
        if (this.testResults.computationFunctions) {
            dataQuality.computation = {
                totalConfigurations: this.testResults.computationFunctions.length,
                configurations: this.testResults.computationFunctions.map(result => ({
                    memoryMB: result.memoryMB,
                    coldCount: result.coldStart ? result.coldStart.count : 0,
                    warmCount: result.warmStart ? result.warmStart.count : 0
                }))
            };
        }
        
        return dataQuality;
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
