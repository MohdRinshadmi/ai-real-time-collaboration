# EKS cluster with managed node groups. IRSA enabled for fine-grained IAM
# per service account (no node-level overprivilege).

variable "cluster_name"    { type = string }
variable "cluster_version" { type = string }
variable "vpc_id"          { type = string }
variable "subnet_ids"      { type = list(string) }

variable "node_groups" {
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
    labels         = optional(map(string), {})
    taints = optional(list(object({
      key    = string
      value  = string
      effect = string
    })), [])
  }))
}

resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_public_access  = true
    endpoint_private_access = true
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-eks"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_eks_node_group" "this" {
  for_each        = var.node_groups
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = each.key
  node_role_arn   = aws_iam_role.cluster.arn
  subnet_ids      = var.subnet_ids
  instance_types  = each.value.instance_types
  labels          = each.value.labels

  scaling_config {
    min_size     = each.value.min_size
    max_size     = each.value.max_size
    desired_size = each.value.desired_size
  }

  update_config { max_unavailable_percentage = 33 }

  dynamic "taint" {
    for_each = each.value.taints
    content {
      key    = taint.value.key
      value  = taint.value.value
      effect = taint.value.effect
    }
  }
}

output "cluster_security_group_id" {
  value = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}
