export { BaseClient } from './base-client.js';
export { ERPClient } from './erp-client.js';
export { CRMClient } from './crm-client.js';
export { FinanceClient } from './finance-client.js';
export class ECONEURAClient {
    baseURL;
    apiKey;
    organizationId;
    constructor(config) {
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.organizationId = config.organizationId;
    }
    get erp() {
        return new ERPClient({
            baseURL: this.baseURL,
            apiKey: this.apiKey,
            organizationId: this.organizationId,
        });
    }
    get crm() {
        return new CRMClient({
            baseURL: this.baseURL,
            apiKey: this.apiKey,
            organizationId: this.organizationId,
        });
    }
    get finance() {
        return new FinanceClient({
            baseURL: this.baseURL,
            apiKey: this.apiKey,
            organizationId: this.organizationId,
        });
    }
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
    setOrganizationId(organizationId) {
        this.organizationId = organizationId;
    }
}
export default ECONEURAClient;
//# sourceMappingURL=index.js.map