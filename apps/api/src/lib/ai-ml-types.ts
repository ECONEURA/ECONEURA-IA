/**
 * AI/ML & Automation Types
 * 
 * This file defines all TypeScript interfaces and types for the Advanced AI/ML
 * and Automation system (PR-50).
 */

// ============================================================================
// CORE AI/ML TYPES
// ============================================================================

export interface MLModel {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision' | 'recommendation' | 'anomaly_detection';
  algorithm: string;
  version: string;
  status: 'training' | 'trained' | 'deployed' | 'retired' | 'error';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingData: string[];
  features: string[];
  hyperparameters: Record<string, any>;
  metadata: Record<string, any>;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  lastTrained?: Date;
  trainingDuration?: number;
  modelSize?: number;
  performance: ModelPerformance;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
  confusionMatrix?: number[][];
  featureImportance?: Array<{ feature: string; importance: number }>;
  trainingHistory?: Array<{ epoch: number; loss: number; accuracy: number }>;
  validationHistory?: Array<{ epoch: number; loss: number; accuracy: number }>;
}

export interface TrainingJob {
  id: string;
  modelId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trainingData: string[];
  validationData: string[];
  testData: string[];
  hyperparameters: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  currentEpoch?: number;
  totalEpochs?: number;
  loss?: number;
  accuracy?: number;
  error?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelDeployment {
  id: string;
  modelId: string;
  environment: 'development' | 'staging' | 'production';
  status: 'deploying' | 'active' | 'inactive' | 'error';
  endpoint: string;
  version: string;
  replicas: number;
  resources: ResourceAllocation;
  configuration: DeploymentConfig;
  healthCheck: HealthCheck;
  metrics: DeploymentMetrics;
  organizationId: string;
  deployedBy: string;
  deployedAt: Date;
  updatedAt: Date;
}

export interface ResourceAllocation {
  cpu: string;
  memory: string;
  gpu?: string;
  storage?: string;
  network?: string;
}

export interface DeploymentConfig {
  batchSize: number;
  timeout: number;
  retries: number;
  scaling: ScalingConfig;
  monitoring: MonitoringConfig;
}

export interface ScalingConfig {
  minReplicas: number;
  maxReplicas: number;
  targetUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
  logging: LoggingConfig;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  retention: number;
  format: 'json' | 'text';
}

export interface HealthCheck {
  enabled: boolean;
  path: string;
  interval: number;
  timeout: number;
  retries: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck?: Date;
  responseTime?: number;
}

export interface DeploymentMetrics {
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  gpuUtilization?: number;
  lastUpdated: Date;
}

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  status: 'active' | 'inactive' | 'draft' | 'error';
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted?: Date;
  nextExecution?: Date;
  organizationId: string;
  createdBy: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'event' | 'webhook' | 'api' | 'data_change' | 'condition';
  name: string;
  description: string;
  configuration: Record<string, any>;
  enabled: boolean;
  priority: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'delay' | 'ai_decision';
  description: string;
  configuration: Record<string, any>;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  timeout?: number;
  retries?: number;
  onError?: 'continue' | 'stop' | 'retry';
}

export interface WorkflowCondition {
  id: string;
  name: string;
  expression: string;
  description: string;
  operator: 'and' | 'or' | 'not';
  conditions: string[];
  actions: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggerId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: ExecutionStep[];
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  organizationId: string;
  executedBy: string;
  metadata: Record<string, any>;
}

export interface ExecutionStep {
  id: string;
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  retries: number;
  logs: string[];
}

// ============================================================================
// PREDICTIVE ANALYTICS TYPES
// ============================================================================

export interface Prediction {
  id: string;
  modelId: string;
  type: 'forecast' | 'classification' | 'regression' | 'anomaly' | 'recommendation';
  inputData: Record<string, any>;
  predictions: PredictionResult[];
  confidence: number;
  accuracy: number;
  timestamp: Date;
  organizationId: string;
  createdBy: string;
  metadata: Record<string, any>;
  tags: string[];
}

export interface PredictionResult {
  value: any;
  confidence: number;
  probability?: number;
  explanation?: string;
  features?: Array<{ feature: string; value: any; importance: number }>;
}

