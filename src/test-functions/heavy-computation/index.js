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
 * Heavy computation Lambda function for CPU-intensive performance testing
 * This function performs mathematical calculations and sorting operations
 */
exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    // Check if this is a cold start (container not initialized before)
    const isColdStart = !global.isContainerInitialized;
    
    // Mark container as initialized for subsequent invocations
    global.isContainerInitialized = true;

    try {
        // Use hardcoded values for GET endpoint
        const iterations = 100000;
        const arraySize = 10000;

        const computationStartTime = Date.now();

        // CPU-intensive operations
        const results = {
            primeNumbers: [],
            sortedArray: [],
            fibonacciResult: 0,
            piApproximation: 0,
            matrixMultiplication: null
        };

        // 1. Prime number calculation
        const primeStartTime = Date.now();
        for (let i = 2; i < Math.min(iterations / 10, 1000); i++) {
            if (isPrime(i)) {
                results.primeNumbers.push(i);
            }
        }
        const primeEndTime = Date.now();

        // 2. Array sorting with random data
        const sortStartTime = Date.now();
        const randomArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 100000));
        results.sortedArray = randomArray.sort((a, b) => a - b);
        const sortEndTime = Date.now();

        // 3. Fibonacci calculation
        const fibStartTime = Date.now();
        results.fibonacciResult = fibonacci(Math.min(iterations / 1000, 40));
        const fibEndTime = Date.now();

        // 4. Pi approximation using Monte Carlo method
        const piStartTime = Date.now();
        results.piApproximation = approximatePi(iterations);
        const piEndTime = Date.now();

        // 5. Matrix multiplication
        const matrixStartTime = Date.now();
        const size = Math.min(Math.sqrt(iterations / 100), 100);
        results.matrixMultiplication = multiplyMatrices(
            generateMatrix(size, size),
            generateMatrix(size, size)
        );
        const matrixEndTime = Date.now();

        const computationEndTime = Date.now();
        const totalEndTime = Date.now();

        const data = {
            message: 'Heavy computation completed',
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
            inputParameters: {
                iterations,
                arraySize
            },
            results: {
                primeCount: results.primeNumbers.length,
                sortedArrayLength: results.sortedArray.length,
                fibonacciResult: results.fibonacciResult,
                piApproximation: results.piApproximation,
                matrixSize: Math.sqrt(results.matrixMultiplication.length)
            },
            performance: {
                totalExecutionTime: totalEndTime - startTime,
                computationTime: computationEndTime - computationStartTime,
                breakdown: {
                    primeCalculation: primeEndTime - primeStartTime,
                    arraySorting: sortEndTime - sortStartTime,
                    fibonacciCalculation: fibEndTime - fibStartTime,
                    piApproximation: piEndTime - piStartTime,
                    matrixMultiplication: matrixEndTime - matrixStartTime
                },
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            }
        };

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
        console.error('Error in heavy computation function:', error);
        
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

// Helper functions for computations
function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function approximatePi(iterations) {
    let inside = 0;
    for (let i = 0; i < iterations; i++) {
        const x = Math.random();
        const y = Math.random();
        if (x * x + y * y <= 1) {
            inside++;
        }
    }
    return 4 * inside / iterations;
}

function generateMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
        matrix[i] = [];
        for (let j = 0; j < cols; j++) {
            matrix[i][j] = Math.floor(Math.random() * 10);
        }
    }
    return matrix;
}

function multiplyMatrices(a, b) {
    const result = [];
    const rows = a.length;
    const cols = b[0].length;
    const common = b.length;
    
    for (let i = 0; i < rows; i++) {
        result[i] = [];
        for (let j = 0; j < cols; j++) {
            let sum = 0;
            for (let k = 0; k < common; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}
