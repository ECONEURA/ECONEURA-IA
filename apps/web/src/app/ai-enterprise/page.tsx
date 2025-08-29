'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  Search, 
  FileText, 
  Workflow, 
  Activity,
  Target,
  Users,
  Settings
} from 'lucide-react';
import AutoMLDashboard from '@/components/ui/AutoMLDashboard';

const features = [
  {
    id: 'automl',
    name: 'AutoML',
    description: 'Train machine learning models automatically',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    status: 'active'
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze customer feedback and emotions',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    status: 'active'
  },
  {
    id: 'workflow',
    name: 'Workflow Automation',
    description: 'Automate business processes with AI',
    icon: Workflow,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    status: 'active'
  },
  {
    id: 'realtime',
    name: 'Real-time Analytics',
    description: 'Process and analyze data in real-time',
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    status: 'active'
  },
  {
    id: 'search',
    name: 'Semantic Search',
    description: 'Advanced search with AI understanding',
    icon: Search,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    status: 'active'
  },
  {
    id: 'reporting',
    name: 'Intelligent Reporting',
    description: 'Generate AI-powered reports automatically',
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    status: 'active'
  },
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    description: 'Intelligent customer service automation',
    icon: Users,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    status: 'active'
  },
  {
    id: 'bpm',
    name: 'Process Optimization',
    description: 'Optimize business processes with AI',
    icon: Target,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    status: 'active'
  }
];

const stats = [
  {
    name: 'Models Trained',
    value: '24',
    change: '+12%',
    changeType: 'positive'
  },
  {
    name: 'Processes Optimized',
    value: '156',
    change: '+8%',
    changeType: 'positive'
  },
  {
    name: 'Automation Rate',
    value: '87%',
    change: '+5%',
    changeType: 'positive'
  },
  {
    name: 'Customer Satisfaction',
    value: '94%',
    change: '+3%',
    changeType: 'positive'
  }
];

export default function AIEnterprisePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Enterprise Platform</h1>
          <p className="text-muted-foreground">
            Advanced artificial intelligence for enterprise operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            All Systems Operational
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="automl">AutoML</TabsTrigger>
          <TabsTrigger value="features">All Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access the most commonly used AI features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  <span className="text-sm">Train Model</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span className="text-sm">Analyze Sentiment</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Workflow className="h-6 w-6 mb-2" />
                  <span className="text-sm">Create Workflow</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">Generate Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Current status of all AI systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.slice(0, 4).map((feature) => (
                  <div key={feature.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feature.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest AI operations and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Brain className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New model trained successfully</p>
                    <p className="text-sm text-muted-foreground">
                      Random Forest model achieved 89% accuracy
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Sentiment analysis completed</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzed 1,247 customer feedback entries
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">4 hours ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Workflow className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Workflow automation triggered</p>
                    <p className="text-sm text-muted-foreground">
                      Order processing workflow executed 15 times
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">6 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automl" className="space-y-4">
          <AutoMLDashboard />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All AI Features</CardTitle>
              <CardDescription>
                Complete overview of all available AI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <Card key={feature.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                          <feature.icon className={`h-5 w-5 ${feature.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {feature.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {feature.description}
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Access Feature
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
