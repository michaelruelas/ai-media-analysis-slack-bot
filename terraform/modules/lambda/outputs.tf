output "ai_handler_function_name" {
  description = "Name of the AI Lambda function"
  value       = aws_lambda_function.ai_handler.function_name
}

output "ai_handler_invoke_arn" {
  description = "Invoke ARN of the AI Lambda function"
  value       = aws_lambda_function.ai_handler.invoke_arn
}

output "ai_handler_arn" {
  description = "ARN of the AI Lambda function"
  value       = aws_lambda_function.ai_handler.arn
}

output "bot_handler_function_name" {
  description = "Name of the Bot Lambda function"
  value       = aws_lambda_function.bot_handler.function_name
}

output "bot_handler_invoke_arn" {
  description = "Invoke ARN of the Bot Lambda function"
  value       = aws_lambda_function.bot_handler.invoke_arn
}

output "bot_handler_arn" {
  description = "ARN of the Bot Lambda function"
  value       = aws_lambda_function.bot_handler.arn
}