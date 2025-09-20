export interface RLSPolicy {
    id: string;
    name: string;
    description: string;
    tableName: string;
    schemaName: string;
    policyType: 'select' | 'insert' | 'update' | 'delete' | 'all';
    condition: string;
    roles: string[];
    users: string[];
    organizations: string[];
    dataCategories: string[];
    version: string;
    status: 'draft' | 'validated' | 'deployed' | 'failed' | 'rollback';
    createdAt: Date;
    updatedAt: Date;
    deployedAt?: Date;
    deployedBy?: string;
    rollbackAt?: Date;
    rollbackBy?: string;
    metadata: Record<string, unknown>;
    auditTrail: PolicyAuditEntry[];
}
export interface PolicyAuditEntry {
    id: string;
    policyId: string;
    action: 'created' | 'updated' | 'validated' | 'deployed' | 'rollback' | 'failed';
    actor: string;
    timestamp: Date;
    details: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
    signature: string;
}
export interface CICDConfig {
    id: string;
    name: string;
    description: string;
    provider: 'github' | 'gitlab' | 'jenkins' | 'azure-devops';
    repository: string;
    branch: string;
    pipeline: string;
    triggers: string[];
    validations: ValidationConfig[];
    deployments: DeploymentConfig[];
    notifications: NotificationConfig[];
    status: 'active' | 'inactive' | 'error';
    createdAt: Date;
    updatedAt: Date;
}
export interface ValidationConfig {
    id: string;
    name: string;
    type: 'syntax' | 'semantic' | 'performance' | 'security' | 'compliance';
    enabled: boolean;
    parameters: Record<string, unknown>;
    timeout: number;
    retries: number;
}
export interface DeploymentConfig {
    id: string;
    name: string;
    strategy: 'blue-green' | 'canary' | 'rolling' | 'feature-flag';
    environment: string;
    enabled: boolean;
    parameters: Record<string, unknown>;
    rollbackThreshold: number;
    monitoringPeriod: number;
}
export interface NotificationConfig {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'teams' | 'webhook';
    enabled: boolean;
    recipients: string[];
    events: string[];
    parameters: Record<string, unknown>;
}
export interface PolicyTemplate {
    id: string;
    name: string;
    description: string;
    category: 'user' | 'role' | 'organization' | 'data' | 'custom';
    template: string;
    variables: PolicyVariable[];
    examples: PolicyExample[];
    documentation: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PolicyVariable {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    defaultValue?: unknown;
    description: string;
    validation?: string;
}
export interface PolicyExample {
    id: string;
    name: string;
    description: string;
    input: Record<string, unknown>;
    output: string;
    explanation: string;
}
export interface DatabaseSchema {
    id: string;
    name: string;
    tables: DatabaseTable[];
    relationships: DatabaseRelationship[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface DatabaseTable {
    id: string;
    name: string;
    schema: string;
    columns: DatabaseColumn[];
    indexes: DatabaseIndex[];
    constraints: DatabaseConstraint[];
    metadata: Record<string, unknown>;
}
export interface DatabaseColumn {
    id: string;
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: unknown;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    references?: string;
    metadata: Record<string, unknown>;
}
export interface DatabaseIndex {
    id: string;
    name: string;
    columns: string[];
    unique: boolean;
    type: 'btree' | 'hash' | 'gin' | 'gist';
    metadata: Record<string, unknown>;
}
export interface DatabaseConstraint {
    id: string;
    name: string;
    type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
    columns: string[];
    definition: string;
    metadata: Record<string, unknown>;
}
export interface DatabaseRelationship {
    id: string;
    name: string;
    type: 'one_to_one' | 'one_to_many' | 'many_to_many';
    sourceTable: string;
    targetTable: string;
    sourceColumns: string[];
    targetColumns: string[];
    metadata: Record<string, unknown>;
}
export interface PolicyGenerationRequest {
    id: string;
    schemaId: string;
    tableName: string;
    policyType: 'select' | 'insert' | 'update' | 'delete' | 'all';
    templateId?: string;
    variables: Record<string, unknown>;
    rules: PolicyRule[];
    options: PolicyGenerationOptions;
    requestedBy: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}
export interface PolicyRule {
    id: string;
    type: 'user' | 'role' | 'organization' | 'data' | 'custom';
    condition: string;
    priority: number;
    enabled: boolean;
    metadata: Record<string, unknown>;
}
export interface PolicyGenerationOptions {
    optimize: boolean;
    validate: boolean;
    test: boolean;
    deploy: boolean;
    environment: string;
    metadata: Record<string, unknown>;
}
export interface PolicyValidationResult {
    id: string;
    policyId: string;
    validationType: 'syntax' | 'semantic' | 'performance' | 'security' | 'compliance';
    status: 'passed' | 'failed' | 'warning';
    score: number;
    issues: ValidationIssue[];
    recommendations: string[];
    executedAt: Date;
    executedBy: string;
}
export interface ValidationIssue {
    id: string;
    type: 'error' | 'warning' | 'info';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    line?: number;
    column?: number;
    suggestion?: string;
    metadata: Record<string, unknown>;
}
export interface PolicyDeployment {
    id: string;
    policyId: string;
    environment: string;
    strategy: 'blue-green' | 'canary' | 'rolling' | 'feature-flag';
    status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rollback';
    deployedAt?: Date;
    deployedBy: string;
    rollbackAt?: Date;
    rollbackBy?: string;
    rollbackReason?: string;
    metadata: Record<string, unknown>;
    auditTrail: DeploymentAuditEntry[];
}
export interface DeploymentAuditEntry {
    id: string;
    deploymentId: string;
    action: 'started' | 'completed' | 'failed' | 'rollback_started' | 'rollback_completed';
    actor: string;
    timestamp: Date;
    details: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
}
export interface RLSStats {
    totalPolicies: number;
    activePolicies: number;
    draftPolicies: number;
    deployedPolicies: number;
    failedPolicies: number;
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    rollbacks: number;
    averageDeploymentTime: number;
    averageValidationTime: number;
    averageGenerationTime: number;
}
export interface PolicyMetrics {
    policyId: string;
    name: string;
    tableName: string;
    executions: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    errorRate: number;
    lastExecuted: Date;
    performanceScore: number;
    securityScore: number;
    complianceScore: number;
}
export interface CICDIntegration {
    id: string;
    name: string;
    provider: 'github' | 'gitlab' | 'jenkins' | 'azure-devops';
    repository: string;
    branch: string;
    pipeline: string;
    webhookUrl: string;
    secret: string;
    events: string[];
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface PolicyTest {
    id: string;
    policyId: string;
    name: string;
    description: string;
    testType: 'unit' | 'integration' | 'performance' | 'security';
    testData: Record<string, unknown>;
    expectedResult: unknown;
    actualResult?: unknown;
    status: 'pending' | 'running' | 'passed' | 'failed';
    executedAt?: Date;
    executedBy: string;
    metadata: Record<string, unknown>;
}
export interface PolicyDocumentation {
    id: string;
    policyId: string;
    title: string;
    content: string;
    format: 'markdown' | 'html' | 'pdf';
    version: string;
    generatedAt: Date;
    generatedBy: string;
    metadata: Record<string, unknown>;
}
//# sourceMappingURL=rls-types.d.ts.map