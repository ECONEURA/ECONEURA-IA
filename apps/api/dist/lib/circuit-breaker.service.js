import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';
export class CircuitBreakerService extends EventEmitter {
    circuits = new Map();
    configs = new Map();
    timers = new Map();
    constructor() {
        super();
        this.setupMetrics();
    }
    setupMetrics() {
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
    registerCircuit(name, config) {
        this.configs.set(name, config);
        this.circuits.set(name, {
            state: 'CLOSED',
            failureCount: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0,
            successCount: 0,
            totalCalls: 0
        });
        this.startMonitoring(name);
    }
    async execute(circuitName, operation, fallback) {
        const circuit = this.circuits.get(circuitName);
        const config = this.configs.get(circuitName);
        if (!circuit || !config) {
            throw new Error(`Circuit breaker '${circuitName}' not registered`);
        }
        const startTime = Date.now();
        circuit.totalCalls++;
        try {
            if (circuit.state === 'OPEN') {
                if (Date.now() < circuit.nextAttemptTime) {
                    prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
                        circuit_name: circuitName,
                        result: 'rejected'
                    });
                    throw new Error(`Circuit breaker '${circuitName}' is OPEN`);
                }
                else {
                    circuit.state = 'HALF_OPEN';
                    circuit.successCount = 0;
                }
            }
            if (circuit.state === 'HALF_OPEN' && circuit.successCount >= config.halfOpenMaxCalls) {
                circuit.state = 'CLOSED';
                circuit.failureCount = 0;
            }
            const result = await operation();
            this.recordSuccess(circuitName, circuit, startTime);
            return result;
        }
        catch (error) {
            this.recordFailure(circuitName, circuit, config, startTime);
            if (fallback) {
                try {
                    const fallbackResult = await fallback();
                    prometheus.register.getSingleMetric('circuit_breaker_calls_total')?.inc({
                        circuit_name: circuitName,
                        result: 'fallback_success'
                    });
                    return fallbackResult;
                }
                catch (fallbackError) {
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
    recordSuccess(circuitName, circuit, startTime) {
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
    recordFailure(circuitName, circuit, config, startTime) {
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
        if (circuit.failureCount >= config.failureThreshold) {
            circuit.state = 'OPEN';
            circuit.nextAttemptTime = Date.now() + config.recoveryTimeout;
            this.emit('circuit_opened', { circuitName, circuit });
        }
        this.updateStateMetric(circuitName, circuit.state);
        this.emit('failure', { circuitName, circuit });
    }
    updateStateMetric(circuitName, state) {
        const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
        prometheus.register.getSingleMetric('circuit_breaker_state')?.set({
            circuit_name: circuitName
        }, stateValue);
    }
    startMonitoring(circuitName) {
        const config = this.configs.get(circuitName);
        if (!config)
            return;
        const timer = setInterval(() => {
            this.monitorCircuit(circuitName);
        }, config.monitoringPeriod);
        this.timers.set(circuitName, timer);
    }
    monitorCircuit(circuitName) {
        const circuit = this.circuits.get(circuitName);
        if (!circuit)
            return;
        if (circuit.state === 'CLOSED' && circuit.failureCount > 0) {
            const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;
            if (timeSinceLastFailure > 60000) {
                circuit.failureCount = Math.max(0, circuit.failureCount - 1);
            }
        }
        this.emit('monitor', { circuitName, circuit });
    }
    getState(circuitName) {
        return this.circuits.get(circuitName) || null;
    }
    getAllStates() {
        return new Map(this.circuits);
    }
    reset(circuitName) {
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
    async start() {
    }
    async stop() {
        for (const [name, timer] of this.timers) {
            clearInterval(timer);
        }
        this.timers.clear();
    }
}
export const circuitBreakerService = new CircuitBreakerService();
//# sourceMappingURL=circuit-breaker.service.js.map