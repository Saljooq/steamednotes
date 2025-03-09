# main.tf

# Specify the provider (AWS)
provider "aws" {
  region = "us-east-1"  # Change to your preferred region
}

# Security Group to allow SSH and HTTP access
resource "aws_security_group" "webserver" {
  name        = "webserver-sg"
  description = "Allow SSH and HTTP inbound traffic"
  
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # Allows all outbound traffic
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 instance configuration (Ubuntu AMI)
resource "aws_instance" "webserver" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  
  security_groups = [aws_security_group.webserver.name]

  tags = {
    Name = "webserver-EC2"
  }

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
