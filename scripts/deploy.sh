#!/bin/bash

# Lambda Cost and Performance Optimization - Deployment Script
# This script automates the deployment of Lambda functions for performance testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
STACK_NAME=""  # Will be read from samconfig.toml
REGION=""
PROFILE=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to read stack name from samconfig.toml
get_stack_name_from_config() {
    if [[ -f "samconfig.toml" ]]; then
        # Extract stack_name from samconfig.toml
        STACK_NAME=$(grep "^stack_name" samconfig.toml | sed 's/.*= *"\([^"]*\)".*/\1/' | tr -d '"')
        if [[ -n "$STACK_NAME" ]]; then
            print_status "Using stack name from samconfig.toml: $STACK_NAME"
        else
            print_warning "Could not read stack_name from samconfig.toml"
            STACK_NAME="lambda-cost-performance-optimization"
        fi
    else
        print_warning "samconfig.toml not found, using default stack name"
        STACK_NAME="lambda-cost-performance-optimization"
    fi
}

# Function to read region from samconfig.toml
get_region_from_config() {
    if [[ -f "samconfig.toml" ]]; then
        # Extract region from samconfig.toml
        CONFIG_REGION=$(grep "^region" samconfig.toml | sed 's/.*= *"\([^"]*\)".*/\1/' | tr -d '"')
        if [[ -n "$CONFIG_REGION" ]]; then
            REGION="$CONFIG_REGION"
            print_status "Using region from samconfig.toml: $REGION"
        else
            print_warning "Could not read region from samconfig.toml, using default"
            REGION="us-east-1"
        fi
    else
        print_warning "samconfig.toml not found, using default region"
        REGION="us-east-1"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --stack-name     CloudFormation stack name [default: from samconfig.toml]"
    echo "  -r, --region         AWS region [default: from samconfig.toml]"
    echo "  -p, --profile        AWS profile"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -r us-east-1"
    echo "  $0 --region eu-west-1 --profile my-profile"
    echo "  $0 -s my-custom-stack-name"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Get stack name from config if not provided via command line
if [[ -z "$STACK_NAME" ]]; then
    get_stack_name_from_config
fi

# Get region from samconfig.toml if not provided via command line
if [[ -z "$REGION" ]]; then
    get_region_from_config
fi

print_status "Starting deployment..."
print_status "Stack name: $STACK_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "SAM CLI is not installed. Please install it first."
    exit 1
fi

# Set AWS profile if provided
if [[ -n "$PROFILE" ]]; then
    export AWS_PROFILE="$PROFILE"
    print_status "Using AWS profile: $PROFILE"
fi

# Set region if provided
if [[ -n "$REGION" ]]; then
    export AWS_DEFAULT_REGION="$REGION"
    print_status "Using AWS region: $REGION"
fi

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured or invalid."
    exit 1
fi

CALLER_IDENTITY=$(aws sts get-caller-identity)
print_success "AWS credentials validated: $(echo $CALLER_IDENTITY | jq -r '.Arn // .UserId' 2>/dev/null || echo $CALLER_IDENTITY)"

# Install dependencies for Lambda functions
print_status "Installing dependencies for Lambda functions..."
cd src/test-functions/basic-function && npm install
cd ../heavy-computation && npm install
cd ../../..

print_success "Dependencies installed successfully"

# Validate SAM template
print_status "Validating SAM template..."
if ! sam validate; then
    print_error "SAM template validation failed"
    exit 1
fi
print_success "SAM template is valid"

# Build the application
print_status "Building SAM application..."
if ! sam build; then
    print_error "SAM build failed"
    exit 1
fi
print_success "SAM build completed successfully"

# Deploy the application
print_status "Deploying SAM application..."
print_status "Deploying to region: $REGION"

sam deploy --region $REGION --stack-name "$STACK_NAME"

print_success "Deployment completed successfully!"

# Get stack outputs
print_status "Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output table)
echo "$OUTPUTS"

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text)
if [[ -n "$API_URL" && "$API_URL" != "None" ]]; then
    print_success "API Gateway URL: $API_URL"
    
    # Test basic endpoints
    print_status "Testing basic endpoints..."
    
    ENDPOINTS=(
        "basic-128"
        #"basic-256" # Uncomment to test additional endpoints
        #"basic-512"
        #"basic-1024"
        #"basic-2048"
        #"basic-3008"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        print_status "Testing $endpoint..."
        RESPONSE=$(curl -s -w "%{http_code}" "$API_URL$endpoint" -o /dev/null)
        if [[ "$RESPONSE" == "200" ]]; then
            print_success "$endpoint is responding correctly"
        else
            print_warning "$endpoint returned status code: $RESPONSE"
        fi
    done
fi

# Get CloudWatch Dashboard URL
DASHBOARD_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' --output text)
if [[ -n "$DASHBOARD_URL" && "$DASHBOARD_URL" != "None" ]]; then
    print_success "CloudWatch Dashboard: $DASHBOARD_URL"
fi

print_success "Deployment script completed successfully!"
print_status "Next steps:"
echo "  1. Run performance tests: npm run test:performance"
echo "  2. View CloudWatch Dashboard: $DASHBOARD_URL"
echo "  3. Monitor logs: sam logs --stack-name $STACK_NAME"
