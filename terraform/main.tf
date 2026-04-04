# ─────────────────────────────────────────────────────────────────
# RentForge — Infrastructure as Code (Terraform)
# Course: 23CS102PE405 — DevOps and Full Stack
# Provisions: VPC, EC2 instances, RDS PostgreSQL, DocumentDB,
#             Security Groups, S3 bucket, ECR registry
# ─────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state backend (S3 + DynamoDB locking)
  backend "s3" {
    bucket         = "rentforge-tf-state"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "rentforge-tf-locks"
    encrypt        = true
  }
}

# ─── Provider ────────────────────────────────────────────────────
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "RentForge"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Course      = "23CS102PE405"
    }
  }
}

# ─── Variables ───────────────────────────────────────────────────
variable "aws_region"       { default = "ap-south-1" }
variable "environment"      { default = "production" }
variable "app_name"         { default = "rentforge" }
variable "db_password"      { sensitive = true }
variable "instance_type"    { default = "t3.medium" }
variable "db_instance_class"{ default = "db.t3.micro" }

# ─── Data Sources ────────────────────────────────────────────────
data "aws_availability_zones" "available" { state = "available" }

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# ─── VPC ─────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${var.app_name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.app_name}-igw" }
}

# Public subnets (2 AZs for HA)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.app_name}-public-${count.index + 1}" }
}

# Private subnets (for DB)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "${var.app_name}-private-${count.index + 1}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${var.app_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ─── Security Groups ─────────────────────────────────────────────
resource "aws_security_group" "app" {
  name        = "${var.app_name}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Node.js API"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.app_name}-app-sg" }
}

resource "aws_security_group" "db" {
  name        = "${var.app_name}-db-sg"
  description = "Security group for databases"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL from app"
  }
  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "MongoDB from app"
  }
  tags = { Name = "${var.app_name}-db-sg" }
}

# ─── EC2 — Application Server ────────────────────────────────────
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = "${var.app_name}-key"

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker git
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install Node.js 20
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs

    echo "RentForge server initialized" >> /var/log/user-data.log
  EOF
  )

  tags = { Name = "${var.app_name}-app-server" }
}

# ─── RDS PostgreSQL ──────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.app_name}-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.app_name}-postgres"
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = var.db_instance_class
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_encrypted       = true
  db_name                 = "rentforge"
  username                = "rentforge_admin"
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  backup_retention_period = 7
  deletion_protection     = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.app_name}-final-snapshot"
  tags = { Name = "${var.app_name}-postgres" }
}

# ─── S3 Bucket — Static Assets ───────────────────────────────────
resource "aws_s3_bucket" "assets" {
  bucket = "${var.app_name}-assets-${var.environment}"
  tags   = { Name = "${var.app_name}-assets" }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ─── ECR — Container Registry ────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}/backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Name = "${var.app_name}-backend-ecr" }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.app_name}/frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Name = "${var.app_name}-frontend-ecr" }
}

# ─── Outputs ─────────────────────────────────────────────────────
output "app_server_public_ip"  { value = aws_instance.app.public_ip }
output "app_server_public_dns" { value = aws_instance.app.public_dns }
output "postgres_endpoint"     { value = aws_db_instance.postgres.endpoint }
output "s3_bucket_name"        { value = aws_s3_bucket.assets.bucket }
output "ecr_backend_url"       { value = aws_ecr_repository.backend.repository_url }
output "ecr_frontend_url"      { value = aws_ecr_repository.frontend.repository_url }
output "vpc_id"                { value = aws_vpc.main.id }
