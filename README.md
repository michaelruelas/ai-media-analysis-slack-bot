# AI Media Analysis Slack Bot

A TypeScript-based Slack bot that analyzes bird images using AI and collects user feedback for model refinement.

## System Architecture

```mermaid
graph TB
    A[Slack User] --> B[Slack API]
    B --> C[API Gateway]
    C --> D[Bot Lambda<br/>bot_handler.ts]
    D --> E{AI Analysis}
    E --> F[AI Lambda<br/>ai_lambda.ts]
    F --> G[Mock Species<br/>Database]
    D --> H[Feedback Collection]
    H --> I[RDS PostgreSQL<br/>feedback table]

    D --> J[Slack Response<br/>with predictions]
    J --> B

    style D fill:#e1f5fe
    style F fill:#e1f5fe
    style I fill:#fff3e0
```

### Architecture Components
- **Bot Lambda**: Handles Slack events, invokes AI analysis, manages user feedback
- **AI Lambda**: Performs mock bird species identification (expandable to real AI models)
- **RDS Database**: Stores user feedback for model refinement
- **API Gateway**: Receives Slack webhook events

## Local Testing Setup

### Prerequisites
- AWS SAM CLI (installed via brew)
- Docker (installed via brew cask)
- Node.js 20+ (for TypeScript Lambdas)
- TypeScript (installed via npm)

### Environment Variables
Copy .env.example to .env and fill in your values:
```bash
cp .env.example .env
```

The .env file contains placeholders for Slack tokens and AWS credentials. For local testing, update:
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- AWS credentials if needed for localstack or local services

### Testing TypeScript Lambdas

#### Build TypeScript
First, compile all TypeScript files:
```bash
cd lambdas
npm run build
```

#### Unit Tests
Run unit tests for all TypeScript lambdas:
```bash
cd lambdas
npm test
```

This runs Jest tests covering both bot_handler.ts and ai_lambda.ts functionality.

#### Direct Lambda Invocation
Test the AI Lambda handler directly:
```bash
cd lambdas
npx ts-node test_invoke_ai.ts
```

Test the Bot Lambda handler directly:
```bash
cd lambdas
npm run test:invoke
```

These scripts create mock events and call the lambda handlers directly, printing the results.

### Testing Bot Lambda Server Mode

#### Unit Tests
Run unit tests for bot_handler.js:
```bash
cd lambdas
npm install
npm test
```

This runs Jest tests covering the handler and event handlers.

#### Local Server Mode
Run the bot as a local server for API Gateway events:
```bash
cd lambdas
npm run build
SLACK_SIGNING_SECRET=dummy-signing-secret node dist/bot_handler.js
```

The bot will start on port 3000. Use curl or Postman to POST Slack events to http://localhost:3000/slack/events

Example curl for URL verification:
```bash
curl -X POST http://localhost:3000/slack/events \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test-challenge"}'
```

For file_shared events, use a similar POST with the appropriate Slack payload.

#### Direct Lambda Handler Test
Run the Lambda handler directly:
```bash
cd lambdas
npm run test:invoke
```

This script mocks external dependencies and tests the core handler logic.

### Testing with SAM CLI

#### Build TypeScript Lambdas
First, build the TypeScript code:
```bash
cd lambdas
npm run build
```

#### Invoke AI Lambda locally:
```bash
sam local invoke AiLambdaFunction -e lambdas/event.json --template ../terraform/main.tf
```

Create lambdas/event.json:
```json
{
  "image_url": "https://example.com/test-image.jpg"
}
```

#### Invoke Bot Lambda locally:
```bash
sam local invoke BotLambdaFunction -e lambdas/slack_event.json --template ../terraform/main.tf
```

Create lambdas/slack_event.json:
```json
{
  "body": "{\"type\":\"event_callback\",\"authed_teams\":[\"TEST_TEAM\"],\"event\":{\"type\":\"file_shared\",\"channel\":\"C1234567890\",\"event_ts\":\"1234567890.123456\",\"ts\":\"1234567890.123456\",\"files\":[{\"id\":\"F123\",\"name\":\"test.jpg\",\"url_private\":\"https://files.slack.com/T00000000-U00000000/F00000000/0000000000.jpg\"}]}}"
}
```

## Slack App Installation Guide

This guide walks you through setting up the AI Media Analysis Slack Bot in your Slack workspace.

### Prerequisites
- A Slack workspace where you have admin permissions
- AWS account with permissions to create Lambda functions, API Gateway, and RDS
- Node.js 20+ and npm installed locally

### Step 1: Create a Slack App

