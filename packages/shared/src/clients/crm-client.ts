import { BaseClient, PaginatedResponse } from './base-client.js';

// CRM Types
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  position?: string;
  department?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expected_close_date: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id: string;
  scheduled_at?: string;
  completed_at?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  type: 'contact' | 'company' | 'deal' | 'activity';
  created_at: string;
  updated_at: string;
}

// Input Types
export interface CreateContactInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  position?: string;
  department?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateContactInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_id?: string;
  position?: string;
  department?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateDealInput {
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expected_close_date: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateDealInput {
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability?: number;
  expected_close_date?: string;
  contact_id?: string;
  company_id?: string;
  owner_id?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateActivityInput {
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id: string;
  scheduled_at?: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface UpdateActivityInput {
  type?: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject?: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id?: string;
  scheduled_at?: string;
  completed_at?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CreateLabelInput {
  name: string;
  color: string;
  type: 'contact' | 'company' | 'deal' | 'activity';
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
  type?: 'contact' | 'company' | 'deal' | 'activity';
}

export class CRMClient extends BaseClient {
  // Contacts
  async listContacts(page = 1, pageSize = 20): Promise<PaginatedResponse<Contact>> {
    return this.get('/v1/crm/contacts', { params: { page, pageSize } });
  }

  async getContact(id: string): Promise<Contact> {
    return this.get(`/v1/crm/contacts/${id}`);
  }

  async createContact(data: CreateContactInput): Promise<Contact> {
    return this.post('/v1/crm/contacts', data);
  }

  async updateContact(id: string, data: UpdateContactInput): Promise<Contact> {
    return this.patch(`/v1/crm/contacts/${id}`, data);
  }

  async deleteContact(id: string): Promise<void> {
    return this.delete(`/v1/crm/contacts/${id}`);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    return this.get('/v1/crm/contacts/search', { params: { q: query } });
  }

  // Companies
  async listCompanies(page = 1, pageSize = 20): Promise<PaginatedResponse<Company>> {
    return this.get('/v1/crm/companies', { params: { page, pageSize } });
  }

  async getCompany(id: string): Promise<Company> {
    return this.get(`/v1/crm/companies/${id}`);
  }

  async createCompany(data: CreateCompanyInput): Promise<Company> {
    return this.post('/v1/crm/companies', data);
  }

  async updateCompany(id: string, data: UpdateCompanyInput): Promise<Company> {
    return this.patch(`/v1/crm/companies/${id}`, data);
  }

  async deleteCompany(id: string): Promise<void> {
    return this.delete(`/v1/crm/companies/${id}`);
  }

  async searchCompanies(query: string): Promise<Company[]> {
    return this.get('/v1/crm/companies/search', { params: { q: query } });
  }

  // Deals
  async listDeals(page = 1, pageSize = 20): Promise<PaginatedResponse<Deal>> {
    return this.get('/v1/crm/deals', { params: { page, pageSize } });
  }

  async getDeal(id: string): Promise<Deal> {
    return this.get(`/v1/crm/deals/${id}`);
  }

  async createDeal(data: CreateDealInput): Promise<Deal> {
    return this.post('/v1/crm/deals', data);
  }

  async updateDeal(id: string, data: UpdateDealInput): Promise<Deal> {
    return this.patch(`/v1/crm/deals/${id}`, data);
  }

  async deleteDeal(id: string): Promise<void> {
    return this.delete(`/v1/crm/deals/${id}`);
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return this.get('/v1/crm/deals/by-stage', { params: { stage } });
  }

  // Activities
  async listActivities(page = 1, pageSize = 20): Promise<PaginatedResponse<Activity>> {
    return this.get('/v1/crm/activities', { params: { page, pageSize } });
  }

  async getActivity(id: string): Promise<Activity> {
    return this.get(`/v1/crm/activities/${id}`);
  }

  async createActivity(data: CreateActivityInput): Promise<Activity> {
    return this.post('/v1/crm/activities', data);
  }

  async updateActivity(id: string, data: UpdateActivityInput): Promise<Activity> {
    return this.patch(`/v1/crm/activities/${id}`, data);
  }

  async deleteActivity(id: string): Promise<void> {
    return this.delete(`/v1/crm/activities/${id}`);
  }

  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    return this.get(`/v1/crm/activities/by-contact/${contactId}`);
  }

  async getActivitiesByCompany(companyId: string): Promise<Activity[]> {
    return this.get(`/v1/crm/activities/by-company/${companyId}`);
  }

  // Labels
  async listLabels(type?: string): Promise<Label[]> {
    return this.get('/v1/crm/labels', { params: { type } });
  }

  async getLabel(id: string): Promise<Label> {
    return this.get(`/v1/crm/labels/${id}`);
  }

  async createLabel(data: CreateLabelInput): Promise<Label> {
    return this.post('/v1/crm/labels', data);
  }

  async updateLabel(id: string, data: UpdateLabelInput): Promise<Label> {
    return this.patch(`/v1/crm/labels/${id}`, data);
  }

  async deleteLabel(id: string): Promise<void> {
    return this.delete(`/v1/crm/labels/${id}`);
  }

  // Reports
  async getPipelineReport(): Promise<{
    total_deals: number;
    total_value: number;
    deals_by_stage: Array<{ stage: string; count: number; value: number }>;
    conversion_rate: number;
  }> {
    return this.get('/v1/crm/reports/pipeline');
  }

  async getActivityReport(startDate: string, endDate: string): Promise<{
    total_activities: number;
    activities_by_type: Array<{ type: string; count: number }>;
    completion_rate: number;
  }> {
    return this.get('/v1/crm/reports/activities', { 
      params: { startDate, endDate } 
    });
  }
}
