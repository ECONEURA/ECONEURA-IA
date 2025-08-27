'use client';

import React, { useState } from 'react';
import { 
  PaperAirplaneIcon,
  CpuChipIcon,
  ClockIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    latency?: number;
    costEur?: number;
    tokensIn?: number;
    tokensOut?: number;
  };
}

interface AIRequestOptions {
  model?: string;
  taskType: 'draft_email' | 'analyze_invoice' | 'summarize' | 'classify';
  sensitivity: 'public' | 'internal' | 'confidential' | 'pii';
  priority: 'low' | 'medium' | 'high' | 'critical';
  preferEdge: boolean;
  maxCostEur: number;
  temperature?: number;
  maxTokens?: number;
}

export function AIChatPlayground() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'AI Router Chat Playground - Test AI routing capabilities with real-time cost monitoring.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AIRequestOptions>({
    taskType: 'summarize',
    sensitivity: 'internal',
    priority: 'medium',
    preferEdge: true,
    maxCostEur: 0.1,
    temperature: 0.7,
    maxTokens: 1000,
  });

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const requestPayload = {
        content: input,
        task_type: options.taskType,
        sensitivity: options.sensitivity,
        priority: options.priority,
        prefer_edge: options.preferEdge,
        max_cost_eur: options.maxCostEur,
        model: options.model,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        languages: ['en'],
      };

      const response = await fetch('/api/econeura/ai/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.content || 'No response content',
        timestamp: new Date(),
        metadata: {
          provider: data.provider_used,
          model: data.model_used,
          latency: data.latency_ms,
          costEur: data.cost_cents ? data.cost_cents / 100 : undefined,
          tokensIn: data.tokens_in,
          tokensOut: data.tokens_out,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success toast with routing info
      if (data.provider_used) {
        toast.success(`Response from ${data.provider_used} (${data.latency_ms}ms)`, {
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('AI request failed:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'system',
        content: 'AI Router Chat Playground - Test AI routing capabilities with real-time cost monitoring.',
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Options Panel */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Request Options</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Type</label>
            <select
              value={options.taskType}
              onChange={(e) => setOptions(prev => ({ ...prev, taskType: e.target.value as any }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="summarize">Summarize</option>
              <option value="draft_email">Draft Email</option>
              <option value="analyze_invoice">Analyze Invoice</option>
              <option value="classify">Classify</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sensitivity</label>
            <select
              value={options.sensitivity}
              onChange={(e) => setOptions(prev => ({ ...prev, sensitivity: e.target.value as any }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="pii">PII</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={options.priority}
              onChange={(e) => setOptions(prev => ({ ...prev, priority: e.target.value as any }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Cost (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="10"
              value={options.maxCostEur}
              onChange={(e) => setOptions(prev => ({ ...prev, maxCostEur: parseFloat(e.target.value) || 0.1 }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Temperature</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={options.temperature}
              onChange={(e) => setOptions(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="flex items-center mt-6">
              <input
                type="checkbox"
                checked={options.preferEdge}
                onChange={(e) => setOptions(prev => ({ ...prev, preferEdge: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Prefer Edge</span>
            </label>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              
              {message.metadata && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
                  <div className="flex items-center space-x-4">
                    {message.metadata.provider && (
                      <div className="flex items-center">
                        <CpuChipIcon className="h-3 w-3 mr-1" />
                        {message.metadata.provider}
                      </div>
                    )}
                    {message.metadata.latency && (
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {message.metadata.latency}ms
                      </div>
                    )}
                    {message.metadata.costEur && (
                      <div className="flex items-center">
                        <CurrencyEuroIcon className="h-3 w-3 mr-1" />
                        €{message.metadata.costEur.toFixed(4)}
                      </div>
                    )}
                  </div>
                  {(message.metadata.tokensIn || message.metadata.tokensOut) && (
                    <div className="text-gray-500">
                      Tokens: {message.metadata.tokensIn || 0} → {message.metadata.tokensOut || 0}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-1 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow px-4 py-2 rounded-lg">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 resize-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}