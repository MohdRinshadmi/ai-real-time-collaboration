# 3-AZ VPC with public + private subnets. NAT gateway per AZ (HA).
# Flow logs to CloudWatch for forensics.

variable "name" { type = string }
variable "cidr" { type = string }
variable "azs"  { type = list(string) }
variable "enable_nat_gateway" { type = bool, default = true }
variable "single_nat_gateway" { type = bool, default = false }

resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = var.name }
}

resource "aws_subnet" "public" {
  count                   = length(var.azs)
  vpc_id                  = aws_vpc.this.id
  availability_zone       = var.azs[count.index]
  cidr_block              = cidrsubnet(var.cidr, 4, count.index)
  map_public_ip_on_launch = true
  tags = {
    Name                          = "${var.name}-public-${var.azs[count.index]}"
    "kubernetes.io/role/elb"      = "1"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.this.id
  availability_zone = var.azs[count.index]
  cidr_block        = cidrsubnet(var.cidr, 4, count.index + 8)
  tags = {
    Name                                 = "${var.name}-private-${var.azs[count.index]}"
    "kubernetes.io/role/internal-elb"    = "1"
  }
}

output "vpc_id"             { value = aws_vpc.this.id }
output "public_subnet_ids"  { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
