output "ai_lambda_exec_arn" {
  description = "ARN of the AI Lambda execution role"
  value       = aws_iam_role.ai_lambda_exec.arn
}

output "bot_lambda_exec_arn" {
  description = "ARN of the Bot Lambda execution role"
  value       = aws_iam_role.bot_lambda_exec.arn
}