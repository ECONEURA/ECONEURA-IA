import { z } from 'zod';
import { 
  CreateCompanySchema,
  UpdateCompanySchema,
  CreateContactSchema,
  UpdateContactSchema,
  CreateDealSchema,
  UpdateDealSchema,
  BaseHeadersSchema,
  validateRequest 
} from '../schemas';

export class CRMClient {
  constructor(
    private baseUrl: string,
    private headers: z.infer<typeof BaseHeadersSchema>
  ) {}

  // Empresas
  async createCompany(params: z.infer<typeof CreateCompanySchema>) {
    const validatedParams = validateRequest(CreateCompanySchema, params);

    const response = await fetch(this.baseUrl + '/crm/companies', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to create company: ' + response.statusText);
    }

    return response.json();
  }

  async updateCompany(id: string, params: z.infer<typeof UpdateCompanySchema>) {
    const validatedParams = validateRequest(UpdateCompanySchema, params);

    const response = await fetch(this.baseUrl + '/crm/companies/' + id, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to update company: ' + response.statusText);
    }

    return response.json();
  }

  async getCompany(id: string) {
    const response = await fetch(this.baseUrl + '/crm/companies/' + id, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get company: ' + response.statusText);
    }

    return response.json();
  }

  async listCompanies(params?: { 
    page?: number; 
    perPage?: number;
    type?: string;
    status?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.perPage) query.append('per_page', params.perPage.toString());
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const response = await fetch(this.baseUrl + '/crm/companies?' + query.toString(), {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to list companies: ' + response.statusText);
    }

    return response.json();
  }

  // Contactos
  async createContact(params: z.infer<typeof CreateContactSchema>) {
    const validatedParams = validateRequest(CreateContactSchema, params);

    const response = await fetch(this.baseUrl + '/crm/contacts', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to create contact: ' + response.statusText);
    }

    return response.json();
  }

  async updateContact(id: string, params: z.infer<typeof UpdateContactSchema>) {
    const validatedParams = validateRequest(UpdateContactSchema, params);

    const response = await fetch(this.baseUrl + '/crm/contacts/' + id, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to update contact: ' + response.statusText);
    }

    return response.json();
  }

  async getContact(id: string) {
    const response = await fetch(this.baseUrl + '/crm/contacts/' + id, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get contact: ' + response.statusText);
    }

    return response.json();
  }

  async listContacts(params?: {
    page?: number;
    perPage?: number;
    companyId?: string;
    type?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.perPage) query.append('per_page', params.perPage.toString());
    if (params?.companyId) query.append('company_id', params.companyId);
    if (params?.type) query.append('type', params.type);
    if (params?.search) query.append('search', params.search);

    const response = await fetch(this.baseUrl + '/crm/contacts?' + query.toString(), {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to list contacts: ' + response.statusText);
    }

    return response.json();
  }

  // Oportunidades
  async createDeal(params: z.infer<typeof CreateDealSchema>) {
    const validatedParams = validateRequest(CreateDealSchema, params);

    const response = await fetch(this.baseUrl + '/crm/deals', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to create deal: ' + response.statusText);
    }

    return response.json();
  }

  async updateDeal(id: string, params: z.infer<typeof UpdateDealSchema>) {
    const validatedParams = validateRequest(UpdateDealSchema, params);

    const response = await fetch(this.baseUrl + '/crm/deals/' + id, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to update deal: ' + response.statusText);
    }

    return response.json();
  }

  async getDeal(id: string) {
    const response = await fetch(this.baseUrl + '/crm/deals/' + id, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get deal: ' + response.statusText);
    }

    return response.json();
  }

  async listDeals(params?: {
    page?: number;
    perPage?: number;
    companyId?: string;
    contactId?: string;
    stage?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.perPage) query.append('per_page', params.perPage.toString());
    if (params?.companyId) query.append('company_id', params.companyId);
    if (params?.contactId) query.append('contact_id', params.contactId);
    if (params?.stage) query.append('stage', params.stage);
    if (params?.search) query.append('search', params.search);

    const response = await fetch(this.baseUrl + '/crm/deals?' + query.toString(), {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to list deals: ' + response.statusText);
    }

    return response.json();
  }
}
