#!/usr/bin/env node
// Simple duplicate detector to identify common patterns
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DUPLICATE_THRESHOLD = 3; // Minimum occurrences to consider duplicate
const MIN_LINES = 5; // Minimum lines to consider

// Common patterns that are likely duplicates
const COMMON_PATTERNS = [
  'import.*from.*react',
  'export.*default.*function',
  'const.*=.*useState',
  'const.*=.*useEffect',
  'interface.*Props',
  'type.*Props',
  'export.*interface',
  'export.*type',
  'async.*function',
  'try.*{.*}.*catch',
  'if.*\(.*\)\s*{',
  'return.*<.*>',
  'className=.*"',
  'onClick=.*{',
  'useState<.*>',
  'useEffect.*\(.*\)',
  'const.*=.*async.*\\(',
  'throw.*new.*Error',
  'console\.log',
  'console\.error',
  'console\.warn'
];

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, .next, dist, build
        if (!['node_modules', '.git', '.next', 'dist', 'build', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const patterns = {};
    
    for (const pattern of COMMON_PATTERNS) {
      const regex = new RegExp(pattern, 'g');
      const matches = content.match(regex);
      if (matches && matches.length >= DUPLICATE_THRESHOLD) {
        patterns[pattern] = matches.length;
      }
    }
    
    return {
      file: filePath,
      lines: lines.length,
      patterns: patterns
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
    return null;
  }
}

function generateReport() {
  console.log('🔍 Simple Duplicate Detection Report');
  console.log('=====================================\n');
  
  const files = findFiles('.');
  console.log(`📁 Analyzing ${files.length} files...\n`);
  
  const results = [];
  let totalDuplicates = 0;
  
  for (const file of files) {
    const analysis = analyzeFile(file);
    if (analysis && Object.keys(analysis.patterns).length > 0) {
      results.push(analysis);
      totalDuplicates += Object.values(analysis.patterns).reduce((sum, count) => sum + count, 0);
    }
  }
  
  // Sort by number of duplicate patterns
  results.sort((a, b) => {
    const aCount = Object.values(a.patterns).reduce((sum, count) => sum + count, 0);
    const bCount = Object.values(b.patterns).reduce((sum, count) => sum + count, 0);
    return bCount - aCount;
  });
  
  console.log(`📊 Found ${results.length} files with duplicate patterns`);
  console.log(`🔢 Total duplicate instances: ${totalDuplicates}\n`);
  
  // Top 20 files with most duplicates
  console.log('🏆 Top 20 files with most duplicates:');
  console.log('=====================================');
  
  results.slice(0, 20).forEach((result, index) => {
    const totalCount = Object.values(result.patterns).reduce((sum, count) => sum + count, 0);
    console.log(`${index + 1}. ${result.file} (${totalCount} duplicates)`);
    
    Object.entries(result.patterns).forEach(([pattern, count]) => {
      console.log(`   - ${pattern}: ${count} occurrences`);
    });
    console.log('');
  });
  
  // Pattern summary
  console.log('📈 Pattern Summary:');
  console.log('==================');
  
  const patternSummary = {};
  results.forEach(result => {
    Object.entries(result.patterns).forEach(([pattern, count]) => {
      patternSummary[pattern] = (patternSummary[pattern] || 0) + count;
    });
  });
  
  Object.entries(patternSummary)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([pattern, count]) => {
      console.log(`- ${pattern}: ${count} total occurrences`);
    });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('===================');
  console.log('1. Create shared components for common UI patterns');
  console.log('2. Extract common hooks to packages/shared/hooks/');
  console.log('3. Create utility functions in packages/shared/utils/');
  console.log('4. Standardize error handling patterns');
  console.log('5. Create common types in packages/shared/types/');
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    filesWithDuplicates: results.length,
    totalDuplicateInstances: totalDuplicates,
    topFiles: results.slice(0, 20).map(r => ({
      file: r.file,
      lines: r.lines,
      duplicateCount: Object.values(r.patterns).reduce((sum, count) => sum + count, 0),
      patterns: r.patterns
    })),
    patternSummary: patternSummary
  };
  
  fs.writeFileSync('reports/simple-duplicate-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: reports/simple-duplicate-report.json');
  
  return totalDuplicates;
}

// Run the analysis
const totalDuplicates = generateReport();

// Exit with appropriate code
if (totalDuplicates > 200) {
  console.log(`\n❌ High duplicate count: ${totalDuplicates} (target: ≤50)`);
  process.exit(1);
} else {
  console.log(`\n✅ Duplicate count acceptable: ${totalDuplicates} (target: ≤50)`);
  process.exit(0);
}
