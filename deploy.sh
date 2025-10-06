#!/bin/bash

# AI Media Analysis Slack Bot - Automated Deployment Script
# This script builds TypeScript lambdas, creates deployment zips, and updates Terraform infrastructure

set -e  # Exit on any error

echo "🚀 Starting AI Media Analysis Slack Bot deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "lambdas" ] || [ ! -d "terraform" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Build and package lambdas
print_status "Building TypeScript lambdas..."
cd lambdas
npm run build:zips
cd ..
print_success "Lambda zips created successfully"

# Initialize Terraform if needed
if [ ! -d "terraform/.terraform" ]; then
    print_status "Initializing Terraform..."
    cd terraform
    terraform init
    cd ..
    print_success "Terraform initialized"
fi

# Plan deployment
print_status "Planning Terraform deployment..."

# NOTE: Database is expected to be provided externally.
# Provide DB config via terraform.tfvars or -var during terraform apply.
# Example terraform.tfvars (do not commit secrets):
# rds_endpoint = "your-db-host.example.com"
# rds_port     = 5432
# rds_db_name  = "audubon_feedback"
# db_username  = "your-db-username"
# db_password  = "your-db-password"
#
# You can also pass using CLI:
# terraform plan -var="rds_endpoint=host" -var="db_username=user" -var="db_password=pass"
cd terraform
terraform plan

# Ask for confirmation
echo ""
read -p "Do you want to apply these changes? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled by user"
    exit 0
fi

# Apply deployment
print_status "Applying Terraform deployment..."
terraform apply

cd ..
print_success "Deployment completed successfully!"

echo ""
print_status "Next steps:"
echo "  1. Configure your Slack app with the API Gateway URL from Terraform output"
echo "  2. Test the bot by sharing an image in your configured Slack channel"
echo "  3. Monitor CloudWatch logs for any issues"
echo ""
print_success "🎉 AI Media Analysis Slack Bot is now deployed and ready to use!"