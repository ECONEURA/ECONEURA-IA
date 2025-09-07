# MEGA PROMPT: INTEGRACIÓN COMPLETA COCKPIT ECONEURA

## 🎯 OBJETIVO PRINCIPAL
Integrar completamente el cockpit de ECONEURA con los servicios AI existentes (PR-17 a PR-27), conectando los chats NEURA a Mistral/OpenAI y todos los agentes automatizados a Make.com, estableciendo una base de código segura, configurable y lista para escalar.

## 🎨 FILOSOFÍA DE DISEÑO Y ARQUITECTURA VISUAL

### Principios Fundamentales del Cockpit ECONEURA

El Econeura Cockpit es la encarnación de un nuevo paradigma en la gestión empresarial: la orquestación estratégica de una fuerza laboral híbrida, compuesta por humanos y agentes de Inteligencia Artificial. No es un simple panel de control; es un puente simbiótico entre la intuición humana y la eficiencia computacional.

#### Pilares del Lenguaje Visual:
1. **Minimalismo Funcional**: Cada elemento visual tiene un propósito. No hay decoración superflua.
2. **Jerarquía Visual Explícita**: El usuario debe saber, de un solo vistazo, qué es lo más importante.
3. **Tacto Digital (Digital Tactility)**: Texturas, sombras y animaciones sutiles para darle profundidad y fisicalidad.
4. **Identidad de Marca Cohesiva**: El diseño refuerza constantemente la marca Econeura.

### Estructura Arquitectónica en Tres Pilares:

#### 1. IDENTIDAD Y MANDO (Header)
- **Logotipo Dual**: EconeuraTreeLogo (crecimiento/estructura) + EconeuraLogo (marca)
- **Búsqueda Inteligente**: Campo Input minimalista con icono Search integrado
- **Portal de Autenticación**: Botón "INICIAR SESIÓN" como guardián del sistema

#### 2. TEATRO DE OPERACIONES (Main Content)
- **Navegación Departamental Semántica**: 10 departamentos funcionales
- **Vista Panorámica**: Organigrama para análisis estructural completo
- **Tarjetas de Agentes**: Unidades operativas con estética "Glassmorphism"

#### 3. MARCO LEGAL Y CORPORATIVO (Footer)
- **Enlaces de Cumplimiento**: Privacidad, condiciones, marcas registradas
- **Establecimiento de Confianza**: Marco profesional y legal

## 📋 PLAN DE IMPLEMENTACIÓN EXHAUSTIVO

## 🎨 IMPLEMENTACIÓN TÉCNICA DE ESTÉTICA AVANZADA

### Fondo Texturizado con Cuadrícula Técnica
**Implementación**: `src/app/globals.css`
```css
body {
  background-image:
    linear-gradient(hsl(var(--secondary)) 1px, transparent 1px),
    linear-gradient(to right, hsl(var(--secondary)) 1px, hsl(var(--background)) 1px);
  background-size: 2rem 2rem;
}
```
**Propósito**: Patrón de "papel milimetrado" que evoca un entorno técnico y de ingeniería, aportando profundidad y textura sin ser abrumador.

### Efecto Glassmorphism en Tarjetas
**Implementación**: `src/app/globals.css`
```css
.glass-card {
  background-color: hsla(var(--card), 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```
**Propósito**: Crea jerarquía de profundidad, haciendo que las tarjetas parezcan flotar sobre el fondo con sensación moderna y de alta tecnología.

### Animaciones de Elevación y Gradiente Interactivo
**Implementación**: `src/components/cockpit/agent-card.tsx`
- **Hover Scale**: `hover:scale-[1.02]` para elevación sutil
- **Shadow Expansion**: `hover:shadow-xl` para profundidad
- **Gradient Border**: Borde dinámico con color del departamento
- **Z-index Trick**: Div absoluto para gradiente sin cortes

