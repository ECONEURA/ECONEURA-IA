'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Eye, 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  Tag,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  useTaxonomies, 
  useClassifyCompany, 
  useViews, 
  useCreateView, 
  useCompaniesByView,
  useTaxonomyHealth,
  CompanyTaxonomy,
  CompanyView,
  CompanyClassification
} from '@/hooks/use-companies-taxonomy';

interface CompaniesTaxonomyDashboardProps {
  organizationId?: string;
}

export function CompaniesTaxonomyDashboard({ 
  organizationId = 'default' 
}: CompaniesTaxonomyDashboardProps) {
  const [activeTab, setActiveTab] = useState('taxonomies');
  const [selectedView, setSelectedView] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');

  // Hooks
  const { data: taxonomies, isLoading: taxonomiesLoading } = useTaxonomies();
  const { data: views, isLoading: viewsLoading } = useViews(organizationId);
  const { data: health, isLoading: healthLoading } = useTaxonomyHealth();
  const { data: companiesByView, isLoading: companiesLoading } = useCompaniesByView(
    selectedView, 
    organizationId, 
    { search: searchTerm }
  );
  
  const classifyCompany = useClassifyCompany();
  const createView = useCreateView();

  // Handlers
  const handleClassifyCompany = async () => {
    await classifyCompany.mutateAsync({
      name: 'Sample Company',
      description: 'A sample company for classification',
      industry: 'Technology',
      keywords: ['software', 'ai', 'cloud']
    });
  };

  const handleCreateView = async () => {
    if (!newViewName.trim()) return;
    
    await createView.mutateAsync({
      name: newViewName,
      description: newViewDescription,
      organizationId,
      filters: [],
      sorting: { field: 'name', direction: 'asc' },
      columns: [
        { field: 'name', label: 'Company Name', isVisible: true },
        { field: 'industry', label: 'Industry', isVisible: true },
        { field: 'size', label: 'Size', isVisible: true }
      ],
      isDefault: false
    });
    
    setNewViewName('');
    setNewViewDescription('');
  };

  const getHealthStatus = () => {
    if (healthLoading) return { status: 'loading', color: 'text-gray-500' };
    if (health?.status === 'healthy') return { status: 'healthy', color: 'text-green-500' };
    return { status: 'degraded', color: 'text-yellow-500' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies Taxonomy & Views</h1>
          <p className="text-gray-600 mt-2">
            Manage company taxonomies and create custom views for better organization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {healthStatus.status === 'healthy' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className={`text-sm font-medium ${healthStatus.color}`}>
              {healthStatus.status === 'loading' ? 'Checking...' : 
               healthStatus.status === 'healthy' ? 'System Healthy' : 'System Degraded'}
            </span>
          </div>
          <Button onClick={handleClassifyCompany} disabled={classifyCompany.isPending}>
            <Tag className="h-4 w-4 mr-2" />
            Test Classification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxonomies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taxonomiesLoading ? '...' : taxonomies?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {viewsLoading ? '...' : views?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {companiesLoading ? '...' : companiesByView?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taxonomiesLoading ? '...' : 
                   taxonomies?.filter(t => t.isActive).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="taxonomies">Taxonomies</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        {/* Taxonomies Tab */}
        <TabsContent value="taxonomies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Taxonomies</CardTitle>
              <CardDescription>
                Predefined taxonomies for company classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taxonomiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading taxonomies...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taxonomies?.map((taxonomy: CompanyTaxonomy) => (
                    <Card key={taxonomy.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{taxonomy.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{taxonomy.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {taxonomy.metadata.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Badge variant={taxonomy.isActive ? "default" : "secondary"}>
                            {taxonomy.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Views Tab */}
        <TabsContent value="views" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create New View */}
            <Card>
              <CardHeader>
                <CardTitle>Create New View</CardTitle>
                <CardDescription>
                  Create a custom view for organizing companies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="viewName">View Name</Label>
                  <Input
                    id="viewName"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Enter view name"
                  />
                </div>
                <div>
                  <Label htmlFor="viewDescription">Description</Label>
                  <Textarea
                    id="viewDescription"
                    value={newViewDescription}
                    onChange={(e) => setNewViewDescription(e.target.value)}
                    placeholder="Enter view description"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreateView} 
                  disabled={!newViewName.trim() || createView.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create View
                </Button>
              </CardContent>
            </Card>

            {/* Existing Views */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Views</CardTitle>
                <CardDescription>
                  Manage your organization's views
                </CardDescription>
              </CardHeader>
              <CardContent>
                {viewsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading views...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {views?.map((view: CompanyView) => (
                      <div 
                        key={view.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedView(view.id)}
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{view.name}</h4>
                          <p className="text-sm text-gray-600">{view.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {view.filters.length} filters
                            </Badge>
                            {view.isDefault && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedView(view.id);
                            setActiveTab('companies');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Companies by View</CardTitle>
                  <CardDescription>
                    Browse companies filtered by selected view
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedView} onValueChange={setSelectedView}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                      {views?.map((view: CompanyView) => (
                        <SelectItem key={view.id} value={view.id}>
                          {view.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedView ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a View</h3>
                  <p className="text-gray-600">Choose a view from the dropdown to see companies</p>
                </div>
              ) : companiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading companies...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {companiesByView?.companies?.map((company: any) => (
                    <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{company.name}</h4>
                          <p className="text-sm text-gray-600">{company.industry} • {company.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {company.employees} employees
                          </p>
                          <p className="text-sm text-gray-600">
                            Score: {company.score}/100
                          </p>
                        </div>
                        <Badge variant="outline">
                          {company.location}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {companiesByView?.companies?.length === 0 && (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search terms' : 'No companies match this view'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
