#!/usr/bin/env node

/**
 * Security CI Script
 * PR-104: Anti-secretos & SBOM (repo) - scripts y CI
 * 
 * Script principal para ejecutar todas las verificaciones de seguridad
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const CONFIG = {
  tools: {
    antiSecrets: {
      enabled: true,
      script: 'scripts/security/anti-secrets-scan.mjs',
      timeout: 300000 // 5 minutos
    },
    sbom: {
      enabled: true,
      script: 'scripts/security/sbom-generator.mjs',
      timeout: 600000 // 10 minutos
    },
    audit: {
      enabled: true,
      commands: ['pnpm audit --audit-level=high', 'npm audit --audit-level=high'],
      timeout: 180000 // 3 minutos
    },
    snyk: {
      enabled: true,
      command: 'npx snyk test --severity-threshold=high',
      timeout: 300000 // 5 minutos
    }
  },
  outputDir: 'reports',
  thresholds: {
    maxSecrets: 0,
    maxVulnerabilities: 10,
    maxHighSeverityVulns: 0,
    maxCriticalVulns: 0
  }
};

class SecurityCI {
  constructor() {
    this.results = {
      antiSecrets: { success: false, secretsFound: 0, error: null },
      sbom: { success: false, packages: 0, vulnerabilities: 0, error: null },
      audit: { success: false, vulnerabilities: 0, error: null },
      snyk: { success: false, vulnerabilities: 0, error: null },
      overall: { success: false, score: 0, issues: [] }
    };
  }

  async run() {
    console.log('🔒 Iniciando verificaciones de seguridad CI...\n');

    try {
      // Crear directorio de reportes
      mkdirSync(CONFIG.outputDir, { recursive: true });

      // Ejecutar verificaciones
      await this.runAntiSecretsScan();
      await this.runSBOMGeneration();
      await this.runDependencyAudit();
      await this.runSnykScan();

      // Evaluar resultados
      await this.evaluateResults();

      // Generar reporte final
      await this.generateFinalReport();

      // Mostrar resumen
      this.showSummary();

      return this.results.overall.success ? 0 : 1;

    } catch (error) {
      console.error('❌ Error durante verificaciones de seguridad:', error.message);
      this.results.overall.error = error.message;
      return 1;
    }
  }

  async runAntiSecretsScan() {
    if (!CONFIG.tools.antiSecrets.enabled) return;

    console.log('🔐 Ejecutando escaneo anti-secretos...');

    try {
      const output = execSync(`node ${CONFIG.tools.antiSecrets.script}`, {
        encoding: 'utf8',
        timeout: CONFIG.tools.antiSecrets.timeout,
        stdio: 'pipe'
      });

      // Leer reporte generado
      if (existsSync(join(CONFIG.outputDir, 'anti-secrets-scan.json'))) {
        const report = JSON.parse(readFileSync(join(CONFIG.outputDir, 'anti-secrets-scan.json'), 'utf8'));
        this.results.antiSecrets.secretsFound = report.summary.secretsFound;
        this.results.antiSecrets.success = report.summary.secretsFound <= CONFIG.thresholds.maxSecrets;
      }

      console.log(`✅ Anti-secretos completado: ${this.results.antiSecrets.secretsFound} secretos encontrados`);

    } catch (error) {
      console.error(`❌ Anti-secretos falló: ${error.message}`);
      this.results.antiSecrets.error = error.message;
      this.results.antiSecrets.success = false;
    }
  }

  async runSBOMGeneration() {
    if (!CONFIG.tools.sbom.enabled) return;

    console.log('📦 Generando SBOM...');

    try {
      const output = execSync(`node ${CONFIG.tools.sbom.script}`, {
        encoding: 'utf8',
        timeout: CONFIG.tools.sbom.timeout,
        stdio: 'pipe'
      });

      // Leer reporte generado
      if (existsSync(join(CONFIG.outputDir, 'sbom-report.json'))) {
        const report = JSON.parse(readFileSync(join(CONFIG.outputDir, 'sbom-report.json'), 'utf8'));
        this.results.sbom.packages = report.summary.totalPackages;
        this.results.sbom.vulnerabilities = report.summary.vulnerabilities;
        this.results.sbom.success = report.summary.vulnerabilities <= CONFIG.thresholds.maxVulnerabilities;
      }

      console.log(`✅ SBOM completado: ${this.results.sbom.packages} paquetes, ${this.results.sbom.vulnerabilities} vulnerabilidades`);

    } catch (error) {
      console.error(`❌ SBOM falló: ${error.message}`);
      this.results.sbom.error = error.message;
      this.results.sbom.success = false;
    }
  }

  async runDependencyAudit() {
    if (!CONFIG.tools.audit.enabled) return;

    console.log('🔍 Ejecutando auditoría de dependencias...');

    try {
      let totalVulnerabilities = 0;

      for (const command of CONFIG.tools.audit.commands) {
        try {
          const output = execSync(command, {
            encoding: 'utf8',
            timeout: CONFIG.tools.audit.timeout,
            stdio: 'pipe'
          });

          // Parsear salida para contar vulnerabilidades
          const vulnCount = this.parseAuditOutput(output);
          totalVulnerabilities += vulnCount;

        } catch (error) {
          // npm/pnpm audit puede fallar si hay vulnerabilidades
          const vulnCount = this.parseAuditOutput(error.stdout || error.message);
          totalVulnerabilities += vulnCount;
        }
      }

      this.results.audit.vulnerabilities = totalVulnerabilities;
      this.results.audit.success = totalVulnerabilities <= CONFIG.thresholds.maxVulnerabilities;

      console.log(`✅ Auditoría completada: ${totalVulnerabilities} vulnerabilidades encontradas`);

    } catch (error) {
      console.error(`❌ Auditoría falló: ${error.message}`);
      this.results.audit.error = error.message;
      this.results.audit.success = false;
    }
  }

  async runSnykScan() {
    if (!CONFIG.tools.snyk.enabled) return;

    console.log('🛡️ Ejecutando escaneo Snyk...');

    try {
      const output = execSync(CONFIG.tools.snyk.command, {
        encoding: 'utf8',
        timeout: CONFIG.tools.snyk.timeout,
        stdio: 'pipe'
      });

      this.results.snyk.vulnerabilities = this.parseSnykOutput(output);
      this.results.snyk.success = this.results.snyk.vulnerabilities <= CONFIG.thresholds.maxVulnerabilities;

      console.log(`✅ Snyk completado: ${this.results.snyk.vulnerabilities} vulnerabilidades encontradas`);

    } catch (error) {
      // Snyk puede fallar si hay vulnerabilidades
      this.results.snyk.vulnerabilities = this.parseSnykOutput(error.stdout || error.message);
      this.results.snyk.success = this.results.snyk.vulnerabilities <= CONFIG.thresholds.maxVulnerabilities;

      if (this.results.snyk.vulnerabilities > 0) {
        console.log(`⚠️ Snyk encontró ${this.results.snyk.vulnerabilities} vulnerabilidades`);
      } else {
        console.error(`❌ Snyk falló: ${error.message}`);
        this.results.snyk.error = error.message;
        this.results.snyk.success = false;
      }
    }
  }

  parseAuditOutput(output) {
    try {
      // Buscar patrones de vulnerabilidades en la salida
      const lines = output.split('\n');
      let vulnCount = 0;

      lines.forEach(line => {
        if (line.includes('vulnerabilities') && line.includes('found')) {
          const match = line.match(/(\d+)\s+vulnerabilities/);
          if (match) {
            vulnCount += parseInt(match[1]);
          }
        }
      });

      return vulnCount;
    } catch (error) {
      return 0;
    }
  }

  parseSnykOutput(output) {
    try {
      // Buscar patrones de vulnerabilidades en la salida de Snyk
      const lines = output.split('\n');
      let vulnCount = 0;

      lines.forEach(line => {
        if (line.includes('vulnerabilities') && line.includes('found')) {
          const match = line.match(/(\d+)\s+vulnerabilities/);
          if (match) {
            vulnCount += parseInt(match[1]);
          }
        }
      });

      return vulnCount;
    } catch (error) {
      return 0;
    }
  }

  async evaluateResults() {
    console.log('📊 Evaluando resultados de seguridad...');

    let score = 100;
    const issues = [];

    // Evaluar anti-secretos
    if (this.results.antiSecrets.success) {
      console.log('✅ Anti-secretos: PASS');
    } else {
      score -= 25;
      issues.push(`Anti-secretos: ${this.results.antiSecrets.secretsFound} secretos encontrados (máximo: ${CONFIG.thresholds.maxSecrets})`);
    }

    // Evaluar SBOM
    if (this.results.sbom.success) {
      console.log('✅ SBOM: PASS');
    } else {
      score -= 25;
      issues.push(`SBOM: ${this.results.sbom.vulnerabilities} vulnerabilidades encontradas (máximo: ${CONFIG.thresholds.maxVulnerabilities})`);
    }

    // Evaluar auditoría
    if (this.results.audit.success) {
      console.log('✅ Auditoría: PASS');
    } else {
      score -= 25;
      issues.push(`Auditoría: ${this.results.audit.vulnerabilities} vulnerabilidades encontradas (máximo: ${CONFIG.thresholds.maxVulnerabilities})`);
    }

    // Evaluar Snyk
    if (this.results.snyk.success) {
      console.log('✅ Snyk: PASS');
    } else {
      score -= 25;
      issues.push(`Snyk: ${this.results.snyk.vulnerabilities} vulnerabilidades encontradas (máximo: ${CONFIG.thresholds.maxVulnerabilities})`);
    }

    this.results.overall.score = Math.max(0, score);
    this.results.overall.issues = issues;
    this.results.overall.success = issues.length === 0;

    console.log(`\n📊 Puntuación de seguridad: ${this.results.overall.score}/100`);
  }

  async generateFinalReport() {
    console.log('📄 Generando reporte final...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overall: this.results.overall.success ? 'PASS' : 'FAIL',
        score: this.results.overall.score,
        issues: this.results.overall.issues.length,
        tools: {
          antiSecrets: this.results.antiSecrets.success ? 'PASS' : 'FAIL',
          sbom: this.results.sbom.success ? 'PASS' : 'FAIL',
          audit: this.results.audit.success ? 'PASS' : 'FAIL',
          snyk: this.results.snyk.success ? 'PASS' : 'FAIL'
        }
      },
      details: this.results,
      thresholds: CONFIG.thresholds
    };

    // Guardar reporte JSON
    writeFileSync(join(CONFIG.outputDir, 'security-ci-report.json'), JSON.stringify(report, null, 2));

    // Generar reporte de texto
    const textReport = this.generateTextReport(report);
    writeFileSync(join(CONFIG.outputDir, 'security-ci-report.txt'), textReport);

    // Generar reporte para GitHub Actions
    if (process.env.GITHUB_ACTIONS) {
      this.generateGitHubReport(report);
    }

    console.log('✅ Reporte final generado');
  }

  generateTextReport(report) {
    let text = `# Security CI Report\n`;
    text += `Generated: ${report.timestamp}\n\n`;

    text += `## Summary\n`;
    text += `- **Overall Status**: ${report.summary.overall}\n`;
    text += `- **Security Score**: ${report.summary.score}/100\n`;
    text += `- **Issues Found**: ${report.summary.issues}\n\n`;

    text += `## Tool Results\n`;
    Object.entries(report.summary.tools).forEach(([tool, status]) => {
      text += `- **${tool}**: ${status}\n`;
    });
    text += `\n`;

    if (report.summary.issues > 0) {
      text += `## Issues\n`;
      report.details.overall.issues.forEach(issue => {
        text += `- ${issue}\n`;
      });
      text += `\n`;
    }

    text += `## Detailed Results\n`;
    text += `### Anti-Secrets Scan\n`;
    text += `- Secrets Found: ${report.details.antiSecrets.secretsFound}\n`;
    text += `- Status: ${report.details.antiSecrets.success ? 'PASS' : 'FAIL'}\n`;
    if (report.details.antiSecrets.error) {
      text += `- Error: ${report.details.antiSecrets.error}\n`;
    }
    text += `\n`;

    text += `### SBOM Generation\n`;
    text += `- Packages: ${report.details.sbom.packages}\n`;
    text += `- Vulnerabilities: ${report.details.sbom.vulnerabilities}\n`;
    text += `- Status: ${report.details.sbom.success ? 'PASS' : 'FAIL'}\n`;
    if (report.details.sbom.error) {
      text += `- Error: ${report.details.sbom.error}\n`;
    }
    text += `\n`;

    text += `### Dependency Audit\n`;
    text += `- Vulnerabilities: ${report.details.audit.vulnerabilities}\n`;
    text += `- Status: ${report.details.audit.success ? 'PASS' : 'FAIL'}\n`;
    if (report.details.audit.error) {
      text += `- Error: ${report.details.audit.error}\n`;
    }
    text += `\n`;

    text += `### Snyk Scan\n`;
    text += `- Vulnerabilities: ${report.details.snyk.vulnerabilities}\n`;
    text += `- Status: ${report.details.snyk.success ? 'PASS' : 'FAIL'}\n`;
    if (report.details.snyk.error) {
      text += `- Error: ${report.details.snyk.error}\n`;
    }

    return text;
  }

  generateGitHubReport(report) {
    let githubReport = `## 🔒 Security CI Results\n\n`;
    githubReport += `**Overall Status**: ${report.summary.overall}\n`;
    githubReport += `**Security Score**: ${report.summary.score}/100\n`;
    githubReport += `**Issues Found**: ${report.summary.issues}\n\n`;

    githubReport += `### Tool Results\n`;
    Object.entries(report.summary.tools).forEach(([tool, status]) => {
      const emoji = status === 'PASS' ? '✅' : '❌';
      githubReport += `- ${emoji} **${tool}**: ${status}\n`;
    });
    githubReport += `\n`;

    if (report.summary.issues > 0) {
      githubReport += `### ⚠️ Issues Found\n`;
      report.details.overall.issues.forEach(issue => {
        githubReport += `- ${issue}\n`;
      });
    }

    // Escribir a GITHUB_STEP_SUMMARY si está disponible
    if (process.env.GITHUB_STEP_SUMMARY) {
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, githubReport);
    }
  }

  showSummary() {
    console.log('\n🔒 RESUMEN DE VERIFICACIONES DE SEGURIDAD');
    console.log('==========================================');
    console.log(`📊 Puntuación general: ${this.results.overall.score}/100`);
    console.log(`✅ Estado general: ${this.results.overall.success ? 'PASS' : 'FAIL'}`);
    console.log(`❌ Problemas encontrados: ${this.results.overall.issues.length}`);

    console.log('\n🛠️ Resultados por herramienta:');
    console.log(`  🔐 Anti-secretos: ${this.results.antiSecrets.success ? '✅ PASS' : '❌ FAIL'} (${this.results.antiSecrets.secretsFound} secretos)`);
    console.log(`  📦 SBOM: ${this.results.sbom.success ? '✅ PASS' : '❌ FAIL'} (${this.results.sbom.vulnerabilities} vulnerabilidades)`);
    console.log(`  🔍 Auditoría: ${this.results.audit.success ? '✅ PASS' : '❌ FAIL'} (${this.results.audit.vulnerabilities} vulnerabilidades)`);
    console.log(`  🛡️ Snyk: ${this.results.snyk.success ? '✅ PASS' : '❌ FAIL'} (${this.results.snyk.vulnerabilities} vulnerabilidades)`);

    if (this.results.overall.issues.length > 0) {
      console.log('\n⚠️ Problemas encontrados:');
      this.results.overall.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }

    console.log('\n📄 Reportes generados:');
    console.log('  - reports/security-ci-report.json');
    console.log('  - reports/security-ci-report.txt');
  }
}

// Ejecutar verificaciones de seguridad
if (import.meta.url === `file://${process.argv[1]}`) {
  const securityCI = new SecurityCI();
  const exitCode = await securityCI.run();
  process.exit(exitCode);
}

export { SecurityCI };
