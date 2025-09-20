#!/usr/bin/env node

/**
 * SBOM Generator Script
 * PR-104: Anti-secretos & SBOM (repo) - scripts y CI
 * 
 * Generador de Software Bill of Materials (SBOM) con múltiples formatos
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
    cyclonedx: {
      enabled: true,
      command: 'cyclonedx-npm',
      args: ['--output-format', 'json', '--output-file', 'reports/sbom-cyclonedx.json']
    },
    spdx: {
      enabled: true,
      command: 'spdx-sbom-generator',
      args: ['-f', 'json', '-o', 'reports/sbom-spdx.json']
    },
    syft: {
      enabled: true,
      command: 'syft',
      args: ['packages', '--output', 'json', '--file', 'reports/sbom-syft.json']
    }
  },
  formats: ['json', 'xml', 'yaml', 'spdx-json', 'cyclonedx-json'],
  outputDir: 'reports',
  metadata: {
    name: 'ECONEURA-IA',
    version: '1.0.0',
    description: 'ECONEURA - Production-ready ERP+CRM cockpit with AI Router',
    supplier: 'ECONEURA',
    license: 'MIT',
    author: 'ECONEURA Team',
    created: new Date().toISOString()
  }
};

class SBOMGenerator {
  constructor() {
    this.results = {
      tools: {},
      packages: [],
      vulnerabilities: [],
      licenses: [],
      summary: {},
      errors: []
    };
  }

  async generate() {
    console.log('📦 Iniciando generación de SBOM...\n');

    try {
      // Verificar herramientas disponibles
      await this.checkTools();
      
      // Generar SBOM con herramientas especializadas
      await this.generateWithTools();
      
      // Generar SBOM personalizado
      await this.generateCustomSBOM();
      
      // Analizar vulnerabilidades
      await this.analyzeVulnerabilities();
      
      // Analizar licencias
      await this.analyzeLicenses();
      
      // Generar reportes
      await this.generateReports();
      
      // Mostrar resumen
      this.showSummary();
      
      return 0;
      
    } catch (error) {
      console.error('❌ Error durante la generación de SBOM:', error.message);
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

  async generateWithTools() {
    console.log('🛠️ Generando SBOM con herramientas especializadas...');
    
    // CycloneDX
    if (this.results.tools.cyclonedx?.available) {
      await this.runCycloneDX();
    }
    
    // SPDX
    if (this.results.tools.spdx?.available) {
      await this.runSPDX();
    }
    
    // Syft
    if (this.results.tools.syft?.available) {
      await this.runSyft();
    }
  }

  async runCycloneDX() {
    try {
      console.log('🌀 Ejecutando CycloneDX...');
      
      // Crear directorio de reportes si no existe
      mkdirSync(CONFIG.outputDir, { recursive: true });
      
      const output = execSync(
        `${CONFIG.tools.cyclonedx.command} ${CONFIG.tools.cyclonedx.args.join(' ')}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      this.results.tools.cyclonedx.output = output;
      this.results.tools.cyclonedx.success = true;
      
      console.log(`✅ CycloneDX completado`);
      
    } catch (error) {
      console.log(`⚠️ CycloneDX falló: ${error.message}`);
      this.results.tools.cyclonedx.error = error.message;
    }
  }

  async runSPDX() {
    try {
      console.log('📋 Ejecutando SPDX...');
      
      const output = execSync(
        `${CONFIG.tools.spdx.command} ${CONFIG.tools.spdx.args.join(' ')}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      this.results.tools.spdx.output = output;
      this.results.tools.spdx.success = true;
      
      console.log(`✅ SPDX completado`);
      
    } catch (error) {
      console.log(`⚠️ SPDX falló: ${error.message}`);
      this.results.tools.spdx.error = error.message;
    }
  }

  async runSyft() {
    try {
      console.log('🔍 Ejecutando Syft...');
      
      const output = execSync(
        `${CONFIG.tools.syft.command} ${CONFIG.tools.syft.args.join(' ')}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      this.results.tools.syft.output = output;
      this.results.tools.syft.success = true;
      
      console.log(`✅ Syft completado`);
      
    } catch (error) {
      console.log(`⚠️ Syft falló: ${error.message}`);
      this.results.tools.syft.error = error.message;
    }
  }

  async generateCustomSBOM() {
    console.log('🔧 Generando SBOM personalizado...');
    
    try {
      // Leer package.json del workspace
      const workspacePackage = JSON.parse(readFileSync('package.json', 'utf8'));
      
      // Leer pnpm-lock.yaml
      const lockFile = await this.parseLockFile();
      
      // Generar SBOM personalizado
      const customSBOM = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        version: 1,
        metadata: {
          timestamp: CONFIG.metadata.created,
          tools: [
            {
              vendor: 'ECONEURA',
              name: 'Custom SBOM Generator',
              version: '1.0.0'
            }
          ],
          component: {
            type: 'application',
            name: CONFIG.metadata.name,
            version: CONFIG.metadata.version,
            description: CONFIG.metadata.description,
            licenses: [
              {
                license: {
                  id: CONFIG.metadata.license
                }
              }
            ],
            supplier: {
              name: CONFIG.metadata.supplier
            }
          }
        },
        components: await this.extractComponents(workspacePackage, lockFile)
      };
      
      // Guardar SBOM personalizado
      writeFileSync(
        join(CONFIG.outputDir, 'sbom-custom.json'),
        JSON.stringify(customSBOM, null, 2)
      );
      
      this.results.packages = customSBOM.components;
      console.log(`✅ SBOM personalizado generado: ${customSBOM.components.length} componentes`);
      
    } catch (error) {
      console.error('Error generando SBOM personalizado:', error.message);
      this.results.errors.push(`Custom SBOM: ${error.message}`);
    }
  }

  async parseLockFile() {
    try {
      if (existsSync('pnpm-lock.yaml')) {
        // Para simplificar, solo leemos el archivo como texto
        // En un caso real, usaríamos una librería YAML parser
        return { type: 'pnpm', exists: true };
      }
      return { type: 'none', exists: false };
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  }

  async extractComponents(workspacePackage, lockFile) {
    const components = [];
    
    // Agregar el componente principal
    components.push({
      type: 'application',
      name: workspacePackage.name,
      version: workspacePackage.version,
      description: workspacePackage.description,
      licenses: workspacePackage.license ? [{ license: { id: workspacePackage.license } }] : [],
      purl: `pkg:npm/${workspacePackage.name}@${workspacePackage.version}`
    });
    
    // Agregar dependencias de desarrollo
    if (workspacePackage.devDependencies) {
      for (const [name, version] of Object.entries(workspacePackage.devDependencies)) {
        components.push({
          type: 'library',
          name,
          version: this.cleanVersion(version),
          purl: `pkg:npm/${name}@${this.cleanVersion(version)}`,
          scope: 'required'
        });
      }
    }
    
    // Agregar dependencias de producción
    if (workspacePackage.dependencies) {
      for (const [name, version] of Object.entries(workspacePackage.dependencies)) {
        components.push({
          type: 'library',
          name,
          version: this.cleanVersion(version),
          purl: `pkg:npm/${name}@${this.cleanVersion(version)}`,
          scope: 'required'
        });
      }
    }
    
    return components;
  }

  cleanVersion(version) {
    // Remover prefijos como ^, ~, etc.
    return version.replace(/^[\^~>=<]/, '');
  }

  async analyzeVulnerabilities() {
    console.log('🔍 Analizando vulnerabilidades...');
    
    try {
      // Ejecutar npm audit
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
      const auditData = JSON.parse(auditOutput);
      
      this.results.vulnerabilities = auditData.vulnerabilities || [];
      console.log(`✅ Análisis de vulnerabilidades completado: ${this.results.vulnerabilities.length} vulnerabilidades encontradas`);
      
    } catch (error) {
      console.log(`⚠️ Análisis de vulnerabilidades falló: ${error.message}`);
      this.results.errors.push(`Vulnerability analysis: ${error.message}`);
    }
  }

  async analyzeLicenses() {
    console.log('📄 Analizando licencias...');
    
    try {
      // Ejecutar license-checker
      const licenseOutput = execSync('npx license-checker --json', { encoding: 'utf8', stdio: 'pipe' });
      const licenseData = JSON.parse(licenseOutput);
      
      this.results.licenses = Object.entries(licenseData).map(([name, data]) => ({
        name,
        version: data.version,
        license: data.licenses,
        repository: data.repository,
        publisher: data.publisher
      }));
      
      console.log(`✅ Análisis de licencias completado: ${this.results.licenses.length} paquetes analizados`);
      
    } catch (error) {
      console.log(`⚠️ Análisis de licencias falló: ${error.message}`);
      this.results.errors.push(`License analysis: ${error.message}`);
    }
  }

  async generateReports() {
    console.log('📊 Generando reportes...');
    
    const report = {
      timestamp: CONFIG.metadata.created,
      metadata: CONFIG.metadata,
      summary: {
        totalPackages: this.results.packages.length,
        vulnerabilities: this.results.vulnerabilities.length,
        licenses: this.results.licenses.length,
        toolsUsed: Object.keys(this.results.tools).filter(tool => this.results.tools[tool].available),
        errors: this.results.errors.length
      },
      tools: this.results.tools,
      packages: this.results.packages,
      vulnerabilities: this.results.vulnerabilities,
      licenses: this.results.licenses,
      errors: this.results.errors
    };
    
    // Crear directorio de reportes si no existe
    mkdirSync(CONFIG.outputDir, { recursive: true });
    
    // Guardar reporte principal
    writeFileSync(join(CONFIG.outputDir, 'sbom-report.json'), JSON.stringify(report, null, 2));
    
    // Generar reporte de texto
    const textReport = this.generateTextReport(report);
    writeFileSync(join(CONFIG.outputDir, 'sbom-report.txt'), textReport);
    
    // Generar reporte de vulnerabilidades
    if (this.results.vulnerabilities.length > 0) {
      const vulnReport = this.generateVulnerabilityReport();
      writeFileSync(join(CONFIG.outputDir, 'vulnerabilities.json'), JSON.stringify(vulnReport, null, 2));
    }
    
    // Generar reporte de licencias
    const licenseReport = this.generateLicenseReport();
    writeFileSync(join(CONFIG.outputDir, 'licenses.json'), JSON.stringify(licenseReport, null, 2));
    
    console.log('✅ Reportes generados en directorio reports/');
  }

  generateTextReport(report) {
    let text = `# SBOM Report\n`;
    text += `Generated: ${report.timestamp}\n\n`;
    
    text += `## Summary\n`;
    text += `- Total Packages: ${report.summary.totalPackages}\n`;
    text += `- Vulnerabilities: ${report.summary.vulnerabilities}\n`;
    text += `- Licenses: ${report.summary.licenses}\n`;
    text += `- Tools Used: ${report.summary.toolsUsed.join(', ')}\n`;
    text += `- Errors: ${report.summary.errors}\n\n`;
    
    if (report.summary.vulnerabilities > 0) {
      text += `## ⚠️ VULNERABILITIES FOUND\n\n`;
      report.vulnerabilities.forEach(vuln => {
        text += `- ${vuln.name}: ${vuln.severity} - ${vuln.title}\n`;
      });
      text += `\n`;
    }
    
    text += `## Packages\n`;
    report.packages.forEach(pkg => {
      text += `- ${pkg.name}@${pkg.version} (${pkg.type})\n`;
    });
    
    return text;
  }

  generateVulnerabilityReport() {
    return {
      timestamp: CONFIG.metadata.created,
      summary: {
        total: this.results.vulnerabilities.length,
        bySeverity: this.groupBySeverity(this.results.vulnerabilities)
      },
      vulnerabilities: this.results.vulnerabilities
    };
  }

  generateLicenseReport() {
    return {
      timestamp: CONFIG.metadata.created,
      summary: {
        total: this.results.licenses.length,
        byLicense: this.groupByLicense(this.results.licenses)
      },
      licenses: this.results.licenses
    };
  }

  groupBySeverity(vulnerabilities) {
    const groups = {};
    vulnerabilities.forEach(vuln => {
      const severity = vuln.severity || 'unknown';
      groups[severity] = (groups[severity] || 0) + 1;
    });
    return groups;
  }

  groupByLicense(licenses) {
    const groups = {};
    licenses.forEach(license => {
      const licenseName = license.license || 'unknown';
      groups[licenseName] = (groups[licenseName] || 0) + 1;
    });
    return groups;
  }

  showSummary() {
    console.log('\n📊 RESUMEN DE GENERACIÓN DE SBOM');
    console.log('==================================');
    console.log(`📦 Paquetes totales: ${this.results.packages.length}`);
    console.log(`🔍 Vulnerabilidades: ${this.results.vulnerabilities.length}`);
    console.log(`📄 Licencias: ${this.results.licenses.length}`);
    console.log(`🛠️ Herramientas utilizadas: ${Object.keys(this.results.tools).filter(tool => this.results.tools[tool].available).join(', ')}`);
    console.log(`❌ Errores: ${this.results.errors.length}`);
    
    if (this.results.vulnerabilities.length > 0) {
      console.log('\n⚠️ VULNERABILIDADES ENCONTRADAS:');
      const bySeverity = this.groupBySeverity(this.results.vulnerabilities);
      Object.entries(bySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity}: ${count}`);
      });
    }
    
    console.log('\n📄 Reportes generados:');
    console.log('  - reports/sbom-report.json');
    console.log('  - reports/sbom-report.txt');
    console.log('  - reports/vulnerabilities.json');
    console.log('  - reports/licenses.json');
  }
}

// Ejecutar generación
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SBOMGenerator();
  const exitCode = await generator.generate();
  process.exit(exitCode);
}

export { SBOMGenerator };
