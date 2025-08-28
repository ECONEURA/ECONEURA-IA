import { z } from 'zod';
import { 
  StartFlowSchema, 
  FlowConfigSchema,
  FlowHistoryQuerySchema,
  BaseHeadersSchema,
  validateRequest 
} from '../schemas';

export class FlowsClient {
  constructor(
    private baseUrl: string,
    private headers: z.infer<typeof BaseHeadersSchema>
  ) {}

  // Iniciar flujo
  async startFlow(params: z.infer<typeof StartFlowSchema>) {
    const validatedParams = validateRequest(StartFlowSchema, params);

    const response = await fetch(this.baseUrl + '/flows', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to start flow: ' + response.statusText);
    }

    return response.json();
  }

  // Consultar estado de flujo
  async getFlowStatus(executionId: string) {
    const response = await fetch(this.baseUrl + '/flows/' + executionId, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get flow status: ' + response.statusText);
    }

    return response.json();
  }

  // Cancelar flujo
  async cancelFlow(executionId: string) {
    const response = await fetch(this.baseUrl + '/flows/' + executionId + '/cancel', {
      method: 'POST',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to cancel flow: ' + response.statusText);
    }

    return response.json();
  }

  // Actualizar configuración de flujo
  async updateFlowConfig(flowType: string, config: z.infer<typeof FlowConfigSchema>) {
    const validatedConfig = validateRequest(FlowConfigSchema, config);

    const response = await fetch(this.baseUrl + '/flows/config/' + flowType, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedConfig),
    });

    if (!response.ok) {
      throw new Error('Failed to update flow config: ' + response.statusText);
    }

    return response.json();
  }

  // Consultar historial de flujos
  async getFlowHistory(params: z.infer<typeof FlowHistoryQuerySchema>) {
    const validatedParams = validateRequest(FlowHistoryQuerySchema, params);
    
    const query = new URLSearchParams();
    if (validatedParams.org_id) query.append('org_id', validatedParams.org_id);
    if (validatedParams.flow_type) query.append('flow_type', validatedParams.flow_type);
    if (validatedParams.status) query.append('status', validatedParams.status);
    if (validatedParams.start_date) query.append('start_date', validatedParams.start_date.toISOString());
    if (validatedParams.end_date) query.append('end_date', validatedParams.end_date.toISOString());

    const response = await fetch(this.baseUrl + '/flows/history?' + query.toString(), {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get flow history: ' + response.statusText);
    }

    return response.json();
  }
}
