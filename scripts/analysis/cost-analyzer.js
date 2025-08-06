/**
 * Cost Analysis Engine
 * Handles all cost efficiency calculations and performance analysis
 */
class CostAnalyzer {
    constructor(config) {
        this.config = config;
    }

    /**
     * Find the optimal memory configuration based on balanced scoring
     */
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

    /**
     * Analyze cost efficiency across all memory configurations
     */
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

    /**
     * Determine best use case based on actual performance characteristics
     */
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
}

module.exports = CostAnalyzer;