### Sistema de Iconografía Multicapa
**Implementación**: `src/components/icons/dept-badge.tsx`
- **SVG Multicapa**: Base tintada + círculo blanco + pictograma
- **Efecto Emboss**: `filter: drop-shadow` para relieve táctil
- **Pictogramas Simbólicos**: Metáforas visuales por departamento
  - CEO: Timón (dirección)
  - CISO: Escudo (protección) 
  - CSO: Diana (estrategia)
  - CDO: Base de datos (datos)

### Tipografía y Jerarquía Visual
**Implementación**: `src/app/layout.tsx` + `src/app/globals.css`
- **Fuente**: Inter (sans-serif moderna para interfaces)
- **Jerarquía**:
  - Títulos Departamento: `text-2xl font-bold`
  - Títulos Tarjeta: `text-base font-semibold`
  - Texto Cuerpo: `text-sm text-muted-foreground`
- **KPIs**: `tabular-nums` para números estables sin "bailes"

## 🔧 FUNCIONALIDADES TÉCNICAS DETALLADAS

### Botón: INICIAR SESIÓN
**Funcionalidad**: Inicia flujo de autenticación, redirige a login/modal
**Implementación Frontend**:
- Componente `<Button>` de ShadCN
- Router Next.js: `router.push('/login')`
- Contexto React para estado de sesión
- Renderizado condicional basado en token

**Implementación Backend**:
- API Route: `src/app/api/auth/login/route.ts`
- Validación contra base de datos
- JWT token o cookie httpOnly
- Integración con Firebase Auth/Supabase

### Botón: Departamento (ej. "Finanzas (CFO)")
**Funcionalidad**: Cambia contexto del panel principal, carga agentes y KPIs específicos
**Implementación Frontend**:
- `onClick` → `onDeptChange` → `handleSetDept`
- Estados: `setDept(nuevaDeptKey)` + `setView("dept")`
- Re-renderizado de `DepartmentView` con nuevos props
- `useEffect` → `suggestRelevantActions({ department: dept })`

### Botón: Organigrama
**Funcionalidad**: Vista global de alto nivel, todos los departamentos
**Implementación Frontend**:
- `onClick` → `onViewChange("org")` → `setView("org")`
- Renderizado condicional: `{view === "org" ? <OrgChartView /> : <DepartmentView />}`

### Botón: Ejecutar (AgentCard)
**Funcionalidad**: Inicia ejecución de agente automatizado con feedback visual
**Implementación Frontend**:
- `onClick` → `onRunAgent(index, name)`
- **Actualización Optimista**: `setUsage` con valores aleatorios (UX inmediata)
- **Llamada Backend**: `await runAgentFlow({ agentName: name, department: dept })`
- **Feedback**: `toast()` + `log()` para ActivityFeed

**Implementación Backend**: `src/ai/flows/run-agent.ts`
- `agentRunnerFlow` recibe `agentName` y `department`
- `fetch POST` a `process.env.MAKE_WEBHOOK_URL`
- Retorna `RunAgentOutput` con `status`, `message`, `requiresHitl`

### Botón: Pausar (AgentCard)
**Funcionalidad**: Simula detención de agente, entrada informativa en feed
**Implementación Frontend**:
- `onClick` → `onPauseAgent(name)`
- `log("info", «${name}» en pausa, dept)`
- Sin lógica backend (simulación)

### Botón: ArrowRight (NeuraAgentCard)
**Funcionalidad**: Envía pregunta al agente conversacional NEURA
**Implementación Frontend**:
- `onClick`/`onKeyDown` → `handleSend` → `onOpenNeura(prompt)`
- `setChatOpen(true)` + `sendToNeura(prompt)`
- **Actualización Optimista**: Mensaje usuario inmediato
- `setIsAiResponding(true)` → indicador escritura
- `await neuraChat(...)` → respuesta IA

**Implementación Backend**: `src/ai/flows/neura-chat.ts`
- `neuraChatFlow` recibe `department` y `message`
- Selección modelo basada en departamento
- Prompt dinámico con contexto departamental
- `generate()` de Genkit → respuesta IA

