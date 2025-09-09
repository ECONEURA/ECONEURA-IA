'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  X,
  Briefcase,
  Palette,
  BarChart3,
  Code,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { promptManager, PromptTemplate } from '@/lib/prompts';

interface PromptTemplatesProps {
  onTemplateSelect: (system: string, user: string) => void;
  onClose: () => void;
}

const categoryIcons = {
  business: Briefcase,
  creative: Palette,
  analysis: BarChart3,
  technical: Code
};

const categoryColors = {
  business: 'bg-blue-100 text-blue-800',
  creative: 'bg-purple-100 text-purple-800',
  analysis: 'bg-green-100 text-green-800',
  technical: 'bg-orange-100 text-orange-800'
};

export function PromptTemplates({ onTemplateSelect, onClose }: PromptTemplatesProps): void {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['business']));
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const categories = [
    { id: 'business', name: 'Negocios', icon: Briefcase },
    { id: 'creative', name: 'Creativo', icon: Palette },
    { id: 'analysis', name: 'Análisis', icon: BarChart3 },
    { id: 'technical', name: 'Técnico', icon: Code }
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? promptManager.getAllTemplates()
    : promptManager.getTemplatesByCategory(selectedCategory);

  const searchResults = searchQuery
    ? promptManager.searchTemplates(searchQuery)
    : filteredTemplates;

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleTemplateClick = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setTemplateVariables({});
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const rendered = promptManager.renderTemplate(selectedTemplate.id, templateVariables);
    if (rendered) {
      onTemplateSelect(rendered.system, rendered.user);
      onClose();
    }
  };

  const isTemplateReady = () => {
    if (!selectedTemplate) return false;
    return selectedTemplate.variables.every(variable => templateVariables[variable]?.trim());
  };

  return (;
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Templates Inteligentes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r bg-gray-50 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  const templates = promptManager.getTemplatesByCategory(category.id);
                  const isExpanded = expandedCategories.has(category.id);

                  return (;
                    <div key={category.id} className="border rounded-lg">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-gray-500">({templates.length})</span>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-white">
                          {templates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateClick(template)}
                              className={`w-full text-left p-3 hover:bg-blue-50 ${
                                selectedTemplate?.id === template.id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Template Details */}
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[selectedTemplate.category]}`}>
                      {selectedTemplate.category}
                    </span>
                    <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

                  {/* Variables */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Variables requeridas:</h4>
                    {selectedTemplate.variables.map(variable => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          value={templateVariables[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          placeholder={`Ingresa ${variable.replace(/_/g, ' ')}`}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <h4 className="font-medium mb-3">Vista previa:</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Sistema:</h5>
                      <div className="bg-gray-100 p-3 rounded-lg text-sm">
                        {selectedTemplate.system}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Usuario:</h5>
                      <div className="bg-blue-50 p-3 rounded-lg text-sm">
                        {promptManager.renderTemplate(selectedTemplate.id, templateVariables)?.user || selectedTemplate.userTemplate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t bg-gray-50">
                  <button
                    onClick={handleUseTemplate}
                    disabled={!isTemplateReady()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Usar Template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona un template para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
