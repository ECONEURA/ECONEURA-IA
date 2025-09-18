# ECONEURA-IA Value Objects and Settings Refactoring Guide

## Value Objects Issues Found:
Based on compilation errors: `Type '{ value: string; }' is not assignable to type 'string'`

### Files to Review and Fix:
1. `src/application/use-cases/architecture/create-architecture.use-case.ts:109`
2. `src/application/use-cases/database-schema/create-database-schema.use-case.ts:217`
3. `src/application/use-cases/predictive-analytics/create-predictive-analytics.use-case.ts:103`

### Fix Pattern:
```typescript
// WRONG: Using value object when string expected
const result = { value: someString };

// CORRECT: Extract value from value object
const result = valueObject.value;

// OR if creating value object:
const result = SomeValueObject.create(someString);
```

## Settings Type Issues:
Based on compilation errors in use cases.

### Files to Review:
1. `src/application/use-cases/company/update-company.use-case.ts:180`
2. `src/application/use-cases/contact/update-contact.use-case.ts:198`

### Fix Pattern:
```typescript
// In interface definitions - make properties required:
interface CompanySettings {
  notifications: {
    email: boolean;        // Required
    sms: boolean;         // Required  
    push: boolean;        // Required
  };
}

// In request DTOs - make properties optional:
interface UpdateCompanyRequest {
  settings?: {
    notifications?: {
      email?: boolean;     // Optional in request
      sms?: boolean;      // Optional in request
      push?: boolean;     // Optional in request
    };
  };
}

// In implementation - provide defaults:
const settings = {
  notifications: {
    email: request.settings?.notifications?.email ?? true,
    sms: request.settings?.notifications?.sms ?? false,
    push: request.settings?.notifications?.push ?? true,
  }
};
```

## Search and Replace Commands:
```bash
# Find all value object misuses:
grep -r "{ value:" apps/api/src/

# Find settings interfaces:
grep -r "Settings" apps/api/src/ | grep "interface"

# Find notification type issues:
grep -r "notifications.*boolean" apps/api/src/
```

## Validation Checklist:
- [ ] Value objects properly unwrapped when string needed
- [ ] Settings interfaces have required properties
- [ ] Request DTOs have optional properties  
- [ ] Default values provided in implementations
- [ ] Type consistency across domain, application, and presentation layers