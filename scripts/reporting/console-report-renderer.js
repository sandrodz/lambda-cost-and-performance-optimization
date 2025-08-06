/**
 * Console Report Renderer
 * Handles all console output formatting for performance reports
 */
class ConsoleReportRenderer {
    constructor(config) {
        this.config = config;
    }

    /**
     * Render the complete report to console
     */
    renderReport(reportData) {
        this.renderOverview(reportData.overview);
        this.renderRecommendations(reportData.recommendations);
        this.renderAnalysis(reportData.analysis);
        this.renderInsights(reportData.insights);
        this.renderScenarios(reportData.scenarios);
        this.renderDataQuality(reportData.dataQuality);
    }

    /**
     * Render test overview section
     */
    renderOverview(overview) {
        console.log('\n📋 Test Overview:');
        console.log(`  • Test Timestamp: ${overview.timestamp}`);
        console.log(`  • Total Functions Tested: ${overview.totalFunctionsTested}`);
        console.log(`  • Basic Functions: ${overview.testTypes.basic} configurations`);
        console.log(`  • Computation Functions: ${overview.testTypes.computation} configurations`);
    }

    /**
     * Render memory configuration recommendations
     */
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

    /**
     * Render detailed cost vs performance analysis
     */
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

    /**
     * Render function-specific analysis tables
     */
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

    /**
     * Render performance insights
     */
    renderInsights(insights) {
        if (insights.length > 0) {
            console.log('\n💡 Key Performance Insights:');
            console.log('─'.repeat(60));
            insights.forEach((insight, index) => {
                console.log(`  ${index + 1}. ${insight}`);
            });
        }
    }

    /**
     * Render scenario-based recommendations
     */
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

    /**
     * Render data quality summary
     */
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
}

module.exports = ConsoleReportRenderer;
