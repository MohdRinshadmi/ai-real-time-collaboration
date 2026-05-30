variable "bucket_name"        { type = string }
variable "enable_versioning"  { type = bool }
variable "enable_encryption"  { type = bool }
variable "enable_replication" { type = bool }
variable "replication_region" { type = string, default = "" }
variable "lifecycle_rules" {
  type = list(object({
    id                         = string
    prefix                     = string
    transition_to_glacier_days = number
    expiration_days            = number
  }))
  default = []
}

resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration { status = var.enable_versioning ? "Enabled" : "Suspended" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.this.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count  = length(var.lifecycle_rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.this.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = "Enabled"
      filter { prefix = rule.value.prefix }

      dynamic "transition" {
        for_each = rule.value.transition_to_glacier_days > 0 ? [1] : []
        content {
          days          = rule.value.transition_to_glacier_days
          storage_class = "GLACIER"
        }
      }
      dynamic "expiration" {
        for_each = rule.value.expiration_days > 0 ? [1] : []
        content { days = rule.value.expiration_days }
      }
    }
  }
}