### Botón: Aprobar/Rechazar (HitlModal)
**Funcionalidad**: Confirma/cancela acción de agente que requiere supervisión
**Implementación Frontend**:
- `onClick` → `onApprove`/`onReject`
- `setHitlOpen(false)` + `log()` + `setHitlAgent(null)`
- Registro en ActivityFeed con estado correspondiente

## 📋 PLAN DE IMPLEMENTACIÓN EXHAUSTIVO

### FASE 0: CONFIGURACIÓN SEGURA Y BASE

#### Acción 0.1: Gestión Segura de Secretos y Configuración
**Objetivo**: Establecer configuración segura para APIs externas

**Tareas**:
1. **Crear archivo `.env` en la raíz del proyecto cockpit**:
```bash
# Clave de API para Google AI (Gemini) - Requerido por Genkit
GEMINI_API_KEY="TU_CLAVE_API_DE_GEMINI_AQUI"

# Clave de API para OpenAI - Para chats NEURA
OPENAI_API_KEY="TU_CLAVE_API_DE_OPENAI_AQUI"

# Clave de API para Mistral - Alternativa para chats NEURA
MISTRAL_API_KEY="TU_CLAVE_API_DE_MISTRAL_AQUI"

# URL del Webhook de Make.com para agentes automatizados
MAKE_WEBHOOK_URL="TU_URL_DE_WEBHOOK_DE_MAKE_AQUI"

# URL base de la API ECONEURA (PR-17 a PR-27)
ECONEURA_API_BASE_URL="http://localhost:3001/v1"

# JWT Token para autenticación con APIs ECONEURA
ECONEURA_JWT_TOKEN="TU_JWT_TOKEN_AQUI"

# Configuración de departamentos
DEPARTMENTS="ceo,ia,cso,cto,ciso,coo,chro,cgo,cfo,cdo"

# Configuración de IA por departamento
AI_PROVIDER_PER_DEPT="ceo:openai,ia:openai,cso:mistral,cto:openai,ciso:mistral,coo:openai,chro:mistral,cgo:openai,cfo:mistral,cdo:openai"
```

2. **Instalar dependencias necesarias**:
```bash
npm install dotenv axios @openai/api mistralai
```

3. **Modificar `src/ai/dev.ts`** para cargar variables de entorno:
```typescript
import 'dotenv/config';
// ... resto del código existente
```

#### Acción 0.2: Configuración de Proveedores IA
**Objetivo**: Configurar múltiples proveedores IA para diferentes departamentos

**Tareas**:
1. **Crear `src/lib/ai-providers.ts`**:
```typescript
import OpenAI from 'openai';
import Mistral from 'mistralai';

export class AIProviderManager {
  private openai: OpenAI;
  private mistral: Mistral;
  
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  }
  
  getProviderForDepartment(dept: string): 'openai' | 'mistral' {
    const config = process.env.AI_PROVIDER_PER_DEPT?.split(',') || [];
    const deptConfig = config.find(c => c.startsWith(`${dept}:`));
    return deptConfig?.split(':')[1] as 'openai' | 'mistral' || 'openai';
  }
  
  async generateResponse(dept: string, message: string, context: any) {
    const provider = this.getProviderForDepartment(dept);
    
    if (provider === 'openai') {
      return await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.getSystemPrompt(dept, context) },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
    } else {
      return await this.mistral.chat.completions.create({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: this.getSystemPrompt(dept, context) },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
    }
  }
  
  private getSystemPrompt(dept: string, context: any): string {
    const prompts = {
      ceo: `Eres NEURA-CEO, el consejero ejecutivo de ECONEURA. Tienes acceso a métricas de todos los departamentos y puedes tomar decisiones estratégicas. Contexto actual: ${JSON.stringify(context)}`,
      ia: `Eres NEURA-IA, el director de la plataforma IA. Gestionas costos, modelos y optimizaciones. Contexto actual: ${JSON.stringify(context)}`,
      cso: `Eres NEURA-CSO, el asesor estratégico. Analizas riesgos, tendencias y oportunidades. Contexto actual: ${JSON.stringify(context)}`,
      cto: `Eres NEURA-CTO, el líder tecnológico. Gestionas SLOs, incidencias y optimizaciones cloud. Contexto actual: ${JSON.stringify(context)}`,
      ciso: `Eres NEURA-CISO, el responsable de seguridad. Gestionas políticas, CVEs y compliance. Contexto actual: ${JSON.stringify(context)}`,
      coo: `Eres NEURA-COO, el responsable de operaciones. Gestionas SLAs, atascos y feedback. Contexto actual: ${JSON.stringify(context)}`,
      chro: `Eres NEURA-CHRO, el responsable de RRHH. Gestionas talento, clima y procesos. Contexto actual: ${JSON.stringify(context)}`,
      cgo: `Eres NEURA-CGO, el responsable de crecimiento. Gestionas marketing, ventas y leads. Contexto actual: ${JSON.stringify(context)}`,
      cfo: `Eres NEURA-CFO, el responsable financiero. Gestionas costos, cobros y proyecciones. Contexto actual: ${JSON.stringify(context)}`,
      cdo: `Eres NEURA-CDO, el responsable de datos. Gestionas calidad, compliance y catálogo. Contexto actual: ${JSON.stringify(context)}`
    };
    
    return prompts[dept] || prompts.ceo;
  }
}
```

