variable "name"           { type = string }
variable "engine_version" { type = string }
variable "node_type"      { type = string }
variable "num_shards"     { type = number }
variable "replicas"       { type = number }
variable "vpc_id"         { type = string }
variable "subnet_ids"     { type = list(string) }
variable "allowed_sgs"    { type = list(string) }

resource "aws_elasticache_subnet_group" "this" {
  name       = var.name
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "this" {
  name   = "${var.name}-redis"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_sgs
  }
  egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = var.name
  description                = "Collab Redis cluster"
  engine                     = "redis"
  engine_version             = var.engine_version
  node_type                  = var.node_type
  num_node_groups            = var.num_shards
  replicas_per_node_group    = var.replicas
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.this.name
  security_group_ids         = [aws_security_group.this.id]
  parameter_group_name       = "default.redis7.cluster.on"
}
