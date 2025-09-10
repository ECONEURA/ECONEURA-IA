# CORS & WebSockets - ECONEURA Azure

## Resumen Ejecutivo

**Objetivo:** Configuración de CORS y WebSockets para ECONEURA en Azure  
**Última actualización:** 2025-09-10T00:30:00Z  
**Estado:** ✅ **CONFIGURED**

## CORS Configuration

### API CORS
```typescript
const corsOptions = {
  origin: [
    'https://econeura-devweb.azurewebsites.net',
    'https://econeura-stagingweb.azurewebsites.net',
    'https://econeura-prodweb.azurewebsites.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Web CORS
```typescript
const corsOptions = {
  origin: [
    'https://econeura-devapi.azurewebsites.net',
    'https://econeura-stagingapi.azurewebsites.net',
    'https://econeura-prodapi.azurewebsites.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
```

## WebSockets Support

### App Service Configuration
```bash
WEBSITE_LOAD_CERTIFICATES=*
WEBSITE_LOAD_USER_PROFILE=1
```

### Socket.io Configuration
```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true
  },
  transports: ['websocket', 'polling']
});
```

### Real-time Features
- Live notifications
- Real-time updates
- Chat functionality
- Progress tracking

## Security Headers

### Helmet Configuration
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

---

**Estado:** ✅ **CONFIGURED**
