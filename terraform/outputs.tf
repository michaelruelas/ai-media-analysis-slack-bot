output "api_endpoint" {
  description = "API Gateway endpoint"
  value       = module.api.slack_api_api_endpoint
}

output "ai_lambda_arn" {
  description = "ARN of the AI Lambda function"
  value       = module.lambda.ai_handler_arn
}

output "bot_lambda_arn" {
  description = "ARN of the Bot Lambda function"
  value       = module.lambda.bot_handler_arn
}
