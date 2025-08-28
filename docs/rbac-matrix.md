# ECONEURA RBAC Matrix

## System Roles

### 1. Admin (admin)
**Description**: Full system access, organization management
**Permissions**: `*:*:*` (all resources, all actions)

### 2. Sales (sales)
**Description**: CRM full access, deals management
**Permissions**:
- `crm:companies:*` - Full company management
- `crm:contacts:*` - Full contact management
- `crm:deals:*` - Full deal management
- `crm:activities:*` - Full activity management
- `invoices:view` - View invoices
- `invoices:create` - Create invoices
- `reports:sales:view` - View sales reports

### 3. Operations (ops)
**Description**: ERP and inventory management
**Permissions**:
- `erp:products:*` - Full product management
- `erp:inventory:*` - Full inventory control
- `erp:suppliers:*` - Full supplier management
- `erp:warehouses:*` - Full warehouse management
- `erp:purchase_orders:*` - Full purchase order management
- `invoices:view` - View invoices
- `reports:inventory:view` - View inventory reports

### 4. CFO (cfo)
**Description**: Financial oversight and control
**Permissions**:
- `finance:*` - Full financial management
- `invoices:*` - Full invoice control
- `payments:*` - Full payment management
- `expenses:*` - Full expense management
- `reports:*` - All reports access
- `crm:deals:view` - View deals for forecasting
- `erp:products:view` - View products for costing
- `erp:inventory:view` - View inventory for valuation

### 5. Viewer (viewer)
**Description**: Read-only access to basic data
**Permissions**:
- `crm:companies:view` - View companies
- `crm:contacts:view` - View contacts
- `crm:deals:view` - View deals
- `erp:products:view` - View products
- `erp:inventory:view` - View inventory
- `invoices:view` - View invoices
- `reports:basic:view` - View basic reports

## Permission Structure

Format: `resource:subresource:action`

### Resources
- `crm` - Customer Relationship Management
  - `companies` - Company management
  - `contacts` - Contact management
  - `deals` - Deal pipeline
  - `activities` - Activities and tasks
- `erp` - Enterprise Resource Planning
  - `products` - Product catalog
  - `inventory` - Inventory management
  - `suppliers` - Supplier management
  - `warehouses` - Warehouse management
  - `purchase_orders` - Purchase orders
- `finance` - Financial Management
  - `invoices` - Invoice management
  - `payments` - Payment processing
  - `expenses` - Expense tracking
  - `reports` - Financial reports
- `ai` - AI Features
  - `router` - AI router access
  - `insights` - AI insights
- `admin` - Administrative
  - `users` - User management
  - `organizations` - Organization settings
  - `roles` - Role management
  - `audit` - Audit logs

### Actions
- `view` - Read access
- `create` - Create new records
- `edit` - Modify existing records
- `delete` - Delete records (soft delete)
- `approve` - Approval workflows
- `export` - Data export
- `import` - Data import
- `*` - All actions

## Scope Modifiers

- `organization` - Access to all organization data (default)
- `own` - Access only to own/assigned data

## Permission Matrix Table

| Role | CRM Companies | CRM Contacts | CRM Deals | ERP Products | ERP Inventory | Finance Invoices | Finance Payments | Reports |
|------|--------------|--------------|-----------|--------------|---------------|-----------------|------------------|---------|
| Admin | CRUD* | CRUD* | CRUD* | CRUD* | CRUD* | CRUD* | CRUD* | All |
| Sales | CRUD | CRUD | CRUD | View | View | Create,View | View | Sales |
| Ops | View | View | View | CRUD | CRUD | View | View | Inventory |
| CFO | View | View | View | View | View | CRUD* | CRUD* | All |
| Viewer | View | View | View | View | View | View | View | Basic |

*CRUD = Create, Read, Update, Delete
*CRUD* = CRUD + Approve + Special actions

## Special Permissions

### Workflow Permissions
- `invoices:submit` - Submit invoice for approval
- `invoices:approve` - Approve submitted invoices
- `expenses:submit` - Submit expense for approval
- `expenses:approve` - Approve submitted expenses
- `deals:move_stage` - Move deals between stages

### System Permissions
- `system:backup` - Create system backups
- `system:restore` - Restore from backups
- `system:export` - Export all data
- `audit:view` - View audit logs
- `settings:manage` - Manage system settings

## Implementation Notes

1. **Permission Checking**: 
   - Check exact match first: `crm:contacts:create`
   - Check wildcard resource: `crm:contacts:*`
   - Check wildcard all: `*:*:*`

2. **Scope Application**:
   - Default scope is `organization`
   - `own` scope adds filter: `assignedUserId = currentUserId`

3. **Permission Inheritance**:
   - No role inheritance by default
   - Permissions are explicitly assigned to roles

4. **Dynamic Permissions**:
   - Custom roles can be created per organization
   - System roles cannot be modified

5. **Audit Requirements**:
   - All permission checks logged in audit_logs
   - Failed permission attempts tracked
   - Permission changes tracked