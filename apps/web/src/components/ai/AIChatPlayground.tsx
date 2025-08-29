'use client';

import React, { useState, useCallback } from 'react';
import { 
  Send,
  Cpu,
  Clock,
  BarChart3,
  AlertTriangle,
  Volume2,
  Image,
  Search,
  Brain
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { iaText, iaTTS, iaImage, webSearch } from '@/lib/ia';
import { intelligentCache } from '@/lib/cache';
import { PromptTemplates } from './PromptTemplates';

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
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [options, setOptions] = useState<AIRequestOptions>({
    taskType: 'summarize',
    sensitivity: 'internal',
    priority: 'medium',
    preferEdge: true,
    maxCostEur: 0.1,
    temperature: 0.7,
    maxTokens: 1000,
  });

  const handleSend = useCallback(async () => {
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
      const history = messages
        .slice(-8)
        .filter((i) => typeof i.content === "string")
        .map((i) => ({ 
          role: (i.role === "user" ? "user" : "model") as "user" | "model", 
          text: i.content as string 
        }));

      const systemInstruction = `Eres ECONEURA, asistente de IA empresarial. Sé conciso y proactivo. Da respuestas accionables y en tono profesional.`;

      const responseText = await iaText({
        prompt: input,
        system: systemInstruction,
        history,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        metadata: {
          provider: 'Azure OpenAI',
          model: 'gpt-4o-mini',
          latency: 0,
          costEur: 0,
          tokensIn: 0,
          tokensOut: 0,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Respuesta de Azure OpenAI');
    } catch (error: any) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: 'system',
        content: `Error: ${error.message || "Modo demo: configura claves de Azure OpenAI"}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Error en la comunicación con IA');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // TTS Function
  const onPlayAudio = useCallback(async (text: string) => {
    if (isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      const b64 = await iaTTS({ text, voice: "es-ES-AlvaroNeural" });
      const url = "data:audio/wav;base64," + b64;
      const audio = new Audio(url);
      await audio.play();
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo generar el audio (demo o error de red)");
    } finally {
      setIsAudioLoading(false);
    }
  }, [isAudioLoading]);

  // Image Generation Function
  const generateImageConcept = useCallback(async () => {
    const prompt = `Concepto visual para una campaña de marketing empresarial. Estilo: ilustración limpia, corporativa, optimista.`;
    const userMessage: ChatMessage = {
      role: 'user',
      content: `Generar un concepto visual empresarial.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsImageLoading(true);
    try {
      const base64Data = await iaImage({ prompt, size: "1024x1024" });
      const src = `data:image/png;base64,${base64Data}`;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `<img src="${src}" alt="Concepto visual generado por IA" className="rounded-lg shadow-md" />`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: ChatMessage = {
        role: 'system',
        content: "No se pudo generar la imagen (demo o error de red)",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsImageLoading(false);
    }
  }, []);

  // Market Trends Analysis Function
  const analyzeMarketTrends = useCallback(async (topic: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: `Analizando tendencias de mercado para: "${topic}"`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      const sources = await webSearch(topic);
      const refs = sources.length
        ? sources.map((s, i) => `(${i + 1}) ${s.title} — ${s.url}\n${s.snippet}`).join("\n\n")
        : "No se encontraron fuentes con el proveedor actual.";

      const system = "Eres un analista de mercado senior. Estructura la respuesta en español con: 1) Resumen ejecutivo, 2) Tendencias clave (viñetas), 3) Players a observar, 4) Outlook. Sé conciso y accionable.";
      const prompt = `Tema: ${topic}\n\nFuentes:\n${refs}\n\nInstrucción: sintetiza en 200-300 palabras, citando [1], [2], etc. al final de puntos relevantes.`;

      const text = await iaText({ prompt, system });
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: ChatMessage = {
        role: 'system',
        content: "No se pudo analizar las tendencias (demo o error de red).",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

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

        <div className="mt-3 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => analyzeMarketTrends("tecnología empresarial")}
              disabled={loading}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Search className="h-4 w-4 inline mr-1" />
              Tendencias
            </button>
            <button
              onClick={generateImageConcept}
              disabled={isImageLoading}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <Image className="h-4 w-4 inline mr-1" />
              Imagen
            </button>
          </div>
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
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: message.content }}></div>
              
              {message.metadata && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
                  <div className="flex items-center space-x-4">
                    {message.metadata.provider && (
                      <div className="flex items-center">
                        <Cpu className="h-3 w-3 mr-1" />
                        {message.metadata.provider}
                      </div>
                    )}
                    {message.metadata.latency && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {message.metadata.latency}ms
                      </div>
                    )}
                    {message.metadata.costEur && (
                      <div className="flex items-center">
                        <BarChart3 className="h-3 w-3 mr-1" />
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
              
              {/* Action buttons for assistant messages */}
              {message.role === 'assistant' && typeof message.content === 'string' && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onPlayAudio(message.content)}
                    disabled={isAudioLoading}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Volume2 className="h-3 w-3 inline mr-1" />
                    Escuchar
                  </button>
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
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}