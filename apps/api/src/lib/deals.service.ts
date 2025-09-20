// Deals Service - PR-9: Deals Management
// Servicio completo para gestión de deals CRM

import { logger } from './logger.js';
import { z } from 'zod';
import { 
  DealSchema, 
  CreateDealSchema, 
  UpdateDealSchema, 
  DealFilterSchema,
  MoveDealStageSchema,
  DealAnalyticsSchema,
  type Deal,
  type CreateDeal,
  type UpdateDeal,
  type DealFilter,
  type MoveDealStage,
  type DealAnalytics
} from '@econeura/shared/src/schemas/crm';

export interface DealSummary {
  total: number;
  totalValue: number;
  averageDealSize: number;
  winRate: number;
  averageSalesCycle: number;
  dealsByStage: Record<string, number>;
  dealsByStatus: Record<string, number>;
  dealsByMonth: Array<{ month: string; count: number; value: number }>;
  topPerformers: Array<{ userId: string; name: string; dealsCount: number; totalValue: number; winRate: number }>;
  pipelineHealth: {
    healthy: boolean;
    score: number;
    issues: string[];
  };
}

export interface DealMetrics {
  totalDeals: number;
  openDeals: number;
  closedWon: number;
  closedLost: number;
  totalValue: number;
  averageDealSize: number;
  winRate: number;
  averageSalesCycle: number;
  dealsByStage: Record<string, number>;
  dealsByStatus: Record<string, number>;
  dealsByPriority: Record<string, number>;
  dealsByMonth: Array<{ month: string; count: number; value: number }>;
  topPerformers: Array<{ userId: string; name: string; dealsCount: number; totalValue: number; winRate: number }>;
  recentActivity: Array<{ date: string; count: number }>;
  pipelineHealth: {
    healthy: boolean;
    score: number;
    issues: string[];
  };
}

