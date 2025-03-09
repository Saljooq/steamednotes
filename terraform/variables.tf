# variables.tf

variable "ami_id" {
  description = "AMI ID for the Ubuntu EC2 instance"
  type        = string
  default     = "ami-04b4f1a9cf54c11d0"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t2.nano"  # Default instance type
}

variable "key_name" {
  description = "The key pair name for EC2 instance SSH access"
  type        = string
  default     = "terraform-key"
}

variable "domain_name" {
  description = "The domain name to configure DNS for"
  default     = "www.steamednotes.com"
}

variable "hosted_zone_domain_entry" {
  description = "domain for Hosted Zone data"
  default = "steamednotes.com."
}