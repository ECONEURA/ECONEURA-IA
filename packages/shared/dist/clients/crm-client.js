import { BaseClient } from './base-client.js';
export class CRMClient extends BaseClient {
    async listContacts(page = 1, pageSize = 20) {
        return this.get('/v1/crm/contacts', { params: { page, pageSize } });
    }
    async getContact(id) {
        return this.get(`/v1/crm/contacts/${id}`);
    }
    async createContact(data) {
        return this.post('/v1/crm/contacts', data);
    }
    async updateContact(id, data) {
        return this.patch(`/v1/crm/contacts/${id}`, data);
    }
    async deleteContact(id) {
        return this.delete(`/v1/crm/contacts/${id}`);
    }
    async searchContacts(query) {
        return this.get('/v1/crm/contacts/search', { params: { q: query } });
    }
    async listCompanies(page = 1, pageSize = 20) {
        return this.get('/v1/crm/companies', { params: { page, pageSize } });
    }
    async getCompany(id) {
        return this.get(`/v1/crm/companies/${id}`);
    }
    async createCompany(data) {
        return this.post('/v1/crm/companies', data);
    }
    async updateCompany(id, data) {
        return this.patch(`/v1/crm/companies/${id}`, data);
    }
    async deleteCompany(id) {
        return this.delete(`/v1/crm/companies/${id}`);
    }
    async searchCompanies(query) {
        return this.get('/v1/crm/companies/search', { params: { q: query } });
    }
    async listDeals(page = 1, pageSize = 20) {
        return this.get('/v1/crm/deals', { params: { page, pageSize } });
    }
    async getDeal(id) {
        return this.get(`/v1/crm/deals/${id}`);
    }
    async createDeal(data) {
        return this.post('/v1/crm/deals', data);
    }
    async updateDeal(id, data) {
        return this.patch(`/v1/crm/deals/${id}`, data);
    }
    async deleteDeal(id) {
        return this.delete(`/v1/crm/deals/${id}`);
    }
    async getDealsByStage(stage) {
        return this.get('/v1/crm/deals/by-stage', { params: { stage } });
    }
    async listActivities(page = 1, pageSize = 20) {
        return this.get('/v1/crm/activities', { params: { page, pageSize } });
    }
    async getActivity(id) {
        return this.get(`/v1/crm/activities/${id}`);
    }
    async createActivity(data) {
        return this.post('/v1/crm/activities', data);
    }
    async updateActivity(id, data) {
        return this.patch(`/v1/crm/activities/${id}`, data);
    }
    async deleteActivity(id) {
        return this.delete(`/v1/crm/activities/${id}`);
    }
    async getActivitiesByContact(contactId) {
        return this.get(`/v1/crm/activities/by-contact/${contactId}`);
    }
    async getActivitiesByCompany(companyId) {
        return this.get(`/v1/crm/activities/by-company/${companyId}`);
    }
    async listLabels(type) {
        return this.get('/v1/crm/labels', { params: { type } });
    }
    async getLabel(id) {
        return this.get(`/v1/crm/labels/${id}`);
    }
    async createLabel(data) {
        return this.post('/v1/crm/labels', data);
    }
    async updateLabel(id, data) {
        return this.patch(`/v1/crm/labels/${id}`, data);
    }
    async deleteLabel(id) {
        return this.delete(`/v1/crm/labels/${id}`);
    }
    async getPipelineReport() {
        return this.get('/v1/crm/reports/pipeline');
    }
    async getActivityReport(startDate, endDate) {
        return this.get('/v1/crm/reports/activities', {
            params: { startDate, endDate }
        });
    }
}
//# sourceMappingURL=crm-client.js.map