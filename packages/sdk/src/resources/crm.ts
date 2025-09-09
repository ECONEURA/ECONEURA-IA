import { ApiClient } from '../client';
import type {
  Company,
  CreateCompany,
  UpdateCompany,
  CompanyFilter,
  Contact,
  CreateContact,
  UpdateContact,
  ContactFilter,
  Deal,
  CreateDeal,
  UpdateDeal,
  DealFilter,
  MoveDealStage,
  Activity,
  CreateActivity,
  UpdateActivity,
  PaginationResponse,
} from '@econeura/shared';

export class CrmResource {
  public companies: CompaniesResource;
  public contacts: ContactsResource;
  public deals: DealsResource;
  public activities: ActivitiesResource;

  constructor(private client: ApiClient) {
    this.companies = new CompaniesResource(client);
    this.contacts = new ContactsResource(client);
    this.deals = new DealsResource(client);
    this.activities = new ActivitiesResource(client);
  }
}

export class CompaniesResource {
  constructor(private client: ApiClient) {}

  async list(params?: CompanyFilter & { cursor?: string; limit?: number; sort?: string }): Promise<PaginationResponse & { data: Company[] }> {
    const response = await this.client.get<PaginationResponse & { data: Company[] }>('/api/v1/crm/companies', params);
    return response.data;
  }

  async get(id: string): Promise<Company> {
    const response = await this.client.get<Company>(`/api/v1/crm/companies/${id}`);
    return response.data;
  }

  async create(data: CreateCompany): Promise<Company> {
    const response = await this.client.post<Company>('/api/v1/crm/companies', data);
    return response.data;
  }

  async update(id: string, data: UpdateCompany): Promise<Company> {
    const response = await this.client.put<Company>(`/api/v1/crm/companies/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/api/v1/crm/companies/${id}`);
  }
}

export class ContactsResource {
  constructor(private client: ApiClient) {}

  async list(params?: ContactFilter & { cursor?: string; limit?: number; sort?: string }): Promise<PaginationResponse & { data: Contact[] }> {
    const response = await this.client.get<PaginationResponse & { data: Contact[] }>('/api/v1/crm/contacts', params);
    return response.data;
  }

  async get(id: string): Promise<Contact> {
    const response = await this.client.get<Contact>(`/api/v1/crm/contacts/${id}`);
    return response.data;
  }

  async create(data: CreateContact): Promise<Contact> {
    const response = await this.client.post<Contact>('/api/v1/crm/contacts', data);
    return response.data;
  }

  async update(id: string, data: UpdateContact): Promise<Contact> {
    const response = await this.client.put<Contact>(`/api/v1/crm/contacts/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/api/v1/crm/contacts/${id}`);
  }
}

export class DealsResource {
  constructor(private client: ApiClient) {}

  async list(params?: DealFilter & { cursor?: string; limit?: number; sort?: string }): Promise<PaginationResponse & { data: Deal[] }> {
    const response = await this.client.get<PaginationResponse & { data: Deal[] }>('/api/v1/crm/deals', params);
    return response.data;
  }

  async get(id: string): Promise<Deal> {
    const response = await this.client.get<Deal>(`/api/v1/crm/deals/${id}`);
    return response.data;
  }

  async create(data: CreateDeal): Promise<Deal> {
    const response = await this.client.post<Deal>('/api/v1/crm/deals', data);
    return response.data;
  }

  async update(id: string, data: UpdateDeal): Promise<Deal> {
    const response = await this.client.put<Deal>(`/api/v1/crm/deals/${id}`, data);
    return response.data;
  }

  async moveStage(id: string, data: MoveDealStage): Promise<Deal> {
    const response = await this.client.patch<Deal>(`/api/v1/crm/deals/${id}/stage`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/api/v1/crm/deals/${id}`);
  }
}

export class ActivitiesResource {
  constructor(private client: ApiClient) {}

  async list(params?: { entityType?: string; entityId?: string; cursor?: string; limit?: number }): Promise<PaginationResponse & { data: Activity[] }> {
    const response = await this.client.get<PaginationResponse & { data: Activity[] }>('/api/v1/crm/activities', params);
    return response.data;
  }

  async get(id: string): Promise<Activity> {
    const response = await this.client.get<Activity>(`/api/v1/crm/activities/${id}`);
    return response.data;
  }

  async create(data: CreateActivity): Promise<Activity> {
    const response = await this.client.post<Activity>('/api/v1/crm/activities', data);
    return response.data;
  }

  async update(id: string, data: UpdateActivity): Promise<Activity> {
    const response = await this.client.put<Activity>(`/api/v1/crm/activities/${id}`, data);
    return response.data;
  }

  async complete(id: string): Promise<Activity> {
    const response = await this.client.patch<Activity>(`/api/v1/crm/activities/${id}/complete`, {});
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/api/v1/crm/activities/${id}`);
  }
}
