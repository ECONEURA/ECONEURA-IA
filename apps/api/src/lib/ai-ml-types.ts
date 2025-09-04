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
  type: 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision' | 'time_series' | 'anomaly_detection';
  algorithm: string;
  framework: 'tensorflow' | 'pytorch' | 'scikit-learn' | 'xgboost' | 'lightgbm' | 'custom';
  version: string;
  status: 'training' | 'trained' | 'validating' | 'deployed' | 'retired' | 'failed';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  trainingData: string[];
  features: string[];
  targetVariable: string;
  hyperparameters: Record<string, any>;
  modelPath: string;
  trainingMetrics: MLTrainingMetrics;
  validationMetrics: MLValidationMetrics;
  deploymentConfig: MLDeploymentConfig;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  lastTrainedAt?: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface MLTrainingMetrics {
  trainingAccuracy: number;
  validationAccuracy: number;
  trainingLoss: number;
  validationLoss: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
  trainingTime: number;
  convergenceEpoch?: number;
  overfittingDetected: boolean;
  metrics: Record<string, number>;
}

export interface MLValidationMetrics {
  crossValidationScore: number;
  testAccuracy: number;
  testPrecision: number;
  testRecall: number;
  testF1Score: number;
  confusionMatrix: number[][];
  rocCurve: Array<{ threshold: number; tpr: number; fpr: number }>;
  precisionRecallCurve: Array<{ threshold: number; precision: number; recall: number }>;
  featureImportance: Array<{ feature: string; importance: number }>;
  validationTime: number;
}

export interface MLDeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  instanceType: string;
  scalingConfig: {
    minInstances: number;
    maxInstances: number;
    targetUtilization: number;
  };
  monitoringConfig: {
    enabled: boolean;
    metricsInterval: number;
    alertThresholds: Record<string, number>;
  };
  apiConfig: {
    endpoint: string;
    authentication: boolean;
    rateLimit: number;
    timeout: number;
  };
}

export interface MLTrainingJob {
  id: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  trainingData: string;
  validationData?: string;
  testData?: string;
  hyperparameters: Record<string, any>;
  trainingConfig: MLTrainingConfig;
  progress: number;
  currentEpoch?: number;
  totalEpochs?: number;
  estimatedCompletion?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metrics: MLTrainingMetrics;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MLTrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  lossFunction: string;
  validationSplit: number;
  earlyStopping: {
    enabled: boolean;
    patience: number;
    minDelta: number;
  };
  dataAugmentation?: {
    enabled: boolean;
    techniques: string[];
  };
  regularization?: {
    l1: number;
    l2: number;
    dropout: number;
  };
}

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'paused' | 'error' | 'draft';
  executionCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted?: Date;
  nextExecution?: Date;
  errorMessage?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual' | 'condition';
  config: {
    schedule?: string; // Cron expression
    event?: string;
    webhook?: string;
    condition?: string;
    parameters?: Record<string, any>;
  };
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'delay' | 'ai_decision';
  action?: WorkflowAction;
  condition?: WorkflowCondition;
  loop?: WorkflowLoop;
  parallel?: WorkflowParallel;
  delay?: WorkflowDelay;
  aiDecision?: WorkflowAIDecision;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  timeout?: number;
  metadata: Record<string, any>;
}

export interface WorkflowAction {
  type: 'api_call' | 'data_transformation' | 'notification' | 'file_operation' | 'database_operation' | 'ai_inference';
  config: Record<string, any>;
  parameters: Record<string, any>;
  outputMapping?: Record<string, string>;
}

export interface WorkflowCondition {
  expression: string;
  variables: string[];
  operators: string[];
}

export interface WorkflowLoop {
  type: 'for' | 'while' | 'foreach';
  condition: string;
  maxIterations?: number;
  steps: WorkflowStep[];
}

export interface WorkflowParallel {
  branches: WorkflowStep[][];
  waitForAll: boolean;
  timeout?: number;
}

export interface WorkflowDelay {
  duration: number; // milliseconds
  type: 'fixed' | 'random' | 'exponential';
}

export interface WorkflowAIDecision {
  modelId: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  confidenceThreshold: number;
  fallbackAction?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  trigger: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  steps: WorkflowStepExecution[];
  organizationId: string;
  executedBy: string;
  metadata: Record<string, any>;
}

