# RDS Postgres with pgvector. Multi-AZ for HA, PITR for RPO ~5min.
# Read replicas added in envs/prod once query patterns justify it.

variable "identifier"           { type = string }
variable "engine_version"       { type = string }
variable "instance_class"       { type = string }
variable "storage_gb"           { type = number }
variable "multi_az"             { type = bool }
variable "vpc_id"               { type = string }
variable "subnet_ids"           { type = list(string) }
variable "allowed_sgs"          { type = list(string) }
variable "backup_retention"     { type = number }
variable "performance_insights" { type = bool, default = true }

resource "aws_db_subnet_group" "this" {
  name       = var.identifier
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "this" {
  name   = "${var.identifier}-rds"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_sgs
  }
  egress {
    from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_parameter_group" "this" {
  family = "postgres16"
  name   = "${var.identifier}-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,vector"
    apply_method = "pending-reboot"
  }
}

resource "aws_db_instance" "this" {
  identifier                  = var.identifier
  engine                      = "postgres"
  engine_version              = var.engine_version
  instance_class              = var.instance_class
  allocated_storage           = var.storage_gb
  max_allocated_storage       = var.storage_gb * 4
  storage_encrypted           = true
  storage_type                = "gp3"
  multi_az                    = var.multi_az
  db_subnet_group_name        = aws_db_subnet_group.this.name
  vpc_security_group_ids      = [aws_security_group.this.id]
  parameter_group_name        = aws_db_parameter_group.this.name
  backup_retention_period     = var.backup_retention
  backup_window               = "03:00-04:00"
  maintenance_window          = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot       = true
  performance_insights_enabled = var.performance_insights
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.identifier}-final"

  username = "collab"
  manage_master_user_password = true # rotated automatically
}
