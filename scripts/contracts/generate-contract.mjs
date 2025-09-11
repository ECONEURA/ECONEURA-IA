#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate contract tests from OpenAPI specification
 */
class ContractGenerator {
  constructor() {
    this.openApiPath = 'apps/api/openapi/openapi.yaml';
    this.outputPath = '.artifacts/openapi.contract.json';
  }

  /**
   * Generate contract JSON from OpenAPI
   */
  generate() {
    console.log('🔄 Generating contract tests...');
    
    try {
      const openApiContent = readFileSync(this.openApiPath, 'utf8');
      const contract = this.parseOpenApiToContract(openApiContent);
      
      // Ensure artifacts directory exists
      const fs = require('fs');
      if (!fs.existsSync('.artifacts')) {
        fs.mkdirSync('.artifacts', { recursive: true });
      }
      
      writeFileSync(this.outputPath, JSON.stringify(contract, null, 2));
      
      console.log(`✅ Contract generated: ${this.outputPath}`);
      console.log(`📊 Endpoints: ${contract.endpoints.length}`);
      
    } catch (error) {
      console.error('❌ Failed to generate contract:', error.message);
      process.exit(1);
    }
  }

  /**
   * Parse OpenAPI to contract format
   */
  parseOpenApiToContract(openApiContent) {
    // Simple YAML parsing for contract generation
    const contract = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      endpoints: [],
      schemas: {},
    };

    // Extract endpoints from OpenAPI content
    const pathMatches = openApiContent.match(/^\s*\/[^:]+:/gm);
    if (pathMatches) {
      pathMatches.forEach(path => {
        const cleanPath = path.trim().replace(':', '');
        if (cleanPath.startsWith('/v1/')) {
          contract.endpoints.push({
            path: cleanPath,
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            contract: {
              request: {},
              response: {
                '200': { type: 'object' },
                '400': { type: 'object' },
                '500': { type: 'object' },
              },
            },
          });
        }
      });
    }

    return contract;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ContractGenerator();
  generator.generate();
}

export default ContractGenerator;