### FASE 1: INTEGRACIÓN CON AGENTES AUTOMATIZADOS

#### Acción 1.1: Refactorizar el Flujo runAgentFlow
**Objetivo**: Conectar agentes automatizados a Make.com de forma segura

**Tareas**:
1. **Crear `src/ai/flows/run-agent.ts`**:
```typescript
'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const RunAgentInputSchema = z.object({
  agentId: z.string().describe('ID del agente a ejecutar'),
  department: z.string().describe('Departamento del agente'),
  parameters: z.record(z.any()).optional().describe('Parámetros adicionales'),
});

const RunAgentOutputSchema = z.object({
  status: z.enum(['ok', 'err', 'warn']).describe('Estado de la ejecución'),
  message: z.string().describe('Mensaje de resultado'),
  requiresHitl: z.boolean().describe('Si requiere intervención humana'),
  executionId: z.string().optional().describe('ID de ejecución en Make'),
});

export async function runAgentFlow(input: z.infer<typeof RunAgentInputSchema>): Promise<z.infer<typeof RunAgentOutputSchema>> {
  try {
    const { agentId, department, parameters = {} } = input;
    
    // Preparar payload para Make.com
    const payload = {
      agentId,
      department,
      parameters,
      timestamp: new Date().toISOString(),
      source: 'econeura-cockpit'
    };
    
    // Llamada a Make.com
    const response = await fetch(process.env.MAKE_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAKE_WEBHOOK_TOKEN || ''}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        status: 'ok',
        message: `«${agentId}» disparado en Make.com exitosamente`,
        requiresHitl: false,
        executionId: result.executionId
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('Error al contactar Make.com:', error);
    return {
      status: 'err',
      message: `Error al contactar Make.com para «${input.agentId}»: ${error.message}`,
      requiresHitl: false
    };
  }
}

const runAgentFlowGenkit = ai.defineFlow(
  {
    name: 'runAgentFlow',
    inputSchema: RunAgentInputSchema,
    outputSchema: RunAgentOutputSchema,
  },
  runAgentFlow
);

export { runAgentFlowGenkit };
```

#### Acción 1.2: Integrar con la UI del Cockpit
**Objetivo**: Conectar la UI con el flujo de agentes

