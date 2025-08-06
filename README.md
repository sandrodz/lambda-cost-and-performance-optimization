# Lambda Cost and Performance Optimization

A comprehensive study of AWS Lambda performance optimization across memory configurations and JavaScript bundling strategies.

## Project Goals
1. ✅ Memory configuration optimization with automated testing
2. ✅ Cost vs performance analysis with blended scenarios  
3. 🔄 JavaScript bundling strategy comparison
4. ✅ Data-driven optimization recommendations

## Project Structure

```
lambda-cost-and-performance-optimization/
├── README.md
├── template.yaml                 # SAM template for Lambda deployments
├── samconfig.toml               # SAM configuration
├── package.json                 # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── src/
│   └── test-functions/          # Lambda function implementations
│       ├── basic-function/      # ✅ Simple test function
│       └── heavy-computation/   # ✅ CPU-intensive function
├── scripts/
│   ├── deploy.sh               # ✅ Deployment automation
│   ├── test-basic-functions.js # ✅ Basic function performance tests
│   ├── test-computation-functions.js # ✅ Computation function tests
│   ├── test-runner.ts          # ✅ Comprehensive test orchestration (TypeScript)
│   ├── types/                  # ✅ TypeScript type definitions
│   │   ├── index.ts           # Core types and interfaces
│   │   ├── analysis.ts        # Analysis-specific types
│   │   ├── reporting.ts       # Reporting types
│   │   └── test-runner.ts     # Test runner types
│   ├── analysis/               # ✅ Analysis modules (TypeScript)
│   │   ├── cost-analyzer.ts   # Cost efficiency calculations
│   │   ├── performance-insights-analyzer.ts # Performance insights
│   │   └── analysis-coordinator.ts # Orchestrates all analysis
│   └── reporting/              # ✅ Reporting modules (TypeScript)
│       ├── report-generator.ts # Report data generation
│       └── console-report-renderer.ts # Console output formatting
└── results/                    # Test execution results (generated)
```

## Current Status ✅

**Infrastructure:** 10 Lambda functions (6 basic + 4 computation) with memory configs 128MB-3008MB, API Gateway endpoints, CloudWatch monitoring, X-Ray tracing

**Testing:** Comprehensive performance testing with cold/warm start detection, statistical analysis, and cost modeling with blended scenarios

**Analysis:** Enhanced cost analysis with scenario-based recommendations for different workload patterns

**Codebase:** Core analysis and reporting modules migrated to TypeScript with full type safety and comprehensive type definitions

## Next Phase: Bundling Optimization

**Strategies to Test:**
- Webpack (production optimized, tree shaking, code splitting)
- ESBuild (fast bundling and minification)
- Rollup (ES modules optimization)
- Unbundled baseline (current)

**Metrics:** Bundle size, cold start time, module loading performance

## Quick Start

**Prerequisites:** Node.js 22+, AWS CLI, SAM CLI configured

```bash
# Deploy and test
./scripts/deploy.sh
npm run test:performance

# Test individual endpoints
curl https://wlk17iusoe.execute-api.us-east-1.amazonaws.com/Prod/basic-128
curl https://wlk17iusoe.execute-api.us-east-1.amazonaws.com/Prod/computation-128
```

**Available Scripts:**
- `npm run test:basic` - Test basic functions
- `npm run test:computation` - Test computation functions  
- `npm run test:performance` - Run comprehensive tests
- `npm run logs` - View CloudWatch logs

## Key Questions & Status

1. ✅ **What is the optimal memory configuration for different workload types?**
2. 🔄 **How does bundle size impact cold start performance?** (Next Phase)
3. 🔄 **Which bundling strategy provides the best cost/performance ratio?** (Next Phase)
4. ✅ **What is the break-even point for memory vs. execution time trade-offs?**

---

**Status:** Memory optimization complete ✅ | Next: Bundling optimization 🔄
