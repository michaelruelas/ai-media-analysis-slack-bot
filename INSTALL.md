# AI Media Analysis Slack Bot - Installation Guide

## Quick Start (5 minutes)

Get the AI Media Analysis Slack Bot running in your workspace in under 5 minutes.

### Prerequisites
- Slack workspace with admin access
- AWS account with Lambda/API Gateway/RDS permissions
- Node.js 20+ installed locally

### Step 1: Slack App Setup (2 minutes)

1. **Create Slack App**:
   - Go to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name: "AI Bird Identifier", Select your workspace

2. **Configure Permissions**:
   - Go to "OAuth & Permissions"
   - Add Bot Token Scopes:
     - `files:read`
     - `chat:write`
     - `chat:write.public`
   - Click "Install to Workspace" and copy the Bot Token (`xoxb-...`)

3. **Enable Events**:
   - Go to "Event Subscriptions"
   - Toggle "Enable Events" ON
   - Add Request URL: `https://temp-url.ngrok.io/slack/events` (we'll update this)
   - Subscribe to: `file_shared`

4. **Get Signing Secret**:
   - Go to "Basic Information" → "App Credentials"
   - Copy the "Signing Secret"

### Step 2: Deploy to AWS (3 minutes)

```bash
# Clone and setup
git clone <repository-url>
cd ai-media-analysis-slack-bot

# Configure environment
cp .env.example .env
# Edit .env with your Slack tokens and AWS credentials

# Deploy everything
./deploy.sh
```

### Step 3: Connect Slack to AWS (30 seconds)

1. **Get API Gateway URL** from Terraform output
2. **Update Slack App**:
   - Go back to Event Subscriptions
   - Replace temp URL with your API Gateway URL
   - Save changes

3. **Add Bot to Channel**:
   - In Slack: `/invite @Your Bot Name`

### Step 4: Test (30 seconds)

Upload a bird image in your channel. The bot should respond with AI analysis!

## Detailed Installation

For step-by-step instructions with screenshots and troubleshooting, see the [Slack App Installation Guide](README.md#slack-app-installation-guide) in the main README.

## Troubleshooting

### Bot not responding?
- Check API Gateway URL is correct in Slack app settings
- Ensure bot is invited to the channel: `/invite @BotName`
- Verify environment variables are set correctly

### Permission errors?
- Confirm bot has `files:read` and `chat:write` scopes
- Check AWS IAM permissions for Lambda functions

### Need help?
- Check CloudWatch logs: `aws logs tail /aws/lambda/bot_handler --follow`
- Review the troubleshooting section in README.md

## Production Deployment

For production use:
- Use IAM roles instead of access keys
- Set up VPC and security groups
- Configure CloudWatch monitoring
- Consider Lambda layers for dependencies

---

🎉 **Congratulations!** Your AI-powered bird identification bot is now live in Slack!