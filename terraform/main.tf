terraform {
  required_version = ">= 1.5.0"
}

module "vpc" {
  source = "./modules/vpc"

  aws_region = var.aws_region
}


module "iam" {
  source = "./modules/iam"

  aws_region = var.aws_region
}

module "lambda" {
  source = "./modules/lambda"

  ai_role_arn          = module.iam.ai_lambda_exec_arn
  bot_role_arn         = module.iam.bot_lambda_exec_arn
  aws_region           = var.aws_region
  rds_endpoint         = var.rds_endpoint
  rds_port             = var.rds_port
  rds_db_name          = var.rds_db_name
  db_username          = var.db_username
  db_password          = var.db_password
  slack_bot_token      = var.slack_bot_token
  slack_signing_secret = var.slack_signing_secret
}

module "api" {
  source = "./modules/api"

  bot_handler_invoke_arn    = module.lambda.bot_handler_invoke_arn
  bot_handler_function_name = module.lambda.bot_handler_function_name
}