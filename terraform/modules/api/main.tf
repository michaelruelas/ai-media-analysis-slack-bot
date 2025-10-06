resource "aws_apigatewayv2_api" "slack_api" {
  name          = "slack-bot-api"
  protocol_type = "HTTP"
  description   = "API Gateway for Slack Bot"

  tags = {
    Name = "Audubon Slack Bot API"
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.slack_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      ip                      = "$context.identity.sourceIp"
      caller                  = "$context.identity.caller"
      user                    = "$context.identity.user"
      requestTime             = "$context.requestTime"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      status                  = "$context.status"
      protocol                = "$context.protocol"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/slack-bot-api"
  retention_in_days = 14
}

resource "aws_apigatewayv2_integration" "slack_events" {
  api_id           = aws_apigatewayv2_api.slack_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.bot_handler_invoke_arn

}

resource "aws_apigatewayv2_route" "slack_events" {
  api_id    = aws_apigatewayv2_api.slack_api.id
  route_key = "POST /slack/events"
  target    = "integrations/${aws_apigatewayv2_integration.slack_events.id}"
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.bot_handler_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.slack_api.execution_arn}/*/*"
}