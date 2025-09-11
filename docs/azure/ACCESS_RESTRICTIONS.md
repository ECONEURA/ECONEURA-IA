# ECONEURA Azure Access Restrictions

## Overview
This document defines access restriction policies and configurations for the ECONEURA Azure infrastructure, implementing a deny-all approach with specific IP allowlists for VIP and outbound connections.

## Owners
- **Primary**: Security Team (security@econeura.dev)
- **Secondary**: DevOps Team (devops@econeura.dev)
- **Escalation**: CISO (ciso@econeura.dev)

## Access Control Philosophy

### Default Deny Policy
- **Principle**: Deny all access by default
- **Implementation**: All network security groups (NSGs) and access control lists (ACLs) configured with default deny rules
- **Exception**: Only explicitly allowed IPs and services can access resources

### Zero Trust Architecture
- **Network Segmentation**: Strict isolation between environments
- **Identity Verification**: All access requires authentication and authorization
- **Least Privilege**: Minimum required permissions for each service
- **Continuous Monitoring**: All access attempts logged and monitored

## Network Security Groups (NSGs)

### Production Environment NSG Rules

#### Inbound Rules (Deny All by Default)
```yaml
# Default Deny Rule (Priority 4096)
- name: "Default-Deny-All-Inbound"
  priority: 4096
  direction: "Inbound"
  access: "Deny"
  protocol: "*"
  source_port_range: "*"
  destination_port_range: "*"
  source_address_prefix: "*"
  destination_address_prefix: "*"

# Management Access (Priority 100)
- name: "Allow-Management-IPs"
  priority: 100
  direction: "Inbound"
  access: "Allow"
  protocol: "Tcp"
  source_port_range: "*"
  destination_port_range: "22,3389,443"
  source_address_prefix: "203.0.113.0/24"  # Management VPN
  destination_address_prefix: "*"

# API Gateway Access (Priority 200)
- name: "Allow-API-Gateway"
  priority: 200
  direction: "Inbound"
  access: "Allow"
  protocol: "Tcp"
  source_port_range: "*"
  destination_port_range: "443"
  source_address_prefix: "198.51.100.0/24"  # API Gateway VIP
  destination_address_prefix: "*"

# Load Balancer Health Checks (Priority 300)
- name: "Allow-LB-HealthChecks"
  priority: 300
  direction: "Inbound"
  access: "Allow"
  protocol: "Tcp"
  source_port_range: "*"
  destination_port_range: "80,443"
  source_address_prefix: "AzureLoadBalancer"
  destination_address_prefix: "*"

# Database Access (Priority 400)
- name: "Allow-Database-Access"
  priority: 400
  direction: "Inbound"
  access: "Allow"
  protocol: "Tcp"
  source_port_range: "*"
  destination_port_range: "5432,3306"
  source_address_prefix: "10.0.1.0/24"  # Application subnet
  destination_address_prefix: "*"
```

#### Outbound Rules (Restricted)
```yaml
# Default Deny Rule (Priority 4096)
- name: "Default-Deny-All-Outbound"
  priority: 4096
  direction: "Outbound"
  access: "Deny"
  protocol: "*"
  source_port_range: "*"
  destination_port_range: "*"
  source_address_prefix: "*"
  destination_address_prefix: "*"

# Internet Access for Updates (Priority 100)
- name: "Allow-Internet-Updates"
  priority: 100
  direction: "Outbound"
  access: "Allow"
  protocol: "Tcp"
  source_port_range: "*"
  destination_port_range: "80,443"
  source_address_prefix: "*"
  destination_address_prefix: "Internet"

# Azure Services (Priority 200)
- name: "Allow-Azure-Services"
  priority: 200
  direction: "Outbound"
  access: "Allow"
  protocol: "Tcp"
  source_port_range: "*"
  destination_port_range: "443"
  source_address_prefix: "*"
  destination_address_prefix: "AzureCloud"

# DNS Resolution (Priority 300)
- name: "Allow-DNS"
  priority: 300
  direction: "Outbound"
  access: "Allow"
  protocol: "Udp"
  source_port_range: "*"
  destination_port_range: "53"
  source_address_prefix: "*"
  destination_address_prefix: "168.63.129.16"  # Azure DNS
```

## Application Gateway Access Control

### Web Application Firewall (WAF) Rules
```yaml
# WAF Policy Configuration
waf_policy:
  name: "econeura-waf-policy"
  mode: "Prevention"
  rule_sules:
    - name: "OWASP"
      version: "3.2"
      enabled: true
    - name: "Microsoft_BotManagerRuleSet"
      version: "0.1"
      enabled: true

# Custom Rules
custom_rules:
  - name: "Block-Suspicious-IPs"
    priority: 1
    rule_type: "MatchRule"
    action: "Block"
    match_conditions:
      - match_variables:
          - variable_name: "RemoteAddr"
        operator: "IPMatch"
        negation_condition: false
        match_values:
          - "192.0.2.0/24"  # Known malicious IPs
          - "203.0.113.0/24"  # Suspicious ranges

  - name: "Allow-Trusted-IPs"
    priority: 2
    rule_type: "MatchRule"
    action: "Allow"
    match_conditions:
      - match_variables:
          - variable_name: "RemoteAddr"
        operator: "IPMatch"
        negation_condition: false
        match_values:
          - "198.51.100.0/24"  # Trusted partner IPs
          - "203.0.113.0/24"   # Corporate office IPs
```

## Virtual Network (VNet) Configuration

