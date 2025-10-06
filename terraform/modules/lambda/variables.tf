variable "ai_role_arn" {
  description = "ARN of the AI Lambda execution role"
  type        = string
}

variable "bot_role_arn" {
  description = "ARN of the Bot Lambda execution role"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS endpoint"
  type        = string
}

variable "rds_port" {
  description = "RDS port"
  type        = number
}

variable "rds_db_name" {
  description = "RDS database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "slack_bot_token" {
  description = "Slack bot token"
  type        = string
  sensitive   = true
}

variable "slack_signing_secret" {
  description = "Slack signing secret"
  type        = string
  sensitive   = true
}

variable "slack_bird_channel_id" {
  description = "Slack channel ID for bird identification"
  type        = string
  default     = "C09JDQ384FQ"
}