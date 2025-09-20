#!/usr/bin/env node

/**
 * Anti-Secrets Scan Script
 * PR-104: Anti-secretos & SBOM (repo) - scripts y CI
 * 
 * Script avanzado para detección de secretos con múltiples herramientas
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const CONFIG = {
  tools: {
    detectSecrets: {
      enabled: true,
      command: 'detect-secrets',
      args: ['scan', '--all-files', '--baseline', '.secrets.baseline']
    },
    trufflehog: {
      enabled: true,
      command: 'trufflehog',
      args: ['filesystem', '.', '--no-verification', '--format', 'json']
    },
    gitleaks: {
      enabled: true,
      command: 'gitleaks',
      args: ['detect', '--source', '.', '--report-format', 'json', '--report-path', 'reports/gitleaks-report.json']
    }
  },
  patterns: {
    // Patrones de secretos comunes
    apiKeys: [
      /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
      /apikey\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
      /access[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi
    ],
    passwords: [
      /password\s*[:=]\s*['"]?[^'"]{8,}['"]?/gi,
      /passwd\s*[:=]\s*['"]?[^'"]{8,}['"]?/gi,
      /pwd\s*[:=]\s*['"]?[^'"]{8,}['"]?/gi
    ],
    tokens: [
      /token\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
      /bearer\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
      /jwt\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi
    ],
    secrets: [
      /secret\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
      /private[_-]?key\s*[:=]\s*['"]?-----BEGIN/gi,
      /ssh[_-]?key\s*[:=]\s*['"]?-----BEGIN/gi
    ]
  },
  excludePatterns: [
    /\.env\.example$/,
    /\.secrets\.baseline$/,
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.next/,
    /reports/,
    /\.pnpm/,
    /\.cache/
  ],
  fileExtensions: ['.ts', '.js', '.json', '.yaml', '.yml', '.env', '.md', '.txt', '.sh', '.ps1']
};

class AntiSecretsScanner {
  constructor() {
    this.results = {
      totalFiles: 0,
      scannedFiles: 0,
      secretsFound: 0,
      tools: {},
      patterns: {},
      errors: [],
      summary: {}
    };
  }

  async scan() {
    console.log('🔐 Iniciando escaneo anti-secretos...\n');

    try {
      // Verificar herramientas disponibles
      await this.checkTools();
      
      // Escaneo con herramientas especializadas
      await this.scanWithTools();
      
      // Escaneo con patrones personalizados
      await this.scanWithPatterns();
      
      // Generar reporte
      await this.generateReport();
      
      // Mostrar resumen
      this.showSummary();
      
      // Determinar código de salida
      return this.results.secretsFound > 0 ? 1 : 0;
      
    } catch (error) {
      console.error('❌ Error durante el escaneo:', error.message);
      this.results.errors.push(error.message);
      return 1;
    }
  }

  async checkTools() {
    console.log('🔍 Verificando herramientas disponibles...');
    
    for (const [toolName, config] of Object.entries(CONFIG.tools)) {
      if (!config.enabled) continue;
      
      try {
        execSync(`${config.command} --version`, { stdio: 'pipe' });
        console.log(`✅ ${toolName} disponible`);
        this.results.tools[toolName] = { available: true, version: 'unknown' };
      } catch (error) {
        console.log(`⚠️ ${toolName} no disponible: ${error.message}`);
        this.results.tools[toolName] = { available: false, error: error.message };
      }
    }
    console.log('');
  }

  async scanWithTools() {
    console.log('🛠️ Ejecutando herramientas especializadas...');
    
    // Detect-secrets
    if (this.results.tools.detectSecrets?.available) {
      await this.runDetectSecrets();
    }
    
    // TruffleHog
    if (this.results.tools.trufflehog?.available) {
      await this.runTruffleHog();
    }
    
    // GitLeaks
    if (this.results.tools.gitleaks?.available) {
      await this.runGitLeaks();
    }
  }

  async runDetectSecrets() {
    try {
      console.log('🔍 Ejecutando detect-secrets...');
      
      const output = execSync(
        `${CONFIG.tools.detectSecrets.command} ${CONFIG.tools.detectSecrets.args.join(' ')}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      this.results.tools.detectSecrets.output = output;
      this.results.tools.detectSecrets.secretsFound = this.parseDetectSecretsOutput(output);
      
      console.log(`✅ detect-secrets completado: ${this.results.tools.detectSecrets.secretsFound} secretos encontrados`);
      
    } catch (error) {
      console.log(`⚠️ detect-secrets falló: ${error.message}`);
      this.results.tools.detectSecrets.error = error.message;
    }
  }

  async runTruffleHog() {
    try {
      console.log('🐷 Ejecutando TruffleHog...');
      
      const output = execSync(
        `${CONFIG.tools.trufflehog.command} ${CONFIG.tools.trufflehog.args.join(' ')}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      this.results.tools.trufflehog.output = output;
      this.results.tools.trufflehog.secretsFound = this.parseTruffleHogOutput(output);
      
      console.log(`✅ TruffleHog completado: ${this.results.tools.trufflehog.secretsFound} secretos encontrados`);
      
    } catch (error) {
      console.log(`⚠️ TruffleHog falló: ${error.message}`);
      this.results.tools.trufflehog.error = error.message;
    }
  }

  async runGitLeaks() {
    try {
      console.log('🕵️ Ejecutando GitLeaks...');
      
      // Crear directorio de reportes si no existe
      execSync('mkdir -p reports', { stdio: 'pipe' });
      
      const output = execSync(
        `${CONFIG.tools.gitleaks.command} ${CONFIG.tools.gitleaks.args.join(' ')}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      this.results.tools.gitleaks.output = output;
      this.results.tools.gitleaks.secretsFound = this.parseGitLeaksOutput();
      
      console.log(`✅ GitLeaks completado: ${this.results.tools.gitleaks.secretsFound} secretos encontrados`);
      
    } catch (error) {
      console.log(`⚠️ GitLeaks falló: ${error.message}`);
      this.results.tools.gitleaks.error = error.message;
    }
  }

  async scanWithPatterns() {
    console.log('🔍 Ejecutando escaneo con patrones personalizados...');
    
    const files = await this.getFilesToScan();
    this.results.totalFiles = files.length;
    
    for (const file of files) {
      if (this.shouldExcludeFile(file)) continue;
      
      this.results.scannedFiles++;
      await this.scanFileWithPatterns(file);
    }
    
    console.log(`✅ Escaneo de patrones completado: ${files.length} archivos procesados`);
  }

  async getFilesToScan() {
    try {
      const output = execSync('find . -type f', { encoding: 'utf8' });
      return output.split('\n').filter(file => {
        if (!file) return false;
        
        const ext = file.substring(file.lastIndexOf('.'));
        return CONFIG.fileExtensions.includes(ext);
      });
    } catch (error) {
      console.error('Error obteniendo archivos:', error.message);
      return [];
    }
  }

  shouldExcludeFile(file) {
    return CONFIG.excludePatterns.some(pattern => pattern.test(file));
  }

  async scanFileWithPatterns(file) {
    try {
      const content = readFileSync(file, 'utf8');
      
      for (const [patternType, patterns] of Object.entries(CONFIG.patterns)) {
        if (!this.results.patterns[patternType]) {
          this.results.patterns[patternType] = [];
        }
        
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.results.patterns[patternType].push({
              file,
              matches: matches.length,
              lines: this.getMatchingLines(content, pattern)
            });
            this.results.secretsFound += matches.length;
          }
        }
      }
    } catch (error) {
      // Ignorar archivos que no se pueden leer
    }
  }

  getMatchingLines(content, pattern) {
    const lines = content.split('\n');
    const matchingLines = [];
    
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matchingLines.push({
          lineNumber: index + 1,
          content: line.trim()
        });
      }
    });
    
    return matchingLines;
  }

  parseDetectSecretsOutput(output) {
    try {
      const lines = output.split('\n');
      let secretsFound = 0;
      
      lines.forEach(line => {
        if (line.includes('Potential secrets')) {
          const match = line.match(/(\d+)/);
          if (match) {
            secretsFound = parseInt(match[1]);
          }
        }
      });
      
      return secretsFound;
    } catch (error) {
      return 0;
    }
  }

  parseTruffleHogOutput(output) {
    try {
      const lines = output.split('\n');
      return lines.filter(line => line.trim() && line.includes('"DetectorName"')).length;
    } catch (error) {
      return 0;
    }
  }

  parseGitLeaksOutput() {
    try {
      if (existsSync('reports/gitleaks-report.json')) {
        const report = JSON.parse(readFileSync('reports/gitleaks-report.json', 'utf8'));
        return report.length || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async generateReport() {
    console.log('📊 Generando reporte...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.totalFiles,
        scannedFiles: this.results.scannedFiles,
        secretsFound: this.results.secretsFound,
        toolsUsed: Object.keys(this.results.tools).filter(tool => this.results.tools[tool].available),
        errors: this.results.errors.length
      },
      tools: this.results.tools,
      patterns: this.results.patterns,
      errors: this.results.errors
    };
    
    // Crear directorio de reportes si no existe
    execSync('mkdir -p reports', { stdio: 'pipe' });
    
    // Guardar reporte JSON
    writeFileSync('reports/anti-secrets-scan.json', JSON.stringify(report, null, 2));
    
    // Guardar reporte de texto
    const textReport = this.generateTextReport(report);
    writeFileSync('reports/anti-secrets-scan.txt', textReport);
    
    console.log('✅ Reporte generado en reports/anti-secrets-scan.json y reports/anti-secrets-scan.txt');
  }

  generateTextReport(report) {
    let text = `# Anti-Secrets Scan Report\n`;
    text += `Generated: ${report.timestamp}\n\n`;
    
    text += `## Summary\n`;
    text += `- Total Files: ${report.summary.totalFiles}\n`;
    text += `- Scanned Files: ${report.summary.scannedFiles}\n`;
    text += `- Secrets Found: ${report.summary.secretsFound}\n`;
    text += `- Tools Used: ${report.summary.toolsUsed.join(', ')}\n`;
    text += `- Errors: ${report.summary.errors}\n\n`;
    
    if (report.summary.secretsFound > 0) {
      text += `## ⚠️ SECRETS FOUND\n\n`;
      
      for (const [patternType, findings] of Object.entries(report.patterns)) {
        if (findings.length > 0) {
          text += `### ${patternType.toUpperCase()}\n`;
          findings.forEach(finding => {
            text += `- File: ${finding.file}\n`;
            text += `  Matches: ${finding.matches}\n`;
            finding.lines.forEach(line => {
              text += `  Line ${line.lineNumber}: ${line.content}\n`;
            });
            text += `\n`;
          });
        }
      }
    } else {
      text += `## ✅ No secrets found\n`;
    }
    
    if (report.errors.length > 0) {
      text += `## Errors\n`;
      report.errors.forEach(error => {
        text += `- ${error}\n`;
      });
    }
    
    return text;
  }

  showSummary() {
    console.log('\n📊 RESUMEN DEL ESCANEO ANTI-SECRETOS');
    console.log('=====================================');
    console.log(`📁 Archivos totales: ${this.results.totalFiles}`);
    console.log(`🔍 Archivos escaneados: ${this.results.scannedFiles}`);
    console.log(`🔐 Secretos encontrados: ${this.results.secretsFound}`);
    console.log(`🛠️ Herramientas utilizadas: ${Object.keys(this.results.tools).filter(tool => this.results.tools[tool].available).join(', ')}`);
    console.log(`❌ Errores: ${this.results.errors.length}`);
    
    if (this.results.secretsFound > 0) {
      console.log('\n⚠️ SECRETOS ENCONTRADOS:');
      for (const [patternType, findings] of Object.entries(this.results.patterns)) {
        if (findings.length > 0) {
          console.log(`  ${patternType}: ${findings.length} archivos`);
        }
      }
    } else {
      console.log('\n✅ No se encontraron secretos');
    }
    
    console.log('\n📄 Reportes generados:');
    console.log('  - reports/anti-secrets-scan.json');
    console.log('  - reports/anti-secrets-scan.txt');
  }
}

// Ejecutar escaneo
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new AntiSecretsScanner();
  const exitCode = await scanner.scan();
  process.exit(exitCode);
}

export { AntiSecretsScanner };
