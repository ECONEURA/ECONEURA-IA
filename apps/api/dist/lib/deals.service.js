import { logger } from './logger.js';
import { CreateDealSchema, UpdateDealSchema, DealFilterSchema, MoveDealStageSchema } from '@econeura/shared/src/schemas/crm';
export class DealsService {
    deals = new Map();
    nextId = 1;
    constructor() {
        this.initializeSampleData();
        logger.info('DealsService initialized');
    }
    initializeSampleData() {
        const sampleDeals = [
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
    async createDeal(orgId, userId, data) {
        try {
            const validatedData = CreateDealSchema.parse(data);
            const deal = {
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
        }
        catch (error) {
            logger.error('Failed to create deal', {
                error: error.message,
                orgId,
                userId,
                data
            });
            throw error;
        }
    }
    async getDeals(orgId, filters) {
        try {
            const validatedFilters = DealFilterSchema.parse(filters);
            let filteredDeals = Array.from(this.deals.values())
                .filter(deal => deal.orgId === orgId);
            if (validatedFilters.q) {
                const query = validatedFilters.q.toLowerCase();
                filteredDeals = filteredDeals.filter(deal => deal.name.toLowerCase().includes(query) ||
                    (deal.description && deal.description.toLowerCase().includes(query)));
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
                filteredDeals = filteredDeals.filter(deal => deal.amount >= validatedFilters.minAmount);
            }
            if (validatedFilters.maxAmount !== undefined) {
                filteredDeals = filteredDeals.filter(deal => deal.amount <= validatedFilters.maxAmount);
            }
            if (validatedFilters.assignedTo) {
                filteredDeals = filteredDeals.filter(deal => deal.assignedTo === validatedFilters.assignedTo);
            }
            if (validatedFilters.expectedCloseDateFrom) {
                const fromDate = new Date(validatedFilters.expectedCloseDateFrom);
                filteredDeals = filteredDeals.filter(deal => deal.expectedCloseDate && new Date(deal.expectedCloseDate) >= fromDate);
            }
            if (validatedFilters.expectedCloseDateTo) {
                const toDate = new Date(validatedFilters.expectedCloseDateTo);
                filteredDeals = filteredDeals.filter(deal => deal.expectedCloseDate && new Date(deal.expectedCloseDate) <= toDate);
            }
            if (validatedFilters.tags && validatedFilters.tags.length > 0) {
                filteredDeals = filteredDeals.filter(deal => validatedFilters.tags.some(tag => deal.tags.includes(tag)));
            }
            filteredDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        }
        catch (error) {
            logger.error('Failed to get deals', {
                error: error.message,
                orgId,
                filters
            });
            throw error;
        }
    }
    async getDealById(orgId, dealId) {
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
        }
        catch (error) {
            logger.error('Failed to get deal by ID', {
                error: error.message,
                dealId,
                orgId
            });
            throw error;
        }
    }
    async updateDeal(orgId, dealId, userId, data) {
        try {
            const validatedData = UpdateDealSchema.parse(data);
            const deal = this.deals.get(dealId);
            if (!deal || deal.orgId !== orgId) {
                return null;
            }
            const updatedDeal = {
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
        }
        catch (error) {
            logger.error('Failed to update deal', {
                error: error.message,
                dealId,
                orgId,
                userId,
                data
            });
            throw error;
        }
    }
    async moveDealStage(orgId, dealId, userId, data) {
        try {
            const validatedData = MoveDealStageSchema.parse(data);
            const deal = this.deals.get(dealId);
            if (!deal || deal.orgId !== orgId) {
                return null;
            }
            const previousStage = deal.stage;
            const updatedDeal = {
                ...deal,
                stage: validatedData.stage,
                updatedAt: new Date().toISOString(),
            };
            const stageProbabilities = {
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
        }
        catch (error) {
            logger.error('Failed to move deal stage', {
                error: error.message,
                dealId,
                orgId,
                userId,
                data
            });
            throw error;
        }
    }
    async deleteDeal(orgId, dealId, userId) {
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
        }
        catch (error) {
            logger.error('Failed to delete deal', {
                error: error.message,
                dealId,
                orgId,
                userId
            });
            throw error;
        }
    }
    async getDealSummary(orgId) {
        try {
            const deals = Array.from(this.deals.values())
                .filter(deal => deal.orgId === orgId);
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const total = deals.length;
            const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
            const averageDealSize = total > 0 ? totalValue / total : 0;
            const closedWon = deals.filter(deal => deal.stage === 'closed_won').length;
            const closedLost = deals.filter(deal => deal.stage === 'closed_lost').length;
            const closedTotal = closedWon + closedLost;
            const winRate = closedTotal > 0 ? (closedWon / closedTotal) * 100 : 0;
            const closedDeals = deals.filter(deal => deal.stage === 'closed_won' || deal.stage === 'closed_lost');
            const averageSalesCycle = closedDeals.length > 0
                ? closedDeals.reduce((sum, deal) => {
                    const created = new Date(deal.createdAt).getTime();
                    const closed = new Date(deal.updatedAt).getTime();
                    return sum + (closed - created);
                }, 0) / closedDeals.length / (1000 * 60 * 60 * 24)
                : 0;
            const dealsByStage = deals.reduce((acc, deal) => {
                acc[deal.stage] = (acc[deal.stage] || 0) + 1;
                return acc;
            }, {});
            const dealsByStatus = deals.reduce((acc, deal) => {
                acc[deal.status] = (acc[deal.status] || 0) + 1;
                return acc;
            }, {});
            const dealsByMonth = [];
            for (let i = 11; i >= 0; i--) {
                const date = new Date(currentYear, currentMonth - i, 1);
                const monthKey = date.toISOString().substring(0, 7);
                const monthDeals = deals.filter(deal => {
                    const dealDate = new Date(deal.createdAt);
                    return dealDate.getFullYear() === date.getFullYear() &&
                        dealDate.getMonth() === date.getMonth();
                });
                dealsByMonth.push({
                    month: monthKey,
                    count: monthDeals.length,
                    value: monthDeals.reduce((sum, deal) => sum + deal.amount, 0)
                });
            }
            const performerStats = deals
                .filter(deal => deal.assignedTo)
                .reduce((acc, deal) => {
                const userId = deal.assignedTo;
                if (!acc[userId]) {
                    acc[userId] = {
                        userId,
                        name: `User ${userId}`,
                        dealsCount: 0,
                        totalValue: 0,
                        closedWon: 0,
                        closedLost: 0
                    };
                }
                acc[userId].dealsCount++;
                acc[userId].totalValue += deal.amount;
                if (deal.stage === 'closed_won')
                    acc[userId].closedWon++;
                if (deal.stage === 'closed_lost')
                    acc[userId].closedLost++;
                return acc;
            }, {});
            const topPerformers = Object.values(performerStats)
                .map((performer) => ({
                ...performer,
                winRate: (performer.closedWon + performer.closedLost) > 0
                    ? (performer.closedWon / (performer.closedWon + performer.closedLost)) * 100
                    : 0
            }))
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 5);
            const openDeals = deals.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage));
            const staleDeals = openDeals.filter(deal => {
                const updated = new Date(deal.updatedAt);
                const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
                return daysSinceUpdate > 30;
            });
            const issues = [];
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
            const summary = {
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
        }
        catch (error) {
            logger.error('Failed to get deal summary', {
                error: error.message,
                orgId
            });
            throw error;
        }
    }
    async getDealAnalytics(orgId) {
        try {
            const summary = await this.getDealSummary(orgId);
            const deals = Array.from(this.deals.values())
                .filter(deal => deal.orgId === orgId);
            const openDeals = deals.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage));
            const closedWon = deals.filter(deal => deal.stage === 'closed_won');
            const closedLost = deals.filter(deal => deal.stage === 'closed_lost');
            const recentActivity = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                const count = deals.filter(deal => {
                    const created = new Date(deal.createdAt);
                    return created >= dayStart && created < dayEnd;
                }).length;
                recentActivity.push({
                    date: dayStart.toISOString().split('T')[0],
                    count
                });
            }
            const analytics = {
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
                dealsByPriority: {},
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
        }
        catch (error) {
            logger.error('Failed to get deal analytics', {
                error: error.message,
                orgId
            });
            throw error;
        }
    }
    async bulkUpdateDeals(orgId, userId, updates) {
        try {
            let updated = 0;
            let failed = 0;
            const errors = [];
            for (const update of updates) {
                try {
                    const result = await this.updateDeal(orgId, update.id, userId, update.data);
                    if (result) {
                        updated++;
                    }
                    else {
                        failed++;
                        errors.push(`Deal ${update.id} not found or access denied`);
                    }
                }
                catch (error) {
                    failed++;
                    errors.push(`Failed to update deal ${update.id}: ${error.message}`);
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
        }
        catch (error) {
            logger.error('Failed to bulk update deals', {
                error: error.message,
                orgId,
                userId
            });
            throw error;
        }
    }
    getStats() {
        return {
            totalDeals: this.deals.size,
            byStage: Array.from(this.deals.values()).reduce((acc, deal) => {
                acc[deal.stage] = (acc[deal.stage] || 0) + 1;
                return acc;
            }, {}),
            byStatus: Array.from(this.deals.values()).reduce((acc, deal) => {
                acc[deal.status] = (acc[deal.status] || 0) + 1;
                return acc;
            }, {}),
            byOrg: Array.from(this.deals.values()).reduce((acc, deal) => {
                acc[deal.orgId] = (acc[deal.orgId] || 0) + 1;
                return acc;
            }, {})
        };
    }
}
export const dealsService = new DealsService();
//# sourceMappingURL=deals.service.js.map