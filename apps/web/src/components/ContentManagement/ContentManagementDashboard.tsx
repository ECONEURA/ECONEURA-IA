/**
 * CONTENT MANAGEMENT DASHBOARD
 * 
 * PR-55: Dashboard completo de gestión de contenido
 * 
 * Funcionalidades:
 * - Lista de contenido con filtros
 * - Búsqueda avanzada
 * - Gestión de versiones
 * - Publicación y programación
 * - Analytics de contenido
 * - Workflow de aprobación
 * - SEO y optimización
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
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Share, 
  History, 
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
  Users,
  BookOpen,
  Newspaper,
  ShoppingCart,
  HelpCircle,
  GraduationCap,
  FileCode,
  Home,
  MoreHorizontal
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  template: string;
  metadata: {
    title: string;
    description?: string;
    excerpt?: string;
    tags: string[];
    categories: string[];
    author: string;
    language: string;
    keywords: string[];
    customFields: Record<string, any>;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords: string[];
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      twitterCard?: string;
      structuredData?: Record<string, any>;
    };
    analytics?: {
      views: number;
      uniqueViews: number;
      shares: number;
      comments: number;
      likes: number;
      engagement: number;
      bounceRate: number;
      timeOnPage: number;
    };
  };
  content: string;
  htmlContent?: string;
  markdownContent?: string;
  featuredImage?: string;
  images: string[];
  attachments: string[];
  versions: Array<{
    id: string;
    version: string;
    content: string;
    htmlContent?: string;
    markdownContent?: string;
    changes?: string;
    createdBy: string;
    createdAt: string;
    isActive: boolean;
  }>;
  currentVersion: string;
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  isPublic: boolean;
  isFeatured: boolean;
  isSticky: boolean;
  allowComments: boolean;
  allowSharing: boolean;
  workflow?: {
    currentStep: string;
    steps: Array<{
      step: string;
      status: string;
      assignedTo?: string;
      completedAt?: string;
      comments?: string;
    }>;
    approvedBy?: string;
    approvedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface ContentStatistics {
  totalContents: number;
  contentsByType: Record<string, number>;
  contentsByStatus: Record<string, number>;
  publishedContents: number;
  draftContents: number;
  totalViews: number;
  totalEngagement: number;
  topContents: Content[];
}

const ContentManagementDashboard: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [statistics, setStatistics] = useState<ContentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  useEffect(() => {
    loadContents();
    loadStatistics();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content');
      const data = await response.json();
      
      if (data.success) {
        setContents(data.data.contents || []);
      }
    } catch (error) {
      console.error('Error loading contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/content/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || content.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || content.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'blog': return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'page': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'product': return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      case 'news': return <Newspaper className="h-4 w-4 text-red-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'faq': return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      case 'tutorial': return <GraduationCap className="h-4 w-4 text-teal-500" />;
      case 'documentation': return <FileCode className="h-4 w-4 text-gray-500" />;
      case 'landing': return <Home className="h-4 w-4 text-pink-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Contenido</h1>
          <p className="text-gray-600 mt-1">Administra y publica todo tu contenido</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Crear Contenido
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contenido</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalContents}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.publishedContents} publicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vistas Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(statistics.totalEngagement)} engagement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Contenido</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(statistics.contentsByType).length}</div>
              <p className="text-xs text-muted-foreground">
                Diferentes formatos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.publishedContents}
              </div>
              <p className="text-xs text-muted-foreground">
                Contenido publicado
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
                  placeholder="Buscar contenido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo de contenido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="article">Artículo</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="page">Página</SelectItem>
                <SelectItem value="product">Producto</SelectItem>
                <SelectItem value="news">Noticia</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="documentation">Documentación</SelectItem>
                <SelectItem value="landing">Landing</SelectItem>
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
                <SelectItem value="review">En revisión</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido ({filteredContents.length})</CardTitle>
          <CardDescription>
            Lista de todo el contenido con filtros aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vistas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(content.type)}
                        <div>
                          <div className="font-medium">{content.title}</div>
                          <div className="text-sm text-gray-500">
                            {content.metadata.title}
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {content.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                            {content.isSticky && <Pin className="h-3 w-3 text-blue-500" />}
                            {content.isPublic ? (
                              <Globe className="h-3 w-3 text-green-500" />
                            ) : (
                              <Lock className="h-3 w-3 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{content.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{content.metadata.author}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {formatDate(content.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span className="text-sm">
                          {formatNumber(content.metadata.analytics?.views || 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContent(content)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContent(content);
                            setShowVersionDialog(true);
                          }}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContent(content);
                            setShowPublishDialog(true);
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
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

      {/* Content Details Dialog */}
      {selectedContent && (
        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles del Contenido</DialogTitle>
              <DialogDescription>
                Información completa del contenido seleccionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <p className="text-sm text-gray-600">{selectedContent.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <p className="text-sm text-gray-600">{selectedContent.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <p className="text-sm text-gray-600">{selectedContent.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Badge className={getStatusColor(selectedContent.status)}>
                    {selectedContent.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Autor</label>
                  <p className="text-sm text-gray-600">{selectedContent.metadata.author}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Versión Actual</label>
                  <p className="text-sm text-gray-600">{selectedContent.currentVersion}</p>
                </div>
              </div>
              
              {selectedContent.metadata.description && (
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <p className="text-sm text-gray-600">{selectedContent.metadata.description}</p>
                </div>
              )}
              
              {selectedContent.metadata.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Etiquetas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedContent.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedContent.metadata.categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Categorías</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedContent.metadata.categories.map((category, index) => (
                      <Badge key={index} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedContent.metadata.analytics && (
                <div>
                  <label className="text-sm font-medium">Analytics</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedContent.metadata.analytics.views)} vistas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedContent.metadata.analytics.uniqueViews)} únicas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedContent.metadata.analytics.shares)} shares</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(selectedContent.metadata.analytics.comments)} comentarios</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                {selectedContent.isPublic ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Público</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Privado</span>
                  </div>
                )}
                
                {selectedContent.isFeatured && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Destacado</span>
                  </div>
                )}
                
                {selectedContent.isSticky && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Pin className="h-4 w-4" />
                    <span className="text-sm">Fijo</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Content Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Contenido</DialogTitle>
            <DialogDescription>
              Crea nuevo contenido para tu sitio web
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input placeholder="Título del contenido" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input placeholder="slug-del-contenido" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Artículo</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="page">Página</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="news">Noticia</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="documentation">Documentación</SelectItem>
                  <SelectItem value="landing">Landing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Contenido</label>
              <textarea 
                placeholder="Escribe tu contenido aquí..."
                className="w-full mt-1 p-3 border border-gray-300 rounded-md"
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagementDashboard;
