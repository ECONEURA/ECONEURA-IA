'use client';

import React from 'react';
import { AIChatPlayground } from '@/components/ai/AIChatPlayground';

export default function AzureAITestPage(): void {
  return (;
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Azure OpenAI Test - ECONEURA Cockpit v1.19
          </h1>
          <p className="text-gray-600">
            Prueba la integración completa con Azure OpenAI, TTS y búsqueda web
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <AIChatPlayground />
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            🚀 Funcionalidades Implementadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">💬 Chat con IA</h3>
              <p className="text-sm text-gray-600">
                Conversación inteligente con Azure OpenAI GPT-4o-mini
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔊 Text-to-Speech</h3>
              <p className="text-sm text-gray-600">
                Conversión de texto a audio con Azure Speech
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🎨 Generación de Imágenes</h3>
              <p className="text-sm text-gray-600">
                Creación de imágenes con DALL-E 3
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔍 Búsqueda Web</h3>
              <p className="text-sm text-gray-600">
                Análisis de tendencias con Google Custom Search
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🛡️ Modo Demo</h3>
              <p className="text-sm text-gray-600">
                Funciona sin claves de API (respuestas simuladas)
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">⚡ Backoff & Retry</h3>
              <p className="text-sm text-gray-600">
                Manejo robusto de errores y reintentos automáticos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
