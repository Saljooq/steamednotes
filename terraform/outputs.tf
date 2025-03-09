# outputs.tf

output "ec2_public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.webserver.public_ip
}

output "ec2_public_dns" {
  description = "The public DNS address of the EC2 instance"
  value       = aws_instance.webserver.public_dns
}
