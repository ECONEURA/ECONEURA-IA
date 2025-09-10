# Access Restrictions - ECONEURA Azure

## Resumen Ejecutivo

**Objetivo:** Configuración de restricciones de acceso para ECONEURA en Azure  
**Última actualización:** 2025-09-10T00:30:00Z  
**Estado:** ✅ **CONFIGURED**

## App Service Access Restrictions

### DEV Environment
- **Admin IPs:** Office IPs only
- **API Access:** Web app only
- **Health Checks:** Azure Load Balancer

### STAGING Environment
- **Admin IPs:** Office IPs only
- **API Access:** Web app only
- **Health Checks:** Azure Load Balancer

### PROD Environment
- **Admin IPs:** Office IPs only
- **API Access:** Web app + CDN
- **Health Checks:** Azure Load Balancer

## Key Vault Access

### Managed Identity
- **App Service:** Read secrets
- **GitHub Actions:** Deploy secrets
- **Admin Users:** Full access

### Network Access
- **Private Endpoints:** Enabled
- **Public Access:** Disabled
- **Firewall Rules:** Office IPs only

## Database Access

### PostgreSQL
- **App Service:** Full access
- **Admin Users:** Office IPs only
- **Public Access:** Disabled

### Redis
- **App Service:** Full access
- **Admin Users:** Office IPs only
- **Public Access:** Disabled

## Security Groups

### NSG Rules
```json
{
  "inbound": [
    {
      "name": "AllowHTTPS",
      "priority": 100,
      "sourceAddressPrefix": "*",
      "destinationPortRange": "443",
      "access": "Allow"
    }
  ],
  "outbound": [
    {
      "name": "AllowAll",
      "priority": 100,
      "destinationAddressPrefix": "*",
      "access": "Allow"
    }
  ]
}
```

---

**Estado:** ✅ **CONFIGURED**
