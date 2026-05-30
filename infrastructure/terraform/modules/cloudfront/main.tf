variable "origin_domain"   { type = string }
variable "origin_protocol" { type = string }
variable "price_class"     { type = string }
variable "waf_enabled"     { type = bool }

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  price_class     = var.price_class
  http_version    = "http2and3"

  origin {
    domain_name = var.origin_domain
    origin_id   = "primary"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = var.origin_protocol
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "primary"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 86400

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host", "Origin"]
      cookies { forward = "all" }
    }
  }

  # Heavy cache for static assets
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "primary"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 31536000
    default_ttl            = 31536000
    max_ttl                = 31536000
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}
