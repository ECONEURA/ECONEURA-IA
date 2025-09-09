import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CSPBankingService, cspBankingService } from '../../../lib/csp-sri-banking.service.js';

describe('CSPBankingService - PR-75', () => {
  let service: CSPBankingService;

  beforeEach(() => {
    service = new CSPBankingService({
      enabled: true,
      bankingMode: true,
      strictMode: true,
      enforceMode: true,
      reportOnly: false,
      alertThreshold: 5,
      maxReportAge: 30
    });
  });

  describe('Service Initialization', () => {
    it('should initialize with banking defaults', () => {
      const config = service.getConfig();

      expect(config.bankingMode).toBe(true);
      expect(config.strictMode).toBe(true);
      expect(config.enforceMode).toBe(true);
      expect(config.allowedScripts).not.toContain('unsafe-inline');
      expect(config.allowedStyles).not.toContain('unsafe-inline');
      expect(config.customDirectives['frame-ancestors']).toContain('none');
      expect(config.customDirectives['object-src']).toContain('none');
    });

    it('should initialize with default configuration', () => {
      const defaultService = new CSPBankingService();
      const config = defaultService.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.reportUri).toBe('/api/security/csp-reports');
      expect(config.alertThreshold).toBe(10);
      expect(config.maxReportAge).toBe(30);
    });
  });

  describe('CSP Header Generation', () => {
    it('should generate CSP header for banking mode', () => {
      const cspHeader = service.generateCSPHeader();

      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("style-src 'self'");
      expect(cspHeader).toContain("img-src 'self' data:");
      expect(cspHeader).toContain("font-src 'self'");
      expect(cspHeader).toContain("connect-src 'self'");
      expect(cspHeader).toContain("frame-ancestors none");
      expect(cspHeader).toContain("object-src none");
      expect(cspHeader).toContain("base-uri 'self'");
      expect(cspHeader).toContain("form-action 'self'");
      expect(cspHeader).toContain("upgrade-insecure-requests");
      expect(cspHeader).toContain("block-all-mixed-content");
    });

    it('should include report-uri in CSP header', () => {
      const cspHeader = service.generateCSPHeader();

      expect(cspHeader).toContain("report-uri /api/security/csp-reports");
    });

    it('should return empty string when disabled', () => {
      service.updateConfig({ enabled: false });
      const cspHeader = service.generateCSPHeader();

      expect(cspHeader).toBe('');
    });
  });

  describe('SRI Hash Generation', () => {
    it('should generate SRI hashes for resources', () => {
      const resources = [
        {
          url: 'https://example.com/script.js',
          content: 'console.log("test");',
          algorithm: 'sha384' as const
        },
        {
          url: 'https://example.com/style.css',
          content: 'body { color: red; }'
        }
      ];

      const hashes = service.generateSRIHashes(resources);

      expect(hashes).toHaveLength(2);
      expect(hashes[0]).toHaveProperty('url', 'https://example.com/script.js');
      expect(hashes[0]).toHaveProperty('algorithm', 'sha384');
      expect(hashes[0]).toHaveProperty('hash');
      expect(hashes[0]).toHaveProperty('integrity');
      expect(hashes[0].integrity).toMatch(/^sha384-/);

      expect(hashes[1]).toHaveProperty('url', 'https://example.com/style.css');
      expect(hashes[1]).toHaveProperty('algorithm', 'sha384'); // default
      expect(hashes[1]).toHaveProperty('hash');
      expect(hashes[1]).toHaveProperty('integrity');
    });

    it('should use different algorithms correctly', () => {
      const resources = [
        {
          url: 'https://example.com/sha256.js',
          content: 'test',
          algorithm: 'sha256' as const
        },
        {
          url: 'https://example.com/sha512.js',
          content: 'test',
          algorithm: 'sha512' as const
        }
      ];

      const hashes = service.generateSRIHashes(resources);

      expect(hashes[0].algorithm).toBe('sha256');
      expect(hashes[0].integrity).toMatch(/^sha256-/);
      expect(hashes[1].algorithm).toBe('sha512');
      expect(hashes[1].integrity).toMatch(/^sha512-/);
    });
  });

  describe('CSP Violation Processing', () => {
    it('should process CSP violation and calculate severity', async () => {
      const violationData = {
        'csp-report': {
          'document-uri': 'https://bank.example.com/dashboard',
          'violated-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://malicious.com/script.js'
        }
      };

      const metadata = {
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.1',
        organizationId: 'org-123',
        userId: 'user-456'
      };

      const report = await service.processCSPViolation(violationData, metadata);

      expect(report).toHaveProperty('id');
      expect(report.type).toBe('csp');
      expect(report.severity).toBe('critical'); // script-src with external URI
      expect(report.source).toBe('https://bank.example.com/dashboard');
      expect(report.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(report.ipAddress).toBe('192.168.1.1');
      expect(report.organizationId).toBe('org-123');
      expect(report.userId).toBe('user-456');
      expect(report.resolved).toBe(false);
      expect(report.tags).toContain('script');
      expect(report.tags).toContain('external');
    });

    it('should calculate correct severity for different violations', async () => {
      const testCases = [
        {
          violation: {
            'violated-directive': 'script-src',
            'blocked-uri': 'https://external.com/script.js'
          },
          expectedSeverity: 'critical'
        },
        {
          violation: {
            'violated-directive': 'connect-src',
            'blocked-uri': 'https://external.com/api'
          },
          expectedSeverity: 'critical'
        },
        {
          violation: {
            'violated-directive': 'frame-ancestors',
            'blocked-uri': 'https://external.com'
          },
          expectedSeverity: 'critical'
        },
        {
          violation: {
            'violated-directive': 'style-src',
            'blocked-uri': 'https://external.com/style.css'
          },
          expectedSeverity: 'high'
        },
        {
          violation: {
            'violated-directive': 'img-src',
            'blocked-uri': 'https://external.com/image.jpg'
          },
          expectedSeverity: 'high'
        },
        {
          violation: {
            'violated-directive': 'font-src',
            'blocked-uri': 'https://external.com/font.woff'
          },
          expectedSeverity: 'medium'
        }
      ];

      for (const testCase of testCases) {
        const violationData = {
          'csp-report': {
            'document-uri': 'https://bank.example.com/test',
            'violated-directive': testCase.violation['violated-directive'],
            'original-policy': "default-src 'self'",
            'disposition': 'enforce',
            'blocked-uri': testCase.violation['blocked-uri']
          }
        };

        const metadata = {
          userAgent: 'Test Browser',
          ipAddress: '192.168.1.1'
        };

        const report = await service.processCSPViolation(violationData, metadata);
        expect(report.severity).toBe(testCase.expectedSeverity);
      }
    });

    it('should generate appropriate tags for violations', async () => {
      const violationData = {
        'csp-report': {
          'document-uri': 'https://bank.example.com/dashboard',
          'violated-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://malicious.com/script.js',
          'script-sample': 'alert("xss")',
          'source-file': 'https://malicious.com/script.js'
        }
      };

      const metadata = {
        userAgent: 'Test Browser',
        ipAddress: '192.168.1.1'
      };

      const report = await service.processCSPViolation(violationData, metadata);

      expect(report.tags).toContain('script');
      expect(report.tags).toContain('external');
      expect(report.tags).toContain('inline-script');
      expect(report.tags).toContain('external-script');
    });
  });

  describe('SRI Violation Processing', () => {
    it('should process SRI violation and calculate severity', async () => {
      const violationData = {
        'sri-report': {
          'document-uri': 'https://bank.example.com/dashboard',
          'blocked-uri': 'https://cdn.example.com/script.js',
          'violation-type': 'integrity-mismatch',
          'expected-hash': 'sha384-expected123',
          'actual-hash': 'sha384-actual456',
          'algorithm': 'sha384'
        }
      };

      const metadata = {
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.1',
        organizationId: 'org-123',
        userId: 'user-456'
      };

      const report = await service.processSRIViolation(violationData, metadata);

      expect(report).toHaveProperty('id');
      expect(report.type).toBe('sri');
      expect(report.severity).toBe('critical'); // integrity-mismatch
      expect(report.source).toBe('https://bank.example.com/dashboard');
      expect(report.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(report.ipAddress).toBe('192.168.1.1');
      expect(report.organizationId).toBe('org-123');
      expect(report.userId).toBe('user-456');
      expect(report.resolved).toBe(false);
      expect(report.tags).toContain('sri');
      expect(report.tags).toContain('integrity-mismatch');
      expect(report.tags).toContain('sha384');
    });

    it('should calculate correct severity for different SRI violations', async () => {
      const testCases = [
        {
          violation: { 'violation-type': 'integrity-mismatch' },
          expectedSeverity: 'critical'
        },
        {
          violation: { 'violation-type': 'missing-integrity' },
          expectedSeverity: 'high'
        },
        {
          violation: { 'violation-type': 'invalid-integrity' },
          expectedSeverity: 'medium'
        }
      ];

      for (const testCase of testCases) {
        const violationData = {
          'sri-report': {
            'document-uri': 'https://bank.example.com/test',
            'blocked-uri': 'https://cdn.example.com/script.js',
            'violation-type': testCase.violation['violation-type']
          }
        };

        const metadata = {
          userAgent: 'Test Browser',
          ipAddress: '192.168.1.1'
        };

        const report = await service.processSRIViolation(violationData, metadata);
        expect(report.severity).toBe(testCase.expectedSeverity);
      }
    });
  });

  describe('Statistics and Reporting', () => {
    beforeEach(async () => {
      // Generar algunos reportes de prueba
      const cspViolation = {
        'csp-report': {
          'document-uri': 'https://bank.example.com/dashboard',
          'violated-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://malicious.com/script.js'
        }
      };

      const sriViolation = {
        'sri-report': {
          'document-uri': 'https://bank.example.com/dashboard',
          'blocked-uri': 'https://cdn.example.com/script.js',
          'violation-type': 'integrity-mismatch'
        }
      };

      const metadata = {
        userAgent: 'Test Browser',
        ipAddress: '192.168.1.1'
      };

      await service.processCSPViolation(cspViolation, metadata);
      await service.processSRIViolation(sriViolation, metadata);
    });

    it('should provide comprehensive statistics', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('totalReports');
      expect(stats).toHaveProperty('reportsByType');
      expect(stats).toHaveProperty('reportsBySeverity');
      expect(stats).toHaveProperty('reportsBySource');
      expect(stats).toHaveProperty('topViolations');
      expect(stats).toHaveProperty('recentTrends');
      expect(stats).toHaveProperty('unresolvedCount');
      expect(stats).toHaveProperty('averageResolutionTime');

      expect(stats.reportsByType).toHaveProperty('csp');
      expect(stats.reportsByType).toHaveProperty('sri');
      expect(stats.reportsBySeverity).toHaveProperty('critical');
    });

    it('should filter reports correctly', () => {
      const cspReports = service.getReports({ type: 'csp' });
      const sriReports = service.getReports({ type: 'sri' });
      const criticalReports = service.getReports({ severity: 'critical' });
      const unresolvedReports = service.getReports({ resolved: false });

      expect(cspReports.every(r => r.type === 'csp')).toBe(true);
      expect(sriReports.every(r => r.type === 'sri')).toBe(true);
      expect(criticalReports.every(r => r.severity === 'critical')).toBe(true);
      expect(unresolvedReports.every(r => !r.resolved)).toBe(true);
    });

    it('should support pagination', () => {
      const firstPage = service.getReports({ limit: 1, offset: 0 });
      const secondPage = service.getReports({ limit: 1, offset: 1 });

      expect(firstPage).toHaveLength(1);
      expect(secondPage).toHaveLength(1);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('Report Resolution', () => {
    it('should resolve reports correctly', async () => {
      const violationData = {
        'csp-report': {
          'document-uri': 'https://bank.example.com/dashboard',
          'violated-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://malicious.com/script.js'
        }
      };

      const metadata = {
        userAgent: 'Test Browser',
        ipAddress: '192.168.1.1'
      };

      const report = await service.processCSPViolation(violationData, metadata);
      const success = service.resolveReport(report.id, 'Fixed by updating CSP policy');

      expect(success).toBe(true);

      const reports = service.getReports({ resolved: true });
      const resolvedReport = reports.find(r => r.id === report.id);

      expect(resolvedReport).toBeDefined();
      expect(resolvedReport?.resolved).toBe(true);
      expect(resolvedReport?.resolution).toBe('Fixed by updating CSP policy');
    });

    it('should return false for non-existent report', () => {
      const success = service.resolveReport('non-existent-id', 'Test resolution');
      expect(success).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        enabled: false,
        alertThreshold: 20,
        bankingMode: false,
        allowedScripts: ['self', 'unsafe-inline']
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.alertThreshold).toBe(20);
      expect(config.bankingMode).toBe(false);
      expect(config.allowedScripts).toContain('unsafe-inline');
    });

    it('should reinitialize banking defaults when banking mode changes', () => {
      service.updateConfig({ bankingMode: false });
      let config = service.getConfig();
      expect(config.allowedScripts).toContain('unsafe-inline');

      service.updateConfig({ bankingMode: true });
      config = service.getConfig();
      expect(config.allowedScripts).not.toContain('unsafe-inline');
      expect(config.strictMode).toBe(true);
      expect(config.enforceMode).toBe(true);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old reports', async () => {
      // Crear un reporte antiguo
      const oldDate = new Date(Date.now() - (35 * 24 * 60 * 60 * 1000)); // 35 días atrás
      const violationData = {
        'csp-report': {
          'document-uri': 'https://bank.example.com/old',
          'violated-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://old.com/script.js'
        }
      };

      const metadata = {
        userAgent: 'Test Browser',
        ipAddress: '192.168.1.1'
      };

      const report = await service.processCSPViolation(violationData, metadata);

      // Simular que el reporte es antiguo
      (report as any).timestamp = oldDate;

      const initialCount = service.getReports().length;
      const removedCount = service.cleanupOldReports();
      const finalCount = service.getReports().length;

      expect(removedCount).toBeGreaterThan(0);
      expect(finalCount).toBeLessThan(initialCount);
    });
  });

  describe('Service Reset', () => {
    it('should reset service state', async () => {
      // Generar algunos reportes
      const violationData = {
        'csp-report': {
          'document-uri': 'https://bank.example.com/test',
          'violated-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://test.com/script.js'
        }
      };

      const metadata = {
        userAgent: 'Test Browser',
        ipAddress: '192.168.1.1'
      };

      await service.processCSPViolation(violationData, metadata);

      expect(service.getReports().length).toBeGreaterThan(0);

      service.reset();

      expect(service.getReports().length).toBe(0);
      expect(service.getStats().totalReports).toBe(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should provide singleton instance', () => {
      expect(cspBankingService).toBeInstanceOf(CSPBankingService);
      expect(cspBankingService.getConfig()).toBeDefined();
    });
  });
});
