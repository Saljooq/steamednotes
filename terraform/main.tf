# main.tf

# Specify the provider (AWS)
provider "aws" {
  region = "us-east-1"  # Change to your preferred region
}
# Data source to fetch default VPC
data "aws_vpc" "default" {
  default = true
}

# Data source to fetch a subnet from default VPC (pick one AZ)
data "aws_subnet" "default" {
  vpc_id            = data.aws_vpc.default.id
  availability_zone = "us-east-1a" # Update to your preferred AZ
}

# Security Group to allow SSH, HTTP and HTTPS access
resource "aws_security_group" "webserver" {
  name        = "webserver-sg"
  description = "Allow SSH and HTTP inbound traffic"
  vpc_id      = data.aws_vpc.default.id # Explicitly tie to default VPC
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Open for any IP to connect via SSH
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Open HTTP port for public access
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # Allows all outbound traffic
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "webserver-sg"
    Project = "SteamedNotes"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# EC2 instance configuration (Ubuntu AMI)
resource "aws_instance" "webserver" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = data.aws_subnet.default.id
  vpc_security_group_ids      = [aws_security_group.webserver.id] # Use ID instead of name

  # Automatically associate a public IP address for instance
  associate_public_ip_address = true
}

# Route 53 record set (DNS configuration)
resource "aws_route53_record" "webserver" {
  zone_id = data.aws_route53_zone.webserver.zone_id  # Using your existing Route 53 hosted zone

  name    = var.domain_name  # www.steamednotes.com
  type    = "A"
  ttl     = 300
  records = [aws_instance.webserver.public_ip]  # Pointing to EC2 instance's dynamic public IP
}

# Route 53 Hosted Zone data (assumes you already have the zone created)
data "aws_route53_zone" "webserver" {
  name = var.hosted_zone_domain_entry  # Replace with your domain
}
