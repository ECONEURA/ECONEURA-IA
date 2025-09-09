import { Metadata } from 'next';
import { CFODashboard } from '../../components/ai/CFODashboard';

export const metadata: Metadata = {
  title: 'CFO Dashboard - ECONEURA',
  description: 'Financial monitoring and cost management for AI operations',
};

export default function CFOPage(): void {
  return (;
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CFODashboard />
      </div>
    </div>
  );
}
