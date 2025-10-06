# Audubon Bird POC Constitution

## Core Principles
- **Serverless AWS Focus**: All infrastructure must use serverless components (Lambda, API Gateway, RDS) provisioned via Terraform for reproducibility and Localstack for local development/testing (note: Localstack RDS support limited; cloud testing required for DB).
- **Minimal Viable POC**: Prioritize core flow (Slack media upload → mock AI analysis → feedback modal → RDS storage) over extras like real AI integration or advanced auth. Use mocks for AI model and species API to enable quick iteration.
- **Tech Stack Constraints**: Node.js with Slack Bolt for bot logic (event handling, modals); Python for AI Lambda (mock bird detection); Terraform for infra (modules for API Gateway, Lambdas, RDS); Localstack emulation with custom domain https://localstack.home.pugcasa.com/ for testing—no pre-provisioned services.
- **Data Model Simplicity**: Feedback stored in RDS Postgres table `feedback` with columns feedback_id (UUID PK), slack_message_id, user_id, model_version (v4.2-alpha mock), is_correct (bool), top_prediction, corrected_species (from mock API), zip_code, comments, timestamp.
- **Security & Best Practices**: Least privilege IAM roles; environment variables for secrets (Slack token, signing secret, DB creds); error handling with logging to CloudWatch/Localstack; accessibility in modals (ARIA labels, keyboard nav).
- **Testing Approach**: Local end-to-end with Localstack (tf apply local, ngrok for Slack webhook); unit tests for Lambdas; validate flow: upload image → post analysis → submit modal → query RDS. Note: RDS testing primarily on AWS due to Localstack limitations.
- **Governance**: All decisions prioritize low effort/high value; no nested albums or complex features; assume 837 species in mock API response (JSON array of {id, name}); mock AI returns top 2 predictions (e.g., Cardinalis cardinalis 92%, Piranga rubra 7%).

## Decision Guidelines
- Choose mocks over real integrations for POC speed.
- Use Terraform variables for Localstack vs AWS toggle (e.g., endpoint_url).
- Ensure modals are Slack-compliant (blocks for dropdown, input fields).
- If ambiguities arise, default to document specs (e.g., optional ZIP/comments, Yes/No correct with conditional species select).