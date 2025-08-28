variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "West Europe"
}

variable "tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
}

variable "db_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "econeura_admin"
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret key"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Data encryption key"
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["https://econeura.com", "https://www.econeura.com"]
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default = {
    Project     = "ECONEURA"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}