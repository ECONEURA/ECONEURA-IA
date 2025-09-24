import React, { useState } from 'react';
import { AuthProvider, LoginButton, useAuth } from '../lib/auth.msal';
import { invokeAgent } from '../lib/econeura-gw';

function EconeuraUIContent() {
  const { isAuthenticated, user } = useAuth();
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleInvokeAgent = async () => {
    if (!message.trim()) {
      setError('Por favor ingresa un mensaje para el agente');
      return;
    }

    if (!isAuthenticated) {
      setError('Debes iniciar sesión para usar los agentes IA');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAgentResponse('');

    try {
      const result = await invokeAgent({
        agentId: 'general-assistant',
        message: message.trim(),
        context: {
          source: 'econeura-ui',
          timestamp: new Date().toISOString(),
          user: user?.name || user?.username || 'anonymous',
        },
      });

      setAgentResponse(result.response);
    } catch (error) {
      console.error('Error invoking agent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al invocar el agente';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
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
          {/* Estado de autenticación */}
          {!isAuthenticated && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Inicia sesión con tu cuenta Microsoft para acceder a los agentes IA.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={clearError}
                      className="inline-flex bg-red-50 rounded-md p-1.5 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                    >
                      <span className="sr-only">Cerrar</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Escribe tu consulta o instrucción para el agente IA..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading || !isAuthenticated}
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleInvokeAgent}
                  disabled={isLoading || !isAuthenticated}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    'Enviar al Agente'
                  )}
                </button>

                {isAuthenticated && (
                  <span className="text-sm text-gray-500">
                    Conectado como: {user?.name || user?.username}
                  </span>
                )}
              </div>
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
              <div className="text-sm text-gray-600 space-y-1">
                <p className={`flex items-center ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  Autenticación MSAL: {isAuthenticated ? 'Conectado' : 'Desconectado'}
                </p>
                <p className="flex items-center text-blue-600">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-blue-400"></span>
                  Gateway de Agentes: Configurado
                </p>
                <p className="flex items-center text-purple-600">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-purple-400"></span>
                  Tokens Bearer: Automáticos
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EconeuraUI() {
  return (
    <AuthProvider>
      <EconeuraUIContent />
    </AuthProvider>
  );
}