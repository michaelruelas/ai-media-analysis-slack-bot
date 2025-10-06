# Audubon Bird POC Implementation Plan

## Tech Stack & Architecture
- **Bot Logic**: Node.js 20 with @slack/bolt for Slack events/modals (app setup, file_share listener, view_submission handler).
- **AI Analysis**: Python 3.12 Lambda (mock: receive image URL, return JSON {model_version: 'v4.2-alpha', predictions: [{species: 'Cardinalis cardinalis', confidence: 0.92}, {species: 'Piranga rubra', confidence: 0.07}]}; stub image processing).
- **Infra**: Terraform 1.5+ for AWS resources: API Gateway (REST for Slack webhook), 2 Lambdas (bot_handler, ai_handler, modal_handler), DynamoDB table (audubon_ai_feedback with TTL on timestamp if needed), IAM roles (lambda_exec for bot/ai/modal, dynamodb_put for modal).
- **Local Testing**: Localstack (EDGE_PORT=4566, custom domain https://localstack.home.pugcasa.com/ via /etc/hosts or proxy); tf var localstack_endpoint = 'http://localstack.home.pugcasa.com:4566'; ngrok for local Slack webhook.
- **Species API**: Mock Lambda or static JSON in S3/Localstack (GET /species → array of 837 {id, name}; bundle subset for POC).
- **Deployment**: tf workspace 'local' for Localstack, 'prod' for AWS; env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SPECIES_BUCKET.

## Data Model
- DynamoDB: PK feedback_id (uuid), SK timestamp; attributes as per spec; GSI on slack_message_id for queries.

## Implementation Details
- **Slack App**: Bot token scope: chat:write, files:read, im:write; signing secret for verification.
- **Primary Flow**: file_share event → bot Lambda verifies → calls ai Lambda with image URL → posts message with blocks (table via mrkdwn, button action_id 'feedback').
- **Modal**: button interaction → modal Lambda opens view (blocks: radio_buttons for correct, conditional external_select for species if No, plain_text_input ZIP, plain_text_input comments).
- **Submit**: view_submission → modal Lambda validates → put_item DynamoDB → chat.postMessage confirmation.
- **Mocks**: AI: random from ['Cardinalis cardinalis', 'Piranga rubra']; Species: hardcoded array in code or S3 JSON.
- **Terraform Structure**: main.tf (providers, locals), lambda.tf (functions, layers for deps), api.tf (gateway integration), dynamodb.tf (table), variables.tf (localstack toggle), outputs.tf (endpoints).

## Research Notes
- Slack Bolt: Use receiver for events, app.view for modals; local dev with ngrok.
- Localstack: tf provider localstack; custom domain via AWS::Route53 or local proxy.
- Python Lambda: Use boto3 for S3 if needed; mock image with requests.get(URL).
- Versions: Node 20, Python 3.12, Terraform 1.5; deps: @slack/bolt 3.17, uuid, boto3.

## Risks & Mitigations
- Slack verification: Use bolt's built-in.
- Localstack limits: Test DynamoDB/Lambda first; fallback to AWS for full POC.
- Species data: Hardcode 10 entries for initial test, expand later.