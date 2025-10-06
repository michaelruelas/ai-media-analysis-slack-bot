variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "is_local" {
  description = "Whether to use Localstack"
  type        = bool
  default     = false
}

variable "localstack_endpoint" {
  description = "Localstack endpoint URL"
  type        = string
  default     = ""
}

variable "slack_bot_token" {
  description = "Slack bot token"
  type        = string
  default     = ""
  sensitive   = true
}

variable "slack_signing_secret" {
  description = "Slack signing secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_username" {
  description = "RDS database username"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_password" {
  description = "RDS database password"
  type        = string
  default     = ""
  sensitive   = true
}

# External DB configuration (provided instead of provisioning RDS)
variable "rds_endpoint" {
  description = "External RDS endpoint or host"
  type        = string
  default     = ""
}

variable "rds_port" {
  description = "External RDS port"
  type        = number
  default     = 5432
}

variable "rds_db_name" {
  description = "External RDS database name"
  type        = string
  default     = "audubon_feedback"
}

variable "vpc_id" {
  description = "VPC ID for RDS (optional for Localstack)"
  type        = string
  default     = ""
}