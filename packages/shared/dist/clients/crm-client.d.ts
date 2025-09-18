import { BaseClient, PaginatedResponse } from './base-client.js';
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
export declare class CRMClient extends BaseClient {
    listContacts(page?: number, pageSize?: number): Promise<PaginatedResponse<Contact>>;
    getContact(id: string): Promise<Contact>;
    createContact(data: CreateContactInput): Promise<Contact>;
    updateContact(id: string, data: UpdateContactInput): Promise<Contact>;
    deleteContact(id: string): Promise<void>;
    searchContacts(query: string): Promise<Contact[]>;
    listCompanies(page?: number, pageSize?: number): Promise<PaginatedResponse<Company>>;
    getCompany(id: string): Promise<Company>;
    createCompany(data: CreateCompanyInput): Promise<Company>;
    updateCompany(id: string, data: UpdateCompanyInput): Promise<Company>;
    deleteCompany(id: string): Promise<void>;
    searchCompanies(query: string): Promise<Company[]>;
    listDeals(page?: number, pageSize?: number): Promise<PaginatedResponse<Deal>>;
    getDeal(id: string): Promise<Deal>;
    createDeal(data: CreateDealInput): Promise<Deal>;
    updateDeal(id: string, data: UpdateDealInput): Promise<Deal>;
    deleteDeal(id: string): Promise<void>;
    getDealsByStage(stage: string): Promise<Deal[]>;
    listActivities(page?: number, pageSize?: number): Promise<PaginatedResponse<Activity>>;
    getActivity(id: string): Promise<Activity>;
    createActivity(data: CreateActivityInput): Promise<Activity>;
    updateActivity(id: string, data: UpdateActivityInput): Promise<Activity>;
    deleteActivity(id: string): Promise<void>;
    getActivitiesByContact(contactId: string): Promise<Activity[]>;
    getActivitiesByCompany(companyId: string): Promise<Activity[]>;
    listLabels(type?: string): Promise<Label[]>;
    getLabel(id: string): Promise<Label>;
    createLabel(data: CreateLabelInput): Promise<Label>;
    updateLabel(id: string, data: UpdateLabelInput): Promise<Label>;
    deleteLabel(id: string): Promise<void>;
    getPipelineReport(): Promise<{
        total_deals: number;
        total_value: number;
        deals_by_stage: Array<{
            stage: string;
            count: number;
            value: number;
        }>;
        conversion_rate: number;
    }>;
    getActivityReport(startDate: string, endDate: string): Promise<{
        total_activities: number;
        activities_by_type: Array<{
            type: string;
            count: number;
        }>;
        completion_rate: number;
    }>;
}
//# sourceMappingURL=crm-client.d.ts.map