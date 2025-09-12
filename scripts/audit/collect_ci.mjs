#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'docs/ci';
const MAX_RUNS_LIMIT = 100;

async function collectCI() {
  console.log('🔍 Collecting CI data...');
  
  try {
    // Check if gh is authenticated
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      console.log('✅ GitHub CLI authenticated');
    } catch (error) {
      console.log('⚠️ GitHub CLI not authenticated - using local data only');
      return collectLocalCI();
    }

    // Collect workflow runs
    const runsCommand = `gh run list --limit ${MAX_RUNS_LIMIT} --json name,status,conclusion,headSha,headBranch,createdAt,event,workflowName,url`;
    const runsData = JSON.parse(execSync(runsCommand, { encoding: 'utf8' }));
    
    // Collect workflows
    const workflowsCommand = `gh workflow list --json name,state,createdAt,updatedAt,path`;
    const workflowsData = JSON.parse(execSync(workflowsCommand, { encoding: 'utf8' }));
    
    // Analyze runs by workflow
    const workflowStats = {};
    runsData.forEach(run => {
      const workflowName = run.workflowName || run.name;
      if (!workflowStats[workflowName]) {
        workflowStats[workflowName] = {
          total: 0,
          success: 0,
          failure: 0,
          cancelled: 0,
          skipped: 0,
          lastRun: null
        };
      }
      
      workflowStats[workflowName].total++;
      workflowStats[workflowName][run.conclusion || run.status] = 
        (workflowStats[workflowName][run.conclusion || run.status] || 0) + 1;
      
      if (!workflowStats[workflowName].lastRun || 
          new Date(run.createdAt) > new Date(workflowStats[workflowName].lastRun.createdAt)) {
        workflowStats[workflowName].lastRun = run;
      }
    });

    // Generate CI Matrix
    const matrixContent = `# CI Matrix

## Workflow Status

| Workflow | Total Runs | Success | Failure | Cancelled | Success Rate | Last Run |
|----------|------------|---------|---------|-----------|--------------|----------|
${Object.entries(workflowStats).map(([name, stats]) => {
  const successRate = ((stats.success / stats.total) * 100).toFixed(1);
  const lastRunDate = stats.lastRun ? new Date(stats.lastRun.createdAt).toLocaleDateString() : 'N/A';
  return `| ${name} | ${stats.total} | ${stats.success} | ${stats.failure} | ${stats.cancelled} | ${successRate}% | ${lastRunDate} |`;
}).join('\n')}

## Recent Runs (Last 20)

| Workflow | Status | Conclusion | Branch | Created | URL |
|----------|--------|------------|--------|---------|-----|
${runsData.slice(0, 20).map(run => 
  `| ${run.workflowName || run.name} | ${run.status} | ${run.conclusion || 'N/A'} | ${run.headBranch} | ${new Date(run.createdAt).toLocaleDateString()} | [View](${run.url}) |`
).join('\n')}

## Workflows

| Name | State | Path | Created | Updated |
|------|-------|------|---------|---------|
${workflowsData.map(workflow => 
  `| ${workflow.name} | ${workflow.state} | ${workflow.path} | ${new Date(workflow.createdAt).toLocaleDateString()} | ${new Date(workflow.updatedAt).toLocaleDateString()} |`
).join('\n')}

## Data Files
- \`CI_MATRIX.md\` - This file
- \`RUNS_SUMMARY.json\` - Complete runs data
- \`WORKFLOWS.json\` - Workflows data
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'CI_MATRIX.md'), matrixContent);
    
    // Save raw data
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'RUNS_SUMMARY.json'),
      JSON.stringify(runsData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'WORKFLOWS.json'),
      JSON.stringify(workflowsData, null, 2)
    );
    
    console.log(`✅ CI data collected: ${runsData.length} runs, ${workflowsData.length} workflows`);
    console.log(`📁 Files created: ${OUTPUT_DIR}/CI_MATRIX.md, RUNS_SUMMARY.json, WORKFLOWS.json`);
    
  } catch (error) {
    console.error('❌ Error collecting CI data:', error.message);
    return collectLocalCI();
  }
}

function collectLocalCI() {
  console.log('📊 Collecting local CI data...');
  
  try {
    // Get local workflow files
    const workflowFiles = execSync('find .github/workflows -name "*.yml" -o -name "*.yaml"', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim());
    
    const localData = {
      message: 'Local data only - GitHub CLI not authenticated',
      workflows: workflowFiles,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'CI_MATRIX.md'),
      `# CI Matrix (Local)

## Local Workflows Found
${workflowFiles.map(file => `- ${file}`).join('\n')}

## Note
GitHub CLI not authenticated. Run \`gh auth login\` to collect full CI data.
`
    );
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'RUNS_SUMMARY.json'),
      JSON.stringify(localData, null, 2)
    );
    
    console.log(`✅ Local CI data collected: ${workflowFiles.length} workflow files`);
    
  } catch (error) {
    console.error('❌ Error collecting local CI data:', error.message);
  }
}

collectCI();
