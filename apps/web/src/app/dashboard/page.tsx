'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MetricsCard from '../../components/dashboard/MetricsCard';
import InvoicesTable from '../../components/dashboard/InvoicesTable';
import ActiveFlows from '../../components/dashboard/ActiveFlows';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { cfoApi, mockData, EcoNeuraApiError, type Invoice, type FlowExecution } from '../../lib/api-client';

interface DashboardMetrics {
  dso_days: number;
  emails_drafted: number;
  emails_sent: number;
  ai_cost_month: number;
  success_rate: number;
}

function CFODashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [activeFlows, setActiveFlows] = useState<FlowExecution[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    startFlow: false,
    cancelFlow: false,
  });

  // Load initial dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(prev => ({ ...prev, initial: true }));
      
      // In a real implementation, these would be separate API calls
      // For now, using mock data with some API calls where possible
      
      // Try to load active flows from API
      try {
        const flowsData = await cfoApi.listFlows({
          status: 'running',
          limit: 10,
        });
        setActiveFlows(flowsData.flows);
      } catch (error) {
        console.warn('Failed to load flows from API, using mock data:', error);
        setActiveFlows(mockData.activeFlows);
      }

      // Use mock data for invoices and metrics
      setOverdueInvoices(mockData.overdueInvoices);
      setMetrics(mockData.metrics);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Fallback to mock data
      setOverdueInvoices(mockData.overdueInvoices);
      setActiveFlows(mockData.activeFlows);
      setMetrics(mockData.metrics);
      
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  };

  const handleStartCobroFlow = async (invoiceIds: string[]) => {
    try {
      setLoading(prev => ({ ...prev, startFlow: true }));
      
      // Map invoice IDs to customer IDs (in real app, this would come from invoice data)
      const customerIds = invoiceIds.map(id => `customer-${id}`);
      
      const result = await cfoApi.startCobroFlow(customerIds);
      
      toast.success(
        `Cobro proactivo flow started successfully!`,
        {
          duration: 5000,
          position: 'top-right',
        }
      );

      // Add the new flow to active flows (mock the flow object)
      const newFlow: FlowExecution = {
        id: result.flow_id,
        flow_type: 'cobro_proactivo',
        status: 'running',
        input_data: {
          customer_ids: customerIds,
          escalation_level: 1,
          invoice_ids: invoiceIds,
        },
        output_data: {},
        steps_completed: ['initiated'],
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        corr_id: result.corr_id,
      };

      setActiveFlows(prev => [newFlow, ...prev]);
      setSelectedInvoices([]);
      
      // Refresh flows after a delay to get updated status
      setTimeout(() => {
        loadActiveFlows();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start cobro flow:', error);
      
      if (error instanceof EcoNeuraApiError) {
        if (error.isValidationError) {
          toast.error('Invalid request data');
        } else if (error.isRateLimited) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else {
          toast.error(`Failed to start flow: ${error.message}`);
        }
      } else {
        toast.error('Failed to start cobro proactivo flow');
      }
    } finally {
      setLoading(prev => ({ ...prev, startFlow: false }));
    }
  };

  const handleCancelFlow = async (flowId: string) => {
    try {
      setLoading(prev => ({ ...prev, cancelFlow: true }));
      
      await cfoApi.cancelFlow(flowId);
      
      toast.success('Flow cancelled successfully');
      
      // Update flow status locally
      setActiveFlows(prev =>
        prev.map(flow =>
          flow.id === flowId
            ? { ...flow, status: 'cancelled' as const }
            : flow
        )
      );
      
    } catch (error) {
      console.error('Failed to cancel flow:', error);
      toast.error('Failed to cancel flow');
    } finally {
      setLoading(prev => ({ ...prev, cancelFlow: false }));
    }
  };

  const loadActiveFlows = async () => {
    try {
      const flowsData = await cfoApi.listFlows({
        status: 'running',
        limit: 10,
      });
      setActiveFlows(flowsData.flows);
    } catch (error) {
      console.warn('Failed to refresh flows:', error);
    }
  };

  if (loading.initial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CFO Dashboard</h1>
              <p className="text-gray-600">Monitor collections and AI-driven cobro proactivo</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={loadDashboardData}
                className="btn-outline"
                disabled={loading.initial}
              >
                {loading.initial ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricsCard
            title="DSO (Days Sales Outstanding)"
            value={metrics?.dso_days || 0}
            subtitle="Target: <30 days"
            trend={{
              value: -8.2,
              label: 'vs last month',
              direction: 'down',
            }}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          
          <MetricsCard
            title="Emails Drafted"
            value={metrics?.emails_drafted || 0}
            subtitle="This month"
            trend={{
              value: 12.5,
              label: 'vs last month',
              direction: 'up',
            }}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          
          <MetricsCard
            title="Emails Sent"
            value={metrics?.emails_sent || 0}
            subtitle="This month"
            trend={{
              value: 8.7,
              label: 'vs last month',
              direction: 'up',
            }}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          />
          
          <MetricsCard
            title="AI Cost"
            value={`€${metrics?.ai_cost_month?.toFixed(2) || '0.00'}`}
            subtitle="This month"
            trend={{
              value: 15.3,
              label: 'vs last month',
              direction: 'up',
            }}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />
          
          <MetricsCard
            title="Success Rate"
            value={`${metrics?.success_rate?.toFixed(1) || '0.0'}%`}
            subtitle="Collection rate"
            trend={{
              value: 3.2,
              label: 'vs last month',
              direction: 'up',
            }}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overdue Invoices */}
          <div className="lg:col-span-1">
            <InvoicesTable
              invoices={overdueInvoices}
              onStartCobro={handleStartCobroFlow}
              loading={loading.startFlow}
              selectedIds={selectedInvoices}
              onSelectionChange={setSelectedInvoices}
            />
          </div>

          {/* Active Flows */}
          <div className="lg:col-span-1">
            <ActiveFlows
              flows={activeFlows}
              onCancelFlow={handleCancelFlow}
              loading={loading.cancelFlow}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermission="dashboard:view">
      <CFODashboard />
    </ProtectedRoute>
  );
}