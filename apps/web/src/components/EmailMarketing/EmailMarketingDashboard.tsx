/**
 * EMAIL MARKETING DASHBOARD
 *
 * PR-56: Dashboard completo de email marketing
 *
 * Funcionalidades:
 * - Gestión de campañas de email
 * - Automatización de emails
 * - Segmentación de audiencia
 * - Plantillas y personalización
 * - Analytics y métricas
 * - A/B testing
 * - Programación de envíos
 * - Gestión de suscriptores
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Send,
  Users,
  BarChart3,
  Calendar,
  Clock,
  User,
  Tag,
  Globe,
  Lock,
  Star,
  Pin,
  MessageSquare,
  Share2,
  TrendingUp,
  BookOpen,
  Newspaper,
  ShoppingCart,
  HelpCircle,
  GraduationCap,
  FileCode,
  Home,
  MoreHorizontal,
  Target,
  Zap,
  Settings,
  Download,
  Upload,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  Archive,
  Trash,
  RefreshCw,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Minus,
  Plus as PlusIcon,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Settings as SettingsIcon,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalLow,
  SignalZero,
  SignalHigh,
  SignalMedium,
  SignalLow as SignalLowIcon,
  SignalZero as SignalZeroIcon,
  SignalHigh as SignalHighIcon,
  SignalMedium as SignalMediumIcon
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  templateId?: string;
  segments: string[];
  recipients: string[];
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  trackingEnabled: boolean;
  analytics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    complained: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
    bounceRate: number;
    complaintRate: number;
  };
  abTest?: {
    enabled: boolean;
    variants: Array<{
      id: string;
      subject: string;
      htmlContent: string;
      percentage: number;
    }>;
    winner?: string;
    testDuration?: number;
  };
  automation?: {
    enabled: boolean;
    triggers: Array<{
      type: string;
      conditions: Record<string, any>;
      delay?: number;
    }>;
    actions: Array<{
      type: string;
      config: Record<string, any>;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface EmailSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  tags: string[];
  customFields: Record<string, any>;
  segments: string[];
  subscribedAt: string;
  unsubscribedAt?: string;
  lastActivityAt?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  preferences?: {
    frequency: string;
    categories: string[];
    format: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  previewText?: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailSegment {
  id: string;
  name: string;
  description?: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    logic?: string;
  }>;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface EmailMarketingStatistics {
  totalCampaigns: number;
  campaignsByType: Record<string, number>;
  campaignsByStatus: Record<string, number>;
  totalSubscribers: number;
  subscribersByStatus: Record<string, number>;
  totalTemplates: number;
  totalSegments: number;
  averageOpenRate: number;
  averageClickRate: number;
  topCampaigns: EmailCampaign[];
}

const EmailMarketingDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [segments, setSegments] = useState<EmailSegment[]>([]);
  const [statistics, setStatistics] = useState<EmailMarketingStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubscriberDialog, setShowSubscriberDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load campaigns
      const campaignsResponse = await fetch('/api/email-marketing/campaigns');
      const campaignsData = await campaignsResponse.json();
      if (campaignsData.success) {
        setCampaigns(campaignsData.data.campaigns || []);
      }

      // Load subscribers
      const subscribersResponse = await fetch('/api/email-marketing/subscribers');
      const subscribersData = await subscribersResponse.json();
      if (subscribersData.success) {
        setSubscribers(subscribersData.data.subscribers || []);
      }

      // Load templates
      const templatesResponse = await fetch('/api/email-marketing/templates');
      const templatesData = await templatesResponse.json();
      if (templatesData.success) {
        setTemplates(templatesData.data.templates || []);
      }

      // Load segments
      const segmentsResponse = await fetch('/api/email-marketing/segments');
      const segmentsData = await segmentsResponse.json();
      if (segmentsData.success) {
        setSegments(segmentsData.data.segments || []);
      }

      // Load statistics
      const statisticsResponse = await fetch('/api/email-marketing/statistics');
      const statisticsData = await statisticsResponse.json();
      if (statisticsData.success) {
        setStatistics(statisticsData.data);
      }
    } catch (error) {
      console.error('Error loading email marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.previewText?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || campaign.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-purple-100 text-purple-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'newsletter': return <Newspaper className="h-4 w-4 text-blue-500" />;
      case 'promotional': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'transactional': return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      case 'welcome': return <User className="h-4 w-4 text-purple-500" />;
      case 'abandoned_cart': return <ShoppingCart className="h-4 w-4 text-red-500" />;
      case 're_engagement': return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case 'announcement': return <Bell className="h-4 w-4 text-indigo-500" />;
      case 'survey': return <HelpCircle className="h-4 w-4 text-teal-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (;
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando email marketing...</p>
        </div>
      </div>
    );
  }

  return (;
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-1">Gestiona campañas, suscriptores y automatización</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowSubscriberDialog(true)} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Suscriptores
          </Button>
          <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
            <FileCode className="h-4 w-4 mr-2" />
            Plantillas
          </Button>
          <Button onClick={() => setShowSegmentDialog(true)} variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Segmentos
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Campaña
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campañas</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.campaignsByStatus.sent || 0} enviadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suscriptores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(statistics.totalSubscribers)}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.subscribersByStatus.active || 0} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(statistics.averageOpenRate)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio de todas las campañas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Clic</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(statistics.averageClickRate)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio de todas las campañas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar campañas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo de campaña" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="promotional">Promocional</SelectItem>
                <SelectItem value="transactional">Transaccional</SelectItem>
                <SelectItem value="welcome">Bienvenida</SelectItem>
                <SelectItem value="abandoned_cart">Carrito Abandonado</SelectItem>
                <SelectItem value="re_engagement">Re-engagement</SelectItem>
                <SelectItem value="announcement">Anuncio</SelectItem>
                <SelectItem value="survey">Encuesta</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="scheduled">Programada</SelectItem>
                <SelectItem value="sending">Enviando</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campañas ({filteredCampaigns.length})</CardTitle>
          <CardDescription>
            Lista de todas las campañas de email con filtros aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Métricas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(campaign.type)}
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-gray-500">
                            {campaign.fromName} &lt;{campaign.fromEmail}&gt;
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {campaign.trackingEnabled && <Eye className="h-3 w-3 text-green-500" />}
                            {campaign.abTest?.enabled && <Zap className="h-3 w-3 text-purple-500" />}
                            {campaign.automation?.enabled && <Settings className="h-3 w-3 text-blue-500" />}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.subject}</div>
                        {campaign.previewText && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {campaign.previewText}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {campaign.sentAt ? formatDate(campaign.sentAt) : formatDate(campaign.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.analytics && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <Eye className="h-3 w-3" />
                            <span>{formatPercentage(campaign.analytics.openRate)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <MousePointer className="h-3 w-3" />
                            <span>{formatPercentage(campaign.analytics.clickRate)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="h-3 w-3" />
                            <span>{formatNumber(campaign.analytics.sent)}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Send campaign
                            fetch(`/api/email-marketing/campaigns/${campaign.id}/send`, {
                              method: 'POST'
                            }).then(() => {
                              loadData();
                            });
                          }}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Campaña</DialogTitle>
              <DialogDescription>
                Información completa de la campaña seleccionada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <p className="text-sm text-gray-600">{selectedCampaign.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <p className="text-sm text-gray-600">{selectedCampaign.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Badge className={getStatusColor(selectedCampaign.status)}>
                    {selectedCampaign.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Asunto</label>
                  <p className="text-sm text-gray-600">{selectedCampaign.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">De</label>
                  <p className="text-sm text-gray-600">
                    {selectedCampaign.fromName} &lt;{selectedCampaign.fromEmail}&gt;
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha de Envío</label>
                  <p className="text-sm text-gray-600">
                    {selectedCampaign.sentAt ? formatDate(selectedCampaign.sentAt) : 'No enviada'}
                  </p>
                </div>
              </div>

              {selectedCampaign.previewText && (
                <div>
                  <label className="text-sm font-medium">Texto de Vista Previa</label>
                  <p className="text-sm text-gray-600">{selectedCampaign.previewText}</p>
                </div>
              )}

              {selectedCampaign.analytics && (
                <div>
                  <label className="text-sm font-medium">Analytics</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedCampaign.analytics.sent)} enviados</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedCampaign.analytics.opened)} abiertos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MousePointer className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedCampaign.analytics.clicked)} clics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{formatPercentage(selectedCampaign.analytics.openRate)} tasa de apertura</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4">
                {selectedCampaign.trackingEnabled && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Tracking habilitado</span>
                  </div>
                )}

                {selectedCampaign.abTest?.enabled && (
                  <div className="flex items-center space-x-1 text-purple-600">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">A/B Test activo</span>
                  </div>
                )}

                {selectedCampaign.automation?.enabled && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Automatización activa</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Campaña</DialogTitle>
            <DialogDescription>
              Crea una nueva campaña de email marketing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre de la Campaña</label>
              <Input placeholder="Nombre de la campaña" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promocional</SelectItem>
                  <SelectItem value="transactional">Transaccional</SelectItem>
                  <SelectItem value="welcome">Bienvenida</SelectItem>
                  <SelectItem value="abandoned_cart">Carrito Abandonado</SelectItem>
                  <SelectItem value="re_engagement">Re-engagement</SelectItem>
                  <SelectItem value="announcement">Anuncio</SelectItem>
                  <SelectItem value="survey">Encuesta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Asunto</label>
              <Input placeholder="Asunto del email" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Contenido HTML</label>
              <textarea
                placeholder="Escribe el contenido HTML del email..."
                className="w-full mt-1 p-3 border border-gray-300 rounded-md"
                rows={8}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Crear Campaña
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailMarketingDashboard;
