#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'docs/status';
const MAX_PR_LIMIT = 300;

async function collectPRs() {
  console.log('🔍 Collecting PR data...');
  
  try {
    // Check if gh is authenticated
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      console.log('✅ GitHub CLI authenticated');
    } catch (error) {
      console.log('⚠️ GitHub CLI not authenticated - using local data only');
      return collectLocalPRs();
    }

    // Collect PRs via GitHub CLI
    const prCommand = `gh pr list --state all --limit ${MAX_PR_LIMIT} --json number,title,state,mergedAt,headRefName,baseRefName,updatedAt,createdAt,author,url`;
    const prData = JSON.parse(execSync(prCommand, { encoding: 'utf8' }));
    
    // Save JSON
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'PR_STATUS_REAL.json'),
      JSON.stringify(prData, null, 2)
    );

    // Generate CSV
    const csvHeader = 'number,title,state,mergedAt,headRefName,baseRefName,updatedAt,createdAt,author,url';
    const csvRows = prData.map(pr => [
      pr.number,
      `"${pr.title.replace(/"/g, '""')}"`,
      pr.state,
      pr.mergedAt || '',
      pr.headRefName,
      pr.baseRefName,
      pr.updatedAt,
      pr.createdAt,
      pr.author?.login || '',
      pr.url
    ].join(','));
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'PR_STATUS_REAL.csv'),
      [csvHeader, ...csvRows].join('\n')
    );

    // Generate Markdown
    const mdContent = `# PR Status Real

## Summary
- **Total PRs**: ${prData.length}
- **Open**: ${prData.filter(p => p.state === 'OPEN').length}
- **Merged**: ${prData.filter(p => p.state === 'MERGED').length}
- **Closed**: ${prData.filter(p => p.state === 'CLOSED').length}

## Recent PRs (Last 20)

| # | Title | State | Author | Updated |
|---|-------|-------|--------|---------|
${prData.slice(0, 20).map(pr => 
  `| ${pr.number} | ${pr.title} | ${pr.state} | ${pr.author?.login || 'N/A'} | ${new Date(pr.updatedAt).toLocaleDateString()} |`
).join('\n')}

## Data Files
- \`PR_STATUS_REAL.json\` - Complete JSON data
- \`PR_STATUS_REAL.csv\` - CSV format for analysis
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'PR_STATUS_REAL.md'), mdContent);
    
    console.log(`✅ PR data collected: ${prData.length} PRs`);
    console.log(`📁 Files created: ${OUTPUT_DIR}/PR_STATUS_REAL.{json,csv,md}`);
    
  } catch (error) {
    console.error('❌ Error collecting PRs:', error.message);
    return collectLocalPRs();
  }
}

function collectLocalPRs() {
  console.log('📊 Collecting local PR data...');
  
  try {
    // Get local branch information
    const branches = execSync('git branch -r', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.includes('pr-') || line.includes('PR-'))
      .map(line => line.trim().replace('origin/', ''));
    
    const localData = {
      message: 'Local data only - GitHub CLI not authenticated',
      branches: branches,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'PR_STATUS_REAL.json'),
      JSON.stringify(localData, null, 2)
    );
    
    console.log(`✅ Local PR data collected: ${branches.length} PR branches`);
    
  } catch (error) {
    console.error('❌ Error collecting local PRs:', error.message);
  }
}

collectPRs();
