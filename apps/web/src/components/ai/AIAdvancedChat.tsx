'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Settings, 
  BarChart3,
  Tag,
  Clock,
  TrendingUp,
  Brain,
  Lightbulb,
  Filter,
  Search,
  Plus,
  Archive,
  Trash2,
  Edit,
  Eye,
  MoreVertical
} from 'lucide-react';

// ============================================================================
// AI ADVANCED CHAT COMPONENT - PR-35
// ============================================================================

interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    provider?: string;
    model?: string;
    latency?: number;
    costEur?: number;
    tokensIn?: number;
    tokensOut?: number;
    confidence?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
    intent?: string;
    entities?: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
  };
}

interface Conversation {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
  context: {
    domain?: string;
    intent?: string;
    entities?: Record<string, any>;
    preferences?: Record<string, any>;
    sessionData?: Record<string, any>;
  };
  summary?: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSession {
  id: string;
  conversationId: string;
  userId: string;
  organizationId: string;
  context: {
    currentTopic?: string;
    userPreferences?: Record<string, any>;
    conversationHistory?: ChatMessage[];
    activeEntities?: Record<string, any>;
    sessionVariables?: Record<string, any>;
  };
  isActive: boolean;
  lastActivityAt: string;
  createdAt: string;
}

interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  intent: string;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  topics: string[];
  confidence: number;
  suggestions: string[];
}

interface ChatStatistics {
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  averageMessagesPerConversation: number;
  topIntents: Array<{ intent: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  sentimentDistribution: Record<string, number>;
  averageResponseTime: number;
  totalCost: number;
}

interface AIAdvancedChatProps {
  className?: string;
  refreshInterval?: number;
}

export default function AIAdvancedChat({
  className = "",
  refreshInterval = 30000
}: AIAdvancedChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [statistics, setStatistics] = useState<ChatStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'conversations' | 'chat' | 'analytics' | 'sessions'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [conversationsRes, sessionsRes, statisticsRes] = await Promise.all([
        fetch('/api/ai-chat-advanced/conversations?organizationId=demo-org-1'),
        fetch('/api/ai-chat-advanced/sessions?organizationId=demo-org-1'),
        fetch('/api/ai-chat-advanced/statistics?organizationId=demo-org-1')
      ]);

      const [conversationsData, sessionsData, statisticsData] = await Promise.all([
        conversationsRes.json(),
        sessionsRes.json(),
        statisticsRes.json()
      ]);

      if (conversationsData.success) setConversations(conversationsData.data.conversations || []);
      if (sessionsData.success) setSessions(sessionsData.data.sessions || []);
      if (statisticsData.success) setStatistics(statisticsData.data);

      setError(null);
    } catch (err) {
      setError('Error loading AI chat data');
      console.error('AI Advanced Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai-chat-advanced/conversations/${conversationId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setSelectedView('chat');
    await loadConversationMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || isTyping) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsTyping(true);

    try {
      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        conversationId: currentConversation.id,
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Process message with AI
      const response = await fetch('/api/ai-chat-advanced/chat/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          content: messageContent,
          userId: 'demo-user',
          organizationId: 'demo-org-1'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response
        setMessages(prev => [...prev, data.data.message]);
        setCurrentAnalysis(data.data.analysis);
        setShowAnalysis(true);
        
        // Reload conversations to update last message
        await loadData();
      } else {
        throw new Error(data.error || 'Error processing message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        conversationId: currentConversation.id,
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      'analysis_request': 'text-blue-600 bg-blue-50',
      'optimization_request': 'text-purple-600 bg-purple-50',
      'report_request': 'text-orange-600 bg-orange-50',
      'help_request': 'text-green-600 bg-green-50',
      'explanation_request': 'text-indigo-600 bg-indigo-50',
      'general_inquiry': 'text-gray-600 bg-gray-50'
    };
    return colors[intent] || colors['general_inquiry'];
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || conv.status === selectedStatus;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => conv.tags.includes(tag));
    
    return matchesSearch && matchesStatus && matchesTags;
  });