### Network Segmentation
```yaml
# VNet Architecture
virtual_network:
  name: "econeura-vnet"
  address_space: "10.0.0.0/16"
  subnets:
    - name: "GatewaySubnet"
      address_prefix: "10.0.0.0/24"
      purpose: "Gateway"
      
    - name: "ManagementSubnet"
      address_prefix: "10.0.1.0/24"
      purpose: "Management"
      nsg: "econeura-mgmt-nsg"
      
    - name: "ApplicationSubnet"
      address_prefix: "10.0.2.0/24"
      purpose: "Application"
      nsg: "econeura-app-nsg"
      
    - name: "DatabaseSubnet"
      address_prefix: "10.0.3.0/24"
      purpose: "Database"
      nsg: "econeura-db-nsg"
      service_endpoints:
        - "Microsoft.Sql"
        - "Microsoft.Storage"
        
    - name: "PrivateEndpointSubnet"
      address_prefix: "10.0.4.0/24"
      purpose: "PrivateEndpoints"
      nsg: "econeura-pe-nsg"
```

## Private Endpoints Configuration

### Database Private Endpoints
```yaml
# PostgreSQL Private Endpoint
postgresql_private_endpoint:
  name: "econeura-postgresql-pe"
  subnet: "DatabaseSubnet"
  private_service_connection:
    name: "econeura-postgresql-connection"
    private_connection_resource_id: "/subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.DBforPostgreSQL/flexibleServers/econeura-postgresql"
    group_ids: ["postgresqlServer"]
    is_manual_connection: false

# Key Vault Private Endpoint
keyvault_private_endpoint:
  name: "econeura-keyvault-pe"
  subnet: "PrivateEndpointSubnet"
  private_service_connection:
    name: "econeura-keyvault-connection"
    private_connection_resource_id: "/subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.KeyVault/vaults/econeura-keyvault"
    group_ids: ["vault"]
    is_manual_connection: false
```

## IP Allowlists

### Management IPs
```yaml
# Corporate Office IPs
corporate_office_ips:
  - "203.0.113.0/24"    # Main office
  - "198.51.100.0/24"   # Branch office
  - "192.0.2.0/24"      # Remote office

# VPN Gateway IPs
vpn_gateway_ips:
  - "203.0.113.1"       # Primary VPN gateway
  - "198.51.100.1"      # Secondary VPN gateway

# Partner IPs
partner_ips:
  - "203.0.113.100"     # Payment processor
  - "198.51.100.100"    # Email service provider
  - "192.0.2.100"       # Monitoring service
```

### API Gateway VIPs
```yaml
# Load Balancer VIPs
load_balancer_vips:
  - "20.1.1.100"        # Primary VIP
  - "20.1.1.101"        # Secondary VIP
  - "20.1.1.102"        # Tertiary VIP

# CDN IPs
cdn_ips:
  - "20.1.1.0/24"       # Azure CDN
  - "20.1.2.0/24"       # Azure Front Door
```

## Monitoring and Logging

### Network Security Group Flow Logs
```yaml
# NSG Flow Logs Configuration
nsg_flow_logs:
  enabled: true
  retention_days: 90
  storage_account: "econeuralogs"
  workspace_id: "/subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.OperationalInsights/workspaces/econeura-logs"
```

### Security Center Monitoring
```yaml
# Security Center Configuration
security_center:
  pricing_tier: "Standard"
  auto_provision: true
  monitoring:
    - "NSG Flow Logs"
    - "Network Security Group Rules"
    - "Network Topology"
    - "Network Map"
    - "Adaptive Network Hardening"
    - "Just-in-time VM Access"
```

## Emergency Procedures

### Emergency Access
```yaml
# Emergency Access Configuration
emergency_access:
  break_glass_accounts:
    - "emergency-admin@econeura.dev"
    - "break-glass@econeura.dev"
  emergency_ips:
    - "203.0.113.200"    # Emergency management IP
    - "198.51.100.200"   # Emergency backup IP
  approval_required: true
  approval_workflow:
    - "Security Team Lead"
    - "DevOps Team Lead"
    - "CISO"
```

## Implementation Checklist

### Phase 1: Network Security Groups
- [ ] Create NSG rules with default deny
- [ ] Configure management access rules
- [ ] Set up application access rules
- [ ] Implement database access rules
- [ ] Enable NSG flow logs

### Phase 2: Application Gateway
- [ ] Configure WAF policy
- [ ] Set up custom rules
- [ ] Implement IP allowlists
- [ ] Enable access logs
- [ ] Configure monitoring

### Phase 3: Private Endpoints
- [ ] Create database private endpoints
- [ ] Set up Key Vault private endpoints
- [ ] Configure storage private endpoints
- [ ] Implement service endpoints
- [ ] Test connectivity

### Phase 4: VPN and Firewall
- [ ] Deploy VPN gateway
- [ ] Configure site-to-site VPN
- [ ] Set up point-to-site VPN
- [ ] Deploy Azure Firewall
- [ ] Configure firewall rules

### Phase 5: Monitoring and Compliance
- [ ] Enable Security Center
- [ ] Configure audit logging
- [ ] Set up access reviews
- [ ] Implement monitoring
- [ ] Test emergency procedures

## Contact Information

- **Security Team**: security@econeura.dev
- **DevOps Team**: devops@econeura.dev
- **CISO**: ciso@econeura.dev
- **Emergency**: +1-555-ECONEURA (24/7)

## Last Updated
2024-01-15

## Review Schedule
Monthly review by Security Team