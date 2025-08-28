terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "econeura-terraform"
    storage_account_name = "econeuratfstate"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-econeura-${var.environment}"
  location = var.location
  tags     = var.tags
}

# PostgreSQL Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-econeura-${var.environment}"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "15"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  
  sku_name = "B_Standard_B2s"
  storage_mb = 32768
  
  backup_retention_days = 30
  geo_redundant_backup_enabled = true
  
  tags = var.tags
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "econeura"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "redis-econeura-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  
  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }
  
  tags = var.tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "asp-econeura-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "P1v2"
  
  tags = var.tags
}

# API App Service
resource "azurerm_linux_web_app" "api" {
  name                = "app-econeura-api-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id
  
  site_config {
    always_on = true
    
    application_stack {
      node_version = "20-lts"
    }
    
    cors {
      allowed_origins = var.allowed_origins
    }
  }
  
  app_settings = {
    "NODE_ENV"             = var.environment
    "DATABASE_URL"         = "postgresql://${var.db_admin_username}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
    "REDIS_URL"           = "redis://${azurerm_redis_cache.main.hostname}:6379"
    "JWT_SECRET"          = var.jwt_secret
    "JWT_REFRESH_SECRET"  = var.jwt_refresh_secret
    "ENCRYPTION_KEY"      = var.encryption_key
  }
  
  tags = var.tags
}

# Web App Service
resource "azurerm_linux_web_app" "web" {
  name                = "app-econeura-web-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id
  
  site_config {
    always_on = true
    
    application_stack {
      node_version = "20-lts"
    }
  }
  
  app_settings = {
    "NODE_ENV"              = var.environment
    "NEXT_PUBLIC_API_URL"   = "https://${azurerm_linux_web_app.api.default_hostname}/api"
  }
  
  tags = var.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "ai-econeura-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "Node.JS"
  
  tags = var.tags
}

# CDN Profile
resource "azurerm_cdn_profile" "main" {
  name                = "cdn-econeura-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard_Microsoft"
  
  tags = var.tags
}

# CDN Endpoint for Web App
resource "azurerm_cdn_endpoint" "web" {
  name                = "cdn-econeura-web-${var.environment}"
  profile_name        = azurerm_cdn_profile.main.name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  origin {
    name      = "web-origin"
    host_name = azurerm_linux_web_app.web.default_hostname
  }
  
  tags = var.tags
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                        = "kv-econeura-${var.environment}"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  enabled_for_disk_encryption = true
  tenant_id                   = var.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                   = "standard"
  
  tags = var.tags
}