import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { predictiveAIService } from '../services/predictive-ai.service';
import { metricsService } from '../services/metrics.service';
import { externalIntegrationsService } from '../services/external-integrations.service';
import { auditService } from '../services/audit.service';
import { automlService } from '../services/automl.service';
import { sentimentAnalysisService } from '../services/sentiment-analysis.service';
import { workflowAutomationService } from '../services/workflow-automation.service';
import { realtimeAnalyticsService } from '../services/realtime-analytics.service';
import { semanticSearchService } from '../services/semantic-search.service';
import { intelligentReportingService } from '../services/intelligent-reporting.service';
import { intelligentChatbotService } from '../services/intelligent-chatbot.service';
import { businessProcessOptimizationService } from '../services/business-process-optimization.service';

export class AdvancedFeaturesController {
  // AI Predictive Features
  async predictDemand(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { productIds } = req.body;

      const predictions = await predictiveAIService.predictDemand(orgId, productIds);

      // Log audit event
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'ai_prediction',
        'demand_forecast',
        'predict_demand',
        { productIds },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: predictions,
        message: 'Demand predictions generated successfully'
      });
    } catch (error) {
      logger.error('Error predicting demand:', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate demand predictions'
      });
    }
  }

  async optimizeInventory(req: Request, res: Response) {
    try {
      const { orgId } = req.params;

      const optimizations = await predictiveAIService.optimizeInventory(orgId);

      // Log audit event
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'ai_optimization',
        'inventory',
        'optimize_inventory',
        { optimization_count: optimizations.length },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: optimizations,
        message: 'Inventory optimization completed'
      });
    } catch (error) {
      logger.error('Error optimizing inventory:', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize inventory'
      });
    }
  }

  async analyzeSeasonality(req: Request, res: Response) {
    try {
      const { orgId } = req.params;

      const analysis = await predictiveAIService.analyzeSeasonality(orgId);

      // Log audit event
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'ai_analysis',
        'seasonality',
        'analyze_seasonality',
        { analysis_count: analysis.length },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: analysis,
        message: 'Seasonality analysis completed'
      });
    } catch (error) {
      logger.error('Error analyzing seasonality:', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze seasonality'
      });
    }
  }

  async generateAIRecommendations(req: Request, res: Response) {
    try {
      const { orgId } = req.params;

      const recommendations = await predictiveAIService.generateRecommendations(orgId);

      // Log audit event
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'ai_recommendations',
        'business_intelligence',
        'generate_recommendations',
        { recommendation_types: Object.keys(recommendations) },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: recommendations,
        message: 'AI recommendations generated successfully'
      });
    } catch (error) {
      logger.error('Error generating AI recommendations:', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI recommendations'
      });
    }
  }

  // Metrics and KPI Features
  async getKPIScorecard(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { period = '30d' } = req.query;

      const scorecard = await metricsService.generateKPIScorecard(orgId, period as string);

      // Log audit event
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'metrics',
        'kpi_scorecard',
        'generate_scorecard',
        { period, overall_score: scorecard.overall_score },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: scorecard,
        message: 'KPI scorecard generated successfully'
      });
    } catch (error) {
      logger.error('Error generating KPI scorecard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate KPI scorecard'
      });
    }
  }

  // External Integrations Features
  async getShippingProviders(req: Request, res: Response) {
    try {
      const { origin, destination, weight } = req.body;

      const providers = await externalIntegrationsService.getShippingProviders(
        origin,
        destination,
        weight
      );

      res.json({
        success: true,
        data: providers,
        message: 'Shipping providers retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting shipping providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get shipping providers'
      });
    }
  }

  async trackShipment(req: Request, res: Response) {
    try {
      const { trackingNumber, carrier } = req.params;

      const tracking = await externalIntegrationsService.trackShipment(trackingNumber, carrier);

      res.json({
        success: true,
        data: tracking,
        message: 'Shipment tracking information retrieved'
      });
    } catch (error) {
      logger.error('Error tracking shipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track shipment'
      });
    }
  }

  async getPaymentProviders(req: Request, res: Response) {
    try {
      const { amount, currency = 'EUR' } = req.body;

      const providers = await externalIntegrationsService.getPaymentProviders(amount, currency);

      res.json({
        success: true,
        data: providers,
        message: 'Payment providers retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting payment providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment providers'
      });
    }
  }

  async processPayment(req: Request, res: Response) {
    try {
      const { provider, amount, currency, paymentData } = req.body;

      const result = await externalIntegrationsService.processPayment(
        provider,
        amount,
        currency,
        paymentData
      );

      // Log audit event for payment processing
      await auditService.logDataModification(
        req.body.orgId || 'system',
        req.user?.id || 'system',
        'payment',
        result.data?.transaction_id || 'unknown',
        'process_payment',
        {},
        { provider, amount, currency, status: result.data?.status },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: result,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      logger.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment'
      });
    }
  }

  async getMarketData(req: Request, res: Response) {
    try {
      const { productIds } = req.body;

      const marketData = await externalIntegrationsService.getMarketData(productIds);

      res.json({
        success: true,
        data: marketData,
        message: 'Market data retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting market data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get market data'
      });
    }
  }

  async getWeatherForecast(req: Request, res: Response) {
    try {
      const { location, days = 7 } = req.query;

      const forecast = await externalIntegrationsService.getWeatherForecast(
        location as string,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: forecast,
        message: 'Weather forecast retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting weather forecast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get weather forecast'
      });
    }
  }

  async checkIntegrationHealth(req: Request, res: Response) {
    try {
      const healthStatus = await externalIntegrationsService.checkIntegrationHealth();

      res.json({
        success: true,
        data: healthStatus,
        message: 'Integration health check completed'
      });
    } catch (error) {
      logger.error('Error checking integration health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check integration health'
      });
    }
  }

  // Audit and Compliance Features
  async getAuditEvents(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const filters = req.query;

      const events = await auditService.getAuditEvents(orgId, {
        event_type: filters.event_type as string,
        resource_type: filters.resource_type as string,
        user_id: filters.user_id as string,
        severity: filters.severity as string,
        start_date: filters.start_date ? new Date(filters.start_date as string) : undefined,
        end_date: filters.end_date ? new Date(filters.end_date as string) : undefined,
        limit: filters.limit ? parseInt(filters.limit as string) : 100,
        offset: filters.offset ? parseInt(filters.offset as string) : 0
      });

      res.json({
        success: true,
        data: events,
        message: 'Audit events retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting audit events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit events'
      });
    }
  }

  async generateAuditReport(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { period = '30d' } = req.query;

      const report = await auditService.generateAuditReport(orgId, period as string);

      // Log audit event for report generation
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'audit',
        'report',
        'generate_audit_report',
        { period, total_events: report.total_events },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: report,
        message: 'Audit report generated successfully'
      });
    } catch (error) {
      logger.error('Error generating audit report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate audit report'
      });
    }
  }

  // Combined Dashboard Data
  async getDashboardData(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { period = '30d' } = req.query;

      // Get all dashboard data in parallel
      const [kpiScorecard, demandPredictions, inventoryOptimizations, aiRecommendations] = await Promise.all([
        metricsService.generateKPIScorecard(orgId, period as string),
        predictiveAIService.predictDemand(orgId),
        predictiveAIService.optimizeInventory(orgId),
        predictiveAIService.generateRecommendations(orgId)
      ]);

      const dashboardData = {
        kpi_scorecard: kpiScorecard,
        demand_predictions: demandPredictions,
        inventory_optimizations: inventoryOptimizations,
        ai_recommendations: aiRecommendations,
        last_updated: new Date().toISOString()
      };

      // Log dashboard access
      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'dashboard',
        'comprehensive',
        'view_dashboard',
        { period, data_sources: Object.keys(dashboardData) },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data'
      });
    }
  }

  // System Health and Status
  async getSystemStatus(req: Request, res: Response) {
    try {
      const [integrationHealth, auditStats] = await Promise.all([
        externalIntegrationsService.checkIntegrationHealth(),
        auditService.getAuditEvents('system', { limit: 1 })
      ]);

      const systemStatus = {
        integrations: integrationHealth,
        audit_system: {
          status: 'healthy',
          last_event: auditStats.events[0]?.timestamp || null
        },
        ai_system: {
          status: 'operational',
          last_prediction: new Date().toISOString()
        },
        metrics_system: {
          status: 'operational',
          last_calculation: new Date().toISOString()
        },
        automl_system: {
          status: 'operational',
          models_count: 0
        },
        chatbot_system: {
          status: 'operational',
          active_sessions: 0
        },
        bpm_system: {
          status: 'operational',
          processes_count: 0
        },
        overall_status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0.0'
      };

      res.json({
        success: true,
        data: systemStatus,
        message: 'System status retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting system status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system status'
      });
    }
  }

  // AutoML Features
  async trainModel(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { config, dataset } = req.body;

      const result = await automlService.trainModel(config, dataset);

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'automl_training',
        'model',
        'train_model',
        { modelId: result.modelId, algorithm: config.algorithm },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: result,
        message: 'Model trained successfully'
      });
    } catch (error) {
      logger.error('Error training model:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to train model'
      });
    }
  }

  async predictWithModel(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { modelId, features } = req.body;

      const prediction = await automlService.predict(modelId, features);

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'automl_prediction',
        'model',
        'predict',
        { modelId, features },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: prediction,
        message: 'Prediction completed successfully'
      });
    } catch (error) {
      logger.error('Error making prediction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to make prediction'
      });
    }
  }

  // Sentiment Analysis Features
  async analyzeSentiment(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { text, language, context } = req.body;

      const result = await sentimentAnalysisService.analyzeSentiment({
        text,
        language,
        context
      });

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'sentiment_analysis',
        'text',
        'analyze_sentiment',
        { textLength: text.length, context },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: result,
        message: 'Sentiment analysis completed'
      });
    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze sentiment'
      });
    }
  }

  // Workflow Automation Features
  async createWorkflow(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const workflowData = req.body;

      const workflow = await workflowAutomationService.createWorkflow(workflowData);

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'workflow_creation',
        'workflow',
        'create_workflow',
        { workflowId: workflow.id, name: workflow.name },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully'
      });
    } catch (error) {
      logger.error('Error creating workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create workflow'
      });
    }
  }

  // Real-time Analytics Features
  async ingestEvent(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const eventData = req.body;

      const eventId = await realtimeAnalyticsService.ingestEvent({
        ...eventData,
        source: orgId
      });

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'realtime_ingest',
        'event',
        'ingest_event',
        { eventId, type: eventData.type },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: { eventId },
        message: 'Event ingested successfully'
      });
    } catch (error) {
      logger.error('Error ingesting event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to ingest event'
      });
    }
  }

  // Semantic Search Features
  async indexDocument(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const documentData = req.body;

      const documentId = await semanticSearchService.indexDocument({
        ...documentData,
        metadata: { ...documentData.metadata, orgId }
      });

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'orgId',
        'document',
        'index_document',
        { documentId, type: documentData.type },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: { documentId },
        message: 'Document indexed successfully'
      });
    } catch (error) {
      logger.error('Error indexing document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to index document'
      });
    }
  }

  // Intelligent Reporting Features
  async generateReport(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const reportRequest = req.body;

      const report = await intelligentReportingService.generateReport(reportRequest);

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'report_generation',
        'report',
        'generate_report',
        { reportId: report.id, templateId: report.templateId },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: report,
        message: 'Report generated successfully'
      });
    } catch (error) {
      logger.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  // Chatbot Features
  async createChatSession(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const { userId } = req.body;

      const session = await intelligentChatbotService.createSession(userId);

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'chatbot_session',
        'session',
        'create_session',
        { sessionId: session.id, userId },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: session,
        message: 'Chat session created successfully'
      });
    } catch (error) {
      logger.error('Error creating chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat session'
      });
    }
  }

  // Business Process Optimization Features
  async createProcess(req: Request, res: Response) {
    try {
      const { orgId } = req.params;
      const processData = req.body;

      const process = await businessProcessOptimizationService.createProcess(processData);

      await auditService.logDataAccess(
        orgId,
        req.user?.id || 'system',
        'bpm_creation',
        'process',
        'create_process',
        { processId: process.id, name: process.name },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: process,
        message: 'Business process created successfully'
      });
    } catch (error) {
      logger.error('Error creating business process:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create business process'
      });
    }
  }
}

export const advancedFeaturesController = new AdvancedFeaturesController();

