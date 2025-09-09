/**
 * CUSTOMER SUPPORT DASHBOARD
 *
 * PR-58: Dashboard completo para sistema de soporte al cliente
 *
 * Funcionalidades:
 * - Gestión de tickets de soporte
 * - Chat en vivo
 * - Base de conocimiento
 * - Analytics de soporte
 * - Gestión de agentes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Users,
  BookOpen,
  BarChart3,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  FileText,
  Send,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface SupportTicket {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  assignedTo?: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  tags: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'bot';
  message: string;
  messageType: string;
  attachments: any[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportAgent {
  id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  maxTickets: number;
  currentTickets: number;
  skills: string[];
  languages: string[];
  performance?: {
    ticketsResolved: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
    responseTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SupportStatistics {
  totalTickets: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByCategory: Record<string, number>;
  averageResolutionTime: number;
  totalAgents: number;
  activeAgents: number;
  totalArticles: number;
  topCategories: Array<{ category: string; count: number }>;
  customerSatisfaction: number;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-700' }
];

const STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'pending', label: 'Pending', color: 'bg-orange-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-500' }
];

const CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'billing', label: 'Billing' },
  { value: 'general', label: 'General' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' }
];

const SOURCES = [
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'phone', label: 'Phone' },
  { value: 'portal', label: 'Portal' },
  { value: 'api', label: 'API' },
  { value: 'social', label: 'Social' }
];

export default function CustomerSupportDashboard(): void {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [statistics, setStatistics] = useState<SupportStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showCreateArticle, setShowCreateArticle] = useState(false);

  // Form states
  const [newTicket, setNewTicket] = useState({
    customerId: '',
    customerEmail: '',
    customerName: '',
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    source: 'portal',
    tags: [] as string[]
  });

  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    authorId: 'demo-user'
  });

  const [newMessage, setNewMessage] = useState({
    message: '',
    senderType: 'agent' as 'customer' | 'agent' | 'bot'
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load tickets
      const ticketsResponse = await fetch('/api/support/tickets');
      const ticketsData = await ticketsResponse.json();
      if (ticketsData.success) {
        setTickets(ticketsData.data.tickets);
      }

      // Load articles
      const articlesResponse = await fetch('/api/support/knowledge-base');
      const articlesData = await articlesResponse.json();
      if (articlesData.success) {
        setArticles(articlesData.data.articles);
      }

      // Load agents
      const agentsResponse = await fetch('/api/support/agents');
      const agentsData = await agentsResponse.json();
      if (agentsData.success) {
        setAgents(agentsData.data.agents);
      }

      // Load statistics
      const statsResponse = await fetch('/api/support/statistics');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('Error loading customer support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error loading ticket messages:', error);
    }
  };

  const handleCreateTicket = async () => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicket)
      });

      const data = await response.json();
      if (data.success) {
        setTickets([...tickets, data.data]);
        setNewTicket({
          customerId: '',
          customerEmail: '',
          customerName: '',
          subject: '',
          description: '',
          category: 'general',
          priority: 'medium',
          source: 'portal',
          tags: []
        });
        setShowCreateTicket(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleCreateArticle = async () => {
    try {
      const response = await fetch('/api/support/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newArticle)
      });

      const data = await response.json();
      if (data.success) {
        setArticles([...articles, data.data]);
        setNewArticle({
          title: '',
          content: '',
          category: '',
          tags: [],
          authorId: 'demo-user'
        });
        setShowCreateArticle(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.message.trim()) return;

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newMessage,
          senderId: 'demo-agent'
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage({ message: '', senderType: 'agent' });
        loadTicketMessages(selectedTicket.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, updatedBy: 'demo-agent' })
      });

      const data = await response.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityData = PRIORITIES.find(p => p.value === priority);
    return priorityData?.color || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const statusData = STATUSES.find(s => s.value === status);
    return statusData?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    if (filters.category && ticket.category !== filters.category) return false;
    if (filters.assignedTo && ticket.assignedTo !== filters.assignedTo) return false;
    return true;
  });

  if (loading) {
    return (;
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading customer support data...</div>
      </div>
    );
  }

  return (;
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Support</h1>
          <p className="text-muted-foreground">
            Manage customer support tickets, knowledge base, and agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateTicket(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
          <Button onClick={() => setShowCreateArticle(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.ticketsByStatus.open || 0} open
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.activeAgents}</div>
                  <p className="text-xs text-muted-foreground">
                    of {statistics.totalAgents} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.averageResolutionTime.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average resolution time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.customerSatisfaction.toFixed(1)}/5
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer satisfaction
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>
                  Distribution of tickets by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics && Object.entries(statistics.ticketsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(status)} text-white`}>
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>
                  Most common ticket categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics?.topCategories.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="capitalize">{category.category}</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input placeholder="Search tickets..." />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setActiveTab('chat');
                      loadTicketMessages(ticket.id);
                    }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline">
                        {ticket.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTicketStatus(ticket.id, 'in_progress');
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTicketStatus(ticket.id, 'resolved');
                      }}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {ticket.customerName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {ticket.customerEmail}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatTime(ticket.createdAt)}
                      </div>
                    </div>

                    {ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          {selectedTicket ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat - {selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      Customer: {selectedTicket.customerName} ({selectedTicket.customerEmail})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage.message}
                        onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(selectedTicket.status)}
                        <Badge className={`${getStatusColor(selectedTicket.status)} text-white`}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <div className="mt-1">
                        <Badge className={`${getPriorityColor(selectedTicket.priority)} text-white`}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm capitalize mt-1">{selectedTicket.category}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Source</Label>
                      <p className="text-sm capitalize mt-1">{selectedTicket.source}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm mt-1">{formatTime(selectedTicket.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Mark In Progress
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Resolved
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'closed')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Ticket
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Ticket Selected</h3>
                  <p className="text-muted-foreground">
                    Select a ticket from the Tickets tab to start chatting
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input placeholder="Search knowledge base..." />
            </div>
            <Button>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="capitalize">{article.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {article.content}
                  </p>

                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {article.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {article.helpfulCount}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.email}</CardDescription>
                    </div>
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{agent.currentTickets}</div>
                        <div className="text-xs text-muted-foreground">Current</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{agent.maxTickets}</div>
                        <div className="text-xs text-muted-foreground">Max</div>
                      </div>
                    </div>

                    {agent.performance && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Resolved:</span>
                          <span>{agent.performance.ticketsResolved}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Time:</span>
                          <span>{agent.performance.averageResolutionTime.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Satisfaction:</span>
                          <span>{agent.performance.customerSatisfaction.toFixed(1)}/5</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>
                Create a new support ticket for a customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={newTicket.customerName}
                    onChange={(e) => setNewTicket({...newTicket, customerName: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={newTicket.customerEmail}
                    onChange={(e) => setNewTicket({...newTicket, customerEmail: e.target.value})}
                    placeholder="Enter customer email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  placeholder="Enter ticket subject"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Enter ticket description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({...newTicket, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select value={newTicket.source} onValueChange={(value) => setNewTicket({...newTicket, source: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTicket} className="flex-1">
                  Create Ticket
                </Button>
                <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Article Modal */}
      {showCreateArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create Knowledge Base Article</CardTitle>
              <CardDescription>
                Create a new article for the knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="articleTitle">Title</Label>
                <Input
                  id="articleTitle"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <Label htmlFor="articleCategory">Category</Label>
                <Input
                  id="articleCategory"
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                  placeholder="Enter article category"
                />
              </div>

              <div>
                <Label htmlFor="articleContent">Content</Label>
                <Textarea
                  id="articleContent"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                  placeholder="Enter article content"
                  rows={8}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateArticle} className="flex-1">
                  Create Article
                </Button>
                <Button variant="outline" onClick={() => setShowCreateArticle(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
