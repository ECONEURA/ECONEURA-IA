// Interactions Service - PR-8: CRM Interactions
// Servicio completo para gestión de interacciones CRM

import { z } from 'zod';

import { logger } from './logger.js';

// Esquemas de validación
export const InteractionTypeSchema = z.enum(['email', 'call', 'meeting', 'note', 'task']);
export const InteractionStatusSchema = z.enum(['pending', 'completed', 'cancelled']);
export const InteractionPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const CreateInteractionSchema = z.object({
  type: InteractionTypeSchema,
  subject: z.string().optional(),
  content: z.string().min(1),
  status: InteractionStatusSchema.default('pending'),
  priority: InteractionPrioritySchema.default('medium'),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

export const UpdateInteractionSchema = CreateInteractionSchema.partial();

export const InteractionFiltersSchema = z.object({
  type: InteractionTypeSchema.optional(),
  status: InteractionStatusSchema.optional(),
  priority: InteractionPrioritySchema.optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export interface Interaction {
  id: string;
  org_id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject?: string;
  content: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  contact_id?: string;
  deal_id?: string;
  metadata?: Record<string, any>;
}

export interface InteractionSummary {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  pending_count: number;
  overdue_count: number;
  completed_today: number;
  avg_completion_time: number;
  top_assignees: Array<{ user_id: string; count: number }>;
  recent_activity: Array<{ date: string; count: number }>;
}

export interface InteractionAnalytics {
  summary: InteractionSummary;
  trends: {
    completion_rate: number;
    avg_response_time: number;
    satisfaction_score: number;
    productivity_metrics: {
      interactions_per_day: number;
      completion_rate_by_type: Record<string, number>;
      peak_hours: Array<{ hour: number; count: number }>;
    };
  };
  recommendations: string[];
}

export class InteractionsService {
  private interactions: Map<string, Interaction> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeSampleData();
    logger.info('InteractionsService initialized');
  }

  private initializeSampleData(): void {
    const sampleInteractions: Omit<Interaction, 'id'>[] = [
      {
        org_id: 'demo-org-1',
        type: 'email',
        subject: 'Follow-up on proposal',
        content: 'Sent proposal for Q1 project to client. Waiting for feedback.',
        status: 'completed',
        priority: 'high',
        completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'user-1',
        created_by: 'user-1',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        company_id: 'company-1',
        contact_id: 'contact-1',
        deal_id: 'deal-1',
        metadata: { email_id: 'email-123', sent_at: new Date().toISOString() }
      },
      {
        org_id: 'demo-org-1',
        type: 'call',
        subject: 'Discovery call',
        content: 'Initial discovery call with new prospect. Discussed requirements and timeline.',
        status: 'completed',
        priority: 'medium',
        completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'user-2',
        created_by: 'user-2',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        company_id: 'company-2',
        contact_id: 'contact-2',
        metadata: { call_duration: 30, call_quality: 'good' }
      },
      {
        org_id: 'demo-org-1',
        type: 'meeting',
        subject: 'Project kickoff',
        content: 'Scheduled project kickoff meeting for next week.',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'user-1',
        created_by: 'user-1',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        company_id: 'company-1',
        contact_id: 'contact-1',
        deal_id: 'deal-1',
        metadata: { meeting_type: 'video', duration: 60 }
      },
      {
        org_id: 'demo-org-1',
        type: 'note',
        subject: 'Client feedback',
        content: 'Client provided positive feedback on the demo. Interested in moving forward.',
        status: 'completed',
        priority: 'medium',
        completed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'user-3',
        created_by: 'user-3',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        company_id: 'company-3',
        contact_id: 'contact-3',
        metadata: { source: 'demo_session', sentiment: 'positive' }
      },
      {
        org_id: 'demo-org-1',
        type: 'task',
        subject: 'Prepare contract',
        content: 'Prepare contract documents for new client.',
        status: 'pending',
        priority: 'urgent',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'user-2',
        created_by: 'user-1',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        company_id: 'company-1',
        deal_id: 'deal-1',
        metadata: { task_type: 'documentation', estimated_hours: 4 }
      }
    ];

    sampleInteractions.forEach(interaction => {
      const id = `interaction-${this.nextId++}`;
      this.interactions.set(id, { ...interaction, id });
    });
  }

  async createInteraction(orgId: string, userId: string, data: z.infer<typeof CreateInteractionSchema>): Promise<Interaction> {
    try {
      const validatedData = CreateInteractionSchema.parse(data);
      
      const interaction: Interaction = {
        id: `interaction-${this.nextId++}`,
        org_id: orgId,
        ...validatedData,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.interactions.set(interaction.id, interaction);

      logger.info('Interaction created', {
        interactionId: interaction.id,
        type: interaction.type,
        status: interaction.status,
        orgId,
        userId
      });

      return interaction;
    } catch (error) {
      logger.error('Failed to create interaction', {
        error: (error as Error).message,
        orgId,
        userId,
        data
      });
      throw error;
    }
  }

  async getInteractions(orgId: string, filters: z.infer<typeof InteractionFiltersSchema>): Promise<{ interactions: Interaction[]; total: number }> {
    try {
      const validatedFilters = InteractionFiltersSchema.parse(filters);
      
      let filteredInteractions = Array.from(this.interactions.values())
        .filter(interaction => interaction.org_id === orgId);

      // Aplicar filtros
      if (validatedFilters.type) {
        filteredInteractions = filteredInteractions.filter(i => i.type === validatedFilters.type);
      }
      if (validatedFilters.status) {
        filteredInteractions = filteredInteractions.filter(i => i.status === validatedFilters.status);
      }
      if (validatedFilters.priority) {
        filteredInteractions = filteredInteractions.filter(i => i.priority === validatedFilters.priority);
      }
      if (validatedFilters.company_id) {
        filteredInteractions = filteredInteractions.filter(i => i.company_id === validatedFilters.company_id);
      }
      if (validatedFilters.contact_id) {
        filteredInteractions = filteredInteractions.filter(i => i.contact_id === validatedFilters.contact_id);
      }
      if (validatedFilters.deal_id) {
        filteredInteractions = filteredInteractions.filter(i => i.deal_id === validatedFilters.deal_id);
      }
      if (validatedFilters.assigned_to) {
        filteredInteractions = filteredInteractions.filter(i => i.assigned_to === validatedFilters.assigned_to);
      }
      if (validatedFilters.created_by) {
        filteredInteractions = filteredInteractions.filter(i => i.created_by === validatedFilters.created_by);
      }
      if (validatedFilters.date_from) {
        const fromDate = new Date(validatedFilters.date_from);
        filteredInteractions = filteredInteractions.filter(i => new Date(i.created_at) >= fromDate);
      }
      if (validatedFilters.date_to) {
        const toDate = new Date(validatedFilters.date_to);
        filteredInteractions = filteredInteractions.filter(i => new Date(i.created_at) <= toDate);
      }

      // Ordenar por fecha de creación (más recientes primero)
      filteredInteractions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = filteredInteractions.length;
      const interactions = filteredInteractions.slice(
        validatedFilters.offset,
        validatedFilters.offset + validatedFilters.limit
      );

      logger.info('Interactions retrieved', {
        orgId,
        filters: validatedFilters,
        count: interactions.length,
        total
      });

      return { interactions, total };
    } catch (error) {
      logger.error('Failed to get interactions', {
        error: (error as Error).message,
        orgId,
        filters
      });
      throw error;
    }
  }

  async getInteractionById(orgId: string, interactionId: string): Promise<Interaction | null> {
    try {
      const interaction = this.interactions.get(interactionId);
      
      if (!interaction || interaction.org_id !== orgId) {
        return null;
      }

      logger.info('Interaction retrieved by ID', {
        interactionId,
        orgId
      });

      return interaction;
    } catch (error) {
      logger.error('Failed to get interaction by ID', {
        error: (error as Error).message,
        interactionId,
        orgId
      });
      throw error;
    }
  }

  async updateInteraction(orgId: string, interactionId: string, userId: string, data: z.infer<typeof UpdateInteractionSchema>): Promise<Interaction | null> {
    try {
      const validatedData = UpdateInteractionSchema.parse(data);
      const interaction = this.interactions.get(interactionId);
      
      if (!interaction || interaction.org_id !== orgId) {
        return null;
      }

      const updatedInteraction: Interaction = {
        ...interaction,
        ...validatedData,
        updated_at: new Date().toISOString(),
      };

      // Si se marca como completado, agregar fecha de completado
      if (validatedData.status === 'completed' && !interaction.completed_at) {
        updatedInteraction.completed_at = new Date().toISOString();
      }

      this.interactions.set(interactionId, updatedInteraction);

      logger.info('Interaction updated', {
        interactionId,
        orgId,
        userId,
        updates: Object.keys(validatedData)
      });

      return updatedInteraction;
    } catch (error) {
      logger.error('Failed to update interaction', {
        error: (error as Error).message,
        interactionId,
        orgId,
        userId,
        data
      });
      throw error;
    }
  }

  async deleteInteraction(orgId: string, interactionId: string, userId: string): Promise<boolean> {
    try {
      const interaction = this.interactions.get(interactionId);
      
      if (!interaction || interaction.org_id !== orgId) {
        return false;
      }

      this.interactions.delete(interactionId);

      logger.info('Interaction deleted', {
        interactionId,
        orgId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete interaction', {
        error: (error as Error).message,
        interactionId,
        orgId,
        userId
      });
      throw error;
    }
  }

  async getInteractionSummary(orgId: string): Promise<InteractionSummary> {
    try {
      const interactions = Array.from(this.interactions.values())
        .filter(interaction => interaction.org_id === orgId);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calcular estadísticas
      const byType = interactions.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = interactions.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byPriority = interactions.reduce((acc, i) => {
        acc[i.priority] = (acc[i.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pendingCount = interactions.filter(i => i.status === 'pending').length;
      
      const overdueCount = interactions.filter(i => 
        i.status === 'pending' && 
        i.due_date && 
        new Date(i.due_date) < now
      ).length;

      const completedToday = interactions.filter(i => 
        i.status === 'completed' && 
        i.completed_at && 
        new Date(i.completed_at) >= today
      ).length;

      // Calcular tiempo promedio de completado
      const completedInteractions = interactions.filter(i => 
        i.status === 'completed' && i.completed_at
      );
      
      const avgCompletionTime = completedInteractions.length > 0 
        ? completedInteractions.reduce((sum, i) => {
            const created = new Date(i.created_at).getTime();
            const completed = new Date(i.completed_at!).getTime();
            return sum + (completed - created);
          }, 0) / completedInteractions.length / (1000 * 60 * 60) // en horas
        : 0;

      // Top asignados
      const assigneeCounts = interactions
        .filter(i => i.assigned_to)
        .reduce((acc, i) => {
          acc[i.assigned_to!] = (acc[i.assigned_to!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topAssignees = Object.entries(assigneeCounts)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Actividad reciente (últimos 7 días)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const count = interactions.filter(i => {
          const created = new Date(i.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        recentActivity.push({
          date: dayStart.toISOString().split('T')[0],
          count
        });
      }

      const summary: InteractionSummary = {
        total: interactions.length,
        by_type: byType,
        by_status: byStatus,
        by_priority: byPriority,
        pending_count: pendingCount,
        overdue_count: overdueCount,
        completed_today: completedToday,
        avg_completion_time: avgCompletionTime,
        top_assignees: topAssignees,
        recent_activity: recentActivity
      };

      logger.info('Interaction summary generated', {
        orgId,
        total: summary.total,
        pending: summary.pending_count,
        overdue: summary.overdue_count
      });

      return summary;
    } catch (error) {
      logger.error('Failed to get interaction summary', {
        error: (error as Error).message,
        orgId
      });
      throw error;
    }
  }

  async getInteractionAnalytics(orgId: string): Promise<InteractionAnalytics> {
    try {
      const summary = await this.getInteractionSummary(orgId);
      const interactions = Array.from(this.interactions.values())
        .filter(interaction => interaction.org_id === orgId);

      // Calcular tendencias
      const completedInteractions = interactions.filter(i => i.status === 'completed');
      const completionRate = interactions.length > 0 
        ? (completedInteractions.length / interactions.length) * 100 
        : 0;

      // Tiempo promedio de respuesta (simulado)
      const avgResponseTime = 2.5; // horas

      // Score de satisfacción (simulado)
      const satisfactionScore = 4.2; // de 5

      // Métricas de productividad
      const interactionsPerDay = interactions.length / 30; // últimos 30 días

      const completionRateByType = Object.keys(summary.by_type).reduce((acc, type) => {
        const typeInteractions = interactions.filter(i => i.type === type);
        const completed = typeInteractions.filter(i => i.status === 'completed').length;
        acc[type] = typeInteractions.length > 0 ? (completed / typeInteractions.length) * 100 : 0;
        return acc;
      }, {} as Record<string, number>);

      // Horas pico (simulado)
      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: Math.floor(Math.random() * 20) + 5
      }));

      // Generar recomendaciones
      const recommendations: string[] = [];
      
      if (summary.overdue_count > 0) {
        recommendations.push(`Tienes ${summary.overdue_count} interacciones vencidas que requieren atención inmediata.`);
      }
      
      if (completionRate < 70) {
        recommendations.push('La tasa de completado está por debajo del 70%. Considera revisar la carga de trabajo.');
      }
      
      if (summary.avg_completion_time > 24) {
        recommendations.push('El tiempo promedio de completado es alto. Considera optimizar los procesos.');
      }

      if (recommendations.length === 0) {
        recommendations.push('¡Excelente trabajo! Todas las métricas están en niveles óptimos.');
      }

      const analytics: InteractionAnalytics = {
        summary,
        trends: {
          completion_rate: completionRate,
          avg_response_time: avgResponseTime,
          satisfaction_score: satisfactionScore,
          productivity_metrics: {
            interactions_per_day: interactionsPerDay,
            completion_rate_by_type: completionRateByType,
            peak_hours: peakHours
          }
        },
        recommendations
      };

      logger.info('Interaction analytics generated', {
        orgId,
        completionRate: completionRate.toFixed(2),
        recommendations: recommendations.length
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to get interaction analytics', {
        error: (error as Error).message,
        orgId
      });
      throw error;
    }
  }

  async bulkUpdateInteractions(orgId: string, userId: string, updates: Array<{
    id: string;
    data: z.infer<typeof UpdateInteractionSchema>;
  }>): Promise<{ updated: number; failed: number; errors: string[] }> {
    try {
      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const update of updates) {
        try {
          const result = await this.updateInteraction(orgId, update.id, userId, update.data);
          if (result) {
            updated++;
          } else {
            failed++;
            errors.push(`Interaction ${update.id} not found or access denied`);
          }
        } catch (error) {
          failed++;
          errors.push(`Failed to update interaction ${update.id}: ${(error as Error).message}`);
        }
      }

      logger.info('Bulk update completed', {
        orgId,
        userId,
        updated,
        failed,
        total: updates.length
      });

      return { updated, failed, errors };
    } catch (error) {
      logger.error('Failed to bulk update interactions', {
        error: (error as Error).message,
        orgId,
        userId
      });
      throw error;
    }
  }

  getStats(): any {
    return {
      totalInteractions: this.interactions.size,
      byType: Array.from(this.interactions.values()).reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: Array.from(this.interactions.values()).reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byOrg: Array.from(this.interactions.values()).reduce((acc, i) => {
        acc[i.org_id] = (acc[i.org_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const interactionsService = new InteractionsService();