1. **Go to Slack API**:
   - Visit [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"

2. **Configure Basic Information**:
   - **App Name**: "AI Bird Identifier" (or your preferred name)
   - **Workspace**: Select your Slack workspace
   - Click "Create App"

3. **Set Up Bot Permissions**:
   - In the left sidebar, click "OAuth & Permissions"
   - Under "Scopes", add these Bot Token Scopes:
     - `files:read` - Access files shared in channels the bot is added to
     - `chat:write` - Send messages as the bot
     - `chat:write.public` - Send messages to channels the bot isn't a member of

4. **Install App to Workspace**:
   - Click "Install to Workspace"
   - Review permissions and click "Allow"
   - **Copy the Bot User OAuth Token** (starts with `xoxb-`) - you'll need this later

5. **Set Up Event Subscriptions**:
   - In the left sidebar, click "Event Subscriptions"
   - Toggle "Enable Events" to ON
   - Add this Request URL: `https://your-api-gateway-url.amazonaws.com/prod/slack/events` (you'll get this after deployment)
   - Under "Subscribe to bot events", add:
     - `file_shared` - When a file is shared in a channel

6. **Configure Signing Secret**:
   - In the left sidebar, click "Basic Information"
   - Under "App Credentials", copy the "Signing Secret" - you'll need this later

### Step 2: Prepare Your Environment

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd ai-media-analysis-slack-bot
   ```

2. **Install Dependencies**:
   ```bash
   cd lambdas
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```bash
   # Slack Configuration
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here

   # AWS Configuration
   AWS_REGION=us-west-2
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key

   # Database Configuration (will be set by Terraform)
   RDS_HOST=your-rds-endpoint
   RDS_PORT=5432
   DB_NAME=audubon_feedback
   DB_USER=your-db-username
   DB_PASSWORD=your-db-password

   # Lambda Configuration
   AI_LAMBDA_NAME=ai_handler
   ```

### Step 3: Deploy to AWS

#### Option A: Automated Deployment (Recommended)
```bash
# One-command deployment
./deploy.sh
```

#### Option B: Manual Deployment
```bash
# Build and package lambdas
cd lambdas
npm run build:zips

# Deploy infrastructure
cd ../terraform
terraform init
terraform plan
terraform apply
```

### Step 4: Configure Slack App with API Gateway URL

1. **Get API Gateway URL**:
   - After deployment, Terraform will output the API Gateway URL
   - Or find it in AWS Console → API Gateway → Your API → Stages → prod

2. **Update Slack App**:
   - Go back to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click your app → "Event Subscriptions"
   - Update the Request URL with your API Gateway URL: `https://your-api-id.execute-api.region.amazonaws.com/prod/slack/events`
   - Click "Save Changes"

3. **Add Bot to Channel**:
   - In Slack, go to the channel where you want the bot to work
   - Type: `/invite @Your Bot Name`
   - The bot will now respond to image uploads in this channel

### Step 5: Test the Installation

1. **Share an Image**:
   - In your configured Slack channel, upload a bird image
   - The bot should respond with AI analysis results

2. **Verify Feedback Collection**:
   - Click the "✅ Yes" or "❌ No" buttons in the bot's response
   - Feedback is stored in the RDS database for model improvement

### Step 6: Monitor and Troubleshoot

1. **Check Logs**:
   ```bash
   # View Lambda logs
   aws logs tail /aws/lambda/bot_handler --follow
   aws logs tail /aws/lambda/ai_handler --follow
   ```

2. **Common Issues**:
   - **"Request URL failed"**: Check API Gateway URL is correct and accessible
   - **Bot not responding**: Ensure bot is invited to the channel and has proper permissions
   - **Database errors**: Verify RDS security groups allow Lambda access

3. **Update the Bot**:
   ```bash
   # When you make code changes
   ./deploy.sh
   ```

### Step 7: Production Considerations

1. **Security**:
   - Use IAM roles instead of access keys in production
   - Enable API Gateway logging and monitoring
   - Set up proper VPC and security groups

2. **Scaling**:
   - Consider Lambda layers for large node_modules
   - Set up CloudWatch alarms for monitoring
   - Configure proper timeout and memory settings

3. **Cost Optimization**:
   - Monitor Lambda execution times and costs
   - Set up billing alerts in AWS

### Support

If you encounter issues:
1. Check the troubleshooting section in this README
2. Review CloudWatch logs for detailed error messages
3. Verify all environment variables are correctly set
4. Ensure Slack app permissions are properly configured

## Deployment to AWS

### Quick Start Deployment
For the fastest deployment experience:

```bash
# Clone the repository
git clone <repository-url>
cd ai-media-analysis-slack-bot

# Configure environment variables
cp .env.example .env
# Edit .env with your Slack tokens and AWS credentials

# Deploy everything automatically
./deploy.sh
```

### Prerequisites
- AWS CLI configured with credentials (use .env AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)
- Terraform installed (via brew: `brew tap hashicorp/tap && brew install terraform`)
- AWS account with necessary permissions for Lambda, API Gateway, RDS, etc.

### Deploy Infrastructure
The project uses Terraform for infrastructure as code. The main.tf in terraform/ defines the resources.

1. Initialize Terraform:
```bash
terraform init
```

2. Plan the deployment:
```bash
terraform plan
```

3. Apply the deployment:
```bash
terraform apply
```

This will create:
- Lambda functions (ai_handler, bot_handler)
- API Gateway for Slack events
- IAM roles and policies

Note about database configuration
- This project no longer provisions an RDS instance. Provide an external PostgreSQL endpoint and credentials via Terraform variables or a secure terraform.tfvars file.
- Recommended: store production credentials in AWS Secrets Manager and reference them from CI or Terraform, rather than committing secrets to source control.

Example terraform.tfvars (do not commit secrets to git):
```
rds_endpoint = "your-db-host.example.com"
rds_port     = 5432
rds_db_name  = "audubon_feedback"
db_username  = "your-db-username"
db_password  = "your-db-password"
```

If you prefer to inject secrets at deploy time, pass them with terraform -var or via your CI/CD secrets manager.

### Automated Deployment
Use the automated deployment script for a streamlined experience:

```bash
# One-command deployment (builds, zips, and deploys)
./deploy.sh
```

This script will:
1. Build TypeScript lambdas
2. Create deployment zips
3. Initialize Terraform (if needed)
4. Plan and apply infrastructure changes
5. Provide next steps for configuration

### Manual Deployment Steps
If you prefer manual control:

#### Build and Package Lambdas
```bash
cd lambdas
npm run build:zips  # Builds TypeScript and creates zips
```

Or individually:
```bash
cd lambdas
npm run build       # Compile TypeScript
npm run zip:ai      # Create AI lambda zip
npm run zip:bot     # Create bot lambda zip
```

#### Deploy with Terraform
```bash
cd terraform
terraform plan
terraform apply
```

Note: node_modules can be large; consider using Lambda layers for dependencies in production.

### Test Deployed Lambdas

#### Using AWS CLI
Invoke AI Lambda:
```bash
aws lambda invoke --function-name ai_handler \
  --payload '{"image_url": "https://example.com/test-image.jpg"}' \
  response.json
cat response.json
```

Expected response contains predictions JSON.

Invoke Bot Lambda:
```bash
aws lambda invoke --function-name bot_handler \
  --payload file slack_event.json \
  response.json
cat response.json
```

For full Slack integration, configure the API Gateway endpoint in Slack app settings.

#### Using AWS Console
1. Go to Lambda console
2. Select ai_handler function
3. Test with payload: `{"image_url": "https://example.com/test-image.jpg"}`
4. Select bot_handler function
5. Test with payload from slack_event.json

### Cleanup
To destroy all resources:
```bash
terraform destroy
```

### Troubleshooting
- Check CloudWatch logs for Lambda errors
- Verify IAM roles have necessary permissions
- Ensure RDS is accessible from Lambda (VPC/security groups)
- For Slack integration, verify API Gateway URL in Slack app event subscriptions

## TypeScript Migration

This project has been fully migrated from mixed JavaScript/Python to TypeScript for improved type safety and developer experience.

### Migration Changes
- **AI Lambda**: Converted from `ai_lambda.py` (Python) to `ai_lambda.ts` (TypeScript)
- **Bot Lambda**: Converted from `bot_handler.js` to `bot_handler.ts` with comprehensive type annotations
- **Supporting Files**: All JavaScript files converted to TypeScript with proper types
- **Build Process**: Updated to compile TypeScript to JavaScript in `dist/` folder
- **Infrastructure**: Terraform updated to deploy TypeScript-compiled lambdas with Node.js runtime

### Benefits
- **Type Safety**: Compile-time error checking and better IDE support
- **Language Consistency**: Unified TypeScript/Node.js across all lambdas
- **Maintainability**: Easier refactoring and code navigation
- **Developer Experience**: Enhanced tooling and autocomplete

### File Structure
```
lambdas/
├── src/                    # TypeScript source files
│   ├── ai_lambda.ts       # AI analysis lambda
│   ├── bot_handler.ts     # Slack bot handler
│   ├── mock-species.ts    # Mock species data
│   └── test_invoke_bot.ts # Test utilities
├── dist/                  # Compiled JavaScript (generated)
├── *.test.ts             # Test files
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```