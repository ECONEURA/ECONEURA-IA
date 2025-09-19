import { Router } from 'express';
import { structuredLogger } from '../lib/structured-logger.js';
import { randomUUID } from 'crypto';
const router = Router();
const executionStore = new Map();
const agentRegistry = [
    { id: 'lead-enrich', name: 'Lead Enrichment', category: 'ventas', description: 'Enrich lead information', costHint: 'low' },
    { id: 'score', name: 'Lead Scoring', category: 'ventas', description: 'Score leads based on criteria', costHint: 'low' },
    { id: 'next-best-action', name: 'Next Best Action', category: 'ventas', description: 'Recommend next sales action', costHint: 'medium' },
    { id: 'email-draft', name: 'Email Draft Generator', category: 'ventas', description: 'Generate personalized emails', costHint: 'low' },
    { id: 'follow-up', name: 'Follow-up Scheduler', category: 'ventas', description: 'Schedule follow-up activities', costHint: 'low' },
    { id: 'quote-gen', name: 'Quote Generator', category: 'ventas', description: 'Generate sales quotes', costHint: 'medium' },
    { id: 'churn-risk', name: 'Churn Risk Assessment', category: 'ventas', description: 'Assess customer churn risk', costHint: 'medium' },
    { id: 'upsell-tip', name: 'Upsell Recommendations', category: 'ventas', description: 'Identify upsell opportunities', costHint: 'medium' },
    { id: 'notes-to-crm', name: 'Notes to CRM', category: 'ventas', description: 'Extract CRM data from notes', costHint: 'low' },
    { id: 'summary-call', name: 'Call Summary', category: 'ventas', description: 'Summarize sales calls', costHint: 'medium' },
    { id: 'agenda-gen', name: 'Meeting Agenda Generator', category: 'ventas', description: 'Generate meeting agendas', costHint: 'low' },
    { id: 'nps-insight', name: 'NPS Insights', category: 'ventas', description: 'Analyze NPS feedback', costHint: 'medium' },
    { id: 'segment-build', name: 'Segment Builder', category: 'marketing', description: 'Build customer segments', costHint: 'medium' },
    { id: 'subject-ab', name: 'Subject Line A/B Test', category: 'marketing', description: 'Test email subject lines', costHint: 'low' },
    { id: 'copy-rewrite', name: 'Copy Rewriter', category: 'marketing', description: 'Rewrite marketing copy', costHint: 'medium' },
    { id: 'cta-suggest', name: 'CTA Suggestions', category: 'marketing', description: 'Suggest call-to-actions', costHint: 'low' },
    { id: 'utm-audit', name: 'UTM Audit', category: 'marketing', description: 'Audit UTM parameters', costHint: 'low' },
    { id: 'seo-brief', name: 'SEO Brief Generator', category: 'marketing', description: 'Generate SEO content briefs', costHint: 'medium' },
    { id: 'post-calendar', name: 'Social Post Calendar', category: 'marketing', description: 'Generate social media calendar', costHint: 'medium' },
    { id: 'trend-scan', name: 'Trend Scanner', category: 'marketing', description: 'Scan market trends', costHint: 'high' },
    { id: 'outreach-list', name: 'Outreach List Builder', category: 'marketing', description: 'Build outreach lists', costHint: 'medium' },
    { id: 'persona-synth', name: 'Persona Synthesizer', category: 'marketing', description: 'Create buyer personas', costHint: 'medium' },
    { id: 'landing-critique', name: 'Landing Page Critique', category: 'marketing', description: 'Critique landing pages', costHint: 'medium' },
    { id: 'faq-gen', name: 'FAQ Generator', category: 'marketing', description: 'Generate FAQ content', costHint: 'low' },
    { id: 'ticket-triage', name: 'Ticket Triage', category: 'operaciones', description: 'Triage support tickets', costHint: 'low' },
    { id: 'kb-suggest', name: 'Knowledge Base Suggestions', category: 'operaciones', description: 'Suggest KB articles', costHint: 'low' },
    { id: 'sop-draft', name: 'SOP Draft Generator', category: 'operaciones', description: 'Draft standard procedures', costHint: 'medium' },
    { id: 'escalado-policy', name: 'Escalation Policy', category: 'operaciones', description: 'Define escalation policies', costHint: 'medium' },
    { id: 'capacity-plan', name: 'Capacity Planning', category: 'operaciones', description: 'Plan resource capacity', costHint: 'high' },
    { id: 'stock-alert', name: 'Stock Alerts', category: 'operaciones', description: 'Generate stock alerts', costHint: 'low' },
    { id: 'supplier-ping', name: 'Supplier Communication', category: 'operaciones', description: 'Communicate with suppliers', costHint: 'low' },
    { id: 'shipment-eta', name: 'Shipment ETA', category: 'operaciones', description: 'Calculate shipment ETAs', costHint: 'medium' },
    { id: 'sla-watch', name: 'SLA Monitoring', category: 'operaciones', description: 'Monitor SLA compliance', costHint: 'low' },
    { id: 'task-bundle', name: 'Task Bundling', category: 'operaciones', description: 'Bundle related tasks', costHint: 'low' },
    { id: 'meeting-notes', name: 'Meeting Notes', category: 'operaciones', description: 'Generate meeting notes', costHint: 'medium' },
    { id: 'action-items', name: 'Action Items Extractor', category: 'operaciones', description: 'Extract action items', costHint: 'low' },
    { id: 'invoice-extract', name: 'Invoice Data Extraction', category: 'finanzas', description: 'Extract invoice data', costHint: 'medium' },
    { id: 'ar-prioritize', name: 'AR Prioritization', category: 'finanzas', description: 'Prioritize accounts receivable', costHint: 'low' },
    { id: 'dunning-draft', name: 'Dunning Letter Draft', category: 'finanzas', description: 'Draft dunning letters', costHint: 'low' },
    { id: 'sepa-reconcile-hint', name: 'SEPA Reconciliation Hints', category: 'finanzas', description: 'SEPA reconciliation suggestions', costHint: 'medium' },
    { id: 'anomaly-cost', name: 'Cost Anomaly Detection', category: 'finanzas', description: 'Detect cost anomalies', costHint: 'medium' },
    { id: 'forecast-cash', name: 'Cash Flow Forecast', category: 'finanzas', description: 'Forecast cash flow', costHint: 'high' },
    { id: 'budget-watch', name: 'Budget Monitoring', category: 'finanzas', description: 'Monitor budget performance', costHint: 'low' },
    { id: 'fx-rate-note', name: 'FX Rate Notifications', category: 'finanzas', description: 'FX rate change notifications', costHint: 'low' },
    { id: 'tax-check-hint', name: 'Tax Check Hints', category: 'finanzas', description: 'Tax compliance hints', costHint: 'medium' },
    { id: 'payment-reminder', name: 'Payment Reminders', category: 'finanzas', description: 'Generate payment reminders', costHint: 'low' },
    { id: 'fee-detect', name: 'Fee Detection', category: 'finanzas', description: 'Detect unexpected fees', costHint: 'low' },
    { id: 'refund-assist', name: 'Refund Assistant', category: 'finanzas', description: 'Assist with refund processing', costHint: 'medium' },
    { id: 'bug-triage', name: 'Bug Triage', category: 'soporte_qa', description: 'Triage bug reports', costHint: 'low' },
    { id: 'repro-steps', name: 'Reproduction Steps', category: 'soporte_qa', description: 'Generate bug reproduction steps', costHint: 'medium' },
    { id: 'test-case-gen', name: 'Test Case Generator', category: 'soporte_qa', description: 'Generate test cases', costHint: 'medium' },
    { id: 'release-notes', name: 'Release Notes', category: 'soporte_qa', description: 'Generate release notes', costHint: 'low' },
    { id: 'risk-matrix', name: 'Risk Matrix', category: 'soporte_qa', description: 'Create risk assessment matrix', costHint: 'medium' },
    { id: 'perf-hint', name: 'Performance Hints', category: 'soporte_qa', description: 'Performance optimization hints', costHint: 'medium' },
    { id: 'a11y-audit', name: 'Accessibility Audit', category: 'soporte_qa', description: 'Audit accessibility compliance', costHint: 'high' },
    { id: 'xss-scan-hint', name: 'XSS Scan Hints', category: 'soporte_qa', description: 'XSS vulnerability hints', costHint: 'medium' },
    { id: 'content-policy-check', name: 'Content Policy Check', category: 'soporte_qa', description: 'Check content policy compliance', costHint: 'low' },
    { id: 'pii-scrub-hint', name: 'PII Scrubbing Hints', category: 'soporte_qa', description: 'PII data scrubbing suggestions', costHint: 'medium' },
    { id: 'prompt-lint', name: 'Prompt Linter', category: 'soporte_qa', description: 'Lint AI prompts', costHint: 'low' },
    { id: 'red-team-prompt', name: 'Red Team Prompts', category: 'soporte_qa', description: 'Generate red team prompts', costHint: 'high' }
];
router.get('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const costEur = 0.001 * agentRegistry.length;
        res.set({
            'X-Est-Cost-EUR': costEur.toFixed(4),
            'X-Budget-Pct': '1.2',
            'X-Latency-ms': '45',
            'X-Route': 'local',
            'X-Correlation-Id': req.headers['x-correlation-id'] || randomUUID()
        });
        structuredLogger.info('Agent registry retrieved', {
            orgId,
            count: agentRegistry.length,
            costEur
        });
        res.json({
            success: true,
            data: agentRegistry,
            count: agentRegistry.length,
            categories: {
                ventas: agentRegistry.filter(a => a.category === 'ventas').length,
                marketing: agentRegistry.filter(a => a.category === 'marketing').length,
                operaciones: agentRegistry.filter(a => a.category === 'operaciones').length,
                finanzas: agentRegistry.filter(a => a.category === 'finanzas').length,
                soporte_qa: agentRegistry.filter(a => a.category === 'soporte_qa').length
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to retrieve agent registry', error, {
            orgId: req.headers['x-org-id']
        });
        res.status(500).json({
            error: 'Failed to retrieve agent registry',
            message: error.message
        });
    }
});
router.post('/run', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const userId = req.headers['x-user-id'] || 'user-demo';
        const correlationId = req.headers['x-correlation-id'] || randomUUID();
        const { agentId, inputs, idempotencyKey } = req.body;
        if (!agentId) {
            return res.status(400).json({ error: 'agentId is required' });
        }
        const agent = agentRegistry.find(a => a.id === agentId);
        if (!agent) {
            return res.status(404).json({
                error: 'Agent not found',
                message: `Agent ${agentId} is not available`
            });
        }
        if (idempotencyKey) {
            const existingExecution = Array.from(executionStore.values())
                .find(exec => exec.idempotencyKey === idempotencyKey && exec.orgId === orgId);
            if (existingExecution) {
                return res.status(200).json({
                    success: true,
                    data: {
                        executionId: existingExecution.id,
                        agentId: existingExecution.agentId,
                        status: existingExecution.status,
                        startedAt: existingExecution.startedAt,
                        completedAt: existingExecution.completedAt,
                        outputs: existingExecution.outputs
                    },
                    message: 'Execution already exists (idempotent)'
                });
            }
        }
        const executionId = randomUUID();
        const baseCosts = { low: 0.01, medium: 0.05, high: 0.15 };
        const estimatedCost = baseCosts[agent.costHint] || 0.05;
        const executionRecord = {
            id: executionId,
            agentId,
            orgId,
            userId,
            correlationId,
            idempotencyKey,
            status: 'pending',
            inputs,
            startedAt: new Date().toISOString(),
            estimatedCostEur: estimatedCost
        };
        executionStore.set(executionId, executionRecord);
        res.set({
            'X-Est-Cost-EUR': estimatedCost.toFixed(4),
            'X-Budget-Pct': '2.5',
            'X-Latency-ms': '120',
            'X-Route': 'local',
            'X-Correlation-Id': correlationId
        });
        setImmediate(() => executeAgent(executionId, agent));
        structuredLogger.info('Agent execution started', {
            orgId,
            userId,
            correlationId,
            executionId,
            agentId,
            estimatedCostEur: estimatedCost
        });
        res.status(202).json({
            success: true,
            data: {
                executionId,
                agentId,
                status: 'pending',
                startedAt: executionRecord.startedAt,
                estimatedCostEur: estimatedCost
            },
            message: 'Agent execution started'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to start agent execution', error, {
            orgId: req.headers['x-org-id'],
            body: req.body
        });
        res.status(500).json({
            error: 'Failed to start agent execution',
            message: error.message
        });
    }
});
router.get('/runs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const executionRecord = executionStore.get(id);
        if (!executionRecord || executionRecord.orgId !== orgId) {
            return res.status(404).json({
                error: 'Execution not found',
                message: `Agent execution with ID ${id} not found or access denied`
            });
        }
        res.set({
            'X-Est-Cost-EUR': (executionRecord.actualCostEur || executionRecord.estimatedCostEur || 0).toFixed(4),
            'X-Budget-Pct': '2.5',
            'X-Latency-ms': '25',
            'X-Route': 'cache',
            'X-Correlation-Id': executionRecord.correlationId
        });
        structuredLogger.info('Agent execution status retrieved', {
            orgId,
            executionId: id,
            status: executionRecord.status
        });
        res.json({
            success: true,
            data: {
                id: executionRecord.id,
                agentId: executionRecord.agentId,
                status: executionRecord.status,
                inputs: executionRecord.inputs,
                outputs: executionRecord.outputs,
                startedAt: executionRecord.startedAt,
                completedAt: executionRecord.completedAt,
                costEur: executionRecord.actualCostEur,
                executionTimeMs: executionRecord.executionTimeMs,
                error: executionRecord.error
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to retrieve agent execution', error, {
            orgId: req.headers['x-org-id'],
            executionId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to retrieve agent execution',
            message: error.message
        });
    }
});
router.get('/runs', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const { agentId, status } = req.query;
        let executions = Array.from(executionStore.values())
            .filter(exec => exec.orgId === orgId);
        if (agentId) {
            executions = executions.filter(exec => exec.agentId === agentId);
        }
        if (status) {
            executions = executions.filter(exec => exec.status === status);
        }
        executions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const paginatedResults = executions.slice(skip, skip + limit);
        const total = executions.length;
        res.set({
            'X-Est-Cost-EUR': '0.0020',
            'X-Budget-Pct': '1.8',
            'X-Latency-ms': '85',
            'X-Route': 'local',
            'X-Correlation-Id': req.headers['x-correlation-id'] || randomUUID()
        });
        structuredLogger.info('Agent executions retrieved', {
            orgId,
            count: paginatedResults.length,
            total,
            filters: { agentId, status }
        });
        res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to retrieve agent executions', error, {
            orgId: req.headers['x-org-id']
        });
        res.status(500).json({
            error: 'Failed to retrieve agent executions',
            message: error.message
        });
    }
});
async function executeAgent(executionId, agent) {
    try {
        const record = executionStore.get(executionId);
        if (!record)
            return;
        record.status = 'running';
        executionStore.set(executionId, record);
        const processingTimes = { low: 1000, medium: 3000, high: 8000 };
        const processingTime = processingTimes[agent.costHint] || 3000;
        await new Promise(resolve => setTimeout(resolve, processingTime + Math.random() * 2000));
        let outputs = {};
        let actualCost = 0;
        switch (agent.category) {
            case 'ventas':
                outputs = {
                    recommendations: ['Contact within 24 hours', 'Send personalized proposal'],
                    confidence: 0.85,
                    nextActions: ['schedule_call', 'send_email']
                };
                actualCost = 0.008 + Math.random() * 0.012;
                break;
            case 'marketing':
                outputs = {
                    content: 'Generated marketing content...',
                    metrics: { engagement: 0.12, conversion: 0.03 },
                    suggestions: ['Improve headline', 'Add CTA button']
                };
                actualCost = 0.015 + Math.random() * 0.025;
                break;
            case 'operaciones':
                outputs = {
                    priority: 'high',
                    category: 'technical',
                    assignee: 'operations-team',
                    estimatedResolution: '2 hours'
                };
                actualCost = 0.005 + Math.random() * 0.010;
                break;
            case 'finanzas':
                outputs = {
                    amount: 1250.00,
                    currency: 'EUR',
                    riskScore: 0.25,
                    recommendations: ['Approve payment', 'Verify vendor']
                };
                actualCost = 0.012 + Math.random() * 0.018;
                break;
            case 'soporte_qa':
                outputs = {
                    severity: 'medium',
                    category: 'bug',
                    reproducible: true,
                    testCases: ['Test case 1', 'Test case 2']
                };
                actualCost = 0.010 + Math.random() * 0.015;
                break;
        }
        const completedAt = new Date().toISOString();
        const executionTimeMs = Date.now() - new Date(record.startedAt).getTime();
        record.status = 'completed';
        record.outputs = outputs;
        record.completedAt = completedAt;
        record.actualCostEur = actualCost;
        record.executionTimeMs = executionTimeMs;
        executionStore.set(executionId, record);
        structuredLogger.info('Agent execution completed', {
            orgId: record.orgId,
            executionId,
            agentId: agent.id,
            executionTimeMs,
            actualCostEur: actualCost
        });
    }
    catch (error) {
        const record = executionStore.get(executionId);
        if (record) {
            record.status = 'failed';
            record.error = error.message;
            record.completedAt = new Date().toISOString();
            executionStore.set(executionId, record);
        }
        structuredLogger.error('Agent execution failed', error, {
            executionId,
            agentId: agent.id
        });
    }
}
export { router as agentsRouter };
//# sourceMappingURL=agents-simple.js.map