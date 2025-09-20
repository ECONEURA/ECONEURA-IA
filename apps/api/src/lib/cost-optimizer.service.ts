// Cost Optimizer Service for PR-45
import { 
  OptimizationRecommendation, 
  CostOptimization, 
  OptimizationLog,
  ResourceUtilization 
} from './finops-types.js';
import { structuredLogger } from './structured-logger.js';
import { ErrorHandler } from './error-handler.js';

export class CostOptimizerService {
  private recommendations: OptimizationRecommendation[] = [];
  private optimizations: CostOptimization[] = [];
  private resourceUtilizations: ResourceUtilization[] = [];

  constructor() {
    this.initializeSampleData();
    this.startOptimizationAnalysis();
    structuredLogger.info('CostOptimizerService initialized', {
      operation: 'cost_optimizer_init'
    });
  }

  private initializeSampleData(): void {
    // Initialize with sample recommendations
    const sampleRecommendations: OptimizationRecommendation[] = [
      {
        id: 'rec_1',
        type: 'right_sizing',
        title: 'Right-size EC2 instances',
        description: 'Several EC2 instances are underutilized and can be downsized to save costs',
        potentialSavings: 450.00,
        confidence: 85,
        effort: 'medium',
        impact: 'high',
        resources: ['ec2-instance-1', 'ec2-instance-2', 'ec2-instance-3'],
        implementation: 'Downsize t3.large instances to t3.medium based on CPU utilization patterns',
        estimatedSavings: {
          monthly: 450.00,
          yearly: 5400.00,
          percentage: 25
        },
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tags: ['compute', 'ec2', 'right-sizing'],
        metadata: {
          currentInstanceTypes: ['t3.large', 't3.large', 't3.large'],
          recommendedInstanceTypes: ['t3.medium', 't3.medium', 't3.medium'],
          currentCost: 1800.00,
          recommendedCost: 1350.00
        }
      },
      {
        id: 'rec_2',
        type: 'storage_optimization',
        title: 'Optimize S3 storage classes',
        description: 'Move infrequently accessed data to cheaper storage classes',
        potentialSavings: 120.00,
        confidence: 92,
        effort: 'low',
        impact: 'medium',
        resources: ['s3-bucket-1', 's3-bucket-2'],
        implementation: 'Implement lifecycle policies to automatically transition objects to IA and Glacier',
        estimatedSavings: {
          monthly: 120.00,
          yearly: 1440.00,
          percentage: 15
        },
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ['storage', 's3', 'lifecycle'],
        metadata: {
          currentStorageClass: 'STANDARD',
          recommendedStorageClass: 'STANDARD_IA',
          dataSize: '500GB',
          accessPattern: 'infrequent'
        }
      },
      {
        id: 'rec_3',
        type: 'reserved_instances',
        title: 'Purchase Reserved Instances',
        description: 'Convert on-demand instances to Reserved Instances for predictable workloads',
        potentialSavings: 800.00,
        confidence: 78,
        effort: 'high',
        impact: 'high',
        resources: ['ec2-instance-4', 'ec2-instance-5'],
        implementation: 'Purchase 1-year Reserved Instances for production workloads with consistent usage',
        estimatedSavings: {
          monthly: 800.00,
          yearly: 9600.00,
          percentage: 30
        },
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ['compute', 'ec2', 'reserved-instances'],
        metadata: {
          currentInstanceTypes: ['m5.large', 'm5.large'],
          utilization: 85,
          commitment: '1-year'
        }
      },
      {
        id: 'rec_4',
        type: 'auto_scaling',
        title: 'Implement Auto Scaling',
        description: 'Set up auto scaling for web servers to handle traffic spikes efficiently',
        potentialSavings: 200.00,
        confidence: 88,
        effort: 'medium',
        impact: 'medium',
        resources: ['web-server-1', 'web-server-2'],
        implementation: 'Configure auto scaling groups with CloudWatch metrics and target tracking',
        estimatedSavings: {
          monthly: 200.00,
          yearly: 2400.00,
          percentage: 20
        },
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        tags: ['compute', 'auto-scaling', 'web'],
        metadata: {
          currentInstances: 4,
          recommendedMinInstances: 2,
          recommendedMaxInstances: 8,
          trafficPattern: 'variable'
        }
      },
      {
        id: 'rec_5',
        type: 'query_optimization',
        title: 'Optimize Database Queries',
        description: 'Optimize slow-running database queries to reduce compute costs',
        potentialSavings: 150.00,
        confidence: 75,
        effort: 'high',
        impact: 'medium',
        resources: ['rds-instance-1', 'database-queries'],
        implementation: 'Add indexes, optimize query structure, and implement query caching',
        estimatedSavings: {
          monthly: 150.00,
          yearly: 1800.00,
          percentage: 12
        },
        status: 'pending',
        priority: 'low',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tags: ['database', 'rds', 'query-optimization'],
        metadata: {
          slowQueries: 15,
          averageQueryTime: 2.5,
          targetQueryTime: 0.5
        }
      }
    ];

    this.recommendations = sampleRecommendations;
  }