export interface WorkflowStepExecution {
  id: string;
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: Record<string, any>;
  output?: Record<string, any>;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
  metadata: Record<string, any>;
}

// ============================================================================
// PREDICTIVE ANALYTICS TYPES
// ============================================================================

export interface Prediction {
  id: string;
  modelId: string;
  type: 'forecast' | 'classification' | 'regression' | 'anomaly' | 'recommendation' | 'clustering';
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  accuracy?: number;
  timestamp: Date;
  organizationId: string;
  createdBy: string;
  metadata: Record<string, any>;
  tags: string[];
}

export interface Forecast {
  id: string;
  modelId: string;
  series: string;
  horizon: number; // days
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  predictions: ForecastPoint[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  accuracy: number;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidence: number;
}

export interface AnomalyDetection {
  id: string;
  modelId: string;
  dataPoint: Record<string, any>;
  anomalyScore: number;
  threshold: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  recommendations: string[];
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

export interface Recommendation {
  id: string;
  modelId: string;
  userId?: string;
  itemId?: string;
  context: Record<string, any>;
  recommendations: RecommendationItem[];
  confidence: number;
  algorithm: string;
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

export interface RecommendationItem {
  itemId: string;
  score: number;
  reason: string;
  metadata: Record<string, any>;
}

// ============================================================================
// AI ORCHESTRATION TYPES
// ============================================================================

export interface AIOrchestration {
  id: string;
  name: string;
  description: string;
  type: 'model_serving' | 'pipeline' | 'ensemble' | 'workflow';
  status: 'active' | 'inactive' | 'deploying' | 'error';
  models: string[];
  pipelines: string[];
  configuration: AIOrchestrationConfig;
  performance: AIOrchestrationPerformance;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface AIOrchestrationConfig {
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetUtilization: number;
    autoScaling: boolean;
  };
  loadBalancing: {
    strategy: 'round_robin' | 'weighted' | 'least_connections' | 'ai_based';
    weights?: Record<string, number>;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    alertThresholds: Record<string, number>;
    loggingLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  security: {
    authentication: boolean;
    authorization: boolean;
    encryption: boolean;
    rateLimit: number;
  };
}

export interface AIOrchestrationPerformance {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  lastUpdated: Date;
}

export interface MLPipeline {
  id: string;
  name: string;
  description: string;
  stages: MLPipelineStage[];
  status: 'active' | 'inactive' | 'running' | 'failed';
  schedule?: string; // Cron expression
  lastRun?: Date;
  nextRun?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface MLPipelineStage {
  id: string;
  name: string;
  type: 'data_ingestion' | 'data_preprocessing' | 'feature_engineering' | 'model_training' | 'model_validation' | 'model_deployment' | 'monitoring';
  config: Record<string, any>;
  dependencies: string[];
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
  metadata: Record<string, any>;
}

export interface MLPipelineExecution {
  id: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  trigger: 'manual' | 'schedule' | 'webhook' | 'event';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  stages: MLPipelineStageExecution[];
  organizationId: string;
  executedBy: string;
  metadata: Record<string, any>;
}

export interface MLPipelineStageExecution {
  id: string;
  stageId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
  errorMessage?: string;
  output?: Record<string, any>;
  metadata: Record<string, any>;
}

// ============================================================================
// NATURAL LANGUAGE PROCESSING TYPES
// ============================================================================

export interface NLPAnalysis {
  id: string;
  text: string;
  language: string;
  analysis: {
    sentiment: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    entities: NLPEntity[];
    keywords: string[];
    topics: NLPTopic[];
    summary?: string;
    classification?: {
      category: string;
      confidence: number;
    };
  };
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

export interface NLPEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percentage' | 'other';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface NLPTopic {
  name: string;
  score: number;
  keywords: string[];
}

export interface NLPDocument {
  id: string;
  title: string;
  content: string;
  language: string;
  analysis: NLPAnalysis;
  classification: string;
  summary: string;
  keywords: string[];
  entities: NLPEntity[];
  topics: NLPTopic[];
  createdAt: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

// ============================================================================
// COMPUTER VISION TYPES
// ============================================================================

export interface ComputerVisionAnalysis {
  id: string;
  imageUrl: string;
  imageHash: string;
  analysis: {
    objects: CVObject[];
    faces: CVFace[];
    text: CVText[];
    labels: CVLabel[];
    colors: CVColor[];
    quality: {
      brightness: number;
      contrast: number;
      sharpness: number;
      blur: number;
    };
  };
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

export interface CVObject {
  name: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: Record<string, any>;
}

export interface CVFace {
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: {
    age?: number;
    gender?: string;
    emotion?: string;
    landmarks?: Array<{ x: number; y: number }>;
  };
}

export interface CVText {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language?: string;
}

export interface CVLabel {
  name: string;
  confidence: number;
  category: string;
}

export interface CVColor {
  color: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateMLModelRequest {
  name: string;
  description: string;
  type: MLModel['type'];
  algorithm: string;
  framework: MLModel['framework'];
  features: string[];
  targetVariable: string;
  hyperparameters: Record<string, any>;
  trainingConfig: MLTrainingConfig;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CreateAutomationWorkflowRequest {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: Omit<WorkflowStep, 'id'>[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface CreatePredictionRequest {
  modelId: string;
  type: Prediction['type'];
  input: Record<string, any>;
  metadata: Record<string, any>;
}

export interface CreateForecastRequest {
  modelId: string;
  series: string;
  horizon: number;
  frequency: Forecast['frequency'];
  input: Record<string, any>;
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
    modelVersion: string;
    confidence: number;
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AIMLConfig {
  machineLearning: boolean;
  automation: boolean;
  predictiveAnalytics: boolean;
  aiOrchestration: boolean;
  naturalLanguageProcessing: boolean;
  computerVision: boolean;
  recommendationEngine: boolean;
  anomalyDetection: boolean;
}

export interface MLConfig {
  trainingEnabled: boolean;
  autoDeployment: boolean;
  abTesting: boolean;
  performanceMonitoring: boolean;
  modelVersioning: boolean;
  featureEngineering: boolean;
  hyperparameterOptimization: boolean;
  crossValidation: boolean;
}

export interface AutomationConfig {
  workflowAutomation: boolean;
  processMining: boolean;
  intelligentRouting: boolean;
  businessProcessAutomation: boolean;
  decisionAutomation: boolean;
  taskAutomation: boolean;
  integrationAutomation: boolean;
  schedulingAutomation: boolean;
}

export interface PredictiveAnalyticsConfig {
  forecasting: boolean;
  anomalyDetection: boolean;
  riskPrediction: boolean;
  customerBehaviorPrediction: boolean;
  marketAnalysis: boolean;
  performancePrediction: boolean;
  churnPrediction: boolean;
  demandForecasting: boolean;
}

export interface AIOrchestrationConfig {
  modelOrchestration: boolean;
  pipelineOrchestration: boolean;
  resourceManagement: boolean;
  modelServing: boolean;
  monitoring: boolean;
  costOptimization: boolean;
  governance: boolean;
  scaling: boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  MLModel,
  MLTrainingMetrics,
  MLValidationMetrics,
  MLDeploymentConfig,
  MLTrainingJob,
  MLTrainingConfig,
  AutomationWorkflow,
  WorkflowTrigger,
  WorkflowStep,
  WorkflowAction,
  WorkflowCondition,
  WorkflowLoop,
  WorkflowParallel,
  WorkflowDelay,
  WorkflowAIDecision,
  WorkflowExecution,
  WorkflowStepExecution,
  Prediction,
  Forecast,
  ForecastPoint,
  AnomalyDetection,
  Recommendation,
  RecommendationItem,
  AIOrchestration,
  AIOrchestrationConfig,
  AIOrchestrationPerformance,
  MLPipeline,
  MLPipelineStage,
  MLPipelineExecution,
  MLPipelineStageExecution,
  NLPAnalysis,
  NLPEntity,
  NLPTopic,
  NLPDocument,
  ComputerVisionAnalysis,
  CVObject,
  CVFace,
  CVText,
  CVLabel,
  CVColor,
  CreateMLModelRequest,
  CreateAutomationWorkflowRequest,
  CreatePredictionRequest,
  CreateForecastRequest,
  AIResponse,
  AIMLConfig,
  MLConfig,
  AutomationConfig,
  PredictiveAnalyticsConfig,
  AIOrchestrationConfig
};