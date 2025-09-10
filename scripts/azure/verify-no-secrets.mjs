#!/usr/bin/env node

/**
 * Verify No Secrets Script
 * PR-94: AZURE↔GITHUB ALIGN (NO DEPLOY, SIN SECRETOS)
 * 
 * Rompe CI si halla cadenas tipo InstrumentationKey=/connectionString=
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

// Patrones de secretos REALES a detectar (no placeholders)
const SECRET_PATTERNS = [
  // Azure Application Insights (reales)
  /InstrumentationKey\s*=\s*[a-f0-9-]{36}(?!\s*;)/gi,
  
  // Connection Strings reales (no placeholders)
  /ConnectionString\s*=\s*[^;]{50,}(?!\s*;)/gi,
  
  // API Keys reales (no "your_*_here")
  /api[_-]?key\s*=\s*(?!your_)[a-zA-Z0-9_-]{32,}/gi,
  /API[_-]?KEY\s*=\s*(?!your_)[a-zA-Z0-9_-]{32,}/gi,
  
  // JWT Secrets reales
  /jwt[_-]?secret\s*=\s*(?!your_)[a-zA-Z0-9_-]{32,}/gi,
  /JWT[_-]?SECRET\s*=\s*(?!your_)[a-zA-Z0-9_-]{32,}/gi,
  
  // Database URLs con passwords reales
  /postgresql:\/\/[^:]+:(?!password|test|dev)[^@]+@[^\/]+\/[^?]+/gi,
  
  // GitHub Tokens reales
  /ghp_[a-zA-Z0-9]{36}/gi,
  /gho_[a-zA-Z0-9]{36}/gi,
  /ghu_[a-zA-Z0-9]{36}/gi,
  /ghs_[a-zA-Z0-9]{36}/gi,
  /ghr_[a-zA-Z0-9]{36}/gi,
  
  // AWS Keys reales
  /AKIA[0-9A-Z]{16}/gi,
  
  // Slack Tokens reales
  /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/gi,
  /xoxp-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/gi,
  
  // Stripe Keys reales
  /sk_live_[a-zA-Z0-9]{24}/gi,
  /pk_live_[a-zA-Z0-9]{24}/gi,
  
  // Private Keys reales
  /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/gi,
  /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/gi,
  
  // Passwords reales en URLs (no "password", "test", "dev")
  /:\/\/[^:]+:(?!password|test|dev)[^@]+@/gi
];

// Archivos y directorios a excluir
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.env.example',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.tmp',
  '*.cache',
  'docs/',
  'reports/',
  'test/',
  'tests/',
  'scripts/init-advanced-features.js',
  'scripts/test-advanced-features.js',
  'test-security.js',
  'test-security-simple.js'
];

// Extensiones de archivo a escanear
const SCAN_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',
  '.json', '.yaml', '.yml',
  '.md', '.txt', '.env',
  '.config.js', '.config.ts'
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function shouldScanFile(filePath) {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  return SCAN_EXTENSIONS.includes(ext);
}

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const secrets = [];
    
    SECRET_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          secrets.push({
            pattern: index,
            match: match,
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    return secrets;
  } catch (error) {
    console.warn(`⚠️  No se pudo leer archivo: ${filePath} - ${error.message}`);
    return [];
  }
}

function scanDirectory(dirPath) {
  const results = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      
      if (shouldExcludeFile(fullPath)) {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (stat.isFile() && shouldScanFile(fullPath)) {
        const secrets = scanFile(fullPath);
        if (secrets.length > 0) {
          results.push({
            file: fullPath,
            secrets: secrets
          });
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  No se pudo escanear directorio: ${dirPath} - ${error.message}`);
  }
  
  return results;
}

function main() {
  console.log(`🔍 Escaneando proyecto en busca de secretos...`);
  console.log(`📁 Directorio: ${projectRoot}`);
  console.log(`🔎 Patrones: ${SECRET_PATTERNS.length}`);
  console.log(`📋 Extensiones: ${SCAN_EXTENSIONS.join(', ')}`);
  console.log(`🚫 Excluidos: ${EXCLUDE_PATTERNS.join(', ')}`);
  console.log();
  
  const results = scanDirectory(projectRoot);
  
  if (results.length === 0) {
    console.log(`✅ No se encontraron secretos en el código`);
    console.log(`🔒 Proyecto seguro para commit`);
    process.exit(0);
  }
  
  console.log(`❌ SECRETOS DETECTADOS EN EL CÓDIGO:`);
  console.log(`=====================================`);
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. Archivo: ${result.file}`);
    result.secrets.forEach((secret, secretIndex) => {
      console.log(`   ${secretIndex + 1}. Línea ${secret.line}: ${secret.match.substring(0, 50)}...`);
    });
  });
  
  console.log(`\n🚨 ACCIONES REQUERIDAS:`);
  console.log(`1. Remover secretos del código`);
  console.log(`2. Usar variables de entorno o Azure Key Vault`);
  console.log(`3. Verificar .env.example para claves faltantes`);
  console.log(`4. Re-ejecutar verificación`);
  
  console.log(`\n💡 RECOMENDACIONES:`);
  console.log(`- Usar {{VARIABLE_NAME}} para placeholders`);
  console.log(`- Configurar secrets en Azure Key Vault`);
  console.log(`- Usar GitHub Secrets para CI/CD`);
  console.log(`- Nunca commitear archivos .env`);
  
  process.exit(1);
}

main();
