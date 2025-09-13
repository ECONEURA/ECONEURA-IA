/**
 * DOCUMENT MANAGEMENT DASHBOARD
 * 
 * PR-54: Dashboard completo de gestión de documentos
 * 
 * Funcionalidades:
 * - Lista de documentos con filtros
 * - Búsqueda avanzada
 * - Gestión de versiones
 * - Permisos y colaboración
 * - Estadísticas y analytics
 * - Upload y gestión de archivos
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
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Share, 
  History, 
  BarChart3,
  FolderOpen,
  Clock,
  User,
  Tag,
  Calendar,
  HardDrive,
  Shield,
  Lock,
  Globe
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  status: string;
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    category?: string;
    author: string;
    language: string;
    keywords: string[];
    customFields: Record<string, any>;
    extractedText?: string;
    summary?: string;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
    sentiment?: {
      score: number;
      magnitude: number;
      label: string;
    };
  };
  storagePath: string;
  storageProvider: string;
  encryptionKey?: string;
  permissions: Array<{
    userId: string;
    permission: string;
    grantedBy: string;
    grantedAt: string;
  }>;
  versions: Array<{
    id: string;
    version: string;
    content: string;
    size: number;
    checksum: string;
    changes?: string;
    createdBy: string;
    createdAt: string;
    isActive: boolean;
  }>;
  currentVersion: string;
  size: number;
  mimeType: string;
  checksum: string;
  isPublic: boolean;
  isEncrypted: boolean;
  retentionPolicy?: {
    retentionDays?: number;
    autoDelete: boolean;
    legalHold: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface DocumentStatistics {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;
  totalSize: number;
  averageSize: number;
  recentDocuments: number;
}

const DocumentManagementDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadStatistics();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/documents/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xlsx': return <FileText className="h-4 w-4 text-green-500" />;
      case 'pptx': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'image': return <FileText className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
          <p className="text-gray-600 mt-1">Administra y organiza todos tus documentos</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.recentDocuments} nuevos esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamaño Total</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(statistics.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {formatFileSize(statistics.averageSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Archivo</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(statistics.documentsByType).length}</div>
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
                {statistics.documentsByStatus.approved || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Documentos aprobados
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
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo de archivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="pptx">PowerPoint</SelectItem>
                <SelectItem value="image">Imágenes</SelectItem>
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
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Lista de todos los documentos con filtros aplicados
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
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(document.type)}
                        <div>
                          <div className="font-medium">{document.name}</div>
                          <div className="text-sm text-gray-500">
                            {document.metadata.title}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(document.size)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{document.metadata.author}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDocument(document)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowVersionDialog(true);
                          }}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowPermissionDialog(true);
                          }}
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3" />
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

      {/* Document Details Dialog */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles del Documento</DialogTitle>
              <DialogDescription>
                Información completa del documento seleccionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <p className="text-sm text-gray-600">{selectedDocument.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <p className="text-sm text-gray-600">{selectedDocument.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Badge className={getStatusColor(selectedDocument.status)}>
                    {selectedDocument.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Tamaño</label>
                  <p className="text-sm text-gray-600">{formatFileSize(selectedDocument.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Autor</label>
                  <p className="text-sm text-gray-600">{selectedDocument.metadata.author}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Versión Actual</label>
                  <p className="text-sm text-gray-600">{selectedDocument.currentVersion}</p>
                </div>
              </div>
              
              {selectedDocument.metadata.description && (
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <p className="text-sm text-gray-600">{selectedDocument.metadata.description}</p>
                </div>
              )}
              
              {selectedDocument.metadata.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Etiquetas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDocument.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedDocument.metadata.summary && (
                <div>
                  <label className="text-sm font-medium">Resumen</label>
                  <p className="text-sm text-gray-600">{selectedDocument.metadata.summary}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                {selectedDocument.isPublic ? (
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
                
                {selectedDocument.isEncrypted && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Encriptado</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
            <DialogDescription>
              Selecciona un archivo para subir al sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Archivo</label>
              <Input type="file" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input placeholder="Título del documento" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input placeholder="Descripción opcional" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Etiquetas</label>
              <Input placeholder="Etiquetas separadas por comas" className="mt-1" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowUploadDialog(false)}>
                Subir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManagementDashboard;
