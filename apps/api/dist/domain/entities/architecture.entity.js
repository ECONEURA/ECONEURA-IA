import { BaseEntity } from './base.entity.js';
export class Architecture extends BaseEntity {
    props;
    constructor(props) {
        super(props);
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new Architecture({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromJSON(data) {
        return new Architecture(data);
    }
    get name() { return this.props.name; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get organizationId() { return this.props.organizationId; }
    get description() { return this.props.description; }
    get settings() { return this.props.settings; }
    get metrics() { return this.props.metrics; }
    get components() { return this.props.components; }
    get layers() { return this.props.layers; }
    get lastAnalysisDate() { return this.props.lastAnalysisDate; }
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
    addComponent(component) {
        this.props.components.push(component);
        this.updateTimestamp();
    }
    removeComponent(componentId) {
        this.props.components = this.props.components.filter(component => component.id !== componentId);
        this.updateTimestamp();
    }
    updateComponent(componentId, updates) {
        const componentIndex = this.props.components.findIndex(component => component.id === componentId);
        if (componentIndex !== -1) {
            this.props.components[componentIndex] = { ...this.props.components[componentIndex], ...updates };
            this.updateTimestamp();
        }
    }
    addLayer(layer) {
        this.props.layers.push(layer);
        this.updateTimestamp();
    }
    removeLayer(layerId) {
        this.props.layers = this.props.layers.filter(layer => layer.id !== layerId);
        this.updateTimestamp();
    }
    updateLayer(layerId, updates) {
        const layerIndex = this.props.layers.findIndex(layer => layer.id === layerId);
        if (layerIndex !== -1) {
            this.props.layers[layerIndex] = { ...this.props.layers[layerIndex], ...updates };
            this.updateTimestamp();
        }
    }
    analyzeArchitecture() {
        const metrics = {
            totalComponents: this.props.components.length,
            totalLayers: this.props.layers.length,
            complexity: this.calculateComplexity(),
            coupling: this.calculateCoupling(),
            cohesion: this.calculateCohesion(),
            maintainability: this.calculateMaintainability(),
            testability: this.calculateTestability(),
            scalability: this.calculateScalability(),
            performance: this.calculatePerformance(),
            security: this.calculateSecurity(),
            lastAnalysisDate: new Date(),
            analysisDuration: 0,
            qualityScore: 0
        };
        metrics.qualityScore = this.calculateQualityScore(metrics);
        this.props.metrics = metrics;
        this.props.lastAnalysisDate = new Date();
        this.updateTimestamp();
        return metrics;
    }
    calculateComplexity() {
        let complexity = 0;
        for (const component of this.props.components) {
            complexity += component.dependencies.length + component.interfaces.length;
        }
        return Math.min(complexity / 10, 10);
    }
    calculateCoupling() {
        let totalDependencies = 0;
        for (const component of this.props.components) {
            totalDependencies += component.dependencies.length;
        }
        return Math.min(totalDependencies / this.props.components.length, 10);
    }
    calculateCohesion() {
        let cohesion = 0;
        for (const component of this.props.components) {
            cohesion += Math.max(0, 5 - component.dependencies.length);
        }
        return Math.min(cohesion / this.props.components.length, 10);
    }
    calculateMaintainability() {
        let maintainability = 0;
        for (const component of this.props.components) {
            if (component.documentation && component.documentation.length > 0)
                maintainability += 2;
            if (component.tests && component.tests.length > 0)
                maintainability += 3;
        }
        return Math.min(maintainability / this.props.components.length, 10);
    }
    calculateTestability() {
        let testability = 0;
        for (const component of this.props.components) {
            if (component.tests && component.tests.length > 0)
                testability += 5;
        }
        return Math.min(testability / this.props.components.length, 10);
    }
    calculateScalability() {
        let scalability = 5;
        if (this.props.type.value === 'microservices')
            scalability += 3;
        if (this.props.type.value === 'hexagonal')
            scalability += 2;
        if (this.props.settings.patterns.includes('event_driven'))
            scalability += 2;
        return Math.min(scalability, 10);
    }
    calculatePerformance() {
        let performance = 5;
        if (this.props.type.value === 'hexagonal')
            performance += 2;
        if (this.props.settings.patterns.includes('caching'))
            performance += 2;
        if (this.props.settings.patterns.includes('optimization'))
            performance += 1;
        return Math.min(performance, 10);
    }
    calculateSecurity() {
        let security = 5;
        if (this.props.settings.patterns.includes('security_by_design'))
            security += 2;
        if (this.props.settings.patterns.includes('authentication'))
            security += 1;
        if (this.props.settings.patterns.includes('authorization'))
            security += 1;
        if (this.props.settings.patterns.includes('encryption'))
            security += 1;
        return Math.min(security, 10);
    }
    calculateQualityScore(metrics) {
        const weights = {
            complexity: 0.15,
            coupling: 0.15,
            cohesion: 0.15,
            maintainability: 0.15,
            testability: 0.15,
            scalability: 0.1,
            performance: 0.1,
            security: 0.05
        };
        let score = 0;
        score += (10 - metrics.complexity) * weights.complexity;
        score += (10 - metrics.coupling) * weights.coupling;
        score += metrics.cohesion * weights.cohesion;
        score += metrics.maintainability * weights.maintainability;
        score += metrics.testability * weights.testability;
        score += metrics.scalability * weights.scalability;
        score += metrics.performance * weights.performance;
        score += metrics.security * weights.security;
        return Math.round(score * 100) / 100;
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
        if (!this.props.settings.layers || this.props.settings.layers.length === 0) {
            return false;
        }
        return true;
    }
    toJSON() {
        return { ...this.props };
    }
    clone() {
        return Architecture.fromJSON(this.toJSON());
    }
    static createHexagonalArchitecture(props) {
        return Architecture.create({
            ...props,
            type: 'hexagonal',
        });
    }
    static createMicroservicesArchitecture(props) {
        return Architecture.create({
            ...props,
            type: 'microservices',
        });
    }
    static createLayeredArchitecture(props) {
        return Architecture.create({
            ...props,
            type: 'layered',
        });
    }
}
//# sourceMappingURL=architecture.entity.js.map