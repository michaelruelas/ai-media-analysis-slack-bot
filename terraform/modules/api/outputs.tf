output "slack_api_api_endpoint" {
  description = "API Gateway invoke URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "slack_api_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.slack_api.id
}