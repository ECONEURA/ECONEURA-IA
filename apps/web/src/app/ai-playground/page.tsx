import { Metadata } from 'next';
import { AIChatPlayground } from '../../components/ai/AIChatPlayground';

export const metadata: Metadata = {
  title: 'AI Playground - ECONEURA',
  description: 'Test AI Router functionality with real-time cost monitoring',
};

export default function AIPlaygroundPage() {
  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow h-full">
          <AIChatPlayground />
        </div>
      </div>
    </div>
  );
}