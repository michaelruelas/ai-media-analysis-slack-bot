data "archive_file" "bot_zip" {
  type        = "zip"
  source_dir  = "../lambdas"
  output_path = "bot_handler.zip"

  excludes = [
    "__pycache__",
    "*.pyc",
    ".DS_Store",
    "venv",
  ]
}

data "archive_file" "ai_zip" {
  type        = "zip"
  source_file = "../lambdas/dist/ai_lambda.js"
  output_path = "ai_handler.zip"
}

resource "aws_lambda_function" "ai_handler" {
  filename         = data.archive_file.ai_zip.output_path
  source_code_hash = data.archive_file.ai_zip.output_base64sha256
  function_name    = "ai_handler"
  role             = var.ai_role_arn
  handler          = "ai_lambda.lambda_handler"
  runtime          = "nodejs20.x"

  environment {
    variables = {
      DB_HOST              = var.rds_endpoint
      DB_PORT              = tostring(var.rds_port)
      DB_NAME              = var.rds_db_name
      DB_USER              = var.db_username
      DB_PASSWORD          = var.db_password
      SLACK_BOT_TOKEN      = var.slack_bot_token
      SLACK_SIGNING_SECRET = var.slack_signing_secret
    }
  }
}

resource "aws_lambda_function" "bot_handler" {
  filename         = data.archive_file.bot_zip.output_path
  source_code_hash = data.archive_file.bot_zip.output_base64sha256
  function_name    = "bot_handler"
  role             = var.bot_role_arn
  handler          = "dist/bot_handler.handler"
  runtime          = "nodejs20.x"

  environment {
    variables = {
      DB_HOST                = var.rds_endpoint
      DB_PORT                = tostring(var.rds_port)
      DB_NAME                = var.rds_db_name
      DB_USER                = var.db_username
      DB_PASSWORD            = var.db_password
      AI_LAMBDA_NAME         = aws_lambda_function.ai_handler.function_name
      SLACK_BOT_TOKEN        = var.slack_bot_token
      SLACK_SIGNING_SECRET   = var.slack_signing_secret
      SLACK_BIRD_CHANNEL_ID  = var.slack_bird_channel_id
    }
  }
}