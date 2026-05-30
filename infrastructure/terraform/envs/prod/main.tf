# Production environment composition. Wires the foundation modules together
# and sets prod-grade sizes / replica counts.

module "vpc" {
  source = "../../modules/vpc"

  name = "collab-prod"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]

  enable_nat_gateway = true
  single_nat_gateway = false # one NAT per AZ for HA
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = "collab-prod"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids

  node_groups = {
    general = {
      instance_types = ["m6i.xlarge"]
      min_size       = 3
      max_size       = 20
      desired_size   = 4
      labels         = { workload = "general" }
    }
    realtime = {
      instance_types = ["c6gn.2xlarge"] # high network bandwidth
      min_size       = 2
      max_size       = 30
      desired_size   = 3
      labels         = { workload = "realtime" }
      taints = [{ key = "workload", value = "realtime", effect = "NO_SCHEDULE" }]
    }
    ai = {
      instance_types = ["c6i.4xlarge"]
      min_size       = 1
      max_size       = 10
      desired_size   = 2
      labels         = { workload = "ai" }
    }
  }
}

module "rds" {
  source = "../../modules/rds"

  identifier         = "collab-prod"
  engine_version     = "16.2"
  instance_class     = "db.r6g.2xlarge"
  storage_gb         = 500
  multi_az           = true
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  allowed_sgs        = [module.eks.cluster_security_group_id]
  backup_retention   = 30
  performance_insights = true
}

module "elasticache" {
  source = "../../modules/elasticache"

  name          = "collab-prod"
  engine_version = "7.1"
  node_type      = "cache.r7g.large"
  num_shards     = 3
  replicas       = 1
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  allowed_sgs    = [module.eks.cluster_security_group_id]
}

module "s3_files" {
  source = "../../modules/s3"

  bucket_name          = "collab-files-prod"
  enable_versioning    = true
  enable_encryption    = true
  enable_replication   = true
  replication_region   = "us-west-2"
  lifecycle_rules = [
    {
      id                 = "transition-old-versions"
      prefix             = ""
      transition_to_glacier_days = 90
      expiration_days    = 0
    }
  ]
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  origin_domain   = "alb-collab-prod.us-east-1.elb.amazonaws.com"
  origin_protocol = "https-only"
  price_class     = "PriceClass_100"
  waf_enabled     = true
}