export class DealsService {
  private deals: Map<string, Deal> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeSampleData();
    logger.info('DealsService initialized');
  }

  private initializeSampleData(): void {
    const sampleDeals: Omit<Deal, 'id'>[] = [
      {
        orgId: 'demo-org-1',
        name: 'Enterprise Software License',
        description: 'Annual license for enterprise software solution',
        amount: 50000,
        currency: 'EUR',
        stage: 'negotiation',
        status: 'active',
        probability: 75,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        companyId: 'company-1',
        contactId: 'contact-1',
        assignedTo: 'user-1',
        tags: ['enterprise', 'software', 'annual'],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        orgId: 'demo-org-1',
        name: 'Cloud Infrastructure Migration',
        description: 'Migration to cloud infrastructure services',
        amount: 25000,
        currency: 'EUR',
        stage: 'proposal',
        status: 'active',
        probability: 60,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        companyId: 'company-2',
        contactId: 'contact-2',
        assignedTo: 'user-2',
        tags: ['cloud', 'migration', 'infrastructure'],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        orgId: 'demo-org-1',
        name: 'Data Analytics Platform',
        description: 'Implementation of data analytics platform',
        amount: 75000,
        currency: 'EUR',
        stage: 'closed_won',
        status: 'active',
        probability: 100,
        expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        companyId: 'company-3',
        contactId: 'contact-3',
        assignedTo: 'user-1',
        tags: ['analytics', 'data', 'platform'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        orgId: 'demo-org-1',
        name: 'Mobile App Development',
        description: 'Custom mobile application development',
        amount: 35000,
        currency: 'EUR',
        stage: 'qualified',
        status: 'active',
        probability: 40,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        companyId: 'company-4',
        contactId: 'contact-4',
        assignedTo: 'user-3',
        tags: ['mobile', 'app', 'development'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        orgId: 'demo-org-1',
        name: 'Security Audit Services',
        description: 'Comprehensive security audit and recommendations',
        amount: 15000,
        currency: 'EUR',
        stage: 'closed_lost',
        status: 'active',
        probability: 0,
        expectedCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        companyId: 'company-5',
        contactId: 'contact-5',
        assignedTo: 'user-2',
        tags: ['security', 'audit', 'services'],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    sampleDeals.forEach(deal => {
      const id = `deal-${this.nextId++}`;
      this.deals.set(id, { ...deal, id });
    });
  }

  async createDeal(orgId: string, userId: string, data: CreateDeal): Promise<Deal> {
    try {
      const validatedData = CreateDealSchema.parse(data);
      
      const deal: Deal = {
        id: `deal-${this.nextId++}`,
        orgId,
        ...validatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.deals.set(deal.id, deal);

      logger.info('Deal created', {
        dealId: deal.id,
        name: deal.name,
        amount: deal.amount,
        stage: deal.stage,
        orgId,
        userId
      });

      return deal;
    } catch (error) {
      logger.error('Failed to create deal', {
        error: (error as Error).message,
        orgId,
        userId,
        data
      });
      throw error;
    }
  }

  async getDeals(orgId: string, filters: DealFilter & { limit?: number; offset?: number }): Promise<{ deals: Deal[]; total: number }> {
    try {
      const validatedFilters = DealFilterSchema.parse(filters);
      
      let filteredDeals = Array.from(this.deals.values())
        .filter(deal => deal.orgId === orgId);

      // Aplicar filtros
      if (validatedFilters.q) {
        const query = validatedFilters.q.toLowerCase();
        filteredDeals = filteredDeals.filter(deal => 
          deal.name.toLowerCase().includes(query) ||
          (deal.description && deal.description.toLowerCase().includes(query))
        );
      }
      if (validatedFilters.companyId) {
        filteredDeals = filteredDeals.filter(deal => deal.companyId === validatedFilters.companyId);
      }
      if (validatedFilters.contactId) {
        filteredDeals = filteredDeals.filter(deal => deal.contactId === validatedFilters.contactId);
      }
      if (validatedFilters.stage) {
        filteredDeals = filteredDeals.filter(deal => deal.stage === validatedFilters.stage);
      }
      if (validatedFilters.status) {
        filteredDeals = filteredDeals.filter(deal => deal.status === validatedFilters.status);
      }
      if (validatedFilters.minAmount !== undefined) {
        filteredDeals = filteredDeals.filter(deal => deal.amount >= validatedFilters.minAmount!);
      }
      if (validatedFilters.maxAmount !== undefined) {
        filteredDeals = filteredDeals.filter(deal => deal.amount <= validatedFilters.maxAmount!);
      }
      if (validatedFilters.assignedTo) {
        filteredDeals = filteredDeals.filter(deal => deal.assignedTo === validatedFilters.assignedTo);
      }
      if (validatedFilters.expectedCloseDateFrom) {
        const fromDate = new Date(validatedFilters.expectedCloseDateFrom);
        filteredDeals = filteredDeals.filter(deal => 
          deal.expectedCloseDate && new Date(deal.expectedCloseDate) >= fromDate
        );
      }
      if (validatedFilters.expectedCloseDateTo) {
        const toDate = new Date(validatedFilters.expectedCloseDateTo);
        filteredDeals = filteredDeals.filter(deal => 
          deal.expectedCloseDate && new Date(deal.expectedCloseDate) <= toDate
        );
      }
      if (validatedFilters.tags && validatedFilters.tags.length > 0) {
        filteredDeals = filteredDeals.filter(deal => 
          validatedFilters.tags!.some(tag => deal.tags.includes(tag))
        );
      }

      // Ordenar por fecha de creación (más recientes primero)
      filteredDeals.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

      const total = filteredDeals.length;
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const deals = filteredDeals.slice(offset, offset + limit);

      logger.info('Deals retrieved', {
        orgId,
        filters: validatedFilters,
        count: deals.length,
        total
      });

      return { deals, total };
    } catch (error) {
      logger.error('Failed to get deals', {
        error: (error as Error).message,
        orgId,
        filters
      });
      throw error;
    }
  }

  async getDealById(orgId: string, dealId: string): Promise<Deal | null> {
    try {
      const deal = this.deals.get(dealId);
      
      if (!deal || deal.orgId !== orgId) {
        return null;
      }

      logger.info('Deal retrieved by ID', {
        dealId,
        orgId
      });

      return deal;
    } catch (error) {
      logger.error('Failed to get deal by ID', {
        error: (error as Error).message,
        dealId,
        orgId
      });
      throw error;
    }
  }

  async updateDeal(orgId: string, dealId: string, userId: string, data: UpdateDeal): Promise<Deal | null> {
    try {
      const validatedData = UpdateDealSchema.parse(data);
      const deal = this.deals.get(dealId);
      
      if (!deal || deal.orgId !== orgId) {
        return null;
      }

      const updatedDeal: Deal = {
        ...deal,
        ...validatedData,
        updatedAt: new Date().toISOString(),
      };

      this.deals.set(dealId, updatedDeal);

      logger.info('Deal updated', {
        dealId,
        orgId,
        userId,
        updates: Object.keys(validatedData)
      });

      return updatedDeal;
    } catch (error) {
      logger.error('Failed to update deal', {
        error: (error as Error).message,
        dealId,
        orgId,
        userId,
        data
      });
      throw error;
    }
  }

  async moveDealStage(orgId: string, dealId: string, userId: string, data: MoveDealStage): Promise<Deal | null> {
    try {
      const validatedData = MoveDealStageSchema.parse(data);
      const deal = this.deals.get(dealId);
      
      if (!deal || deal.orgId !== orgId) {
        return null;
      }

      const previousStage = deal.stage;
      const updatedDeal: Deal = {
        ...deal,
        stage: validatedData.stage,
        updatedAt: new Date().toISOString(),
      };

      // Actualizar probabilidad basada en el stage
      const stageProbabilities: Record<string, number> = {
        'lead': 10,
        'qualified': 25,
        'proposal': 50,
        'negotiation': 75,
        'closed_won': 100,
        'closed_lost': 0
      };

      updatedDeal.probability = stageProbabilities[validatedData.stage] || deal.probability;

      this.deals.set(dealId, updatedDeal);

      logger.info('Deal stage moved', {
        dealId,
        orgId,
        userId,
        previousStage,
        newStage: validatedData.stage,
        reason: validatedData.reason
      });

      return updatedDeal;
    } catch (error) {
      logger.error('Failed to move deal stage', {
        error: (error as Error).message,
        dealId,
        orgId,
        userId,
        data
      });
      throw error;
    }
  }

  async deleteDeal(orgId: string, dealId: string, userId: string): Promise<boolean> {
    try {
      const deal = this.deals.get(dealId);
      
      if (!deal || deal.orgId !== orgId) {
        return false;
      }

      this.deals.delete(dealId);

      logger.info('Deal deleted', {
        dealId,
        orgId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete deal', {
        error: (error as Error).message,
        dealId,
        orgId,
        userId
      });
      throw error;
    }
  }

  async getDealSummary(orgId: string): Promise<DealSummary> {
    try {
      const deals = Array.from(this.deals.values())
        .filter(deal => deal.orgId === orgId);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calcular estadísticas básicas
      const total = deals.length;
      const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
      const averageDealSize = total > 0 ? totalValue / total : 0;

      // Calcular win rate
      const closedWon = deals.filter(deal => deal.stage === 'closed_won').length;
      const closedLost = deals.filter(deal => deal.stage === 'closed_lost').length;
      const closedTotal = closedWon + closedLost;
      const winRate = closedTotal > 0 ? (closedWon / closedTotal) * 100 : 0;

      // Calcular ciclo de ventas promedio
      const closedDeals = deals.filter(deal => 
        deal.stage === 'closed_won' || deal.stage === 'closed_lost'
      );
      const averageSalesCycle = closedDeals.length > 0 
        ? closedDeals.reduce((sum, deal) => {
            const created = new Date(deal.createdAt!).getTime();
            const closed = new Date(deal.updatedAt!).getTime();
            return sum + (closed - created);
          }, 0) / closedDeals.length / (1000 * 60 * 60 * 24) // en días
        : 0;

      // Distribución por stage
      const dealsByStage = deals.reduce((acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Distribución por status
      const dealsByStatus = deals.reduce((acc, deal) => {
        acc[deal.status] = (acc[deal.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Deals por mes (últimos 12 meses)
      const dealsByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
        
        const monthDeals = deals.filter(deal => {
          const dealDate = new Date(deal.createdAt!);
          return dealDate.getFullYear() === date.getFullYear() && 
                 dealDate.getMonth() === date.getMonth();
        });

        dealsByMonth.push({
          month: monthKey,
          count: monthDeals.length,
          value: monthDeals.reduce((sum, deal) => sum + deal.amount, 0)
        });
      }

      // Top performers
      const performerStats = deals
        .filter(deal => deal.assignedTo)
        .reduce((acc, deal) => {
          const userId = deal.assignedTo!;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              name: `User ${userId}`, // En un sistema real, esto vendría de la base de datos
              dealsCount: 0,
              totalValue: 0,
              closedWon: 0,
              closedLost: 0
            };
          }
          acc[userId].dealsCount++;
          acc[userId].totalValue += deal.amount;
          if (deal.stage === 'closed_won') acc[userId].closedWon++;
          if (deal.stage === 'closed_lost') acc[userId].closedLost++;
          return acc;
        }, {} as Record<string, any>);

      const topPerformers = Object.values(performerStats)
        .map((performer: any) => ({
          ...performer,
          winRate: (performer.closedWon + performer.closedLost) > 0 
            ? (performer.closedWon / (performer.closedWon + performer.closedLost)) * 100 
            : 0
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);

      // Pipeline health
      const openDeals = deals.filter(deal => 
        !['closed_won', 'closed_lost'].includes(deal.stage)
      );
      const staleDeals = openDeals.filter(deal => {
        const updated = new Date(deal.updatedAt!);
        const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 30;
      });

      const issues: string[] = [];
      if (staleDeals.length > 0) {
        issues.push(`${staleDeals.length} deals haven't been updated in 30+ days`);
      }
      if (winRate < 20) {
        issues.push('Win rate is below 20%');
      }
      if (averageSalesCycle > 90) {
        issues.push('Average sales cycle is longer than 90 days');
      }

      const pipelineHealth = {
        healthy: issues.length === 0,
        score: Math.max(0, 100 - (issues.length * 20)),
        issues
      };

      const summary: DealSummary = {
        total,
        totalValue,
        averageDealSize,
        winRate,
        averageSalesCycle,
        dealsByStage,
        dealsByStatus,
        dealsByMonth,
        topPerformers,
        pipelineHealth
      };

      logger.info('Deal summary generated', {
        orgId,
        total,
        totalValue,
        winRate: winRate.toFixed(2)
      });

      return summary;
    } catch (error) {
      logger.error('Failed to get deal summary', {
        error: (error as Error).message,
        orgId
      });
      throw error;
    }
  }

  async getDealAnalytics(orgId: string): Promise<DealAnalytics> {
    try {
      const summary = await this.getDealSummary(orgId);
      const deals = Array.from(this.deals.values())
        .filter(deal => deal.orgId === orgId);

      // Calcular métricas adicionales
      const openDeals = deals.filter(deal => 
        !['closed_won', 'closed_lost'].includes(deal.stage)
      );
      const closedWon = deals.filter(deal => deal.stage === 'closed_won');
      const closedLost = deals.filter(deal => deal.stage === 'closed_lost');

      // Actividad reciente (últimos 7 días)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const count = deals.filter(deal => {
          const created = new Date(deal.createdAt!);
          return created >= dayStart && created < dayEnd;
        }).length;

        recentActivity.push({
          date: dayStart.toISOString().split('T')[0],
          count
        });
      }

      const analytics: DealAnalytics = {
        totalDeals: summary.total,
        openDeals: openDeals.length,
        closedWon: closedWon.length,
        closedLost: closedLost.length,
        totalValue: summary.totalValue,
        averageDealSize: summary.averageDealSize,
        winRate: summary.winRate,
        averageSalesCycle: summary.averageSalesCycle,
        dealsByStage: summary.dealsByStage,
        dealsByStatus: summary.dealsByStatus,
        dealsByPriority: {}, // No implementado en el schema actual
        dealsByMonth: summary.dealsByMonth,
        topPerformers: summary.topPerformers,
        recentActivity,
        pipelineHealth: summary.pipelineHealth
      };

      logger.info('Deal analytics generated', {
        orgId,
        totalDeals: analytics.totalDeals,
        winRate: analytics.winRate.toFixed(2)
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to get deal analytics', {
        error: (error as Error).message,
        orgId
      });
      throw error;
    }
  }

  async bulkUpdateDeals(orgId: string, userId: string, updates: Array<{
    id: string;
    data: UpdateDeal;
  }>): Promise<{ updated: number; failed: number; errors: string[] }> {
    try {
      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const update of updates) {
        try {
          const result = await this.updateDeal(orgId, update.id, userId, update.data);
          if (result) {
            updated++;
          } else {
            failed++;
            errors.push(`Deal ${update.id} not found or access denied`);
          }
        } catch (error) {
          failed++;
          errors.push(`Failed to update deal ${update.id}: ${(error as Error).message}`);
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
      logger.error('Failed to bulk update deals', {
        error: (error as Error).message,
        orgId,
        userId
      });
      throw error;
    }
  }

  getStats(): any {
    return {
      totalDeals: this.deals.size,
      byStage: Array.from(this.deals.values()).reduce((acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: Array.from(this.deals.values()).reduce((acc, deal) => {
        acc[deal.status] = (acc[deal.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byOrg: Array.from(this.deals.values()).reduce((acc, deal) => {
        acc[deal.orgId] = (acc[deal.orgId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const dealsService = new DealsService();

