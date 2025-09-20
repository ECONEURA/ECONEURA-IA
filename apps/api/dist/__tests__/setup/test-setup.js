import { structuredLogger } from '../../lib/structured-logger.js';
if (process.env.NODE_ENV === 'test') {
    structuredLogger.level = 'silent';
    structuredLogger.info = () => { };
    structuredLogger.debug = () => { };
    structuredLogger.error = () => { };
    structuredLogger.warn = () => { };
}
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
});
afterAll(() => {
});
//# sourceMappingURL=test-setup.js.map