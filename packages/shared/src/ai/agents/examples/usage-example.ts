// packages/shared/src/ai/agents/examples/usage-example.ts
import { agentSystem, createOptimizedAgent } from '../index';
import { BusinessAction } from '../types';

/**
 * Ejemplo de uso del Sistema de Agentes IA de ECONEURA-IA
 * Demuestra cómo crear agentes especializados y ejecutar acciones de negocio
 */
export async function demonstrateAgentSystem() {
  console.log('🚀 Iniciando demostración del Sistema de Agentes IA');

  // 1. Registrar agentes especializados
  console.log('\n📝 Registrando agentes especializados...');

  const salesAgentId = agentSystem.registerAgent('sales', {
    name: 'Agente de Ventas Principal',
    confidence: 0.8
  });

  const operationsAgentId = agentSystem.registerAgent('operations', {
    name: 'Agente de Operaciones',
    confidence: 0.7
  });

  const complianceAgentId = agentSystem.registerAgent('compliance', {
    name: 'Agente de Cumplimiento',
    confidence: 0.9
  });

  console.log(`✅ Agentes registrados: ${salesAgentId}, ${operationsAgentId}, ${complianceAgentId}`);

  // 2. Listar agentes disponibles
  console.log('\n📋 Agentes disponibles:');
  const agents = agentSystem.listAgents();
  agents.forEach(agent => {
    console.log(`  - ${agent.type}: ${agent.status} (${agent.id})`);
  });

  // 3. Ejecutar acciones de ejemplo
  console.log('\n⚡ Ejecutando acciones de ejemplo...');

  // Acción de ventas
  const salesAction: BusinessAction = {
    id: 'sales-001',
    type: 'sales',
    priority: 'high',
    data: {
      customer: {
        id: 'CUST-001',
        name: 'Empresa ABC',
        industry: 'Tecnología',
        revenue: 5000000,
        employees: 150
      },
      opportunity: {
        value: 250000,
        probability: 0.7,
        stage: 'proposal'
      }
    },
    requiresApproval: false
  };

  console.log('\n💼 Ejecutando acción de ventas...');
  try {
    const salesResult = await agentSystem.executeAction(salesAction);
    console.log('Resultado:', {
      success: salesResult.success,
      confidence: `${(salesResult.confidence * 100).toFixed(1)}%`,
      actions: salesResult.actions,
      predictions: salesResult.predictions?.length || 0
    });
  } catch (error) {
    console.error('Error en acción de ventas:', error);
  }

  // Acción operativa
  const operationsAction: BusinessAction = {
    id: 'ops-001',
    type: 'operations',
    priority: 'medium',
    data: {
      process: {
        name: 'Procesamiento de pedidos',
        throughput: 0.8,
        quality: 0.9,
        cost: 0.6,
        time: 0.7
      },
      metrics: [
        { name: 'Tiempo de respuesta', value: 95, threshold: 90 },
        { name: 'Tasa de error', value: 2, threshold: 5 },
        { name: 'Utilización de recursos', value: 85, threshold: 80 }
      ],
      optimization: {
        automation: 0.6,
        resource_utilization: 0.75
      }
    },
    requiresApproval: false
  };

  console.log('\n🏭 Ejecutando acción operativa...');
  try {
    const opsResult = await agentSystem.executeAction(operationsAction);
    console.log('Resultado:', {
      success: opsResult.success,
      confidence: `${(opsResult.confidence * 100).toFixed(1)}%`,
      actions: opsResult.actions,
      predictions: opsResult.predictions?.length || 0
    });
  } catch (error) {
    console.error('Error en acción operativa:', error);
  }

  // Acción de cumplimiento
  const complianceAction: BusinessAction = {
    id: 'comp-001',
    type: 'compliance',
    priority: 'high',
    data: {
      policy: {
        name: 'Política de Seguridad de Datos',
        coverage: 0.9,
        enforcement: 0.8,
        monitoring: 0.85,
        training: 0.7
      },
      violation: {
        severity: 0.3,
        impact: 0.4,
        frequency: 1
      },
      remediation: {
        implemented: 8,
        planned: 10,
        effective: 0.8
      }
    },
    requiresApproval: false
  };

  console.log('\n⚖️ Ejecutando acción de cumplimiento...');
  try {
    const complianceResult = await agentSystem.executeAction(complianceAction);
    console.log('Resultado:', {
      success: complianceResult.success,
      confidence: `${(complianceResult.confidence * 100).toFixed(1)}%`,
      actions: complianceResult.actions,
      predictions: complianceResult.predictions?.length || 0
    });
  } catch (error) {
    console.error('Error en acción de cumplimiento:', error);
  }

  // 4. Obtener métricas del sistema
  console.log('\n📊 Métricas del sistema:');
  const metrics = agentSystem.getSystemMetrics();
  console.log({
    totalAgents: metrics.totalAgents,
    activeAgents: metrics.activeAgents,
    averagePerformance: `${(metrics.averagePerformance * 100).toFixed(1)}%`,
    specializationCoverage: `${(metrics.specializationCoverage * 100).toFixed(1)}%`
  });

  console.log('\n✅ Demostración completada exitosamente!');
}

/**
 * Ejemplo de uso directo de un agente individual
 */
export async function demonstrateIndividualAgent() {
  console.log('\n🤖 Demostración de agente individual');

  // Crear un agente de ventas directamente
  const salesAgent = createOptimizedAgent('sales', {
    name: 'Agente de Ventas Directo',
    confidence: 0.8
  });

  // Inicializar el agente
  await salesAgent.initialize();

  // Ejecutar una acción directamente
  const action: BusinessAction = {
    id: 'direct-001',
    type: 'sales',
    priority: 'high',
    data: {
      customer: {
        id: 'CUST-002',
        name: 'Empresa XYZ',
        industry: 'Manufactura',
        revenue: 2000000,
        employees: 75
      },
      opportunity: {
        value: 150000,
        probability: 0.8,
        stage: 'negotiation'
      }
    },
    requiresApproval: false
  };

  const result = await salesAgent.predictAndExecute(action);
  console.log('Resultado directo:', {
    success: result.success,
    confidence: `${(result.confidence * 100).toFixed(1)}%`,
    actions: result.actions
  });

  // Obtener contexto del agente
  const context = salesAgent.getContext();
  console.log('Contexto del agente:', {
    name: context.name,
    role: context.role,
    capabilities: context.capabilities.length,
    performance: context.performance
  });

  // Apagar el agente
  await salesAgent.shutdown();
}

// Función principal para ejecutar todas las demostraciones
export async function runAllDemonstrations() {
  try {
    await demonstrateAgentSystem();
    await demonstrateIndividualAgent();
  } catch (error) {
    console.error('Error en las demostraciones:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllDemonstrations();
}
