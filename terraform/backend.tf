terraform {
  backend "s3" {
    bucket = "webserver-terraform-state-bucket"        # Your S3 bucket name
    key    = "terraform.tfstate"     # The path inside the bucket
    region = "us-east-1"                        # AWS region
    encrypt = false                              # Enable encryption of the state file in S3
  }
}