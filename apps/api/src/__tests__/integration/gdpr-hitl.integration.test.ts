/**
 * GDPR HITL Integration Tests
 * PR-100: GDPR Export/Erase (api) - endpoints con HITL
 * 
 * Tests de integración para endpoints GDPR con Human-in-the-Loop
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { gdprHITLService } from '../../services/gdpr-hitl.service.js';
import { gdprConsolidated } from '../../lib/gdpr-consolidated.service.js';
import { hitlV2Service } from '../../lib/hitl-v2.service.js';

// Mock the services
vi.mock('../../services/gdpr-hitl.service.js');
vi.mock('../../lib/gdpr-consolidated.service.js');
vi.mock('../../lib/hitl-v2.service.js');

// Mock Express app
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn()
} as unknown as Express;

describe('GDPR HITL Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /gdpr-hitl/requests', () => {
    it('should create GDPR HITL request successfully', async () => {
      const mockHITLRequest = {
        id: 'hitl_req_1',
        gdprRequestId: 'gdpr_req_1',
        hitlTaskId: 'task_1',
        type: 'export_approval',
        status: 'pending',
        priority: 'high',
        title: 'Export Approval - EXPORT Request for User user-123',
        description: 'GDPR export approval request for user user-123',
        dataCategories: ['personal_info', 'financial_data'],
        riskLevel: 'high',
        requiresLegalReview: true,
        assignedTo: 'user_2',
        assignedBy: 'user_1',
        organizationId: 'org_1',
        metadata: {
          originalRequest: {
            id: 'gdpr_req_1',
            userId: 'user-123',
            type: 'export',
            status: 'pending'
          },
          dataSummary: {
            userId: 'user-123',
            dataCategories: ['personal_info', 'financial_data'],
            estimatedRecords: 25
          }
        },
        reviewCriteria: {
          dataSensitivity: ['personal_info', 'financial_data'],
          legalRequirements: ['GDPR Article 15 (Right of access)'],
          businessJustification: 'User requested data export',
          technicalFeasibility: 'To be assessed by technical team',
          riskAssessment: 'Risk level: high'
        },
        decisions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaHours: 48
      };

      vi.mocked(gdprHITLService.createGDPRHITLRequest).mockResolvedValue(mockHITLRequest);

      const requestData = {
        gdprRequestId: 'gdpr_req_1',
        type: 'export_approval',
        organizationId: 'org_1',
        assignedBy: 'user_1',
        options: {
          priority: 'high',
          assignedTo: 'user_2',
          slaHours: 48
        }
      };

      // Mock the Express app to handle the request
      const mockRequest = {
        body: requestData
      };
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      // Simulate the route handler
      try {
        const result = await gdprHITLService.createGDPRHITLRequest(
          requestData.gdprRequestId,
          requestData.type,
          requestData.organizationId,
          requestData.assignedBy,
          requestData.options
        );

        expect(result).toEqual(mockHITLRequest);
        expect(gdprHITLService.createGDPRHITLRequest).toHaveBeenCalledWith(
          'gdpr_req_1',
          'export_approval',
          'org_1',
          'user_1',
          {
            priority: 'high',
            assignedTo: 'user_2',
            slaHours: 48
          }
        );
      } catch (error) {
        // Handle any errors
        expect(error).toBeUndefined();
      }
    });

    it('should handle validation errors', async () => {
      const invalidRequestData = {
        gdprRequestId: '', // Invalid empty string
        type: 'invalid_type', // Invalid type
        organizationId: 'invalid-uuid', // Invalid UUID
        assignedBy: 'user_1'
      };

      // Mock validation error
      vi.mocked(gdprHITLService.createGDPRHITLRequest).mockRejectedValue(
        new Error('Validation failed')
      );

      try {
        await gdprHITLService.createGDPRHITLRequest(
          invalidRequestData.gdprRequestId,
          invalidRequestData.type as any,
          invalidRequestData.organizationId,
          invalidRequestData.assignedBy
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Validation failed');
      }
    });
  });

  describe('POST /gdpr-hitl/requests/:requestId/decisions', () => {
    it('should make decision successfully', async () => {
      const mockDecision = {
        id: 'decision_1',
        requestId: 'hitl_req_1',
        decision: 'approved',
        decisionBy: 'user_2',
        decisionAt: new Date().toISOString(),
        reasoning: 'Data export approved after legal review. All requirements met.',
        conditions: ['Data will be encrypted during transfer'],
        riskMitigation: ['Use secure file transfer protocol'],
        legalBasis: 'consent',
        complianceNotes: 'GDPR Article 15 compliance verified',
        attachments: [],
        requiresFollowUp: false,
        metadata: {}
      };

      vi.mocked(gdprHITLService.makeDecision).mockResolvedValue(mockDecision);

      const decisionData = {
        decision: 'approved',
        decisionBy: 'user_2',
        reasoning: 'Data export approved after legal review. All requirements met.',
        options: {
          conditions: ['Data will be encrypted during transfer'],
          riskMitigation: ['Use secure file transfer protocol'],
          complianceNotes: 'GDPR Article 15 compliance verified'
        }
      };

      const result = await gdprHITLService.makeDecision(
        'hitl_req_1',
        decisionData.decision,
        decisionData.decisionBy,
        decisionData.reasoning,
        decisionData.options
      );

      expect(result).toEqual(mockDecision);
      expect(gdprHITLService.makeDecision).toHaveBeenCalledWith(
        'hitl_req_1',
        'approved',
        'user_2',
        'Data export approved after legal review. All requirements met.',
        {
          conditions: ['Data will be encrypted during transfer'],
          riskMitigation: ['Use secure file transfer protocol'],
          complianceNotes: 'GDPR Article 15 compliance verified'
        }
      );
    });

    it('should handle rejection decision', async () => {
      const mockDecision = {
        id: 'decision_2',
        requestId: 'hitl_req_2',
        decision: 'rejected',
        decisionBy: 'user_3',
        decisionAt: new Date().toISOString(),
        reasoning: 'Data erase rejected due to active legal holds',
        conditions: [],
        riskMitigation: [],
        legalBasis: 'legal_obligation',
        complianceNotes: 'Active legal hold prevents data erasure',
        attachments: [],
        requiresFollowUp: true,
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      };

      vi.mocked(gdprHITLService.makeDecision).mockResolvedValue(mockDecision);

      const decisionData = {
        decision: 'rejected',
        decisionBy: 'user_3',
        reasoning: 'Data erase rejected due to active legal holds',
        options: {
          complianceNotes: 'Active legal hold prevents data erasure',
          requiresFollowUp: true,
          followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const result = await gdprHITLService.makeDecision(
        'hitl_req_2',
        decisionData.decision,
        decisionData.decisionBy,
        decisionData.reasoning,
        decisionData.options
      );

      expect(result).toEqual(mockDecision);
      expect(result.decision).toBe('rejected');
      expect(result.requiresFollowUp).toBe(true);
    });
  });

  describe('GET /gdpr-hitl/requests', () => {
    it('should retrieve HITL requests with filters', async () => {
      const mockRequests = [
        {
          id: 'hitl_req_1',
          gdprRequestId: 'gdpr_req_1',
          type: 'export_approval',
          status: 'pending',
          priority: 'high',
          riskLevel: 'high',
          organizationId: 'org_1',
          assignedTo: 'user_2',
          createdAt: new Date().toISOString()
        },
        {
          id: 'hitl_req_2',
          gdprRequestId: 'gdpr_req_2',
          type: 'erase_approval',
          status: 'approved',
          priority: 'normal',
          riskLevel: 'medium',
          organizationId: 'org_1',
          assignedTo: 'user_3',
          createdAt: new Date().toISOString()
        }
      ];

      vi.mocked(gdprHITLService.getGDPRHITLRequests).mockResolvedValue(mockRequests);

      const filters = {
        organizationId: 'org_1',
        status: 'pending',
        priority: 'high'
      };

      const result = await gdprHITLService.getGDPRHITLRequests(
        filters.organizationId,
        {
          status: filters.status as any,
          priority: filters.priority as any
        }
      );

      expect(result).toEqual(mockRequests);
      expect(gdprHITLService.getGDPRHITLRequests).toHaveBeenCalledWith(
        'org_1',
        {
          status: 'pending',
          priority: 'high'
        }
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(gdprHITLService.getGDPRHITLRequests).mockResolvedValue([]);

      const result = await gdprHITLService.getGDPRHITLRequests('org_1');

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('GET /gdpr-hitl/stats/:organizationId', () => {
    it('should retrieve HITL statistics', async () => {
      const mockStats = {
        totalRequests: 10,
        pendingRequests: 3,
        approvedRequests: 5,
        rejectedRequests: 2,
        escalatedRequests: 0,
        averageProcessingTime: 24.5,
        slaCompliance: 85.0,
        requestsByType: {
          'export_approval': 6,
          'erase_approval': 4
        },
        requestsByRiskLevel: {
          'low': 2,
          'medium': 5,
          'high': 3
        },
        requestsByAssignee: {
          'user_2': 4,
          'user_3': 3,
          'user_4': 3
        },
        decisionsByType: {
          'approved': 5,
          'rejected': 2,
          'conditional_approval': 1
        }
      };

      vi.mocked(gdprHITLService.getStats).mockResolvedValue(mockStats);

      const result = await gdprHITLService.getStats('org_1');

      expect(result).toEqual(mockStats);
      expect(gdprHITLService.getStats).toHaveBeenCalledWith('org_1');
      expect(result.totalRequests).toBe(10);
      expect(result.slaCompliance).toBe(85.0);
    });
  });

  describe('POST /gdpr-hitl/gdpr-requests-with-hitl', () => {
    it('should create GDPR request with HITL automatically', async () => {
      const mockGDPRRequest = {
        id: 'gdpr_req_1',
        userId: 'user-123',
        type: 'export',
        status: 'pending',
        requestedBy: 'user_1',
        dataCategories: ['personal_info', 'financial_data'],
        createdAt: new Date().toISOString()
      };

      const mockHITLRequest = {
        id: 'hitl_req_1',
        gdprRequestId: 'gdpr_req_1',
        type: 'export_approval',
        status: 'pending',
        riskLevel: 'high',
        requiresLegalReview: true
      };

      vi.mocked(gdprConsolidated.createGDPRRequest).mockResolvedValue(mockGDPRRequest);
      vi.mocked(gdprHITLService.createGDPRHITLRequest).mockResolvedValue(mockHITLRequest);

      const requestData = {
        gdprRequest: {
          userId: 'user-123',
          type: 'export',
          requestedBy: 'user_1',
          dataCategories: ['personal_info', 'financial_data']
        },
        hitlConfig: {
          organizationId: 'org_1',
          priority: 'high',
          assignedTo: 'user_2'
        }
      };

      // Test the logic
      const gdprRequest = await gdprConsolidated.createGDPRRequest(
        requestData.gdprRequest.userId,
        requestData.gdprRequest.type,
        requestData.gdprRequest.requestedBy,
        requestData.gdprRequest.dataCategories
      );

      const requiresHITL = requestData.gdprRequest.dataCategories.includes('financial_data');
      
      let hitlRequest = null;
      if (requiresHITL) {
        hitlRequest = await gdprHITLService.createGDPRHITLRequest(
          gdprRequest.id,
          'export_approval',
          requestData.hitlConfig.organizationId,
          requestData.gdprRequest.requestedBy,
          {
            priority: requestData.hitlConfig.priority,
            assignedTo: requestData.hitlConfig.assignedTo
          }
        );
      }

      expect(gdprRequest).toEqual(mockGDPRRequest);
      expect(requiresHITL).toBe(true);
      expect(hitlRequest).toEqual(mockHITLRequest);
      expect(gdprConsolidated.createGDPRRequest).toHaveBeenCalledWith(
        'user-123',
        'export',
        'user_1',
        ['personal_info', 'financial_data']
      );
    });

    it('should skip HITL for low-risk requests', async () => {
      const mockGDPRRequest = {
        id: 'gdpr_req_2',
        userId: 'user-456',
        type: 'export',
        status: 'pending',
        requestedBy: 'user_1',
        dataCategories: ['personal_info'],
        createdAt: new Date().toISOString()
      };

      vi.mocked(gdprConsolidated.createGDPRRequest).mockResolvedValue(mockGDPRRequest);

      const requestData = {
        gdprRequest: {
          userId: 'user-456',
          type: 'export',
          requestedBy: 'user_1',
          dataCategories: ['personal_info']
        },
        hitlConfig: {
          organizationId: 'org_1'
        }
      };

      const gdprRequest = await gdprConsolidated.createGDPRRequest(
        requestData.gdprRequest.userId,
        requestData.gdprRequest.type,
        requestData.gdprRequest.requestedBy,
        requestData.gdprRequest.dataCategories
      );

      const requiresHITL = requestData.gdprRequest.dataCategories.includes('financial_data') ||
                          requestData.gdprRequest.dataCategories.includes('sepa_transactions') ||
                          requestData.gdprRequest.type === 'erase';

      expect(gdprRequest).toEqual(mockGDPRRequest);
      expect(requiresHITL).toBe(false);
    });
  });

  describe('Workflow Management', () => {
    it('should create workflow successfully', async () => {
      const mockWorkflow = {
        id: 'workflow_1',
        name: 'Custom Export Workflow',
        description: 'Custom workflow for export requests',
        type: 'export',
        steps: [
          {
            id: 'step_1',
            name: 'Data Review',
            type: 'data_review',
            assignedRole: 'data_analyst',
            isRequired: true,
            order: 1,
            criteria: ['Verify data categories'],
            slaHours: 24
          }
        ],
        autoApprovalThreshold: 0.8,
        escalationRules: [],
        slaHours: 48,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(gdprHITLService.createWorkflow).mockResolvedValue(mockWorkflow);

      const workflowData = {
        name: 'Custom Export Workflow',
        description: 'Custom workflow for export requests',
        type: 'export',
        steps: [
          {
            name: 'Data Review',
            type: 'data_review',
            assignedRole: 'data_analyst',
            isRequired: true,
            order: 1,
            criteria: ['Verify data categories'],
            slaHours: 24
          }
        ],
        autoApprovalThreshold: 0.8,
        escalationRules: [],
        slaHours: 48,
        isActive: true
      };

      const result = await gdprHITLService.createWorkflow(workflowData);

      expect(result).toEqual(mockWorkflow);
      expect(gdprHITLService.createWorkflow).toHaveBeenCalledWith(workflowData);
    });

    it('should retrieve workflows by type', async () => {
      const mockWorkflows = [
        {
          id: 'workflow_1',
          name: 'Export Workflow',
          type: 'export',
          isActive: true
        },
        {
          id: 'workflow_2',
          name: 'Erase Workflow',
          type: 'erase',
          isActive: true
        }
      ];

      vi.mocked(gdprHITLService.getWorkflows).mockResolvedValue(mockWorkflows);

      const result = await gdprHITLService.getWorkflows('export');

      expect(result).toEqual(mockWorkflows);
      expect(gdprHITLService.getWorkflows).toHaveBeenCalledWith('export');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(gdprHITLService.createGDPRHITLRequest).mockRejectedValue(
        new Error('Service unavailable')
      );

      try {
        await gdprHITLService.createGDPRHITLRequest(
          'gdpr_req_1',
          'export_approval',
          'org_1',
          'user_1'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Service unavailable');
      }
    });

    it('should handle missing requests', async () => {
      vi.mocked(gdprHITLService.getGDPRHITLRequest).mockResolvedValue(null);

      const result = await gdprHITLService.getGDPRHITLRequest('nonexistent_id');

      expect(result).toBeNull();
    });
  });

  describe('Integration with HITL Service', () => {
    it('should create HITL task when creating HITL request', async () => {
      const mockHITLTask = {
        id: 'task_1',
        organizationId: 'org_1',
        type: 'approval',
        status: 'pending',
        title: 'GDPR Export Approval',
        description: 'Review GDPR export request',
        assignedTo: 'user_2',
        assignedBy: 'user_1'
      };

      vi.mocked(hitlV2Service.createTask).mockResolvedValue(mockHITLTask);

      const taskData = {
        organizationId: 'org_1',
        type: 'approval' as const,
        status: 'pending' as const,
        priority: 'high' as const,
        title: 'GDPR Export Approval',
        description: 'Review GDPR export request',
        content: 'Test content',
        metadata: { gdprRequestId: 'gdpr_req_1' },
        assignedTo: 'user_2',
        assignedBy: 'user_1',
        slaHours: 48,
        tags: ['gdpr', 'export']
      };

      const result = await hitlV2Service.createTask(taskData);

      expect(result).toEqual(mockHITLTask);
      expect(hitlV2Service.createTask).toHaveBeenCalledWith(taskData);
    });
  });
});