  private startOptimizationAnalysis(): void {
    // Run optimization analysis every 6 hours
    setInterval(() => {
      this.analyzeOptimizationOpportunities();
    }, 6 * 60 * 60 * 1000);
  }

  async analyzeOptimizationOpportunities(): Promise<OptimizationRecommendation[]> {
    try {
      const newRecommendations: OptimizationRecommendation[] = [];

      // Analyze resource utilization
      const utilizationRecommendations = await this.analyzeResourceUtilization();
      newRecommendations.push(...utilizationRecommendations);

      // Analyze cost patterns
      const costRecommendations = await this.analyzeCostPatterns();
      newRecommendations.push(...costRecommendations);

      // Analyze storage optimization
      const storageRecommendations = await this.analyzeStorageOptimization();
      newRecommendations.push(...storageRecommendations);

      // Add new recommendations
      this.recommendations.push(...newRecommendations);

      structuredLogger.info('Optimization analysis completed', {
        operation: 'optimization_analysis',
        newRecommendations: newRecommendations.length,
        totalRecommendations: this.recommendations.length
      });

      return newRecommendations;
    } catch (error) {
      structuredLogger.error('Failed to analyze optimization opportunities', error as Error, {
        operation: 'optimization_analysis'
      });
      throw error;
    }
  }

