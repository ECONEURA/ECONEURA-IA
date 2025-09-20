import { logger } from './logger.js';
export class RLSPolicyGeneratorService {
    policies = [];
    templates = [];
    schemas = [];
    generationRequests = [];
    constructor() {
        this.initializeTemplates();
        this.initializeSchemas();
    }
    initializeTemplates() {
        this.templates = [
            {
                id: 'user_based_policy',
                name: 'User-Based Policy',
                description: 'Policy based on user ID matching',
                category: 'user',
                template: `CREATE POLICY "{policy_name}" ON "{schema_name}"."{table_name}"
FOR {policy_type}
TO {roles}
USING (user_id = current_user_id());`,
                variables: [
                    {
                        id: 'policy_name',
                        name: 'policy_name',
                        type: 'string',
                        required: true,
                        description: 'Name of the policy'
                    },
                    {
                        id: 'schema_name',
                        name: 'schema_name',
                        type: 'string',
                        required: true,
                        description: 'Database schema name'
                    },
                    {
                        id: 'table_name',
                        name: 'table_name',
                        type: 'string',
                        required: true,
                        description: 'Database table name'
                    },
                    {
                        id: 'policy_type',
                        name: 'policy_type',
                        type: 'string',
                        required: true,
                        defaultValue: 'SELECT',
                        description: 'Type of policy (SELECT, INSERT, UPDATE, DELETE, ALL)'
                    },
                    {
                        id: 'roles',
                        name: 'roles',
                        type: 'array',
                        required: true,
                        description: 'Roles that can access this policy'
                    }
                ],
                examples: [
                    {
                        id: 'user_policy_example',
                        name: 'User Policy Example',
                        description: 'Example of user-based policy',
                        input: {
                            policy_name: 'user_data_policy',
                            schema_name: 'public',
                            table_name: 'user_data',
                            policy_type: 'SELECT',
                            roles: ['authenticated_user']
                        },
                        output: `CREATE POLICY "user_data_policy" ON "public"."user_data"
FOR SELECT
TO authenticated_user
USING (user_id = current_user_id());`,
                        explanation: 'This policy allows users to only see their own data'
                    }
                ],
                documentation: 'User-based policies restrict access to rows where the user_id matches the current user.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'role_based_policy',
                name: 'Role-Based Policy',
                description: 'Policy based on user roles',
                category: 'role',
                template: `CREATE POLICY "{policy_name}" ON "{schema_name}"."{table_name}"
FOR {policy_type}
TO {roles}
USING (has_role('{role_name}'));`,
                variables: [
                    {
                        id: 'policy_name',
                        name: 'policy_name',
                        type: 'string',
                        required: true,
                        description: 'Name of the policy'
                    },
                    {
                        id: 'schema_name',
                        name: 'schema_name',
                        type: 'string',
                        required: true,
                        description: 'Database schema name'
                    },
                    {
                        id: 'table_name',
                        name: 'table_name',
                        type: 'string',
                        required: true,
                        description: 'Database table name'
                    },
                    {
                        id: 'policy_type',
                        name: 'policy_type',
                        type: 'string',
                        required: true,
                        defaultValue: 'SELECT',
                        description: 'Type of policy'
                    },
                    {
                        id: 'roles',
                        name: 'roles',
                        type: 'array',
                        required: true,
                        description: 'Roles that can access this policy'
                    },
                    {
                        id: 'role_name',
                        name: 'role_name',
                        type: 'string',
                        required: true,
                        description: 'Role name to check'
                    }
                ],
                examples: [
                    {
                        id: 'admin_policy_example',
                        name: 'Admin Policy Example',
                        description: 'Example of admin role-based policy',
                        input: {
                            policy_name: 'admin_data_policy',
                            schema_name: 'public',
                            table_name: 'sensitive_data',
                            policy_type: 'ALL',
                            roles: ['admin'],
                            role_name: 'admin'
                        },
                        output: `CREATE POLICY "admin_data_policy" ON "public"."sensitive_data"
FOR ALL
TO admin
USING (has_role('admin'));`,
                        explanation: 'This policy allows only admin users to access sensitive data'
                    }
                ],
                documentation: 'Role-based policies restrict access based on user roles.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'organization_based_policy',
                name: 'Organization-Based Policy',
                description: 'Policy based on organization membership',
                category: 'organization',
                template: `CREATE POLICY "{policy_name}" ON "{schema_name}"."{table_name}"
FOR {policy_type}
TO {roles}
USING (organization_id = current_user_organization_id());`,
                variables: [
                    {
                        id: 'policy_name',
                        name: 'policy_name',
                        type: 'string',
                        required: true,
                        description: 'Name of the policy'
                    },
                    {
                        id: 'schema_name',
                        name: 'schema_name',
                        type: 'string',
                        required: true,
                        description: 'Database schema name'
                    },
                    {
                        id: 'table_name',
                        name: 'table_name',
                        type: 'string',
                        required: true,
                        description: 'Database table name'
                    },
                    {
                        id: 'policy_type',
                        name: 'policy_type',
                        type: 'string',
                        required: true,
                        defaultValue: 'SELECT',
                        description: 'Type of policy'
                    },
                    {
                        id: 'roles',
                        name: 'roles',
                        type: 'array',
                        required: true,
                        description: 'Roles that can access this policy'
                    }
                ],
                examples: [
                    {
                        id: 'org_policy_example',
                        name: 'Organization Policy Example',
                        description: 'Example of organization-based policy',
                        input: {
                            policy_name: 'org_data_policy',
                            schema_name: 'public',
                            table_name: 'company_data',
                            policy_type: 'SELECT',
                            roles: ['company_user']
                        },
                        output: `CREATE POLICY "org_data_policy" ON "public"."company_data"
FOR SELECT
TO company_user
USING (organization_id = current_user_organization_id());`,
                        explanation: 'This policy allows users to only see data from their organization'
                    }
                ],
                documentation: 'Organization-based policies restrict access to data within the same organization.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'data_sensitivity_policy',
                name: 'Data Sensitivity Policy',
                description: 'Policy based on data sensitivity levels',
                category: 'data',
                template: `CREATE POLICY "{policy_name}" ON "{schema_name}"."{table_name}"
FOR {policy_type}
TO {roles}
USING (data_sensitivity_level <= current_user_clearance_level());`,
                variables: [
                    {
                        id: 'policy_name',
                        name: 'policy_name',
                        type: 'string',
                        required: true,
                        description: 'Name of the policy'
                    },
                    {
                        id: 'schema_name',
                        name: 'schema_name',
                        type: 'string',
                        required: true,
                        description: 'Database schema name'
                    },
                    {
                        id: 'table_name',
                        name: 'table_name',
                        type: 'string',
                        required: true,
                        description: 'Database table name'
                    },
                    {
                        id: 'policy_type',
                        name: 'policy_type',
                        type: 'string',
                        required: true,
                        defaultValue: 'SELECT',
                        description: 'Type of policy'
                    },
                    {
                        id: 'roles',
                        name: 'roles',
                        type: 'array',
                        required: true,
                        description: 'Roles that can access this policy'
                    }
                ],
                examples: [
                    {
                        id: 'sensitivity_policy_example',
                        name: 'Sensitivity Policy Example',
                        description: 'Example of data sensitivity policy',
                        input: {
                            policy_name: 'sensitive_data_policy',
                            schema_name: 'public',
                            table_name: 'classified_data',
                            policy_type: 'SELECT',
                            roles: ['cleared_user']
                        },
                        output: `CREATE POLICY "sensitive_data_policy" ON "public"."classified_data"
FOR SELECT
TO cleared_user
USING (data_sensitivity_level <= current_user_clearance_level());`,
                        explanation: 'This policy allows users to see data based on their clearance level'
                    }
                ],
                documentation: 'Data sensitivity policies restrict access based on data classification levels.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }
    initializeSchemas() {
        this.schemas = [
            {
                id: 'econeura_schema',
                name: 'econeura',
                tables: [
                    {
                        id: 'users_table',
                        name: 'users',
                        schema: 'public',
                        columns: [
                            {
                                id: 'user_id',
                                name: 'id',
                                type: 'uuid',
                                nullable: false,
                                isPrimaryKey: true,
                                isForeignKey: false,
                                metadata: {}
                            },
                            {
                                id: 'user_email',
                                name: 'email',
                                type: 'varchar',
                                nullable: false,
                                isPrimaryKey: false,
                                isForeignKey: false,
                                metadata: {}
                            },
                            {
                                id: 'user_organization',
                                name: 'organization_id',
                                type: 'uuid',
                                nullable: false,
                                isPrimaryKey: false,
                                isForeignKey: true,
                                references: 'organizations.id',
                                metadata: {}
                            }
                        ],
                        indexes: [],
                        constraints: [],
                        metadata: {}
                    },
                    {
                        id: 'organizations_table',
                        name: 'organizations',
                        schema: 'public',
                        columns: [
                            {
                                id: 'org_id',
                                name: 'id',
                                type: 'uuid',
                                nullable: false,
                                isPrimaryKey: true,
                                isForeignKey: false,
                                metadata: {}
                            },
                            {
                                id: 'org_name',
                                name: 'name',
                                type: 'varchar',
                                nullable: false,
                                isPrimaryKey: false,
                                isForeignKey: false,
                                metadata: {}
                            }
                        ],
                        indexes: [],
                        constraints: [],
                        metadata: {}
                    }
                ],
                relationships: [
                    {
                        id: 'user_org_relationship',
                        name: 'user_organization',
                        type: 'many_to_one',
                        sourceTable: 'users',
                        targetTable: 'organizations',
                        sourceColumns: ['organization_id'],
                        targetColumns: ['id'],
                        metadata: {}
                    }
                ],
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }
    async generatePolicy(schemaId, tableName, policyType, templateId, variables, rules, options, requestedBy) {
        try {
            const requestId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const generationRequest = {
                id: requestId,
                schemaId,
                tableName,
                policyType,
                templateId,
                variables,
                rules,
                options,
                requestedBy,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.generationRequests.push(generationRequest);
            const template = this.templates.find(t => t.id === templateId);
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }
            const schema = this.schemas.find(s => s.id === schemaId);
            if (!schema) {
                throw new Error(`Schema ${schemaId} not found`);
            }
            const table = schema.tables.find(t => t.name === tableName);
            if (!table) {
                throw new Error(`Table ${tableName} not found in schema ${schemaId}`);
            }
            const policy = await this.generatePolicyFromTemplate(template, variables, rules, table, options);
            generationRequest.status = 'completed';
            generationRequest.updatedAt = new Date();
            this.policies.push(policy);
            logger.info('RLS policy generated successfully', {
                policyId: policy.id,
                tableName,
                policyType,
                templateId,
                requestedBy
            });
            return policy;
        }
        catch (error) {
            logger.error('Failed to generate RLS policy', {
                schemaId,
                tableName,
                error: error.message
            });
            throw error;
        }
    }
    async generatePolicyFromTemplate(template, variables, rules, table, options) {
        const policyName = `${table.name}_${template.category}_policy`;
        const condition = this.generateCondition(rules, table);
        const roles = this.extractRoles(rules);
        const users = this.extractUsers(rules);
        const organizations = this.extractOrganizations(rules);
        const dataCategories = this.extractDataCategories(rules);
        const policy = {
            id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: policyName,
            description: `Generated policy for ${table.name} using ${template.name}`,
            tableName: table.name,
            schemaName: table.schema,
            policyType: variables.policy_type || 'select',
            condition,
            roles,
            users,
            organizations,
            dataCategories,
            version: '1.0.0',
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
                templateId: template.id,
                generationOptions: options,
                rules: rules.map(r => ({ id: r.id, type: r.type, condition: r.condition }))
            },
            auditTrail: []
        };
        return policy;
    }
    generateCondition(rules, table) {
        if (rules.length === 0) {
            return 'true';
        }
        const conditions = rules.map(rule => {
            switch (rule.type) {
                case 'user':
                    return `user_id = current_user_id()`;
                case 'role':
                    return `has_role('${rule.condition}')`;
                case 'organization':
                    return `organization_id = current_user_organization_id()`;
                case 'data':
                    return `data_sensitivity_level <= current_user_clearance_level()`;
                case 'custom':
                    return rule.condition;
                default:
                    return 'true';
            }
        });
        return conditions.join(' AND ');
    }
    extractRoles(rules) {
        const roles = new Set();
        rules.forEach(rule => {
            if (rule.type === 'role') {
                roles.add(rule.condition);
            }
        });
        return Array.from(roles);
    }
    extractUsers(rules) {
        const users = new Set();
        rules.forEach(rule => {
            if (rule.type === 'user') {
                users.add(rule.condition);
            }
        });
        return Array.from(users);
    }
    extractOrganizations(rules) {
        const organizations = new Set();
        rules.forEach(rule => {
            if (rule.type === 'organization') {
                organizations.add(rule.condition);
            }
        });
        return Array.from(organizations);
    }
    extractDataCategories(rules) {
        const categories = new Set();
        rules.forEach(rule => {
            if (rule.type === 'data') {
                categories.add(rule.condition);
            }
        });
        return Array.from(categories);
    }
    getPolicy(policyId) {
        return this.policies.find(p => p.id === policyId) || null;
    }
    getPolicies() {
        return [...this.policies];
    }
    getPoliciesByTable(tableName) {
        return this.policies.filter(p => p.tableName === tableName);
    }
    getPoliciesBySchema(schemaName) {
        return this.policies.filter(p => p.schemaName === schemaName);
    }
    getTemplates() {
        return [...this.templates];
    }
    getTemplate(templateId) {
        return this.templates.find(t => t.id === templateId) || null;
    }
    getTemplatesByCategory(category) {
        return this.templates.filter(t => t.category === category);
    }
    getSchemas() {
        return [...this.schemas];
    }
    getSchema(schemaId) {
        return this.schemas.find(s => s.id === schemaId) || null;
    }
    getGenerationRequests() {
        return [...this.generationRequests];
    }
    getGenerationRequest(requestId) {
        return this.generationRequests.find(r => r.id === requestId) || null;
    }
    updatePolicy(policyId, updates) {
        const policyIndex = this.policies.findIndex(p => p.id === policyId);
        if (policyIndex === -1)
            return null;
        this.policies[policyIndex] = {
            ...this.policies[policyIndex],
            ...updates,
            updatedAt: new Date()
        };
        return this.policies[policyIndex];
    }
    deletePolicy(policyId) {
        const policyIndex = this.policies.findIndex(p => p.id === policyId);
        if (policyIndex === -1)
            return false;
        this.policies.splice(policyIndex, 1);
        return true;
    }
    getPolicyStats() {
        const total = this.policies.length;
        const draft = this.policies.filter(p => p.status === 'draft').length;
        const validated = this.policies.filter(p => p.status === 'validated').length;
        const deployed = this.policies.filter(p => p.status === 'deployed').length;
        const failed = this.policies.filter(p => p.status === 'failed').length;
        const policiesByType = this.policies.reduce((acc, policy) => {
            acc[policy.policyType] = (acc[policy.policyType] || 0) + 1;
            return acc;
        }, {});
        const policiesByTable = this.policies.reduce((acc, policy) => {
            acc[policy.tableName] = (acc[policy.tableName] || 0) + 1;
            return acc;
        }, {});
        return {
            totalPolicies: total,
            draftPolicies: draft,
            validatedPolicies: validated,
            deployedPolicies: deployed,
            failedPolicies: failed,
            policiesByType,
            policiesByTable
        };
    }
}
//# sourceMappingURL=rls-policy-generator.service.js.map