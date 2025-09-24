import React, { useState } from 'react';
import { AuthProvider, LoginButton } from '../lib/auth.msal';
import { invokeAgent } from '../lib/econeura-gw';

export default function EconeuraUI() {
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvokeAgent = async () => {
    if (!message.trim()) {
      alert('Por favor ingresa un mensaje para el agente');
      return;
    }

    setIsLoading(true);
    try {
      const result = await invokeAgent({
        agentId: 'general-assistant',
        message: message.trim(),
        context: {
          source: 'econeura-ui',
          timestamp: new Date().toISOString(),
        },
      });

      setAgentResponse(result.response);
    } catch (error) {
      console.error('Error invoking agent:', error);
      setAgentResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header con autenticación */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">ECONEURA IA</h1>
                <span className="ml-2 text-sm text-gray-500">Centro de Mando IA</span>
              </div>
              <LoginButton />
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Interacción con Agentes IA
              </h2>

              {/* Formulario para enviar mensajes al agente */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Mensaje para el Agente
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Escribe tu consulta o instrucción para el agente IA..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleInvokeAgent}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Procesando...' : 'Enviar al Agente'}
                </button>
              </div>

              {/* Respuesta del agente */}
              {agentResponse && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">
                    Respuesta del Agente
                  </h3>
                  <div className="bg-gray-50 border rounded-md p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {agentResponse}
                    </pre>
                  </div>
                </div>
              )}

              {/* Información del sistema */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Estado del Sistema
                </h3>
                <div className="text-sm text-gray-600">
                  <p>• Autenticación MSAL: Configurada</p>
                  <p>• Gateway de Agentes: Conectado</p>
                  <p>• Tokens Bearer: Automáticos</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}