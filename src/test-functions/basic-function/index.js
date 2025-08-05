const { CloudWatchClient } = require('@aws-sdk/client-cloudwatch');

// Initialize AWS X-Ray if tracing is enabled
let cloudWatchClient;
if (process.env._X_AMZN_TRACE_ID) {
    const AWSXRay = require('aws-xray-sdk-core');
    cloudWatchClient = AWSXRay.captureAWSv3Client(new CloudWatchClient({}));
} else {
    cloudWatchClient = new CloudWatchClient({});
}

/**
 * Basic Lambda function for performance testing
 * This function performs minimal operations to establish baseline metrics
 */
exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    // Check if this is a cold start (container not initialized before)
    const isColdStart = !global.isContainerInitialized;
    
    // Mark container as initialized for subsequent invocations
    global.isContainerInitialized = true;

    try {
        // Simulate minimal processing
        const data = {
            message: 'Hello from Lambda!',
            timestamp: new Date().toISOString(),
            executionEnvironment: {
                functionName: context.functionName,
                functionVersion: context.functionVersion,
                memoryLimit: context.memoryLimitInMB,
                remainingTime: context.getRemainingTimeInMillis(),
                requestId: context.awsRequestId,
                region: process.env.AWS_REGION,
                coldStart: isColdStart,
                runtime: process.version,
                platform: process.platform,
                architecture: process.arch
            },
            performance: {
                initTime: startTime,
                processingStartTime: Date.now()
            }
        };

        // More substantial computation to ensure measurable execution time
        // Note: Simple operations like basic Math.sqrt() loops get optimized/cached 
        // by V8 engine, resulting in 0ms execution times. This implementation uses:
        // - Mixed mathematical operations to prevent compiler optimization
        // - Random values to prevent result caching
        // - Memory allocation (arrays/strings) to force actual work
        // - Varied operation types to ensure consistent measurable timing (5-50ms)
        let sum = 0;
        let result = 0;
        
        // Mix different operations to prevent optimization
        for (let i = 0; i < 50000; i++) {
            // Vary the operations to prevent caching
            if (i % 3 === 0) {
                sum += Math.sqrt(i + Math.random());
            } else if (i % 3 === 1) {
                sum += Math.sin(i) * Math.cos(i);
            } else {
                sum += Math.log(i + 1) / Math.log(10);
            }
            
            // Add some array operations
            if (i % 1000 === 0) {
                const tempArray = Array.from({length: 100}, (_, idx) => idx * Math.random());
                result += tempArray.reduce((acc, val) => acc + val, 0);
            }
        }
        
        // String operations to add variety
        let stringResult = '';
        for (let i = 0; i < 1000; i++) {
            stringResult += String.fromCharCode(65 + (i % 26));
        }
        
        data.computationResult = {
            sum: sum,
            arrayResult: result,
            stringLength: stringResult.length
        };

        const endTime = Date.now();
        data.performance.totalExecutionTime = endTime - startTime;
        data.performance.memoryUsed = process.memoryUsage();
        data.performance.cpuUsage = process.cpuUsage();

        // Log complete response data
        console.log('Response data:', data);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data, null, 2)
        };

    } catch (error) {
        console.error('Error in basic function:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                requestId: context.awsRequestId
            })
        };
    }
};