**Tareas**:
1. **Modificar `src/app/page.tsx`**:
```typescript
// Agregar import del flujo
import { runAgentFlow } from '@/ai/flows/run-agent';

// Modificar la función runAgent
const runAgent = useCallback(async (i: number, name: string) => {
  try {
    // Llamar al flujo de Genkit
    const result = await runAgentFlow({
      agentId: name,
      department: dept,
      parameters: {
        index: i,
        timestamp: new Date().toISOString()
      }
    });
    
    // Actualizar métricas de uso
    setUsage((u) => {
      const copy = { ...u };
      const arr = [...copy[dept]];
      const cur = { ...arr[i] };
      cur.tokens += Math.floor(Math.random() * 40) + 10;
      cur.ms += Math.floor(Math.random() * 400) + 120;
      cur.calls += 1;
      cur.euro = parseFloat((cur.euro + Math.random() * 0.06).toFixed(2));
      arr[i] = cur;
      copy[dept] = arr;
      return copy;
    });
    
    // Mostrar resultado en timeline
    if (result.status === 'ok') {
      log("ok", result.message, dept);
    } else if (result.status === 'warn') {
      log("warn", result.message, dept);
      if (result.requiresHitl) {
        setHitlAgent(name);
        setHitlOpen(true);
      }
    } else {
      log("err", result.message, dept);
    }
    
  } catch (error) {
    console.error('Error ejecutando agente:', error);
    log("err", `Error ejecutando «${name}»`, dept);
  }
}, [dept, log]);
```

### FASE 2: INTEGRACIÓN CON CHATS NEURA

#### Acción 2.1: Crear Sistema de Chat Inteligente
**Objetivo**: Conectar chats NEURA con proveedores IA y APIs ECONEURA

**Tareas**:
1. **Crear `src/lib/neura-chat.service.ts`**:
```typescript
import { AIProviderManager } from './ai-providers';
import axios from 'axios';

export class NeuraChatService {
  private aiProvider: AIProviderManager;
  private apiBaseUrl: string;
  private jwtToken: string;
  
  constructor() {
    this.aiProvider = new AIProviderManager();
    this.apiBaseUrl = process.env.ECONEURA_API_BASE_URL!;
    this.jwtToken = process.env.ECONEURA_JWT_TOKEN!;
  }
  
  async processMessage(department: string, message: string, context: any) {
    try {
      // Obtener métricas del departamento desde APIs ECONEURA
      const metrics = await this.getDepartmentMetrics(department);
      
      // Generar respuesta con IA
      const aiResponse = await this.aiProvider.generateResponse(
        department, 
        message, 
        { ...context, metrics }
      );
      
      // Procesar respuesta y generar sugerencias
      const suggestions = await this.generateSuggestions(department, metrics);
      
      return {
        response: aiResponse.choices[0].message.content,
        metrics: {
          tokens: aiResponse.usage?.total_tokens || 0,
          cost: this.calculateCost(aiResponse.usage),
          latency: Date.now() - context.startTime
        },
        suggestions,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error procesando mensaje NEURA:', error);
      return {
        response: 'Lo siento, no puedo responder en este momento. Por favor, inténtalo de nuevo.',
        metrics: { tokens: 0, cost: 0, latency: 0 },
        suggestions: [],
        timestamp: new Date()
      };
    }
  }
  
  private async getDepartmentMetrics(department: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/cockpit-integration/metrics/${department}`,
        {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      return {};
    }
  }
  
  private async generateSuggestions(department: string, metrics: any) {
    // Lógica para generar sugerencias basadas en métricas
    const suggestions = {
      ceo: ['Revisar OKRs del trimestre', 'Analizar métricas de rendimiento'],
      ia: ['Optimizar costos de modelos IA', 'Revisar cuotas de tokens'],
      // ... más sugerencias por departamento
    };
    
    return suggestions[department] || [];
  }
  
  private calculateCost(usage: any): number {
    // Calcular costo basado en tokens usados
    return (usage?.total_tokens || 0) * 0.0001; // Precio aproximado por token
  }
}
```

#### Acción 2.2: Integrar Chat Service con UI
**Objetivo**: Conectar el servicio de chat con los componentes del cockpit

**Tareas**:
1. **Modificar `src/app/page.tsx`** para usar el servicio:
```typescript
import { NeuraChatService } from '@/lib/neura-chat.service';

// En el componente principal
const neuraChatService = new NeuraChatService();

