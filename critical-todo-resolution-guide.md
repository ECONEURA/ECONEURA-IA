# ECONEURA-IA Critical TODO Resolution Guide

## 🔴 CRITICAL PRIORITY (Must fix before production)

### 1. Authentication & Security
**File:** `apps/api/src/presentation/middleware/base.middleware.ts`
- [ ] **Line 85:** Implement JWT validation
- [ ] **Line 113:** Implement permission verification
**File:** `apps/api/src/routes/auth.ts`
- [ ] **Line 516:** Implement password change logic

### 2. Core Infrastructure
**File:** `apps/api/src/routes/index.ts`
- [ ] **Line 47:** Implement dependency checks (DB, Redis, etc)
**File:** `apps/api/src/index.ts`
- [ ] **Line 242:** Fix workflow type definitions

### 3. Business Logic
**File:** `apps/api/src/lib/inventory-kardex.service.ts`
- [ ] **Line 365:** Calculate reserved stock from pending orders
**File:** `apps/api/src/lib/logger.ts`
- [ ] **Line 485:** Implement log storage

## 🟡 HIGH PRIORITY (Fix soon)

### 4. AI & Providers
**File:** `packages/shared/src/ai/providers.js` & `packages/shared/src/ai/providers.ts`
- [ ] **Lines 484, 610:** Implement error rate tracking based on request history
- [ ] **Lines 494, 621:** Track concurrent requests
**File:** `packages/shared/src/ai/enhanced-router.js`
- [ ] **Line 190:** Extract model from request context

### 5. Graph Client
**File:** `packages/shared/src/graph/client.ts`
- [ ] **Line 390:** Implement exponential backoff

### 6. Playbooks System
**File:** `packages/shared/src/playbooks/cfo-collection.ts`
- [ ] **Line 360:** Query database for playbook status
- [ ] **Line 375:** Implement approval logic
- [ ] **Line 394:** Implement rejection logic

## 🟢 MEDIUM PRIORITY (Nice to have)

### 7. System Integrations
**File:** `packages/shared/src/playbooks/dsl.ts`
- [ ] **Line 326:** Integrate with AI router
- [ ] **Lines 355, 380, 405:** Integrate with Graph client
- [ ] **Line 430:** Integrate with database
- [ ] **Line 455:** Integrate with webhook system

### 8. Monitoring & Analytics
**File:** `packages/shared/src/cost-meter.ts`
- [ ] **Line 339:** Add latency tracking to database
**File:** `apps/api/src/lib/stripe-receipts.service.ts`
- [ ] **Line 309:** Get organization ID from metadata

## Implementation Templates:

### JWT Validation Template:
```typescript
// apps/api/src/presentation/middleware/base.middleware.ts:85
import jwt from 'jsonwebtoken';

const validateJWT = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### Permission Verification Template:
```typescript
// apps/api/src/presentation/middleware/base.middleware.ts:113
const verifyPermissions = (user: any, requiredPermission: string) => {
  return user.permissions?.includes(requiredPermission) || user.role === 'admin';
};
```

### Error Rate Tracking Template:
```typescript
// packages/shared/src/ai/providers.ts:610
const getErrorRate = (provider: string, timeWindow: number = 300000) => {
  const recent = errorHistory.filter(
    e => e.provider === provider && 
    Date.now() - e.timestamp < timeWindow
  );
  return recent.length / totalRequests[provider] || 0;
};
```

## Resolution Order:
1. Authentication & Security (Items 1)
2. Core Infrastructure (Items 2)
3. Business Logic (Items 3)
4. AI & Providers (Items 4)
5. Graph Client (Items 5)
6. Playbooks System (Items 6)
7. System Integrations (Items 7)
8. Monitoring & Analytics (Items 8)

## Testing After Resolution:
```bash
# After each major TODO resolution:
pnpm --filter @econeura/api build
pnpm --filter @econeura/api test
pnpm --filter @econeura/api lint

# Full integration test:
pnpm build
pnpm test:all
```