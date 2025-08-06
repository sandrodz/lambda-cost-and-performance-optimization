const ConsoleReportRenderer = require('./console-report-renderer');

/**
 * Report Generator
 * Coordinates report data generation and rendering across multiple output formats
 */
class ReportGenerator {
    constructor(config, analysisCoordinator) {
        this.config = config;
        this.analysisCoordinator = analysisCoordinator;
        this.consoleRenderer = new ConsoleReportRenderer(config);
    }

    /**
     * Generate comprehensive report and display to console
     */
    generateComprehensiveReport(testResults) {
        console.log('\n📊 Comprehensive Performance Report');
        console.log('=' .repeat(80));
        
        // Generate all analysis data objects using the analysis coordinator
        const reportData = {
            overview: this.analysisCoordinator.generateOverviewData(testResults),
            recommendations: this.analysisCoordinator.generateRecommendationsData(testResults),
            analysis: this.analysisCoordinator.generateAnalysisData(testResults),
            insights: testResults.summary.performanceInsights || [],
            scenarios: this.analysisCoordinator.generateScenarioData(testResults.summary.costEfficiencyAnalysis),
            dataQuality: this.analysisCoordinator.generateDataQualityData(testResults)
        };
        
        // Render the visual output to console
        this.consoleRenderer.renderReport(reportData);
        
        return reportData;
    }

    /**
     * Generate report content as text (for file saving)
     */
    generateReportText(testResults) {
        const reportData = {
            overview: this.analysisCoordinator.generateOverviewData(testResults),
            recommendations: this.analysisCoordinator.generateRecommendationsData(testResults),
            analysis: this.analysisCoordinator.generateAnalysisData(testResults),
            insights: testResults.summary.performanceInsights || [],
            scenarios: this.analysisCoordinator.generateScenarioData(testResults.summary.costEfficiencyAnalysis),
            dataQuality: this.analysisCoordinator.generateDataQualityData(testResults)
        };
        
        let reportContent = '';
        const originalLog = console.log;
        
        // Capture console output as text
        console.log = (...args) => {
            reportContent += args.join(' ') + '\n';
        };
        
        // Generate the report content
        this.consoleRenderer.renderReport(reportData);
        
        // Restore original console.log
        console.log = originalLog;
        
        return reportContent;
    }

    /**
     * Get report data without rendering (for programmatic access)
     */
    getReportData(testResults) {
        return {
            overview: this.analysisCoordinator.generateOverviewData(testResults),
            recommendations: this.analysisCoordinator.generateRecommendationsData(testResults),
            analysis: this.analysisCoordinator.generateAnalysisData(testResults),
            insights: testResults.summary.performanceInsights || [],
            scenarios: this.analysisCoordinator.generateScenarioData(testResults.summary.costEfficiencyAnalysis),
            dataQuality: this.analysisCoordinator.generateDataQualityData(testResults)
        };
    }
}

module.exports = ReportGenerator;
