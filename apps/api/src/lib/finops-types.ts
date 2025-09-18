// FinOps Types for PR-45
export interface Cost {
  id: string;
  service: string;
  resource: string;
  organizationId: string;
  userId?: string;
  amount: number;
  currency: string;
  category: 'infrastructure' | 'software' | 'services' | 'licenses' | 'data' | 'compute' | 'storage' | 'network';
  subcategory: string;
  timestamp: Date;
  period: 'hourly' | 'daily' | 'monthly' | 'yearly';
  metadata: Record<string, unknown>;
  tags: string[];
  region?: string;
  environment?: 'development' | 'staging' | 'production';
  projectId?: string;
  departmentId?: string;
}

export interface Budget {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  threshold: number; // Porcentaje para alertas (0-100)
  status: 'active' | 'paused' | 'exceeded' | 'completed' | 'cancelled';
  categories: string[];
  tags: string[];
  alerts: BudgetAlert[];
  notifications: BudgetNotification[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  metadata: Record<string, unknown>;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'threshold' | 'exceeded' | 'predicted_exceeded' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface BudgetNotification {
  id: string;
  budgetId: string;
  type: 'email' | 'sms' | 'slack' | 'webhook';
  recipients: string[];
  template: string;
  enabled: boolean;
  conditions: NotificationCondition[];
  lastSent?: Date;
  metadata: Record<string, unknown>;
}

export interface NotificationCondition {
  type: 'threshold' | 'exceeded' | 'daily' | 'weekly' | 'monthly';
  value?: number;
  operator?: 'greater_than' | 'less_than' | 'equals';
}

export interface OptimizationRecommendation {
  id: string;
  type: 'right_sizing' | 'auto_scaling' | 'storage_optimization' | 'query_optimization' | 'reserved_instances' | 'spot_instances' | 'lifecycle_policy';
  title: string;
  description: string;
  potentialSavings: number;
  confidence: number; // 0-100
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  resources: string[];
  implementation: string;
  estimatedSavings: {
    monthly: number;
    yearly: number;
    percentage: number;
  };
  status: 'pending' | 'approved' | 'implemented' | 'rejected' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  implementedAt?: Date;
  implementedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface FinOpsReport {
  id: string;
  name: string;
  type: 'executive' | 'technical' | 'compliance' | 'optimization' | 'trends' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  organizationId: string;
  data: {
    totalCosts: number;
    costsByService: Record<string, number>;
    costsByCategory: Record<string, number>;
    costsByResource: Record<string, number>;
    costsByOrganization: Record<string, number>;
    trends: CostTrend[];
    recommendations: OptimizationRecommendation[];
    budgetStatus: BudgetStatus[];
    anomalies: CostAnomaly[];
    forecasts: CostForecast[];
  };
  generatedAt: Date;
  generatedBy: string;
  format: 'pdf' | 'excel' | 'json' | 'csv';
  status: 'generating' | 'completed' | 'failed';
  filePath?: string;
  fileSize?: number;
  metadata: Record<string, unknown>;
}

export interface CostTrend {
  date: Date;
  amount: number;
  service: string;
  category: string;
  organizationId: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  metadata: Record<string, unknown>;
}

export interface BudgetStatus {
  budgetId: string;
  budgetName: string;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  status: 'on_track' | 'at_risk' | 'exceeded';
  daysRemaining: number;
  projectedAmount: number;
  variance: number;
  variancePercentage: number;
}

export interface CostAnomaly {
  id: string;
  type: 'spike' | 'drop' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  affectedServices: string[];
  affectedResources: string[];
  impact: {
    costIncrease: number;
    percentageIncrease: number;
  };
  rootCause?: string;
  resolution?: string;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  metadata: Record<string, unknown>;
}

export interface CostForecast {
  date: Date;
  predictedAmount: number;
  confidence: number; // 0-100
  model: 'linear' | 'exponential' | 'seasonal' | 'arima';
  factors: string[];
  metadata: Record<string, unknown>;
}

export interface CostAllocation {
  id: string;
  costId: string;
  organizationId: string;
  departmentId?: string;
  projectId?: string;
  userId?: string;
  percentage: number; // 0-100
  amount: number;
  method: 'equal' | 'usage_based' | 'custom' | 'tag_based';
  tags: string[];
  createdAt: Date;
  createdBy: string;
  metadata: Record<string, unknown>;
}

export interface CostCenter {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  parentId?: string;
  type: 'department' | 'project' | 'team' | 'product';
  budget?: number;
  currency: string;
  managerId: string;
  members: string[];
  tags: string[];
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface ResourceUtilization {
  id: string;
  resourceId: string;
  resourceType: string;
  service: string;
  organizationId: string;
  timestamp: Date;
  metrics: {
    cpu: number; // 0-100
    memory: number; // 0-100
    storage: number; // 0-100
    network: number; // 0-100
    requests: number;
    errors: number;
  };
  cost: number;
  efficiency: number; // 0-100
  recommendations: string[];
  metadata: Record<string, unknown>;
}

export interface CostOptimization {
  id: string;
  type: 'automatic' | 'manual' | 'scheduled';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  targetResources: string[];
  optimizationType: 'right_sizing' | 'auto_scaling' | 'storage_tiering' | 'instance_scheduling';
  parameters: Record<string, unknown>;
  expectedSavings: number;
  actualSavings?: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  logs: OptimizationLog[];
  metadata: Record<string, unknown>;
}

export interface OptimizationLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface FinOpsMetrics {
  totalCosts: number;
  costsByPeriod: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  costsByService: Record<string, {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  costsByCategory: Record<string, {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  budgetAdherence: {
    totalBudgets: number;
    onTrack: number;
    atRisk: number;
    exceeded: number;
    averageAdherence: number;
  };
  optimization: {
    totalRecommendations: number;
    implemented: number;
    pending: number;
    totalSavings: number;
    potentialSavings: number;
  };
  anomalies: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  efficiency: {
    averageResourceUtilization: number;
    averageCostEfficiency: number;
    wastePercentage: number;
  };
}

export interface FinOpsAlert {
  id: string;
  type: 'budget_exceeded' | 'cost_anomaly' | 'optimization_opportunity' | 'resource_waste' | 'forecast_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  organizationId: string;
  affectedResources: string[];
  affectedServices: string[];
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata: Record<string, unknown>;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'notification' | 'automation' | 'escalation' | 'approval';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  parameters: Record<string, unknown>;
  executedAt?: Date;
  result?: Record<string, unknown>;
}

export interface FinOpsDashboard {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  userId: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval: number; // seconds
  isPublic: boolean;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface DashboardWidget {
  id: string;
  type: 'cost_chart' | 'budget_status' | 'optimization_recommendations' | 'cost_trends' | 'resource_utilization' | 'alerts' | 'kpi' | 'table';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  configuration: Record<string, unknown>;
  dataSource: string;
  refreshInterval: number;
  metadata: Record<string, unknown>;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  padding: number;
}

export interface DashboardFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: unknown;
  label: string;
}

export interface FinOpsSettings {
  organizationId: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  defaultBudgetPeriod: 'monthly' | 'quarterly' | 'yearly';
  defaultAlertThreshold: number;
  costAllocationMethod: 'equal' | 'usage_based' | 'tag_based';
  optimizationEnabled: boolean;
  autoApprovalLimit: number;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    slack: boolean;
    webhook: boolean;
  };
  reportingPreferences: {
    defaultFormat: 'pdf' | 'excel' | 'json' | 'csv';
    includeCharts: boolean;
    includeRecommendations: boolean;
    includeForecasts: boolean;
  };
  metadata: Record<string, unknown>;
}

export interface FinOpsUser {
  id: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'viewer' | 'analyst';
  permissions: {
    viewCosts: boolean;
    manageBudgets: boolean;
    approveOptimizations: boolean;
    generateReports: boolean;
    manageSettings: boolean;
    viewAlerts: boolean;
  };
  preferences: {
    dashboard: string;
    notifications: boolean;
    reports: string[];
  };
  lastLogin: Date;
  createdAt: Date;
  metadata: Record<string, unknown>;
}
