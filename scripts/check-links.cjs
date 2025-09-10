#!/usr/bin/env node
/**
 * Simple link checker for CI gates demonstration
 * In production, use lychee or a similar robust link checking tool
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const config = {
  ignorePatterns: [
    // Load ignore patterns from .lycheeignore
    'https://docs.microsoft.com/',
    'https://azure.microsoft.com/',
    'https://github.com/microsoft/',
    'https://twitter.com/',
    'https://linkedin.com/',
    'https://api.github.com/',
    'http://localhost',
    'https://localhost',
    'https://example.com',
    'https://portal.azure.com/'
  ],
  timeout: 10000,
  maxRetries: 2
};

// Load .lycheeignore file
function loadIgnorePatterns() {
  const ignorePath = path.join(process.cwd(), '.lycheeignore');
  if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, 'utf-8');
    const patterns = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    config.ignorePatterns.push(...patterns);
  }
}

// Extract links from markdown files
function extractLinksFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (url && !url.startsWith('#')) { // Skip anchors
      links.push({
        text: match[1],
        url: url,
        file: filePath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }
  
  return links;
}

// Check if URL should be ignored
function shouldIgnoreUrl(url) {
  return config.ignorePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    }
    return url.includes(pattern);
  });
}

// Check if URL is reachable
function checkUrl(url) {
  return new Promise((resolve) => {
    if (shouldIgnoreUrl(url)) {
      resolve({ url, status: 'ignored', reason: 'In ignore list' });
      return;
    }
    
    // Handle relative URLs and local paths
    if (url.startsWith('./') || url.startsWith('../') || !url.includes('://')) {
      // For relative URLs, check if file exists
      const filePath = path.resolve(path.dirname(process.cwd()), url);
      const exists = fs.existsSync(filePath);
      resolve({ 
        url, 
        status: exists ? 'ok' : 'broken', 
        reason: exists ? 'Local file exists' : 'Local file not found' 
      });
      return;
    }
    
    const protocol = url.startsWith('https:') ? https : http;
    const timeout = setTimeout(() => {
      resolve({ url, status: 'timeout', reason: 'Request timeout' });
    }, config.timeout);
    
    try {
      const request = protocol.get(url, { timeout: config.timeout }, (res) => {
        clearTimeout(timeout);
        const status = res.statusCode;
        if (status >= 200 && status < 400) {
          resolve({ url, status: 'ok', code: status });
        } else {
          resolve({ url, status: 'broken', code: status, reason: `HTTP ${status}` });
        }
      });
      
      request.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ 
          url, 
          status: 'broken', 
          reason: error.message.includes('ENOTFOUND') ? 'Domain not found' : error.message 
        });
      });
      
    } catch (error) {
      clearTimeout(timeout);
      resolve({ url, status: 'broken', reason: error.message });
    }
  });
}

// Find markdown files
function findMarkdownFiles(dir = process.cwd()) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Skip node_modules and other build directories
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        continue;
      }
      files.push(...findMarkdownFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.md')) {
      files.push(path.join(dir, entry.name));
    }
  }
  
  return files;
}

// Main function
async function main() {
  console.log('🔗 Starting link check...');
  
  loadIgnorePatterns();
  
  const markdownFiles = findMarkdownFiles();
  console.log(`Found ${markdownFiles.length} markdown files`);
  
  const allLinks = [];
  
  // Extract all links
  for (const file of markdownFiles) {
    const links = extractLinksFromFile(file);
    allLinks.push(...links);
  }
  
  console.log(`Found ${allLinks.length} total links`);
  
  // Check unique URLs only
  const uniqueUrls = [...new Set(allLinks.map(link => link.url))];
  console.log(`Checking ${uniqueUrls.length} unique URLs...`);
  
  const results = [];
  
  // Check URLs in batches to avoid overwhelming servers
  const batchSize = 10;
  for (let i = 0; i < uniqueUrls.length; i += batchSize) {
    const batch = uniqueUrls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < uniqueUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Process results
  const broken = results.filter(r => r.status === 'broken');
  const ignored = results.filter(r => r.status === 'ignored');
  const ok = results.filter(r => r.status === 'ok');
  
  console.log(`\n📊 Results:`);
  console.log(`✅ OK: ${ok.length}`);
  console.log(`⚠️ Ignored: ${ignored.length}`);
  console.log(`❌ Broken: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log(`\n❌ Broken links found:`);
    broken.forEach(result => {
      console.log(`  - ${result.url} (${result.reason})`);
    });
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      ok: ok.length,
      broken: broken.length,
      ignored: ignored.length
    },
    brokenLinks: broken.length,
    results: results
  };
  
  fs.writeFileSync('link-check-report.json', JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to link-check-report.json`);
  
  // Exit with error if broken links found
  if (broken.length > 0) {
    process.exit(1);
  } else {
    console.log(`\n✅ All internal links are working!`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Link check failed:', error);
    process.exit(1);
  });
}