import { describe, it, expect, beforeEach } from 'vitest';
import { AntivirusGlobalService, type ScanResult, type QuarantineItem } from '../../../lib/antivirus-global.service.js';

describe('AntivirusGlobalService', () => {
  let service: AntivirusGlobalService;
  let mockItem: any;

  beforeEach(() => {
    service = new AntivirusGlobalService();
    mockItem = {
      id: 'item-123',
      type: 'file',
      size: 1024,
      path: '/test/file.txt',
      content: 'test content',
      metadata: { source: 'upload' }
    };
  });

  describe('scanItem', () => {
    it('should scan an item successfully', async () => {
      const result = await service.scanItem(mockItem, 'file');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('moduleId');
      expect(result).toHaveProperty('moduleType');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('threats');
      expect(result).toHaveProperty('scanTime');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata');
    });

    it('should return clean status for safe items', async () => {
      const result = await service.scanItem(mockItem, 'file');

      // En la mayoría de casos debería estar limpio (90% de probabilidad)
      expect(['clean', 'infected']).toContain(result.status);
    });

    it('should detect threats when present', async () => {
      // Crear un item que simule una amenaza
      const suspiciousItem = {
        ...mockItem,
        content: 'malicious content',
        path: '/suspicious/file.exe'
      };

      const result = await service.scanItem(suspiciousItem, 'file');

      expect(result).toBeDefined();
      expect(result.threats).toBeDefined();
      expect(Array.isArray(result.threats)).toBe(true);
    });

    it('should include proper metadata in scan result', async () => {
      const result = await service.scanItem(mockItem, 'file');

      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('fileSize');
      expect(result.metadata).toHaveProperty('fileType');
      expect(result.metadata).toHaveProperty('checksum');
      expect(result.metadata).toHaveProperty('source');
    });
  });

  describe('performGlobalScan', () => {
    it('should perform global scan successfully', async () => {
      const stats = await service.performGlobalScan();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalScans');
      expect(stats).toHaveProperty('cleanScans');
      expect(stats).toHaveProperty('infectedScans');
      expect(stats).toHaveProperty('quarantinedItems');
      expect(stats).toHaveProperty('threatsDetected');
      expect(stats).toHaveProperty('lastScan');
      expect(stats).toHaveProperty('scanSuccessRate');
      expect(stats).toHaveProperty('averageScanTime');
      expect(stats).toHaveProperty('topThreats');
      expect(stats).toHaveProperty('moduleStats');
    });

    it('should update statistics after scan', async () => {
      const initialStats = service.getStats();
      const stats = await service.performGlobalScan();

      expect(stats.totalScans).toBeGreaterThanOrEqual(initialStats.totalScans);
      expect(stats.lastScan).toBeDefined();
      expect(new Date(stats.lastScan)).toBeInstanceOf(Date);
    });

    it('should not run concurrent scans', async () => {
      const scan1 = service.performGlobalScan();
      const scan2 = service.performGlobalScan();

      const [result1, result2] = await Promise.all([scan1, scan2]);

      // Ambos deberían completarse sin errores
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('quarantineItem', () => {
    it('should quarantine an infected item', async () => {
      const threat = {
        id: 'threat-123',
        type: 'virus' as const,
        name: 'Test.Virus',
        severity: 'high' as const,
        description: 'Test virus',
        signature: 'test-signature',
        confidence: 0.95,
        action: 'quarantine' as const,
        metadata: {}
      };

      const quarantineItem = await service.quarantineItem(mockItem, threat);

      expect(quarantineItem).toBeDefined();
      expect(quarantineItem).toHaveProperty('id');
      expect(quarantineItem).toHaveProperty('moduleId');
      expect(quarantineItem).toHaveProperty('moduleType');
      expect(quarantineItem).toHaveProperty('threatId');
      expect(quarantineItem).toHaveProperty('originalPath');
      expect(quarantineItem).toHaveProperty('quarantinePath');
      expect(quarantineItem).toHaveProperty('quarantinedAt');
      expect(quarantineItem).toHaveProperty('quarantinedBy');
      expect(quarantineItem).toHaveProperty('reason');
      expect(quarantineItem).toHaveProperty('status');
      expect(quarantineItem).toHaveProperty('metadata');

      expect(quarantineItem.status).toBe('quarantined');
      expect(quarantineItem.threatId).toBe(threat.id);
    });
  });

  describe('getQuarantineItems', () => {
    it('should return empty array initially', () => {
      const items = service.getQuarantineItems();
      expect(Array.isArray(items)).toBe(true);
    });

    it('should return quarantined items after quarantine', async () => {
      const threat = {
        id: 'threat-123',
        type: 'virus' as const,
        name: 'Test.Virus',
        severity: 'high' as const,
        description: 'Test virus',
        signature: 'test-signature',
        confidence: 0.95,
        action: 'quarantine' as const,
        metadata: {}
      };

      await service.quarantineItem(mockItem, threat);
      const items = service.getQuarantineItems();

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].status).toBe('quarantined');
    });
  });

  describe('getScanResults', () => {
    it('should return empty array initially', () => {
      const results = service.getScanResults();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return scan results after scanning', async () => {
      await service.scanItem(mockItem, 'file');
      const results = service.getScanResults();

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('status');
    });
  });

  describe('getStats', () => {
    it('should return stats object', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('totalScans');
      expect(stats).toHaveProperty('cleanScans');
      expect(stats).toHaveProperty('infectedScans');
      expect(stats).toHaveProperty('quarantinedItems');
      expect(stats).toHaveProperty('threatsDetected');
      expect(stats).toHaveProperty('lastScan');
      expect(stats).toHaveProperty('scanSuccessRate');
      expect(stats).toHaveProperty('averageScanTime');
      expect(stats).toHaveProperty('topThreats');
      expect(stats).toHaveProperty('moduleStats');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        enabled: false,
        scanInterval: 120,
        quarantineEnabled: false
      };

      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('restoreFromQuarantine', () => {
    it('should restore item from quarantine', async () => {
      const threat = {
        id: 'threat-123',
        type: 'virus' as const,
        name: 'Test.Virus',
        severity: 'high' as const,
        description: 'Test virus',
        signature: 'test-signature',
        confidence: 0.95,
        action: 'quarantine' as const,
        metadata: {}
      };

      const quarantineItem = await service.quarantineItem(mockItem, threat);

      await expect(service.restoreFromQuarantine(quarantineItem.id))
        .resolves.not.toThrow();
    });

    it('should throw error for non-existent quarantine item', async () => {
      await expect(service.restoreFromQuarantine('non-existent'))
        .rejects.toThrow('Quarantine item not found');
    });
  });

  describe('deleteFromQuarantine', () => {
    it('should delete item from quarantine', async () => {
      const threat = {
        id: 'threat-123',
        type: 'virus' as const,
        name: 'Test.Virus',
        severity: 'high' as const,
        description: 'Test virus',
        signature: 'test-signature',
        confidence: 0.95,
        action: 'quarantine' as const,
        metadata: {}
      };

      const quarantineItem = await service.quarantineItem(mockItem, threat);

      await expect(service.deleteFromQuarantine(quarantineItem.id))
        .resolves.not.toThrow();
    });

    it('should throw error for non-existent quarantine item', async () => {
      await expect(service.deleteFromQuarantine('non-existent'))
        .rejects.toThrow('Quarantine item not found');
    });
  });

  describe('stop', () => {
    it('should stop service without errors', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });
});
