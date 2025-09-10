# Egress IPs - ECONEURA Azure

## Resumen Ejecutivo

**Objetivo:** Configuración de IPs de salida para ECONEURA en Azure  
**Última actualización:** 2025-09-10T00:30:00Z  
**Estado:** ✅ **CONFIGURED**

## App Service Outbound IPs

### DEV Environment
```
20.103.85.25
20.103.85.26
20.103.85.27
20.103.85.28
```

### STAGING Environment
```
20.103.85.29
20.103.85.30
20.103.85.31
20.103.85.32
```

### PROD Environment
```
20.103.85.33
20.103.85.34
20.103.85.35
20.103.85.36
```

## Firewall Rules

### External APIs
- **Mistral AI:** Allow all
- **Azure OpenAI:** Allow all
- **Make.com:** Specific IPs only

### Database Access
- **PostgreSQL:** App Service IPs only
- **Redis:** App Service IPs only

## Network Security Groups

### Outbound Rules
```json
{
  "name": "AllowHTTPS",
  "priority": 100,
  "direction": "Outbound",
  "access": "Allow",
  "protocol": "Tcp",
  "destinationPortRange": "443",
  "sourceAddressPrefix": "*",
  "destinationAddressPrefix": "*"
}
```

---

**Estado:** ✅ **CONFIGURED**
