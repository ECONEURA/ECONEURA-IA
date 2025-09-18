export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ECONEURA API',
    description: 'ERP/CRM + IA + 60 agentes en Azure - API completa con Analytics, Security, FinOps y más',
    version: '1.0.0',
    contact: {
      name: 'ECONEURA Team',
      email: 'support@econeura.com',
      url: 'https://econeura.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.econeura.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints'
    },
    {
      name: 'Analytics',
      description: 'Basic analytics and event tracking'
    },
    {
      name: 'Advanced Analytics',
      description: 'Advanced analytics and business intelligence'
    },
    {
      name: 'Security',
      description: 'Advanced security and threat detection'
    },
    {
      name: 'FinOps',
      description: 'Financial operations and budget management'
    },
    {
      name: 'GDPR',
      description: 'GDPR compliance and data management'
    },
    {
      name: 'SEPA',
      description: 'SEPA payment processing'
    },
    {
      name: 'Events',
      description: 'Server-Sent Events for real-time updates'
    },
    {
      name: 'Cockpit',
      description: 'Operational dashboard endpoints'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic health check',
        description: 'Returns basic health status of the API',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 123.45 },
                    version: { type: 'string', example: '1.0.0' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        description: 'Kubernetes liveness probe endpoint',
        responses: {
          '200': {
            description: 'Service is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'alive' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        description: 'Kubernetes readiness probe endpoint',
        responses: {
          '200': {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ready' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/metrics': {
      get: {
        tags: ['Health'],
        summary: 'Prometheus metrics',
        description: 'Returns Prometheus-compatible metrics',
        responses: {
          '200': {
            description: 'Metrics in Prometheus format',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: '# HELP econeura_api_info API information\n# TYPE econeura_api_info gauge'
                }
              }
            }
          }
        }
      }
    },
    '/v1/analytics/events': {
      post: {
        tags: ['Analytics'],
        summary: 'Track analytics event',
        description: 'Track a new analytics event',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventType', 'action', 'entityType', 'entityId', 'userId', 'orgId'],
                properties: {
                  eventType: { type: 'string', example: 'user_action' },
                  action: { type: 'string', example: 'login' },
                  entityType: { type: 'string', example: 'user' },
                  entityId: { type: 'string', example: 'user_123' },
                  userId: { type: 'string', example: 'user_123' },
                  orgId: { type: 'string', example: 'demo-org' },
                  metadata: { type: 'object', example: { source: 'web' } }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Event tracked successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    eventId: { type: 'string', example: 'event_1234567890_abc123' },
                    message: { type: 'string', example: 'Event tracked successfully' }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Analytics'],
        summary: 'Query analytics events',
        description: 'Query analytics events with filters',
        parameters: [
          {
            name: 'eventType',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by event type'
          },
          {
            name: 'action',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by action'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
            description: 'Maximum number of events to return'
          }
        ],
        responses: {
          '200': {
            description: 'Events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          eventType: { type: 'string' },
                          action: { type: 'string' },
                          timestamp: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/advanced-analytics/dashboard': {
      get: {
        tags: ['Advanced Analytics'],
        summary: 'Get analytics dashboard',
        description: 'Get comprehensive analytics dashboard data',
        parameters: [
          {
            name: 'timeRange',
            in: 'query',
            schema: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
            description: 'Time range for analytics data'
          }
        ],
        responses: {
          '200': {
            description: 'Dashboard data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalEvents: { type: 'integer', example: 1250 },
                        uniqueUsers: { type: 'integer', example: 45 },
                        topActions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              action: { type: 'string', example: 'login' },
                              count: { type: 'integer', example: 150 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/advanced-analytics/business-intelligence': {
      get: {
        tags: ['Advanced Analytics'],
        summary: 'Get business intelligence data',
        description: 'Get comprehensive business intelligence metrics',
        responses: {
          '200': {
            description: 'BI data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        revenue: {
                          type: 'object',
                          properties: {
                            total: { type: 'number', example: 125000 },
                            monthly: { type: 'number', example: 15000 },
                            growth: { type: 'number', example: 12.5 }
                          }
                        },
                        customers: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer', example: 1250 },
                            new: { type: 'integer', example: 45 },
                            churn: { type: 'integer', example: 8 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/advanced-security/threats/detect': {
      post: {
        tags: ['Security'],
        summary: 'Detect security threats',
        description: 'Analyze request for security threats',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ipAddress', 'userAgent', 'endpoint', 'method', 'orgId'],
                properties: {
                  ipAddress: { type: 'string', format: 'ipv4', example: '192.168.1.100' },
                  userAgent: { type: 'string', example: 'Mozilla/5.0' },
                  endpoint: { type: 'string', example: '/api/test' },
                  method: { type: 'string', example: 'POST' },
                  userId: { type: 'string', example: 'user_123' },
                  orgId: { type: 'string', example: 'demo-org' },
                  body: { type: 'object', description: 'Request body to analyze' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Threat analysis completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    threat: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string', example: 'threat_1234567890' },
                        threatType: { type: 'string', example: 'sql_injection' },
                        confidence: { type: 'integer', minimum: 0, maximum: 100, example: 85 },
                        blocked: { type: 'boolean', example: true }
                      }
                    },
                    message: { type: 'string', example: 'Threat detected and handled' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/advanced-security/metrics': {
      get: {
        tags: ['Security'],
        summary: 'Get security metrics',
        description: 'Get comprehensive security metrics and statistics',
        responses: {
          '200': {
            description: 'Security metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalThreats: { type: 'integer', example: 25 },
                        threatsBlocked: { type: 'integer', example: 20 },
                        activeAlerts: { type: 'integer', example: 3 },
                        securityEvents: { type: 'integer', example: 150 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/finops/budgets': {
      get: {
        tags: ['FinOps'],
        summary: 'Get budgets',
        description: 'Get all budgets for the organization',
        responses: {
          '200': {
            description: 'Budgets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'budget_123' },
                          name: { type: 'string', example: 'Monthly Budget' },
                          amount: { type: 'number', example: 1000 },
                          currency: { type: 'string', example: 'EUR' },
                          period: { type: 'string', example: 'monthly' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['FinOps'],
        summary: 'Create budget',
        description: 'Create a new budget',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['organizationId', 'name', 'amount', 'period'],
                properties: {
                  organizationId: { type: 'string', example: 'demo-org' },
                  name: { type: 'string', example: 'Monthly Budget' },
                  amount: { type: 'number', example: 1000 },
                  currency: { type: 'string', default: 'EUR' },
                  period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Budget created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    budgetId: { type: 'string', example: 'budget_123' },
                    message: { type: 'string', example: 'Budget created successfully' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/finops/costs': {
      get: {
        tags: ['FinOps'],
        summary: 'Get cost tracking data',
        description: 'Get cost tracking and analysis data',
        responses: {
          '200': {
            description: 'Cost data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalCost: { type: 'number', example: 2500.50 },
                        monthlyCost: { type: 'number', example: 500.25 },
                        costByCategory: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              category: { type: 'string', example: 'AI Services' },
                              amount: { type: 'number', example: 1200.00 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message' },
          details: { type: 'string', example: 'Detailed error information' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ]
};
