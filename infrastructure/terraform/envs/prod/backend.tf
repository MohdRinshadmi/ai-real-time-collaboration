terraform {
  required_version = ">= 1.5"
  backend "s3" {
    bucket         = "collab-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "collab-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      Project     = "collab"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}
