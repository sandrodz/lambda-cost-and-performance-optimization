#!/usr/bin/env node

const https = require('https');

// Configuration
const API_BASE_URL = 'https://wlk17iusoe.execute-api.us-east-1.amazonaws.com/Prod';
const BASIC_CONFIGS = [128, 256, 512, 1024, 2048, 3008];
const TARGET_COLD_STARTS = 5; // Number of cold starts to collect
const TARGET_WARM_STARTS = 5; // Number of warm starts to collect
const MAX_CONCURRENT_REQUESTS = 20; // Concurrent requests to trigger cold starts
const REQUEST_DELAY = 500; // Delay between request batches (ms)

/**
 * Make HTTP GET request
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(new Error(`Failed to parse response: ${err.message}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.abort();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Make concurrent requests to trigger cold starts
 */
async function makeConcurrentRequests(url, count) {
    const requests = Array(count).fill(null).map(() => makeRequest(url));
    try {
        return await Promise.all(requests);
    } catch (error) {
        // If some requests fail, return successful ones
        const results = await Promise.allSettled(requests);
        return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
    }
}

/**
 * Test a single memory configuration with targeted cold/warm start collection
 */
async function testBasicFunction(memoryMB) {
    const url = `${API_BASE_URL}/basic-${memoryMB}`;
    const coldStartResults = [];
    const warmStartResults = [];
    let totalRequests = 0;
    let requestNumber = 1;
    
    console.log(`\nTesting Basic Function ${memoryMB}MB:`);
    console.log(`Target: ${TARGET_COLD_STARTS} cold starts, ${TARGET_WARM_STARTS} warm starts`);
    console.log('─'.repeat(60));
    
    while (coldStartResults.length < TARGET_COLD_STARTS || warmStartResults.length < TARGET_WARM_STARTS) {
        try {
            console.log(`  Request batch ${Math.ceil(requestNumber / MAX_CONCURRENT_REQUESTS)} (Cold: ${coldStartResults.length}/${TARGET_COLD_STARTS}, Warm: ${warmStartResults.length}/${TARGET_WARM_STARTS})`);
            
            // Make concurrent requests to trigger cold starts
            const responses = await makeConcurrentRequests(url, MAX_CONCURRENT_REQUESTS);
            totalRequests += responses.length;
            
            // Process responses
            responses.forEach((response, index) => {
                if (response.performance && response.executionEnvironment) {
                    const isColdStart = response.executionEnvironment.coldStart || false;
                    const result = {
                        requestNumber: requestNumber + index,
                        executionTime: response.performance.totalExecutionTime,
                        memoryLimit: response.executionEnvironment.memoryLimit,
                        requestId: response.executionEnvironment.requestId,
                        isColdStart: isColdStart,
                        timestamp: new Date().toISOString()
                    };
                    
                    if (isColdStart && coldStartResults.length < TARGET_COLD_STARTS) {
                        coldStartResults.push(result);
                        console.log(`    Cold Start: ${response.performance.totalExecutionTime}ms`);
                    } else if (!isColdStart && warmStartResults.length < TARGET_WARM_STARTS) {
                        warmStartResults.push(result);
                        console.log(`    Warm Start: ${response.performance.totalExecutionTime}ms`);
                    } else {
                        // Log when we're discarding results because we have enough
                        const type = isColdStart ? 'Cold' : 'Warm';
                        console.log(`    ${type} Start (discarded - have enough): ${response.performance.totalExecutionTime}ms`);
                    }
                } else {
                    console.log(`    Error response: ${JSON.stringify(response)}`);
                }
            });
            
            requestNumber += MAX_CONCURRENT_REQUESTS;
            
            // Check if we have enough of both types
            if (coldStartResults.length >= TARGET_COLD_STARTS && warmStartResults.length >= TARGET_WARM_STARTS) {
                console.log(`    ✅ Collection complete! Have enough cold and warm starts.`);
                break;
            }
            
            // Wait between batches to allow containers to scale down for more cold starts
            if (coldStartResults.length < TARGET_COLD_STARTS) {
                console.log(`    Waiting ${REQUEST_DELAY}ms for potential container scaling...`);
                await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
            }
            
            // Safety break to prevent infinite loops
            if (totalRequests > 100) {
                console.log(`    Reached maximum request limit (${totalRequests}), stopping...`);
                break;
            }
            
        } catch (error) {
            console.log(`    Batch error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Calculate statistics
    const allResults = [...coldStartResults, ...warmStartResults];
    
    if (allResults.length > 0) {
        console.log(`\n  Collection Summary:`);
        console.log(`    Total Requests: ${totalRequests}`);
        console.log(`    Cold Starts Collected: ${coldStartResults.length}/${TARGET_COLD_STARTS}`);
        console.log(`    Warm Starts Collected: ${warmStartResults.length}/${TARGET_WARM_STARTS}`);
        
        // Cold start statistics
        if (coldStartResults.length > 0) {
            const coldTimes = coldStartResults.map(r => r.executionTime);
            const coldAvg = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length;
            const coldMin = Math.min(...coldTimes);
            const coldMax = Math.max(...coldTimes);
            console.log(`    Cold Start - Avg: ${coldAvg.toFixed(2)}ms, Min: ${coldMin}ms, Max: ${coldMax}ms`);
        }
        
        // Warm start statistics
        if (warmStartResults.length > 0) {
            const warmTimes = warmStartResults.map(r => r.executionTime);
            const warmAvg = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;
            const warmMin = Math.min(...warmTimes);
            const warmMax = Math.max(...warmTimes);
            console.log(`    Warm Start  - Avg: ${warmAvg.toFixed(2)}ms, Min: ${warmMin}ms, Max: ${warmMax}ms`);
        }
        
        return {
            memoryMB,
            totalRequests,
            coldStart: coldStartResults.length > 0 ? {
                count: coldStartResults.length,
                totalTime: coldStartResults.reduce((sum, r) => sum + r.executionTime, 0),
                average: coldStartResults.reduce((sum, r) => sum + r.executionTime, 0) / coldStartResults.length,
                min: Math.min(...coldStartResults.map(r => r.executionTime)),
                max: Math.max(...coldStartResults.map(r => r.executionTime)),
                results: coldStartResults
            } : null,
            warmStart: warmStartResults.length > 0 ? {
                count: warmStartResults.length,
                totalTime: warmStartResults.reduce((sum, r) => sum + r.executionTime, 0),
                average: warmStartResults.reduce((sum, r) => sum + r.executionTime, 0) / warmStartResults.length,
                min: Math.min(...warmStartResults.map(r => r.executionTime)),
                max: Math.max(...warmStartResults.map(r => r.executionTime)),
                results: warmStartResults
            } : null,
            allResults
        };
    }
    
    return null;
}

/**
 * Run all basic function tests
 */
async function runAllTests() {
    console.log('🚀 Starting Basic Function Performance Tests');
    console.log('═'.repeat(60));
    
    const allResults = [];
    
    for (const memoryMB of BASIC_CONFIGS) {
        const result = await testBasicFunction(memoryMB);
        if (result) {
            allResults.push(result);
        }
    }
    
    // Display summary
    console.log('\n📊 Performance Summary:');
    console.log('═'.repeat(90));
    console.log('Memory (MB) | Cold Starts | Warm Starts | Cold Avg (ms) | Warm Avg (ms)');
    console.log('─'.repeat(90));
    
    allResults.forEach(result => {
        const coldCount = result.coldStart ? result.coldStart.count : 0;
        const warmCount = result.warmStart ? result.warmStart.count : 0;
        const coldAvg = result.coldStart ? result.coldStart.average.toFixed(2) : 'N/A';
        const warmAvg = result.warmStart ? result.warmStart.average.toFixed(2) : 'N/A';
        
        console.log(`${result.memoryMB.toString().padStart(10)} | ${coldCount.toString().padStart(11)} | ${warmCount.toString().padStart(11)} | ${coldAvg.padStart(13)} | ${warmAvg.padStart(13)}`);
    });
    
    // Cold Start Analysis
    console.log('\n❄️ Cold Start Analysis:');
    console.log('═'.repeat(60));
    allResults.forEach(result => {
        if (result.coldStart) {
            console.log(`${result.memoryMB}MB: ${result.coldStart.average.toFixed(2)}ms (min: ${result.coldStart.min}ms, max: ${result.coldStart.max}ms)`);
        }
    });
    
    // Warm Start Analysis
    console.log('\n🔥 Warm Start Analysis:');
    console.log('═'.repeat(60));
    allResults.forEach(result => {
        if (result.warmStart) {
            console.log(`${result.memoryMB}MB: ${result.warmStart.average.toFixed(2)}ms (min: ${result.warmStart.min}ms, max: ${result.warmStart.max}ms)`);
        }
    });
    
    console.log('\n✅ Basic function tests completed!');
    console.log('💡 Check X-Ray traces in AWS Console for detailed analysis');
    
    return allResults;
}

// Run tests if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, testBasicFunction };
