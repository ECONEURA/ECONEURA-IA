import { EventEmitter } from 'events';

import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
  totalCalls: number;
}

export class CircuitBreakerService extends EventEmitter {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private configs: Map<string, CircuitBreakerConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setupMetrics();
  }

  private setupMetrics() {
    // Circuit breaker metrics
    prometheus.register.gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['circuit_name']
    });

    prometheus.register.counter({
      name: 'circuit_breaker_calls_total',
      help: 'Total circuit breaker calls',
      labelNames: ['circuit_name', 'result']
    });

    prometheus.register.histogram({
      name: 'circuit_breaker_duration_seconds',
      help: 'Circuit breaker operation duration',
      labelNames: ['circuit_name', 'result']
    });
  }

  /**
   * Register a circuit breaker for a service
   */
  registerCircuit(
    name: string, 
    config: CircuitBreakerConfig
  ): void {
    this.configs.set(name, config);
    this.circuits.set(name, {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      successCount: 0,
      totalCalls: 0
    });

    // Start monitoring timer
    this.startMonitoring(name);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(circuitName);
    const config = this.configs.get(circuitName);

    if (!circuit || !config) {
      throw new Error(`Circuit breaker '${circuitName}' not registered`);
    }

    const startTime = Date.now();
    circuit.totalCalls++;

    try {
      // Check if circuit is open
      if (circuit.state === 'OPEN') {
        if (Date.now() < circuit.nextAttemptTime) {
          prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
            circuit_name: circuitName,
            result: 'rejected'
          });
          throw new Error(`Circuit breaker '${circuitName}' is OPEN`);
        } else {
          circuit.state = 'HALF_OPEN';
          circuit.successCount = 0;
        }
      }

      // Check half-open limit
      if (circuit.state === 'HALF_OPEN' && circuit.successCount >= config.halfOpenMaxCalls) {
        circuit.state = 'CLOSED';
        circuit.failureCount = 0;
      }

      // Execute operation
      const result = await operation();
      
      // Record success
      this.recordSuccess(circuitName, circuit, startTime);
      return result;

    } catch (error) {
      // Record failure
      this.recordFailure(circuitName, circuit, config, startTime);
      
      // Try fallback if available
      if (fallback) {
        try {
          const fallbackResult = await fallback();
          prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
            circuit_name: circuitName,
            result: 'fallback_success'
          });
          return fallbackResult;
        } catch (fallbackError) {
          prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
            circuit_name: circuitName,
            result: 'fallback_failure'
          });
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  private recordSuccess(circuitName: string, circuit: CircuitBreakerState, startTime: number): void {
    circuit.failureCount = 0;
    circuit.successCount++;
    
    if (circuit.state === 'HALF_OPEN') {
      circuit.state = 'CLOSED';
    }

    const duration = (Date.now() - startTime) / 1000;
    prometheus.register.getSingleMetric('circuit_breaker_duration_seconds')?.observe({
      circuit_name: circuitName,
      result: 'success'
    }, duration);

    prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
      circuit_name: circuitName,
      result: 'success'
    });

    this.updateStateMetric(circuitName, circuit.state);
    this.emit('success', { circuitName, circuit });
  }

  private recordFailure(
    circuitName: string, 
    circuit: CircuitBreakerState, 
    config: CircuitBreakerConfig,
    startTime: number
  ): void {
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();
    circuit.successCount = 0;

    const duration = (Date.now() - startTime) / 1000;
    prometheus.register.getSingleMetric('circuit_breaker_duration_seconds')?.observe({
      circuit_name: circuitName,
      result: 'failure'
    }, duration);

    prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
      circuit_name: circuitName,
      result: 'failure'
    });

    // Check if should open circuit
    if (circuit.failureCount >= config.failureThreshold) {
      circuit.state = 'OPEN';
      circuit.nextAttemptTime = Date.now() + config.recoveryTimeout;
      this.emit('circuit_opened', { circuitName, circuit });
    }

    this.updateStateMetric(circuitName, circuit.state);
    this.emit('failure', { circuitName, circuit });
  }

  private updateStateMetric(circuitName: string, state: string): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    prometheus.register.getSingleMetric('circuit_breaker_state')?.set({
      circuit_name: circuitName
    }, stateValue);
  }

  private startMonitoring(circuitName: string): void {
    const config = this.configs.get(circuitName);
    if (!config) return;

    const timer = setInterval(() => {
      this.monitorCircuit(circuitName);
    }, config.monitoringPeriod);

    this.timers.set(circuitName, timer);
  }

  private monitorCircuit(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) return;

    // Reset failure count periodically for closed circuits
    if (circuit.state === 'CLOSED' && circuit.failureCount > 0) {
      const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;
      if (timeSinceLastFailure > 60000) { // 1 minute
        circuit.failureCount = Math.max(0, circuit.failureCount - 1);
      }
    }

    this.emit('monitor', { circuitName, circuit });
  }

  /**
   * Get circuit breaker state
   */
  getState(circuitName: string): CircuitBreakerState | null {
    return this.circuits.get(circuitName) || null;
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuits);
  }

  /**
   * Reset circuit breaker
   */
  reset(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.state = 'CLOSED';
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.lastFailureTime = 0;
      circuit.nextAttemptTime = 0;
      
      this.updateStateMetric(circuitName, circuit.state);
      this.emit('reset', { circuitName, circuit });
    }
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    // Clear all timers
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();

    
  }
}

// Singleton instance
export const circuitBreakerService = new CircuitBreakerService();
