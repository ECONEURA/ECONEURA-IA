'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// INTERFACES
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    sentiment?: SentimentAnalysis;
    functionCall?: FunctionCall;
  };
}

interface ChatSession {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens: number;
    totalCost: number;
    messageCount: number;
    averageSentiment: SentimentAnalysis;
  };
}

interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
  isAvailable: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AIChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [availableFunctions, setAvailableFunctions] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    loadSessions();
    loadModels();
    loadFunctions();
  }, []);

  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
      setSelectedModel(currentSession.model);
      loadSessionStats(currentSession.id);
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/ai-chat/sessions?userId=demo-user&orgId=demo-org');
      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const loadModels = async () => {
    try {
      const response = await fetch('/api/ai-chat/models');
      if (response.ok) {
        const modelsData = await response.json();
        setAvailableModels(modelsData);
      }
    } catch (err) {
      console.error('Error loading models:', err);
    }
  };

  const loadFunctions = async () => {
    try {
      const response = await fetch('/api/ai-chat/functions');
      if (response.ok) {
        const functionsData = await response.json();
        setAvailableFunctions(functionsData);
      }
    } catch (err) {
      console.error('Error loading functions:', err);
    }
  };

  const loadSessionStats = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-chat/sessions/${sessionId}/stats`);
      if (response.ok) {
        const statsData = await response.json();
        setSessionStats(statsData);
      }
    } catch (err) {
      console.error('Error loading session stats:', err);
    }
  };

  // ============================================================================
  // FUNCIONES DE CHAT
  // ============================================================================

  const createNewSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user',
          orgId: 'demo-org',
          title: 'New Chat',
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setMessages([]);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err) {
      setError('Failed to create new session');
      console.error('Error creating session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    try {
      setIsLoading(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: inputMessage,
        timestamp: new Date(),
      };

      // Agregar mensaje del usuario inmediatamente
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');

      const response = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: inputMessage,
          model: selectedModel,
          temperature,
          maxTokens,
          functions: selectedFunctions,
          userId: 'demo-user',
          orgId: 'demo-org',
        }),
      });

      if (response.ok) {
        const chatResponse = await response.json();
        
        // Agregar respuesta del asistente
        setMessages(prev => [...prev, chatResponse.message]);
        
        // Actualizar sesión
        if (currentSession) {
          const updatedSession = { ...currentSession, messages: [...messages, userMessage, chatResponse.message] };
          setCurrentSession(updatedSession);
          setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(cost);
  };

  const getSentimentColor = (sentiment: SentimentAnalysis) => {
    if (sentiment.label === 'positive') return 'text-green-600';
    if (sentiment.label === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'assistant': return 'bg-green-100 text-green-800';
      case 'function': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Sesiones */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">AI Chat Sessions</h2>
          <Button 
            onClick={createNewSession} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating...' : 'New Chat'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No sessions yet. Create your first chat!
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => selectSession(session)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{session.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(session.updatedAt)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {session.model}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {session.metadata?.messageCount || 0} messages
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-semibold">{currentSession.title}</h1>
                  <p className="text-sm text-gray-500">
                    Model: {currentSession.model} • 
                    Messages: {currentSession.metadata?.messageCount || 0} • 
                    Cost: {formatCost(currentSession.metadata?.totalCost || 0)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Start a conversation by typing a message below.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRoleColor(message.role)}>
                          {message.role}
                        </Badge>
                        {message.metadata?.model && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.model}
                          </Badge>
                        )}
                        <span className="text-xs opacity-70">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.metadata && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {message.metadata.tokens && (
                              <span>Tokens: {message.metadata.tokens}</span>
                            )}
                            {message.metadata.cost && (
                              <span>Cost: {formatCost(message.metadata.cost)}</span>
                            )}
                            {message.metadata.sentiment && (
                              <span className={getSentimentColor(message.metadata.sentiment)}>
                                Sentiment: {message.metadata.sentiment.label}
                              </span>
                            )}
                          </div>
                          
                          {message.metadata.functionCall && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <div className="font-medium">Function Call:</div>
                              <div>{message.metadata.functionCall.name}</div>
                              {message.metadata.functionCall.result && (
                                <div className="mt-1">
                                  <div className="font-medium">Result:</div>
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(message.metadata.functionCall.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Temperature:</label>
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Max Tokens:</label>
                    <Input
                      type="number"
                      min="1"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-24"
                    />
                  </div>
                </div>

                {/* Functions */}
                {availableFunctions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Functions:</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableFunctions.map((func) => (
                        <Button
                          key={func.name}
                          variant={selectedFunctions.includes(func.name) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedFunctions(prev =>
                              prev.includes(func.name)
                                ? prev.filter(f => f !== func.name)
                                : [...prev, func.name]
                            );
                          }}
                        >
                          {func.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 min-h-[60px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-6"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </Button>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                Welcome to AI Chat
              </h2>
              <p className="text-gray-500 mb-6">
                Select a session or create a new one to start chatting with AI.
              </p>
              <Button onClick={createNewSession} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Start New Chat'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Sidebar */}
      {currentSession && sessionStats && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4">Session Statistics</h3>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages:</span>
                  <span className="font-medium">{sessionStats.messageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Tokens:</span>
                  <span className="font-medium">{sessionStats.totalTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost:</span>
                  <span className="font-medium">{formatCost(sessionStats.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {Math.round(sessionStats.duration / 1000 / 60)}m
                  </span>
                </div>
              </CardContent>
            </Card>

            {sessionStats.averageSentiment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall:</span>
                    <span className={`font-medium ${getSentimentColor(sessionStats.averageSentiment)}`}>
                      {sessionStats.averageSentiment.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="font-medium">
                      {(sessionStats.averageSentiment.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Joy</span>
                      <span>{(sessionStats.averageSentiment.emotions.joy * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={sessionStats.averageSentiment.emotions.joy * 100} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
