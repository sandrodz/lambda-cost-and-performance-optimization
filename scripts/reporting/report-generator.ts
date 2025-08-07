/**
 * Report Generator
 * Coordinates report data generation and rendering across multiple output formats
 */

import AnalysisCoordinator from '../analysis/analysis-coordinator';
import ConsoleReportRenderer from './console-report-renderer';

import { TestConfig, TestResults } from '../types/test-runner';
import { ReportData } from '../types/reporting';

class ReportGenerator {
    private analysisCoordinator: AnalysisCoordinator;
    private consoleRenderer: ConsoleReportRenderer;

    constructor(config: TestConfig, analysisCoordinator: AnalysisCoordinator) {
        this.analysisCoordinator = analysisCoordinator;
        this.consoleRenderer = new ConsoleReportRenderer(config);
    }

    /**
     * Generate comprehensive report and display to console
     */
    generateComprehensiveReportAndRender(testResults: TestResults): ReportData {
        console.log('\n📊 Comprehensive Performance Report');
        console.log('='.repeat(80));
        
        // Generate all analysis data objects using the analysis coordinator
        const reportData = this.getReportData(testResults);
        
        // Render the visual output to console
        this.consoleRenderer.renderReport(reportData);
        
        return reportData;
    }

    /**
     * Generate report content as text (for file saving)
     */
    generateReportText(testResults: TestResults): string {
        const reportData = this.getReportData(testResults);
        
        let reportContent = '';
        const originalLog = console.log;
        
        // Capture console output as text
        console.log = (...args: any[]) => {
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
    getReportData(testResults: TestResults): ReportData {
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

export default ReportGenerator;
