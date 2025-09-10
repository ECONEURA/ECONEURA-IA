#!/usr/bin/env node
/**
 * Simple secrets scanner for CI gates demonstration
 * In production, use gitleaks, truffleHog, or detect-secrets
 */

const fs = require('fs');
const path = require('path');

// Common secret patterns
const SECRET_PATTERNS = [
  // API Keys
  { name: 'API_KEY', pattern: /api[_-]?key[\s]*[:=][\s]*['"`]?[a-zA-Z0-9]{20,}['"`]?/gi, severity: 'high' },
  { name: 'SECRET_KEY', pattern: /secret[_-]?key[\s]*[:=][\s]*['"`]?[a-zA-Z0-9]{20,}['"`]?/gi, severity: 'high' },
  
  // Passwords
  { name: 'PASSWORD', pattern: /password[\s]*[:=][\s]*['"`][^'"`\s]{8,}['"`]/gi, severity: 'high' },
  
  // JWT Tokens
  { name: 'JWT_TOKEN', pattern: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, severity: 'medium' },
  
  // AWS Keys
  { name: 'AWS_ACCESS_KEY', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
  { name: 'AWS_SECRET_KEY', pattern: /aws[_-]?secret[_-]?access[_-]?key[\s]*[:=][\s]*['"`]?[a-zA-Z0-9\/+=]{40}['"`]?/gi, severity: 'critical' },
  
  // Azure Keys
  { name: 'AZURE_KEY', pattern: /azure[_-]?key[\s]*[:=][\s]*['"`]?[a-zA-Z0-9]{32,}['"`]?/gi, severity: 'high' },
  
  // Private Keys
  { name: 'PRIVATE_KEY', pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g, severity: 'critical' },
  
  // Database URLs with credentials
  { name: 'DATABASE_URL', pattern: /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:\s]+:[^@\s]+@[^:\s]+/g, severity: 'high' },
  
  // Generic secrets
  { name: 'GENERIC_SECRET', pattern: /_secret[\s]*[:=][\s]*['"`][^'"`\s]{10,}['"`]/gi, severity: 'medium' },
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules\//,
  /\.git\//,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
  /test-results\//,
  /\.md$/,
  /\.lock$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  // Exclude test files - they often contain test fixtures that look like secrets
  /\.test\.(js|ts|jsx|tsx)$/,
  /\.spec\.(js|ts|jsx|tsx)$/,
  /__tests__\//,
  /test\//,
  /tests\//,
  /\.env\.example$/,
];

// Allowlist for known test fixtures and examples
const ALLOWLIST = [
  'Demo1234!', // Test password
  'test@example.com',
  'admin@ecoretail.com',
  'password123', // Common test password
  'hashedpassword', // Test hash
  'wrongpassword', // Test wrong password
  'secret123', // Test secret
  'postgresql://test:test@localhost', // Test database URL
  'postgresql://postgres:postgres@localhost', // Test database URL
  'postgresql://user:password@localhost', // Example database URL
  'postgres://postgres:postgres@localhost', // Test database URL
  'test-secret', // Test secret patterns
  'test-jwt-secret', // Test JWT secret
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isAllowlisted(content) {
  return ALLOWLIST.some(allowed => content.includes(allowed));
}

function scanFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const findings = [];
    
    for (const { name, pattern, severity } of SECRET_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const matchedText = match[0];
        
        // Skip if this looks like a test fixture
        if (isAllowlisted(matchedText)) {
          continue;
        }
        
        // Get line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        findings.push({
          type: name,
          severity,
          file: filePath,
          line: lineNumber,
          match: matchedText.length > 50 ? matchedText.substring(0, 47) + '...' : matchedText,
          column: match.index - beforeMatch.lastIndexOf('\n')
        });
      }
    }
    
    return findings;
  } catch (error) {
    console.warn(`Warning: Could not scan file ${filePath}: ${error.message}`);
    return [];
  }
}

function findFilesToScan(dir = process.cwd()) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (shouldExcludeFile(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        files.push(...findFilesToScan(fullPath));
      } else if (entry.isFile()) {
        // Only scan text files
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config'].includes(ext) || 
            entry.name.startsWith('.env')) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
  }
  
  return files;
}

function main() {
  console.log('🔍 Starting secrets scan...');
  
  const filesToScan = findFilesToScan();
  console.log(`Scanning ${filesToScan.length} files...`);
  
  const allFindings = [];
  
  for (const file of filesToScan) {
    const findings = scanFileForSecrets(file);
    allFindings.push(...findings);
  }
  
  // Group by severity
  const critical = allFindings.filter(f => f.severity === 'critical');
  const high = allFindings.filter(f => f.severity === 'high');
  const medium = allFindings.filter(f => f.severity === 'medium');
  
  console.log(`\n📊 Secrets scan results:`);
  console.log(`🔴 Critical: ${critical.length}`);
  console.log(`🟠 High: ${high.length}`);
  console.log(`🟡 Medium: ${medium.length}`);
  console.log(`📄 Total files scanned: ${filesToScan.length}`);
  
  // Report findings
  if (allFindings.length > 0) {
    console.log(`\n⚠️ Potential secrets found:`);
    
    for (const finding of allFindings) {
      const severity = finding.severity.toUpperCase().padEnd(8);
      console.log(`  ${severity} ${finding.type} in ${finding.file}:${finding.line}`);
      console.log(`           ${finding.match}`);
    }
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: allFindings.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      filesScanned: filesToScan.length
    },
    findings: allFindings
  };
  
  fs.writeFileSync('secrets-scan-report.json', JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to secrets-scan-report.json`);
  
  // Exit with error if critical or high severity secrets found
  const highRiskFindings = critical.length + high.length;
  if (highRiskFindings > 0) {
    console.log(`\n❌ Found ${highRiskFindings} high-risk potential secrets!`);
    process.exit(1);
  } else {
    console.log(`\n✅ No high-risk secrets detected!`);
  }
}

if (require.main === module) {
  main();
}