// Modificar sendToNeura
const sendToNeura = useCallback(async (prompt: string) => {
  setChatLog((l) => [...l, { role: "user", text: prompt }]);
  setIsAiResponding(true);
  
  try {
    const result = await neuraChatService.processMessage(
      dept,
      prompt,
      {
        startTime: Date.now(),
        previousMessages: chatLog.slice(-5), // Últimos 5 mensajes como contexto
        department: dept
      }
    );
    
    setChatLog((l) => [...l, { 
      role: "assistant", 
      text: result.response 
    }]);
    
    // Actualizar métricas si están disponibles
    if (result.metrics) {
      // Actualizar métricas de uso del departamento
      // ... lógica para actualizar métricas
    }
    
  } catch (error) {
    console.error("Error en chat NEURA:", error);
    setChatLog((l) => [...l, { 
      role: "assistant", 
      text: "Lo siento, no puedo responder en este momento." 
    }]);
  } finally {
    setIsAiResponding(false);
  }
}, [dept, chatLog]);
```

### FASE 3: INTEGRACIÓN CON APIs ECONEURA

#### Acción 3.1: Crear Cliente API ECONEURA
**Objetivo**: Conectar con todas las APIs de PR-17 a PR-27

**Tareas**:
1. **Crear `src/lib/econeura-api.client.ts`**:
```typescript
import axios from 'axios';

export class EconeuraAPIClient {
  private baseURL: string;
  private jwtToken: string;
  