  if (loading && !conversations.length) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-sand-100 rounded-lg p-6 h-96"></div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-sand-100 rounded-lg p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-600 mb-4">
          <MessageCircle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error Loading AI Chat</h3>
          <p className="text-gray-600">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Avanzado</h1>
          <p className="text-gray-600">Sistema de chat inteligente con análisis de contexto y conversaciones persistentes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Brain className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'conversations', label: 'Conversaciones', icon: MessageCircle },
            { id: 'chat', label: 'Chat', icon: Bot },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'sessions', label: 'Sesiones', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conversations Tab */}
      {selectedView === 'conversations' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="archived">Archivadas</option>
              <option value="deleted">Eliminadas</option>
            </select>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Conversaciones</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalConversations}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalMessages}</p>
                  </div>
                  <Bot className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversaciones Activas</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.activeConversations}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(statistics.averageResponseTime)}ms</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensajes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actividad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConversations.map((conversation) => (
                    <tr key={conversation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{conversation.title}</div>
                          <div className="text-sm text-gray-500">{conversation.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                          conversation.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {conversation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {conversation.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {conversation.tags.length > 2 && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              +{conversation.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conversation.messageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(conversation.lastMessageAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConversationSelect(conversation)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Abrir conversación"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" title="Más opciones">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {selectedView === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat Messages */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{currentConversation.title}</h3>
                  <p className="text-sm text-gray-500">{currentConversation.description}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.role === 'assistant'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-yellow-100 text-yellow-900'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : message.role === 'assistant' ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                          <span className="text-xs opacity-75">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Message Metadata */}
                        {message.metadata && (
                          <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.sentiment && (
                                <span className={`px-2 py-1 text-xs rounded-full ${getSentimentColor(message.metadata.sentiment)}`}>
                                  {message.metadata.sentiment}
                                </span>
                              )}
                              {message.metadata.intent && (
                                <span className={`px-2 py-1 text-xs rounded-full ${getIntentColor(message.metadata.intent)}`}>
                                  {message.metadata.intent}
                                </span>
                              )}
                              {message.metadata.confidence && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                  {Math.round(message.metadata.confidence * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      disabled={isTyping}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isTyping}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona una conversación</h3>
                  <p className="text-gray-500">Elige una conversación de la lista para comenzar a chatear</p>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Análisis IA</h3>
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Brain className="w-5 h-5" />
              </button>
            </div>

            {showAnalysis && currentAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sentimiento</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(currentAnalysis.sentiment)}`}>
                    {currentAnalysis.sentiment}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Intención</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getIntentColor(currentAnalysis.intent)}`}>
                    {currentAnalysis.intent}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Confianza</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${currentAnalysis.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(currentAnalysis.confidence * 100)}%</span>
                </div>

                {currentAnalysis.entities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Entidades</h4>
                    <div className="space-y-1">
                      {currentAnalysis.entities.map((entity, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{entity.value}</span>
                          <span className="text-xs text-gray-500">{entity.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentAnalysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sugerencias</h4>
                    <div className="space-y-1">
                      {currentAnalysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Enviar un mensaje para ver el análisis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedView === 'analytics' && statistics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Intenciones</h3>
              <div className="space-y-2">
                {statistics.topIntents.map((intent, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{intent.intent}</span>
                    <span className="text-sm font-medium text-gray-900">{intent.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Temas</h3>
              <div className="space-y-2">
                {statistics.topTopics.map((topic, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{topic.topic}</span>
                    <span className="text-sm font-medium text-gray-900">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Sentimientos</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(statistics.sentimentDistribution).map(([sentiment, count]) => (
                <div key={sentiment} className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${getSentimentColor(sentiment)}`}>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  <span className="text-sm text-gray-600 capitalize">{sentiment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {selectedView === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actividad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{session.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.conversationId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.lastActivityAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
