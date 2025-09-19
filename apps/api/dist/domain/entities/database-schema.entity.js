import { BaseEntity } from './base.entity.js';
export class DatabaseSchema extends BaseEntity {
    props;
    constructor(props) {
        super(props);
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new DatabaseSchema({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromJSON(data) {
        return new DatabaseSchema(data);
    }
    get name() { return this.props.name; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get organizationId() { return this.props.organizationId; }
    get description() { return this.props.description; }
    get settings() { return this.props.settings; }
    get metrics() { return this.props.metrics; }
    get tables() { return this.props.tables; }
    get views() { return this.props.views; }
    get functions() { return this.props.functions; }
    get procedures() { return this.props.procedures; }
    get triggers() { return this.props.triggers; }
    get indexes() { return this.props.indexes; }
    get policies() { return this.props.policies; }
    get lastBackupDate() { return this.props.lastBackupDate; }
    get lastMaintenanceDate() { return this.props.lastMaintenanceDate; }
    updateName(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Name cannot be empty');
        }
        this.props.name = name.trim();
        this.updateTimestamp();
    }
    updateType(type) {
        this.props.type = type;
        this.updateTimestamp();
    }
    updateStatus(status) {
        this.props.status = status;
        this.updateTimestamp();
    }
    updateDescription(description) {
        this.props.description = description;
        this.updateTimestamp();
    }
    updateSettings(settings) {
        this.props.settings = settings;
        this.updateTimestamp();
    }
    updateMetrics(metrics) {
        this.props.metrics = metrics;
        this.updateTimestamp();
    }
    addTable(table) {
        this.props.tables.push(table);
        this.updateTimestamp();
    }
    removeTable(tableId) {
        this.props.tables = this.props.tables.filter(table => table.id !== tableId);
        this.updateTimestamp();
    }
    updateTable(tableId, updates) {
        const tableIndex = this.props.tables.findIndex(table => table.id === tableId);
        if (tableIndex !== -1) {
            this.props.tables[tableIndex] = { ...this.props.tables[tableIndex], ...updates };
            this.updateTimestamp();
        }
    }
    addView(view) {
        this.props.views.push(view);
        this.updateTimestamp();
    }
    removeView(viewId) {
        this.props.views = this.props.views.filter(view => view.id !== viewId);
        this.updateTimestamp();
    }
    addFunction(func) {
        this.props.functions.push(func);
        this.updateTimestamp();
    }
    removeFunction(functionId) {
        this.props.functions = this.props.functions.filter(func => func.id !== functionId);
        this.updateTimestamp();
    }
    addProcedure(procedure) {
        this.props.procedures.push(procedure);
        this.updateTimestamp();
    }
    removeProcedure(procedureId) {
        this.props.procedures = this.props.procedures.filter(proc => proc.id !== procedureId);
        this.updateTimestamp();
    }
    addTrigger(trigger) {
        this.props.triggers.push(trigger);
        this.updateTimestamp();
    }
    removeTrigger(triggerId) {
        this.props.triggers = this.props.triggers.filter(trigger => trigger.id !== triggerId);
        this.updateTimestamp();
    }
    addIndex(index) {
        this.props.indexes.push(index);
        this.updateTimestamp();
    }
    removeIndex(indexId) {
        this.props.indexes = this.props.indexes.filter(index => index.id !== indexId);
        this.updateTimestamp();
    }
    addPolicy(policy) {
        this.props.policies.push(policy);
        this.updateTimestamp();
    }
    removePolicy(policyId) {
        this.props.policies = this.props.policies.filter(policy => policy.id !== policyId);
        this.updateTimestamp();
    }
    updateLastBackupDate() {
        this.props.lastBackupDate = new Date();
        this.updateTimestamp();
    }
    updateLastMaintenanceDate() {
        this.props.lastMaintenanceDate = new Date();
        this.updateTimestamp();
    }
    analyzeSchema() {
        const metrics = {
            totalTables: this.props.tables.length,
            totalViews: this.props.views.length,
            totalFunctions: this.props.functions.length,
            totalProcedures: this.props.procedures.length,
            totalTriggers: this.props.triggers.length,
            totalIndexes: this.props.indexes.length,
            totalConstraints: this.calculateTotalConstraints(),
            totalPolicies: this.props.policies.length,
            totalSize: this.calculateTotalSize(),
            averageTableSize: this.calculateAverageTableSize(),
            largestTable: this.findLargestTable(),
            smallestTable: this.findSmallestTable(),
            mostIndexedTable: this.findMostIndexedTable(),
            leastIndexedTable: this.findLeastIndexedTable(),
            lastBackupDate: this.props.lastBackupDate,
            lastMaintenanceDate: this.props.lastMaintenanceDate,
            healthScore: this.calculateHealthScore(),
            performanceScore: this.calculatePerformanceScore(),
            securityScore: this.calculateSecurityScore(),
            maintainabilityScore: this.calculateMaintainabilityScore(),
            lastAnalysisDate: new Date(),
            analysisDuration: 0
        };
        this.props.metrics = metrics;
        this.updateTimestamp();
        return metrics;
    }
    calculateTotalConstraints() {
        let total = 0;
        for (const table of this.props.tables) {
            total += table.constraints.length;
        }
        return total;
    }
    calculateTotalSize() {
        let total = 0;
        for (const table of this.props.tables) {
            total += table.statistics.totalSize;
        }
        return total;
    }
    calculateAverageTableSize() {
        if (this.props.tables.length === 0)
            return 0;
        return this.calculateTotalSize() / this.props.tables.length;
    }
    findLargestTable() {
        if (this.props.tables.length === 0)
            return '';
        return this.props.tables.reduce((largest, current) => current.statistics.totalSize > largest.statistics.totalSize ? current : largest).name;
    }
    findSmallestTable() {
        if (this.props.tables.length === 0)
            return '';
        return this.props.tables.reduce((smallest, current) => current.statistics.totalSize < smallest.statistics.totalSize ? current : smallest).name;
    }
    findMostIndexedTable() {
        if (this.props.tables.length === 0)
            return '';
        return this.props.tables.reduce((most, current) => current.indexes.length > most.indexes.length ? current : most).name;
    }
    findLeastIndexedTable() {
        if (this.props.tables.length === 0)
            return '';
        return this.props.tables.reduce((least, current) => current.indexes.length < least.indexes.length ? current : least).name;
    }
    calculateHealthScore() {
        let score = 100;
        for (const table of this.props.tables) {
            if (table.indexes.length === 0)
                score -= 5;
        }
        for (const table of this.props.tables) {
            if (table.constraints.length === 0)
                score -= 3;
        }
        for (const table of this.props.tables) {
            if (table.statistics.totalSize > 1000000 && table.indexes.length < 3)
                score -= 10;
        }
        return Math.max(0, score);
    }
    calculatePerformanceScore() {
        let score = 100;
        for (const table of this.props.tables) {
            for (const column of table.columns) {
                if (column.isForeignKey && !column.isIndexed)
                    score -= 5;
            }
        }
        for (const table of this.props.tables) {
            const deadRatio = table.statistics.deadTuples / (table.statistics.liveTuples + table.statistics.deadTuples);
            if (deadRatio > 0.1)
                score -= 10;
        }
        return Math.max(0, score);
    }
    calculateSecurityScore() {
        let score = 100;
        for (const table of this.props.tables) {
            if (!table.rowLevelSecurity)
                score -= 15;
        }
        for (const table of this.props.tables) {
            if (table.policies.length === 0)
                score -= 10;
        }
        for (const table of this.props.tables) {
            const hasPrimaryKey = table.constraints.some(c => c.type.value === 'primary_key');
            if (!hasPrimaryKey)
                score -= 20;
        }
        return Math.max(0, score);
    }
    calculateMaintainabilityScore() {
        let score = 100;
        for (const table of this.props.tables) {
            if (!table.description || table.description.trim().length === 0)
                score -= 5;
        }
        for (const table of this.props.tables) {
            for (const column of table.columns) {
                if (!column.description || column.description.trim().length === 0)
                    score -= 1;
            }
        }
        for (const table of this.props.tables) {
            if (table.columns.length > 20)
                score -= 5;
        }
        return Math.max(0, score);
    }
    validate() {
        if (!this.validateBase()) {
            return false;
        }
        if (!this.props.name || this.props.name.trim().length === 0) {
            return false;
        }
        if (!this.props.organizationId || this.props.organizationId.trim().length === 0) {
            return false;
        }
        if (!this.props.settings.version || this.props.settings.version.trim().length === 0) {
            return false;
        }
        return true;
    }
    toJSON() {
        return { ...this.props };
    }
    clone() {
        return DatabaseSchema.fromJSON(this.toJSON());
    }
    static createPostgreSQLSchema(props) {
        return DatabaseSchema.create({
            ...props,
            type: 'postgresql',
        });
    }
    static createMySQLSchema(props) {
        return DatabaseSchema.create({
            ...props,
            type: 'mysql',
        });
    }
    static createMongoDBSchema(props) {
        return DatabaseSchema.create({
            ...props,
            type: 'mongodb',
        });
    }
}
//# sourceMappingURL=database-schema.entity.js.map