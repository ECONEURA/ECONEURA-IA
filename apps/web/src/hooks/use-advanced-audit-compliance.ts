import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance: {
    gdpr: boolean;
    sox: boolean;
    pci: boolean;
    hipaa: boolean;
    iso27001: boolean;
  };
  riskScore: number;
  tags: string[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  framework: 'gdpr' | 'sox' | 'pci' | 'hipaa' | 'iso27001';
  conditions: {
    action?: string[];
    resource?: string[];
    severity?: string[];
    timeWindow?: number;
    threshold?: number;
  };
  actions: {
    alert: boolean;
    block: boolean;
    notify: string[];
    escalate: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  eventId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  filters: {
    actions?: string[];
    resources?: string[];
    severities?: string[];
    frameworks?: string[];
  };
  metrics: {
    totalEvents: number;
    violations: number;
    riskScore: number;
    complianceScore: number;
    topActions: Array<{ action: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    severityDistribution: Record<string, number>;
    frameworkCompliance: Record<string, number>;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface ComplianceMetrics {
  totalEvents: number;
  totalViolations: number;
  openViolations: number;
  complianceScore: number;
  riskScore: number;
  frameworkCompliance: Record<string, number>;
  recentViolations: ComplianceViolation[];
}

// Hooks
export function useAuditEvents(filters?: {
  organizationId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['audit-events', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.set(key, value.toString());
        });
      }
      
      const response = await fetch(`/api/advanced-audit-compliance/events?${params}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  });
}

export function useLogAuditEvent() {
  return useMutation({
    mutationFn: async (eventData: Omit<AuditEvent, 'id' | 'timestamp'>) => {
      const response = await fetch('/api/advanced-audit-compliance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.event as AuditEvent;
    },
    onSuccess: () => {
      toast.success('Audit event logged successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to log audit event');
    },
  });
}

export function useComplianceRules() {
  return useQuery({
    queryKey: ['compliance-rules'],
    queryFn: async () => {
      const response = await fetch('/api/advanced-audit-compliance/rules');
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.rules as ComplianceRule[];
    },
  });
}

export function useCreateComplianceRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ruleData: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/advanced-audit-compliance/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.rule as ComplianceRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-rules'] });
      toast.success('Compliance rule created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create compliance rule');
    },
  });
}

export function useComplianceViolations(filters?: {
  organizationId?: string;
  status?: string;
  severity?: string;
  ruleId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['compliance-violations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.set(key, value.toString());
        });
      }
      
      const response = await fetch(`/api/advanced-audit-compliance/violations?${params}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  });
}

export function useUpdateViolationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      violationId, 
      status, 
      resolution, 
      assignedTo 
    }: { 
      violationId: string; 
      status: string; 
      resolution?: string; 
      assignedTo?: string; 
    }) => {
      const response = await fetch(`/api/advanced-audit-compliance/violations/${violationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution, assignedTo }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.violation as ComplianceViolation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      toast.success('Violation status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update violation status');
    },
  });
}

export function useGenerateAuditReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reportData: {
      name: string;
      description?: string;
      organizationId: string;
      period: { start: string; end: string };
      filters?: {
        actions?: string[];
        resources?: string[];
        severities?: string[];
        frameworks?: string[];
      };
      generatedBy: string;
    }) => {
      const response = await fetch('/api/advanced-audit-compliance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.report as AuditReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-reports'] });
      toast.success('Audit report generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate audit report');
    },
  });
}

export function useAuditReports(organizationId: string) {
  return useQuery({
    queryKey: ['audit-reports', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/advanced-audit-compliance/reports/${organizationId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.reports as AuditReport[];
    },
    enabled: !!organizationId,
  });
}

export function useComplianceMetrics(organizationId: string) {
  return useQuery({
    queryKey: ['compliance-metrics', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/advanced-audit-compliance/metrics/${organizationId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data.metrics as ComplianceMetrics;
    },
    enabled: !!organizationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAuditComplianceHealth() {
  return useQuery({
    queryKey: ['audit-compliance-health'],
    queryFn: async () => {
      const response = await fetch('/api/advanced-audit-compliance/health');
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
}
