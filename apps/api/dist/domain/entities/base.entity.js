export class BaseEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get organizationId() { return this.props.organizationId; }
    get isActive() { return this.props.isActive; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    activate() {
        this.props.isActive = true;
        this.updateTimestamp();
    }
    deactivate() {
        this.props.isActive = false;
        this.updateTimestamp();
    }
    updateTimestamp() {
        this.props.updatedAt = new Date();
    }
    validateBase() {
        if (!this.props.id || !this.props.id.value) {
            return false;
        }
        if (!this.props.organizationId || !this.props.organizationId.value) {
            return false;
        }
        return true;
    }
    toJSON() {
        return { ...this.props };
    }
    static generateId() {
        return crypto.randomUUID();
    }
    static getCurrentTimestamp() {
        return new Date();
    }
}
//# sourceMappingURL=base.entity.js.map