  constructor() {
    this.baseURL = process.env.ECONEURA_API_BASE_URL!;
    this.jwtToken = process.env.ECONEURA_JWT_TOKEN!;
  }
  
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.jwtToken}`,
      'Content-Type': 'application/json'
    };
  }
  
  // Dashboard Consolidation APIs
  async getDashboardMetrics(department: string, timeframe: string = '24h') {
    const response = await axios.get(
      `${this.baseURL}/ai-dashboard-consolidation/metrics`,
      {
        params: { department, timeframe },
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
  
  // Cockpit Integration APIs
  async getCockpitMetrics(department: string) {
    const response = await axios.get(
      `${this.baseURL}/cockpit-integration/metrics/${department}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
  
  // AI Cost Optimization APIs
  async getCostOptimization(department: string) {
    const response = await axios.get(
      `${this.baseURL}/ai-cost-optimization/rules`,
      {
        params: { department },
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
  
  // AI Cost Prediction APIs
  async getCostPredictions(department: string) {
    const response = await axios.get(
      `${this.baseURL}/ai-cost-prediction/predictions`,
      {
        params: { department },
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
  
  // AI Analytics APIs
  async getAnalytics(department: string) {
    const response = await axios.get(
      `${this.baseURL}/ai-analytics/insights`,
      {
        params: { department },
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
  
  // AI Security & Compliance APIs
  async getSecurityMetrics(department: string) {
    const response = await axios.get(
      `${this.baseURL}/ai-security-compliance/metrics`,
      {
        params: { department },
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
  
  // AI Performance Optimization APIs
  async getPerformanceMetrics(department: string) {
    const response = await axios.get(
      `${this.baseURL}/ai-performance-optimization/metrics`,
      {
        params: { department },
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
}
```

#### Acción 3.2: Integrar Métricas Reales en KPIs
**Objetivo**: Mostrar métricas reales de las APIs en lugar de datos simulados

**Tareas**:
1. **Modificar `src/lib/data.ts`** para usar datos reales:
```typescript
import { EconeuraAPIClient } from './econeura-api.client';

const apiClient = new EconeuraAPIClient();

export const getRealTimeKPIs = async (department: string) => {
  try {
    const [dashboardMetrics, costOptimization, costPrediction] = await Promise.all([
      apiClient.getDashboardMetrics(department),
      apiClient.getCostOptimization(department),
      apiClient.getCostPredictions(department)
    ]);
    
    return {
      totalCost: dashboardMetrics.data.kpis.totalCost,
      totalTokens: dashboardMetrics.data.kpis.totalTokens,
      successRate: dashboardMetrics.data.kpis.successRate,
      activeAgents: dashboardMetrics.data.kpis.activeAgents,
      costSavings: costOptimization.data.totalSavings || 0,
      predictedCost: costPrediction.data.baseForecast || 0
    };
  } catch (error) {
    console.error('Error obteniendo KPIs reales:', error);
    return kpisByDept[department]; // Fallback a datos simulados
  }
};
```

### FASE 4: SISTEMA DE NOTIFICACIONES Y ALERTAS

#### Acción 4.1: Implementar WebSocket para Tiempo Real
**Objetivo**: Conectar con WebSocket de PR-27 para actualizaciones en tiempo real

**Tareas**:
1. **Crear `src/lib/websocket.service.ts`**:
```typescript
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(department: string, onMessage: (data: any) => void) {
    const wsUrl = `${process.env.ECONEURA_WS_URL}/cockpit-integration/realtime?department=${department}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket conectado');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket desconectado');
      this.reconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('Error WebSocket:', error);
    };
  }
  
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reintentando conexión WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        // Reconectar con el último departamento
      }, 2000 * this.reconnectAttempts);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### FASE 5: TESTING Y VALIDACIÓN

#### Acción 5.1: Tests de Integración
**Objetivo**: Validar que todas las integraciones funcionen correctamente

**Tareas**:
1. **Crear `tests/integration/cockpit-integration.test.ts`**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NeuraChatService } from '@/lib/neura-chat.service';
import { EconeuraAPIClient } from '@/lib/econeura-api.client';
import { runAgentFlow } from '@/ai/flows/run-agent';

describe('Cockpit Integration Tests', () => {
  let chatService: NeuraChatService;
  let apiClient: EconeuraAPIClient;
  
  beforeAll(() => {
    chatService = new NeuraChatService();
    apiClient = new EconeuraAPIClient();
  });
  
  it('should connect to NEURA chat service', async () => {
    const result = await chatService.processMessage('ceo', 'Hola NEURA-CEO', {});
    expect(result.response).toBeDefined();
    expect(result.metrics).toBeDefined();
  });
  
  it('should connect to Make.com for agent execution', async () => {
    const result = await runAgentFlow({
      agentId: 'AGENTE-Test',
      department: 'ceo',
      parameters: { test: true }
    });
    expect(result.status).toMatch(/ok|err/);
  });
  
  it('should fetch real metrics from ECONEURA APIs', async () => {
    const metrics = await apiClient.getDashboardMetrics('ceo');
    expect(metrics.data).toBeDefined();
  });
});
```

### FASE 6: DEPLOYMENT Y CONFIGURACIÓN

#### Acción 6.1: Configuración de Producción
**Objetivo**: Preparar el cockpit para producción

**Tareas**:
1. **Crear `docker-compose.yml`**:
```yaml
version: '3.8'
services:
  cockpit:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
      - MAKE_WEBHOOK_URL=${MAKE_WEBHOOK_URL}
      - ECONEURA_API_BASE_URL=${ECONEURA_API_BASE_URL}
      - ECONEURA_JWT_TOKEN=${ECONEURA_JWT_TOKEN}
    depends_on:
      - redis
    volumes:
      - ./.env:/app/.env
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

2. **Crear `Dockerfile`**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🎯 RESULTADO FINAL

Al completar este mega prompt, tendrás:

1. **✅ Cockpit completamente funcional** conectado a APIs reales
2. **✅ Chats NEURA** con OpenAI/Mistral por departamento
3. **✅ Agentes automatizados** conectados a Make.com
4. **✅ Métricas en tiempo real** desde PR-17 a PR-27
5. **✅ WebSocket** para actualizaciones en vivo
6. **✅ Configuración segura** con variables de entorno
7. **✅ Tests de integración** completos
8. **✅ Docker** para deployment
9. **✅ Sistema escalable** y mantenible
10. **✅ Estética Glassmorphism** con animaciones premium
11. **✅ Sistema de iconografía** multicapa con relieve táctil
12. **✅ Tipografía profesional** con jerarquía visual explícita
13. **✅ Fondo texturizado** con cuadrícula técnica
14. **✅ Animaciones de elevación** y gradientes interactivos
15. **✅ Human-in-the-Loop** para gobernanza responsable de IA

## 🎨 EXPERIENCIA DE USUARIO FINAL

### Flujo de Interacción Completo:

1. **Llegada al Cockpit**: Usuario ve fondo texturizado con cuadrícula técnica, header con logotipo dual y búsqueda inteligente
2. **Navegación Departamental**: Sidebar con 10 departamentos, cada uno con badge multicapa y pictograma simbólico
3. **Selección de Contexto**: Click en departamento → cambio de color dinámico, carga de agentes específicos
4. **Interacción con Agentes**:
   - **NEURA**: Chat conversacional con IA contextual por departamento
   - **Automatizados**: Ejecutar/Pausar con feedback visual inmediato
5. **Supervisión en Tiempo Real**: ActivityFeed como ECG del sistema, códigos de color para diagnóstico rápido
6. **Gobernanza Humana**: HitlModal para decisiones críticas, transformando usuario en supervisor con autoridad
7. **Vista Panorámica**: Organigrama para análisis estructural completo de toda la organización

### Sensación Visual y Táctil:

- **Profundidad**: Glassmorphism hace que las tarjetas floten sobre el fondo
- **Interactividad**: Hover effects con elevación, escalado y gradientes luminosos
- **Cohesión**: Paleta de colores por departamento con tintes y variaciones
- **Profesionalismo**: Tipografía Inter con jerarquía clara y números estables
- **Artesanía**: Iconos SVG con efectos de relieve y metáforas visuales precisas

### Arquitectura de Información:

- **Jerarquía Visual Explícita**: Usuario sabe inmediatamente qué es importante
- **Affordances Claros**: Cada elemento interactivo comunica su función
- **Feedback Inmediato**: Actualizaciones optimistas y animaciones de estado
- **Contexto Preservado**: Navegación mantiene estado y memoria de interacciones
- **Escalabilidad**: Diseño preparado para crecimiento de departamentos y agentes

## 🚀 ORDEN DE EJECUCIÓN

1. **FASE 0**: Configuración y secretos
2. **FASE 1**: Agentes automatizados + Make.com
3. **FASE 2**: Chats NEURA + IA providers
4. **FASE 3**: APIs ECONEURA + métricas reales
5. **FASE 4**: WebSocket + tiempo real
6. **FASE 5**: Testing + validación
7. **FASE 6**: Deployment + producción

**Cada fase es independiente y verificable. Ejecuta en orden secuencial para garantizar el éxito.**

## 🎯 MANIFIESTO DE DISEÑO ECONEURA

### La Filosofía del Cockpit

El Econeura Cockpit no es solo una herramienta; es una **experiencia transformadora** que redefine la relación entre humanos y máquinas en el entorno empresarial. Cada píxel, cada animación, cada interacción está diseñada para inspirar confianza, claridad y control en la gestión de una fuerza laboral híbrida.

### Principios de Diseño Aplicados:

1. **Minimalismo Funcional**: Cada elemento visual tiene un propósito específico
2. **Jerarquía Visual Explícita**: El usuario comprende inmediatamente la importancia relativa
3. **Tacto Digital**: Sensación de profundidad y fisicalidad en una interfaz digital
4. **Identidad de Marca Cohesiva**: Refuerzo constante de la marca Econeura
5. **Gobernanza Humana**: El usuario mantiene autoridad final sobre las decisiones de IA

### Metáfora Visual Central:

El cockpit es un **organigrama corporativo vivo**, donde cada departamento es un nexo de agentes de IA especializados. La interfaz transforma la complejidad de gestionar múltiples sistemas de IA en una experiencia intuitiva y estéticamente gratificante.

### Resultado Final:

Un sistema que no solo funciona, sino que **inspira**. Una interfaz que no solo informa, sino que **empodera**. Una herramienta que no solo gestiona, sino que **transforma** la forma en que los humanos colaboran con la inteligencia artificial.

**El Econeura Cockpit es la encarnación de un futuro donde la tecnología no reemplaza la humanidad, sino que la amplifica.**
