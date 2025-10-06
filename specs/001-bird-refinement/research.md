# Research Notes for Audubon Bird POC

## Slack Bolt Integration
- Latest v3.17: Supports Node.js 18+; use for event listening (file_shared), block actions, view submissions.
- Local dev: Ngrok for webhook URL; set app.port = 3000 for local server.
- Verification: Built-in signing secret validation; env SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET.
- Modals: client.views.open with trigger_id; blocks: sections, actions, inputs (radio_buttons, external_select for species, plain_text_input).
- Channel filter: Check event.channel against #bird-id ID (user to provide).

## Terraform for AWS/Localstack
- Provider: hashicorp/aws v5.40, localstack/localstack v0.2.
- Localstack config: provider "localstack" { endpoints { lambda = "http://localstack.home.pugcasa.com:4566" } }; var "localstack_endpoint" = "http://localstack.home.pugcasa.com:4566".
- API Gateway: rest_api, resource /slack/events, method POST integrated to bot Lambda.
- Lambda: aws_lambda_function with zip packaging; role with CloudWatchLogsFullAccess, DynamoDBPutItemPolicy.
- DynamoDB: serverless mode, TTL on timestamp for cleanup.
- Outputs: api_url for webhook.

## Python Lambda Mock AI
- Runtime 3.12; deps boto3, requests, json.
- Mock logic: Hardcode or random.choice from species list; assume image_url, 'analyze' by returning fixed predictions for POC.
- Invoke from Node: AWS SDK lambda.invoke({ FunctionName: 'ai_handler', Payload: JSON.stringify({image_url}) }).

## Mock Species API
- Create S3 bucket 'species-mock', upload species.json (generate 837 entries: e.g., script to create from list).
- Lambda or direct S3 GET; for POC, hardcode array in modal Lambda to avoid extra service.

## Localstack Setup
- Install localstack CLI if needed; localstack start --docker (custom domain via config or proxy).
- tf apply with -var 'localstack=true'; test with awslocal dynamodb put-item.
- Ngrok: ngrok http 3000 for Slack to hit local API Gateway.

## Versions & Deps
- Node 20, npm 10.
- Python 3.12, pip.
- Terraform 1.5+.
- No real AI: Mock to ensure flow works; expand later.

## Potential Issues
- Custom domain: Ensure /etc/hosts has localstack.home.pugcasa.com -> 127.0.0.1; use https if certs set.
- Slack channel ID: Hardcode or env for #bird-id.
- Image access: Slack url_private requires auth; use bot token to download in AI Lambda.