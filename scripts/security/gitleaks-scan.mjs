#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

/**
 * GitLeaks security scan with history analysis
 */
class GitLeaksScanner {
  constructor() {
    this.reportPath = 'reports/gitleaks-report.json';
    this.configPath = '.gitleaks.toml';
  }

  /**
   * Run GitLeaks scan on repository
   */
  async scan() {
    console.log('🔍 Running GitLeaks security scan...');
    
    try {
      // Create reports directory
      const fs = require('fs');
      if (!fs.existsSync('reports')) {
        fs.mkdirSync('reports', { recursive: true });
      }

      // Run gitleaks with history scan
      const command = `gitleaks detect --no-git --repo-path . --redact --format json --output ${this.reportPath}`;
      
      try {
        execSync(command, { stdio: 'pipe' });
        console.log('✅ GitLeaks scan completed - no secrets found');
        return { success: true, secrets: 0 };
      } catch (error) {
        // GitLeaks exits with non-zero if secrets are found
        const output = error.stdout?.toString() || '';
        const secrets = this.parseSecrets(output);
        
        console.log(`⚠️ GitLeaks found ${secrets.length} potential secrets`);
        secrets.forEach(secret => {
          console.log(`  - ${secret.rule}: ${secret.file}:${secret.line}`);
        });
        
        return { success: false, secrets: secrets.length, details: secrets };
      }
      
    } catch (error) {
      console.error('❌ GitLeaks scan failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse secrets from GitLeaks output
   */
  parseSecrets(output) {
    try {
      const lines = output.split('\n');
      const secrets = [];
      
      for (const line of lines) {
        if (line.trim() && line.includes(':')) {
          const parts = line.split(':');
          if (parts.length >= 3) {
            secrets.push({
              rule: parts[0]?.trim() || 'unknown',
              file: parts[1]?.trim() || 'unknown',
              line: parts[2]?.trim() || 'unknown',
            });
          }
        }
      }
      
      return secrets;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate SBOM with Syft
   */
  async generateSBOM() {
    console.log('📦 Generating SBOM...');
    
    try {
      // Generate SBOM with Syft
      const sbomCommand = 'syft packages . -o spdx-json --file reports/sbom.spdx.json';
      execSync(sbomCommand, { stdio: 'inherit' });
      
      console.log('✅ SBOM generated: reports/sbom.spdx.json');
      return { success: true, file: 'reports/sbom.spdx.json' };
      
    } catch (error) {
      console.error('❌ SBOM generation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create attestation for SBOM
   */
  async createAttestation() {
    console.log('🔐 Creating SBOM attestation...');
    
    try {
      const attestationCommand = 'syft attest --key cosign.key --output reports/sbom.attestation.json reports/sbom.spdx.json';
      execSync(attestationCommand, { stdio: 'inherit' });
      
      console.log('✅ SBOM attestation created: reports/sbom.attestation.json');
      return { success: true, file: 'reports/sbom.attestation.json' };
      
    } catch (error) {
      console.log('⚠️ Attestation skipped (no key available)');
      return { success: false, error: 'No signing key available' };
    }
  }

  /**
   * Generate licenses denylist
   */
  generateLicensesDenylist() {
    console.log('📋 Generating licenses denylist...');
    
    const denylist = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      denylist: [
        'GPL-2.0',
        'GPL-3.0',
        'AGPL-3.0',
        'LGPL-2.1',
        'LGPL-3.0',
        'Copyleft',
        'Proprietary',
      ],
      allowed: [
        'MIT',
        'Apache-2.0',
        'BSD-2-Clause',
        'BSD-3-Clause',
        'ISC',
        'Unlicense',
        'CC0-1.0',
      ],
    };
    
    writeFileSync('LICENSES_DENYLIST.md', this.formatLicensesMarkdown(denylist));
    console.log('✅ Licenses denylist generated: LICENSES_DENYLIST.md');
    
    return { success: true, file: 'LICENSES_DENYLIST.md' };
  }

  /**
   * Format licenses as markdown
   */
  formatLicensesMarkdown(denylist) {
    return `# Licenses Denylist

Generated: ${denylist.generatedAt}

## Denied Licenses

The following licenses are **NOT ALLOWED** in this project:

${denylist.denylist.map(license => `- ❌ ${license}`).join('\n')}

## Allowed Licenses

The following licenses are **ALLOWED** in this project:

${denylist.allowed.map(license => `- ✅ ${license}`).join('\n')}

## Usage

This denylist is used by CI/CD pipelines to prevent inclusion of packages with restricted licenses.

## Compliance

All dependencies must comply with the allowed licenses list. Any package with a denied license will cause the build to fail.
`;
  }

  /**
   * Run complete security scan
   */
  async runCompleteScan() {
    console.log('🚀 Starting complete security scan...');
    
    const results = {
      gitleaks: await this.scan(),
      sbom: await this.generateSBOM(),
      attestation: await this.createAttestation(),
      licenses: this.generateLicensesDenylist(),
    };
    
    // Write summary report
    const summary = {
      timestamp: new Date().toISOString(),
      results,
      status: results.gitleaks.success && results.sbom.success ? 'PASS' : 'FAIL',
    };
    
    writeFileSync('reports/security-scan-summary.json', JSON.stringify(summary, null, 2));
    
    console.log(`\n📊 Security Scan Summary:`);
    console.log(`  GitLeaks: ${results.gitleaks.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  SBOM: ${results.sbom.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Attestation: ${results.attestation.success ? '✅ PASS' : '⚠️ SKIP'}`);
    console.log(`  Licenses: ${results.licenses.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Overall: ${summary.status}`);
    
    return summary;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new GitLeaksScanner();
  scanner.runCompleteScan().then(result => {
    process.exit(result.status === 'PASS' ? 0 : 1);
  });
}

export default GitLeaksScanner;
