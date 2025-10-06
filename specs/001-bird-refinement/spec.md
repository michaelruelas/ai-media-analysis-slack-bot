# Audubon Bird Identification POC Specification

## Project Overview
Build a Slack bot for the #bird-id channel that processes media uploads, runs mock AI analysis on a Python Lambda, posts predictions in a thread with a feedback button, launches a modal for corrections (Yes/No, species dropdown from mock API, optional ZIP/comments), stores feedback in DynamoDB, and posts confirmation. Use model v4.2-alpha mock. Minimal POC: local testing with Localstack/Terraform.

## User Stories
- **As a Slack user**, when I upload an image (e.g., IMG_4081.JPG) to #bird-id, the bot posts a threaded reply with analysis table (top 2 predictions, confidence) and "Provide Feedback" button.
- **As a Slack user**, when I click the button, a modal opens asking if top prediction is correct (Yes/No radio); if No, show searchable species dropdown (~837 options from mock API); optional ZIP input and comments textarea.
- **As a Slack user**, when I submit the modal, it closes, data saves to DB, and bot posts "✅ Thank you! Your feedback has been recorded." in the thread.
- **As an ML engineer**, feedback is stored in DynamoDB with slack_message_id, user_id, model_version, is_correct, top_prediction, corrected_species, zip_code, comments, timestamp for querying inaccuracies.

## Functional Requirements
- **Event Trigger**: Listen to file_share events in #bird-id channel only.
- **Analysis Post**: Table format:
  | Prediction | Species Name | Confidence |
  |------------|--------------|------------|
  | 1 | *Cardinalis cardinalis* | 92% |
  | 2 | *Piranga rubra* | 7% |
  Mock via Python Lambda (stub image analysis, return JSON {predictions: [{species: 'Cardinalis cardinalis', confidence: 0.92}, ...]}).
- **Modal**: Slack blocks: Radio for Yes/No (conditional species select if No), plain_text_input for ZIP, input for comments. Submit calls modal handler Lambda.
- **Data Storage**: DynamoDB table audubon_ai_feedback (PK: feedback_id UUID, GSI on slack_message_id if needed).
- **Mock Species API**: Assume GET /species returns [{id: 1, name: 'Cardinalis cardinalis'}, ...] (hardcode 837 entries or subset for POC).
- **Error Handling**: If AI fails, post "AI unavailable"; validate modal inputs.

## Non-Functional Requirements
- **Performance**: Lambda timeout 30s; modal response <3s.
- **Security**: Env vars for SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET; IAM least privilege.
- **Testing**: Local with Localstack (custom domain), ngrok for Slack webhook; verify flow with sample image.

## Acceptance Criteria
- [ ] Upload image → analysis post with button (mock data).
- [ ] Button click → modal launches with fields.
- [ ] Submit valid feedback → DB insert + confirmation post.
- [ ] Query DB for stored feedback.
- [ ] Local end-to-end test succeeds; Terraform deploys to AWS.