  private async analyzeResourceUtilization(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Simulate analysis of resource utilization
    const underutilizedResources = [
      { resource: 'ec2-instance-6', utilization: 25, type: 't3.xlarge' },
      { resource: 'ec2-instance-7', utilization: 30, type: 'm5.large' }
    ];

    for (const resource of underutilizedResources) {
      if (resource.utilization < 40) {
        const recommendation: OptimizationRecommendation = {
          id: `rec_util_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'right_sizing',
          title: `Right-size ${resource.resource}`,
          description: `${resource.resource} is only ${resource.utilization}% utilized and can be downsized`,
          potentialSavings: 100 + Math.random() * 200,
          confidence: 80 + Math.random() * 15,
          effort: 'low',
          impact: 'medium',
          resources: [resource.resource],
          implementation: `Downsize ${resource.type} to a smaller instance type based on utilization patterns`,
          estimatedSavings: {
            monthly: 100 + Math.random() * 200,
            yearly: (100 + Math.random() * 200) * 12,
            percentage: 20 + Math.random() * 15
          },
          status: 'pending',
          priority: 'medium',
          createdAt: new Date(),
          tags: ['compute', 'right-sizing', 'utilization'],
          metadata: {
            currentUtilization: resource.utilization,
            currentInstanceType: resource.type,
            recommendedInstanceType: this.getRecommendedInstanceType(resource.type, resource.utilization)
          }
        };

        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  private async analyzeCostPatterns(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Simulate analysis of cost patterns
    const costPatterns = [
      { service: 'compute', pattern: 'spike', savings: 300 },
      { service: 'storage', pattern: 'growth', savings: 150 }
    ];

    for (const pattern of costPatterns) {
      const recommendation: OptimizationRecommendation = {
        id: `rec_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'auto_scaling',
        title: `Optimize ${pattern.service} cost pattern`,
        description: `Detected ${pattern.pattern} pattern in ${pattern.service} costs that can be optimized`,
        potentialSavings: pattern.savings,
        confidence: 70 + Math.random() * 20,
        effort: 'medium',
        impact: 'high',
        resources: [`${pattern.service}-resources`],
        implementation: `Implement auto-scaling and cost controls for ${pattern.service} to handle ${pattern.pattern} patterns`,
        estimatedSavings: {
          monthly: pattern.savings,
          yearly: pattern.savings * 12,
          percentage: 15 + Math.random() * 10
        },
        status: 'pending',
        priority: 'high',
        createdAt: new Date(),
        tags: ['cost-pattern', pattern.service, 'optimization'],
        metadata: {
          pattern: pattern.pattern,
          service: pattern.service,
          detectedAt: new Date()
        }
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  private async analyzeStorageOptimization(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Simulate analysis of storage optimization
    const storageAnalysis = [
      { bucket: 's3-bucket-3', size: '200GB', access: 'infrequent', savings: 80 },
      { bucket: 's3-bucket-4', size: '100GB', access: 'archival', savings: 120 }
    ];

    for (const storage of storageAnalysis) {
      const recommendation: OptimizationRecommendation = {
        id: `rec_storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'storage_optimization',
        title: `Optimize ${storage.bucket} storage class`,
        description: `${storage.bucket} contains ${storage.access} data that can be moved to cheaper storage`,
        potentialSavings: storage.savings,
        confidence: 85 + Math.random() * 10,
        effort: 'low',
        impact: 'medium',
        resources: [storage.bucket],
        implementation: `Move ${storage.access} data to appropriate storage class (IA or Glacier)`,
        estimatedSavings: {
          monthly: storage.savings,
          yearly: storage.savings * 12,
          percentage: 20 + Math.random() * 15
        },
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(),
        tags: ['storage', 's3', 'lifecycle'],
        metadata: {
          bucket: storage.bucket,
          size: storage.size,
          accessPattern: storage.access,
          currentStorageClass: 'STANDARD',
          recommendedStorageClass: storage.access === 'archival' ? 'GLACIER' : 'STANDARD_IA'
        }
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  private getRecommendedInstanceType(currentType: string, utilization: number): string {
    const typeMap: Record<string, string[]> = {
      't3.xlarge': ['t3.large', 't3.medium', 't3.small'],
      't3.large': ['t3.medium', 't3.small'],
      't3.medium': ['t3.small'],
      'm5.large': ['m5.medium', 'm5.small'],
      'm5.xlarge': ['m5.large', 'm5.medium']
    };

    const options = typeMap[currentType] || [];
    if (utilization < 25) return options[options.length - 1] || currentType;
    if (utilization < 50) return options[Math.floor(options.length / 2)] || currentType;
    return options[0] || currentType;
  }

  getRecommendations(filters?: {
    status?: 'pending' | 'approved' | 'implemented' | 'rejected';
    type?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    effort?: 'low' | 'medium' | 'high';
    impact?: 'low' | 'medium' | 'high';
  }): OptimizationRecommendation[] {
    let filteredRecommendations = [...this.recommendations];

    if (filters) {
      if (filters.status) {
        filteredRecommendations = filteredRecommendations.filter(r => r.status === filters.status);
      }
      if (filters.type) {
        filteredRecommendations = filteredRecommendations.filter(r => r.type === filters.type);
      }
      if (filters.priority) {
        filteredRecommendations = filteredRecommendations.filter(r => r.priority === filters.priority);
      }
      if (filters.effort) {
        filteredRecommendations = filteredRecommendations.filter(r => r.effort === filters.effort);
      }
      if (filters.impact) {
        filteredRecommendations = filteredRecommendations.filter(r => r.impact === filters.impact);
      }
    }

    return filteredRecommendations.sort((a, b) => {
      // Sort by priority and potential savings
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.potentialSavings - a.potentialSavings;
    });
  }

  getRecommendation(recommendationId: string): OptimizationRecommendation | null {
    return this.recommendations.find(r => r.id === recommendationId) || null;
  }

  async approveRecommendation(recommendationId: string, approvedBy: string): Promise<OptimizationRecommendation | null> {
    try {
      const recommendation = this.getRecommendation(recommendationId);
      if (!recommendation) {
        return null;
      }

      recommendation.status = 'approved';
      recommendation.metadata = {
        ...recommendation.metadata,
        approvedBy,
        approvedAt: new Date().toISOString()
      };

      structuredLogger.info('Optimization recommendation approved', {
        operation: 'recommendation_approve',
        recommendationId,
        approvedBy,
        potentialSavings: recommendation.potentialSavings
      });

      return recommendation;
    } catch (error) {
      structuredLogger.error('Failed to approve recommendation', error as Error, {
        operation: 'recommendation_approve',
        recommendationId
      });
      throw error;
    }
  }

  async rejectRecommendation(recommendationId: string, rejectedBy: string, reason: string): Promise<OptimizationRecommendation | null> {
    try {
      const recommendation = this.getRecommendation(recommendationId);
      if (!recommendation) {
        return null;
      }

      recommendation.status = 'rejected';
      recommendation.rejectedAt = new Date();
      recommendation.rejectedBy = rejectedBy;
      recommendation.rejectionReason = reason;

      structuredLogger.info('Optimization recommendation rejected', {
        operation: 'recommendation_reject',
        recommendationId,
        rejectedBy,
        reason
      });

      return recommendation;
    } catch (error) {
      structuredLogger.error('Failed to reject recommendation', error as Error, {
        operation: 'recommendation_reject',
        recommendationId
      });
      throw error;
    }
  }

  async implementRecommendation(recommendationId: string, implementedBy: string): Promise<CostOptimization | null> {
    try {
      const recommendation = this.getRecommendation(recommendationId);
      if (!recommendation) {
        return null;
      }

      if (recommendation.status !== 'approved') {
        throw new Error('Recommendation must be approved before implementation');
      }

      // Create optimization record
      const optimization: CostOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'manual',
        status: 'running',
        targetResources: recommendation.resources,
        optimizationType: recommendation.type as any,
        parameters: recommendation.metadata,
        expectedSavings: recommendation.potentialSavings,
        startedAt: new Date(),
        logs: [
          {
            timestamp: new Date(),
            level: 'info',
            message: `Starting implementation of recommendation: ${recommendation.title}`,
            details: { recommendationId, implementedBy }
          }
        ],
        metadata: {
          recommendationId,
          implementedBy,
          originalRecommendation: recommendation
        }
      };

      this.optimizations.push(optimization);

      // Update recommendation status
      recommendation.status = 'implemented';
      recommendation.implementedAt = new Date();
      recommendation.implementedBy = implementedBy;

      // Simulate optimization process
      setTimeout(() => {
        this.completeOptimization(optimization.id);
      }, 5000);

      structuredLogger.info('Optimization recommendation implementation started', {
        operation: 'recommendation_implement',
        recommendationId,
        optimizationId: optimization.id,
        implementedBy
      });

      return optimization;
    } catch (error) {
      structuredLogger.error('Failed to implement recommendation', error as Error, {
        operation: 'recommendation_implement',
        recommendationId
      });
      throw error;
    }
  }

  private async completeOptimization(optimizationId: string): Promise<void> {
    try {
      const optimization = this.optimizations.find(o => o.id === optimizationId);
      if (!optimization) {
        return;
      }

      optimization.status = 'completed';
      optimization.completedAt = new Date();
      optimization.duration = optimization.completedAt.getTime() - optimization.startedAt.getTime();
      optimization.actualSavings = optimization.expectedSavings * (0.8 + Math.random() * 0.4); // 80-120% of expected

      optimization.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Optimization completed successfully',
        details: {
          actualSavings: optimization.actualSavings,
          duration: optimization.duration
        }
      });

      structuredLogger.info('Optimization completed', {
        operation: 'optimization_complete',
        optimizationId,
        actualSavings: optimization.actualSavings,
        duration: optimization.duration
      });
    } catch (error) {
      structuredLogger.error('Failed to complete optimization', error as Error, {
        operation: 'optimization_complete',
        optimizationId
      });
    }
  }

  getOptimizations(filters?: {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    type?: 'automatic' | 'manual' | 'scheduled';
  }): CostOptimization[] {
    let filteredOptimizations = [...this.optimizations];

    if (filters) {
      if (filters.status) {
        filteredOptimizations = filteredOptimizations.filter(o => o.status === filters.status);
      }
      if (filters.type) {
        filteredOptimizations = filteredOptimizations.filter(o => o.type === filters.type);
      }
    }

    return filteredOptimizations.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  getOptimization(optimizationId: string): CostOptimization | null {
    return this.optimizations.find(o => o.id === optimizationId) || null;
  }

  getOptimizationStats(): {
    totalRecommendations: number;
    pendingRecommendations: number;
    approvedRecommendations: number;
    implementedRecommendations: number;
    rejectedRecommendations: number;
    totalPotentialSavings: number;
    totalActualSavings: number;
    totalOptimizations: number;
    completedOptimizations: number;
    runningOptimizations: number;
    averageSavings: number;
  } {
    const totalRecommendations = this.recommendations.length;
    const pendingRecommendations = this.recommendations.filter(r => r.status === 'pending').length;
    const approvedRecommendations = this.recommendations.filter(r => r.status === 'approved').length;
    const implementedRecommendations = this.recommendations.filter(r => r.status === 'implemented').length;
    const rejectedRecommendations = this.recommendations.filter(r => r.status === 'rejected').length;
    const totalPotentialSavings = this.recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
    const totalActualSavings = this.optimizations
      .filter(o => o.actualSavings)
      .reduce((sum, o) => sum + (o.actualSavings || 0), 0);
    const totalOptimizations = this.optimizations.length;
    const completedOptimizations = this.optimizations.filter(o => o.status === 'completed').length;
    const runningOptimizations = this.optimizations.filter(o => o.status === 'running').length;
    const averageSavings = completedOptimizations > 0 ? totalActualSavings / completedOptimizations : 0;

    return {
      totalRecommendations,
      pendingRecommendations,
      approvedRecommendations,
      implementedRecommendations,
      rejectedRecommendations,
      totalPotentialSavings,
      totalActualSavings,
      totalOptimizations,
      completedOptimizations,
      runningOptimizations,
      averageSavings
    };
  }
}
