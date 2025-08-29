'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, TrendingUp, BarChart3, Clock, Target } from 'lucide-react';
import { useApiClient } from '@/lib/api-client';

interface Model {
  id: string;
  algorithm: string;
  accuracy: number;
  status: 'training' | 'ready' | 'error';
  createdAt: string;
  lastUsed?: string;
}

interface TrainingConfig {
  algorithm: 'linear' | 'random_forest' | 'neural_network' | 'xgboost';
  targetColumn: string;
  features: string[];
  testSize: number;
}

export default function AutoMLDashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [config, setConfig] = useState<TrainingConfig>({
    algorithm: 'random_forest',
    targetColumn: '',
    features: [],
    testSize: 0.2
  });
  const { apiCall } = useApiClient();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      // Simular carga de modelos
      const mockModels: Model[] = [
        {
          id: 'model_1',
          algorithm: 'random_forest',
          accuracy: 0.89,
          status: 'ready',
          createdAt: '2024-01-15T10:30:00Z',
          lastUsed: '2024-01-20T14:22:00Z'
        },
        {
          id: 'model_2',
          algorithm: 'neural_network',
          accuracy: 0.92,
          status: 'ready',
          createdAt: '2024-01-18T09:15:00Z'
        }
      ];
      setModels(mockModels);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    // Simular progreso de entrenamiento
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          loadModels(); // Recargar modelos
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // Aquí iría la llamada real a la API
      // await apiCall('POST', `/ai/automl/train/${orgId}`, { config, dataset });
    } catch (error) {
      console.error('Error training model:', error);
      setIsTraining(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'neural_network': return <Brain className="h-4 w-4" />;
      case 'random_forest': return <BarChart3 className="h-4 w-4" />;
      case 'linear': return <TrendingUp className="h-4 w-4" />;
      case 'xgboost': return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AutoML Dashboard</h1>
          <p className="text-muted-foreground">
            Train and manage machine learning models automatically
          </p>
        </div>
        <Button onClick={loadModels} variant="outline">
          <Zap className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Training Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Train New Model
          </CardTitle>
          <CardDescription>
            Configure and train a new machine learning model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="algorithm">Algorithm</Label>
              <Select
                value={config.algorithm}
                onValueChange={(value: any) => setConfig(prev => ({ ...prev, algorithm: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="neural_network">Neural Network</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testSize">Test Size</Label>
              <Select
                value={config.testSize.toString()}
                onValueChange={(value) => setConfig(prev => ({ ...prev, testSize: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.2">20%</SelectItem>
                  <SelectItem value="0.3">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetColumn">Target Column</Label>
            <Input
              id="targetColumn"
              placeholder="Enter target column name"
              value={config.targetColumn}
              onChange={(e) => setConfig(prev => ({ ...prev, targetColumn: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Input
              id="features"
              placeholder="feature1, feature2, feature3"
              value={config.features.join(', ')}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                features: e.target.value.split(',').map(f => f.trim()).filter(f => f)
              }))}
            />
          </div>

          {isTraining && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} className="w-full" />
            </div>
          )}

          <Button 
            onClick={startTraining} 
            disabled={isTraining || !config.targetColumn || config.features.length === 0}
            className="w-full"
          >
            {isTraining ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Start Training
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Models List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trained Models
          </CardTitle>
          <CardDescription>
            View and manage your trained models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No models trained yet</p>
                <p className="text-sm">Start by training your first model above</p>
              </div>
            ) : (
              models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getAlgorithmIcon(model.algorithm)}
                      <div>
                        <p className="font-medium capitalize">
                          {model.algorithm.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {model.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{(model.accuracy * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                    </div>

                    <Badge className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(model.createdAt).toLocaleDateString()}
                      </p>
                      {model.lastUsed && (
                        <p className="text-sm text-muted-foreground">
                          Used: {new Date(model.lastUsed).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <Button variant="outline" size="sm">
                      Use Model
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{models.length}</p>
                <p className="text-sm text-muted-foreground">Total Models</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {models.length > 0 
                    ? (models.reduce((acc, m) => acc + m.accuracy, 0) / models.length * 100).toFixed(1)
                    : '0'
                  }%
                </p>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {models.filter(m => m.status === 'ready').length}
                </p>
                <p className="text-sm text-muted-foreground">Ready Models</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
