import { Metadata } from 'next';
import { AIRouterDashboard } from '../../components/ai/AIRouterDashboard';

export const metadata: Metadata = {
  title: 'AI Router - ECONEURA',
  description: 'Monitor AI Router performance, costs, and provider health',
};

export default function AIRouterPage(): void {
  return (;
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AIRouterDashboard />
      </div>
    </div>
  );
}