export interface Forecast {
  id: string;
  modelId: string;
  timeSeries: string;
  horizon: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  predictions: ForecastPoint[];
  confidenceIntervals: ConfidenceInterval[];
  accuracy: number;
  metrics: ForecastMetrics;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: number;
  anomaly?: boolean;
}

export interface ConfidenceInterval {
  timestamp: Date;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastMetrics {
  mape: number;
  rmse: number;
  mae: number;
  mse: number;
  r2Score: number;
  directionalAccuracy: number;
}

export interface AnomalyDetection {
  id: string;
  modelId: string;
  data: Record<string, any>;
  anomaly: boolean;
  score: number;
  threshold: number;
  features: Array<{ feature: string; value: any; contribution: number }>;
  timestamp: Date;
  organizationId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendations: string[];
}

// ============================================================================
// AI ORCHESTRATION TYPES
// ============================================================================

export interface AIOrchestration {
  id: string;
  name: string;
  description: string;
  type: 'pipeline' | 'model_serving' | 'batch_processing' | 'real_time' | 'streaming';
  models: string[];
  resources: ResourceAllocation;
  status: 'running' | 'stopped' | 'error' | 'scheduled' | 'paused';
  performance: PerformanceMetrics;
  configuration: OrchestrationConfig;
  organizationId: string;
  createdBy: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
}

export interface OrchestrationConfig {
  parallelism: number;
  timeout: number;
  retries: number;
  scheduling: SchedulingConfig;
  monitoring: MonitoringConfig;
  scaling: ScalingConfig;
  dependencies: string[];
}

export interface SchedulingConfig {
  enabled: boolean;
  schedule: string;
  timezone: string;
  maxConcurrency: number;
  priority: number;
}

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  errorRate: number;
  resourceUtilization: ResourceUtilization;
  lastUpdated: Date;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  gpu?: number;
  storage: number;
  network: number;
}

export interface MLPipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  status: 'active' | 'inactive' | 'error';
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted?: Date;
  nextExecution?: Date;
  organizationId: string;
  createdBy: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: 'data_ingestion' | 'preprocessing' | 'training' | 'validation' | 'deployment' | 'monitoring';
  description: string;
  configuration: Record<string, any>;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  timeout?: number;
  retries?: number;
  resources: ResourceAllocation;
}

// ============================================================================
// NATURAL LANGUAGE PROCESSING TYPES
// ============================================================================

export interface NLPRequest {
  id: string;
  type: 'sentiment' | 'classification' | 'extraction' | 'translation' | 'summarization' | 'generation';
  text: string;
  language?: string;
  model?: string;
  parameters: Record<string, any>;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
}

export interface NLPResponse {
  id: string;
  requestId: string;
  results: NLPResult[];
  confidence: number;
  processingTime: number;
  model: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface NLPResult {
  type: string;
  value: any;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  explanation?: string;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: Array<{ emotion: string; score: number }>;
  aspects: Array<{ aspect: string; sentiment: string; confidence: number }>;
}

export interface TextClassification {
  category: string;
  confidence: number;
  categories: Array<{ category: string; confidence: number }>;
  explanation?: string;
}

export interface EntityExtraction {
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }>;
  relations: Array<{
    entity1: string;
    entity2: string;
    relation: string;
    confidence: number;
  }>;
}

// ============================================================================
// COMPUTER VISION TYPES
// ============================================================================

export interface VisionRequest {
  id: string;
  type: 'classification' | 'detection' | 'segmentation' | 'ocr' | 'analysis';
  image: string; // Base64 encoded image
  model?: string;
  parameters: Record<string, any>;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
}

