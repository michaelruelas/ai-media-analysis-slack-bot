terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  profile = "sandbox-dev"

  skip_credentials_validation = var.is_local
  skip_metadata_api_check     = var.is_local
  skip_region_validation      = var.is_local
}

# For Localstack, set environment variables externally:
# export AWS_ENDPOINT_URL=http://localstack.home.pugcasa.com:4566
# export AWS_ACCESS_KEY_ID=test
# export AWS_SECRET_ACCESS_KEY=test
# export AWS_DEFAULT_REGION=us-west-1