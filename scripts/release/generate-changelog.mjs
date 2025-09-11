#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate changelog from conventional commits
 */
class ChangelogGenerator {
  constructor() {
    this.changelogPath = 'CHANGELOG.md';
    this.packageJsonPath = 'package.json';
  }

  /**
   * Get package version
   */
  getPackageVersion() {
    try {
      const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('Error reading package.json:', error.message);
      return '1.0.0';
    }
  }

  /**
   * Get commits since last tag
   */
  getCommitsSinceLastTag() {
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"%h|%s|%b"`, { encoding: 'utf8' });
      return commits.split('\n').filter(commit => commit.trim());
    } catch (error) {
      // If no tags exist, get all commits
      const commits = execSync('git log --pretty=format:"%h|%s|%b"', { encoding: 'utf8' });
      return commits.split('\n').filter(commit => commit.trim());
    }
  }

  /**
   * Parse conventional commit
   */
  parseCommit(commitLine) {
    const [hash, subject, body] = commitLine.split('|');
    
    // Parse conventional commit format
    const conventionalCommitRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
    const match = subject.match(conventionalCommitRegex);
    
    if (!match) {
      return {
        hash: hash?.trim(),
        type: 'chore',
        scope: null,
        breaking: false,
        subject: subject?.trim(),
        body: body?.trim()
      };
    }

    const [, type, scope, breaking, description] = match;
    
    return {
      hash: hash?.trim(),
      type: type.toLowerCase(),
      scope: scope?.trim() || null,
      breaking: !!breaking,
      subject: description?.trim(),
      body: body?.trim()
    };
  }

  /**
   * Categorize commits by type
   */
  categorizeCommits(commits) {
    const categories = {
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      style: [],
      test: [],
      build: [],
      ci: [],
      chore: [],
      revert: []
    };

    commits.forEach(commitLine => {
      const commit = this.parseCommit(commitLine);
      
      if (commit.breaking) {
        categories.feat.push({ ...commit, breaking: true });
      } else if (categories[commit.type]) {
        categories[commit.type].push(commit);
      } else {
        categories.chore.push(commit);
      }
    });

    return categories;
  }

  /**
   * Generate changelog section
   */
  generateChangelogSection(version, categories) {
    const date = new Date().toISOString().split('T')[0];
    let changelog = `## [${version}] - ${date}\n\n`;

    // Features
    if (categories.feat.length > 0) {
      changelog += '### 🚀 Features\n\n';
      categories.feat.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        const breaking = commit.breaking ? ' **BREAKING CHANGE**' : '';
        changelog += `- ${scope}${commit.subject}${breaking}\n`;
      });
      changelog += '\n';
    }

    // Bug Fixes
    if (categories.fix.length > 0) {
      changelog += '### 🐛 Bug Fixes\n\n';
      categories.fix.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Performance Improvements
    if (categories.perf.length > 0) {
      changelog += '### ⚡ Performance Improvements\n\n';
      categories.perf.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Code Refactoring
    if (categories.refactor.length > 0) {
      changelog += '### ♻️ Code Refactoring\n\n';
      categories.refactor.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Documentation
    if (categories.docs.length > 0) {
      changelog += '### 📚 Documentation\n\n';
      categories.docs.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Tests
    if (categories.test.length > 0) {
      changelog += '### 🧪 Tests\n\n';
      categories.test.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Build System
    if (categories.build.length > 0) {
      changelog += '### 🏗️ Build System\n\n';
      categories.build.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // CI/CD
    if (categories.ci.length > 0) {
      changelog += '### 👷 CI/CD\n\n';
      categories.ci.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Chores
    if (categories.chore.length > 0) {
      changelog += '### 🔧 Chores\n\n';
      categories.chore.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    // Reverts
    if (categories.revert.length > 0) {
      changelog += '### ⏪ Reverts\n\n';
      categories.revert.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      });
      changelog += '\n';
    }

    return changelog;
  }

  /**
   * Update changelog file
   */
  updateChangelog(newSection) {
    let existingChangelog = '';
    
    try {
      existingChangelog = readFileSync(this.changelogPath, 'utf8');
    } catch (error) {
      // Create new changelog if it doesn't exist
      existingChangelog = '# ECONEURA Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }

    // Insert new section after the header
    const lines = existingChangelog.split('\n');
    const headerEndIndex = lines.findIndex(line => line.startsWith('## ['));
    
    if (headerEndIndex === -1) {
      // No existing versions, append to end
      const updatedChangelog = existingChangelog + '\n' + newSection;
      writeFileSync(this.changelogPath, updatedChangelog);
    } else {
      // Insert after header
      const beforeHeader = lines.slice(0, headerEndIndex).join('\n');
      const afterHeader = lines.slice(headerEndIndex).join('\n');
      const updatedChangelog = beforeHeader + '\n' + newSection + '\n' + afterHeader;
      writeFileSync(this.changelogPath, updatedChangelog);
    }
  }

  /**
   * Generate changelog
   */
  generate() {
    console.log('🔄 Generating changelog...');
    
    const version = this.getPackageVersion();
    const commits = this.getCommitsSinceLastTag();
    const categories = this.categorizeCommits(commits);
    
    // Check if there are any changes
    const totalChanges = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalChanges === 0) {
      console.log('ℹ️ No changes detected since last release');
      return;
    }

    const newSection = this.generateChangelogSection(version, categories);
    this.updateChangelog(newSection);
    
    console.log(`✅ Changelog generated for version ${version}`);
    console.log(`📊 Total changes: ${totalChanges}`);
    
    // Print summary
    Object.entries(categories).forEach(([type, commits]) => {
      if (commits.length > 0) {
        console.log(`  ${type}: ${commits.length} changes`);
      }
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ChangelogGenerator();
  generator.generate();
}

export default ChangelogGenerator;