export interface VisionResponse {
  id: string;
  requestId: string;
  results: VisionResult[];
  confidence: number;
  processingTime: number;
  model: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface VisionResult {
  type: string;
  value: any;
  confidence: number;
  boundingBox?: BoundingBox;
  explanation?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectDetection {
  objects: Array<{
    label: string;
    confidence: number;
    boundingBox: BoundingBox;
    attributes?: Record<string, any>;
  }>;
  scene: string;
  sceneConfidence: number;
}

export interface ImageClassification {
  category: string;
  confidence: number;
  categories: Array<{ category: string; confidence: number }>;
  attributes: Record<string, any>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    boundingBox: BoundingBox;
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    boundingBox: BoundingBox;
  }>;
}

// ============================================================================
// RECOMMENDATION SYSTEM TYPES
// ============================================================================

export interface RecommendationRequest {
  id: string;
  userId: string;
  type: 'collaborative' | 'content_based' | 'hybrid' | 'contextual';
  context: Record<string, any>;
  limit: number;
  filters?: Record<string, any>;
  organizationId: string;
  createdAt: Date;
}

export interface RecommendationResponse {
  id: string;
  requestId: string;
  recommendations: Recommendation[];
  confidence: number;
  processingTime: number;
  model: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface Recommendation {
  itemId: string;
  score: number;
  confidence: number;
  reason: string;
  explanation?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationModel {
  id: string;
  name: string;
  type: 'collaborative' | 'content_based' | 'hybrid' | 'contextual';
  algorithm: string;
  status: 'training' | 'trained' | 'deployed' | 'retired';
  performance: RecommendationMetrics;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  ndcg: number;
  map: number;
  diversity: number;
  novelty: number;
  coverage: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateMLModelRequest {
  name: string;
  description: string;
  type: MLModel['type'];
  algorithm: string;
  features: string[];
  hyperparameters: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
}

export interface CreateWorkflowRequest {
  name: string;
  description: string;
  triggers: Omit<WorkflowTrigger, 'id'>[];
  steps: Omit<WorkflowStep, 'id'>[];
  conditions: Omit<WorkflowCondition, 'id'>[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface CreatePredictionRequest {
  modelId: string;
  type: Prediction['type'];
  inputData: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
}

export interface CreateOrchestrationRequest {
  name: string;
  description: string;
  type: AIOrchestration['type'];
  models: string[];
  resources: ResourceAllocation;
  configuration: OrchestrationConfig;
  tags: string[];
  metadata: Record<string, any>;
}

export interface AIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  metadata?: {
    timestamp: Date;
    executionTime: number;
    model: string;
    confidence: number;
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface MLConfig {
  trainingEnabled: boolean;
  servingEnabled: boolean;
  autoOptimization: boolean;
  abTesting: boolean;
  modelRegistry: boolean;
  versionControl: boolean;
  monitoring: boolean;
}

export interface AutomationConfig {
  workflowAutomation: boolean;
  intelligentDecisions: boolean;
  processOptimization: boolean;
  resourceManagement: boolean;
  errorHandling: boolean;
  performanceMonitoring: boolean;
}

export interface PredictionConfig {
  forecasting: boolean;
  trendAnalysis: boolean;
  scenarioPlanning: boolean;
  confidenceIntervals: boolean;
  anomalyDetection: boolean;
  realTimePrediction: boolean;
}

export interface AIOrchestrationConfig {
  pipelineManagement: boolean;
  modelServing: boolean;
  resourceOrchestration: boolean;
  monitoring: boolean;
  governance: boolean;
  integration: boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  MLModel,
  ModelPerformance,
  TrainingJob,
  ModelDeployment,
  ResourceAllocation,
  DeploymentConfig,
  ScalingConfig,
  MonitoringConfig,
  AlertConfig,
  LoggingConfig,
  HealthCheck,
  DeploymentMetrics,
  AutomationWorkflow,
  WorkflowTrigger,
  WorkflowStep,
  WorkflowCondition,
  WorkflowExecution,
  ExecutionStep,
  Prediction,
  PredictionResult,
  Forecast,
  ForecastPoint,
  ConfidenceInterval,
  ForecastMetrics,
  AnomalyDetection,
  AIOrchestration,
  OrchestrationConfig,
  SchedulingConfig,
  PerformanceMetrics,
  ResourceUtilization,
  MLPipeline,
  PipelineStage,
  NLPRequest,
  NLPResponse,
  NLPResult,
  SentimentAnalysis,
  TextClassification,
  EntityExtraction,
  VisionRequest,
  VisionResponse,
  VisionResult,
  BoundingBox,
  ObjectDetection,
  ImageClassification,
  OCRResult,
  RecommendationRequest,
  RecommendationResponse,
  Recommendation,
  RecommendationModel,
  RecommendationMetrics,
  CreateMLModelRequest,
  CreateWorkflowRequest,
  CreatePredictionRequest,
  CreateOrchestrationRequest,
  AIResponse,
  MLConfig,
  AutomationConfig,
  PredictionConfig,
  AIOrchestrationConfig
};
