export class Product {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new Product({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromJSON(data) {
        return new Product(data);
    }
    get id() { return this.props.id; }
    get organizationId() { return this.props.organizationId; }
    get name() { return this.props.name; }
    get description() { return this.props.description; }
    get shortDescription() { return this.props.shortDescription; }
    get sku() { return this.props.sku; }
    get barcode() { return this.props.barcode; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get category() { return this.props.category; }
    get brand() { return this.props.brand; }
    get supplier() { return this.props.supplier; }
    get settings() { return this.props.settings; }
    get images() { return this.props.images; }
    get documents() { return this.props.documents; }
    get specifications() { return this.props.specifications; }
    get variants() { return this.props.variants; }
    get isActive() { return this.props.isActive; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    updateName(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Product name cannot be empty');
        }
        this.props.name = name.trim();
        this.props.updatedAt = new Date();
    }
    updateDescription(description) {
        this.props.description = description;
        this.props.updatedAt = new Date();
    }
    updateShortDescription(shortDescription) {
        this.props.shortDescription = shortDescription;
        this.props.updatedAt = new Date();
    }
    updateSku(sku) {
        if (!sku || sku.trim().length === 0) {
            throw new Error('Product SKU cannot be empty');
        }
        this.props.sku = sku.trim();
        this.props.updatedAt = new Date();
    }
    updateBarcode(barcode) {
        this.props.barcode = barcode;
        this.props.updatedAt = new Date();
    }
    updateType(type) {
        this.props.type = type;
        this.props.updatedAt = new Date();
    }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }
    updateCategory(category) {
        this.props.category = category;
        this.props.updatedAt = new Date();
    }
    updateBrand(brand) {
        this.props.brand = brand;
        this.props.updatedAt = new Date();
    }
    updateSupplier(supplier) {
        this.props.supplier = supplier;
        this.props.updatedAt = new Date();
    }
    updateSettings(settings) {
        this.props.settings = settings;
        this.props.updatedAt = new Date();
    }
    addImage(imageUrl) {
        if (!this.props.images) {
            this.props.images = [];
        }
        if (!this.props.images.includes(imageUrl)) {
            this.props.images.push(imageUrl);
            this.props.updatedAt = new Date();
        }
    }
    removeImage(imageUrl) {
        if (this.props.images) {
            this.props.images = this.props.images.filter(img => img !== imageUrl);
            this.props.updatedAt = new Date();
        }
    }
    addDocument(documentUrl) {
        if (!this.props.documents) {
            this.props.documents = [];
        }
        if (!this.props.documents.includes(documentUrl)) {
            this.props.documents.push(documentUrl);
            this.props.updatedAt = new Date();
        }
    }
    removeDocument(documentUrl) {
        if (this.props.documents) {
            this.props.documents = this.props.documents.filter(doc => doc !== documentUrl);
            this.props.updatedAt = new Date();
        }
    }
    updateSpecifications(specifications) {
        this.props.specifications = specifications;
        this.props.updatedAt = new Date();
    }
    addVariant(variant) {
        if (!this.props.variants) {
            this.props.variants = [];
        }
        this.props.variants.push(variant);
        this.props.updatedAt = new Date();
    }
    removeVariant(variantId) {
        if (this.props.variants) {
            this.props.variants = this.props.variants.filter(v => v.id !== variantId);
            this.props.updatedAt = new Date();
        }
    }
    updateVariant(variantId, updates) {
        if (this.props.variants) {
            const variantIndex = this.props.variants.findIndex(v => v.id === variantId);
            if (variantIndex !== -1) {
                this.props.variants[variantIndex] = { ...this.props.variants[variantIndex], ...updates };
                this.props.updatedAt = new Date();
            }
        }
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    validate() {
        if (!this.props.name || this.props.name.trim().length === 0) {
            return false;
        }
        if (!this.props.sku || this.props.sku.trim().length === 0) {
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
    clone() {
        return Product.fromJSON(this.toJSON());
    }
    static createPhysicalProduct(props) {
        return Product.create({
            ...props,
            type: 'physical',
        });
    }
    static createDigitalProduct(props) {
        return Product.create({
            ...props,
            type: 'digital',
        });
    }
    static createServiceProduct(props) {
        return Product.create({
            ...props,
            type: 'service',
        });
    }
    static createSubscriptionProduct(props) {
        return Product.create({
            ...props,
            type: 'subscription',
        });
    }
    static createBundleProduct(props) {
        return Product.create({
            ...props,
            type: 'bundle',
        });
    }
}
//# sourceMappingURL=product.entity.js.map