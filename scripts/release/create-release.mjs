#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Create GitHub release with changelog
 */
class ReleaseCreator {
  constructor() {
    this.packageJsonPath = 'package.json';
    this.changelogPath = 'CHANGELOG.md';
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
   * Get changelog for version
   */
  getChangelogForVersion(version) {
    try {
      const changelog = readFileSync(this.changelogPath, 'utf8');
      const lines = changelog.split('\n');
      
      // Find the section for this version
      const versionIndex = lines.findIndex(line => line.includes(`[${version}]`));
      
      if (versionIndex === -1) {
        return `Release ${version}`;
      }

      // Extract the section until the next version
      const nextVersionIndex = lines.findIndex((line, index) => 
        index > versionIndex && line.startsWith('## [')
      );

      const sectionLines = nextVersionIndex === -1 
        ? lines.slice(versionIndex)
        : lines.slice(versionIndex, nextVersionIndex);

      return sectionLines.join('\n').trim();
    } catch (error) {
      console.error('Error reading changelog:', error.message);
      return `Release ${version}`;
    }
  }

  /**
   * Check if tag exists
   */
  tagExists(tag) {
    try {
      execSync(`git rev-parse ${tag}`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create git tag
   */
  createTag(version, message) {
    const tag = `v${version}`;
    
    if (this.tagExists(tag)) {
      console.log(`ℹ️ Tag ${tag} already exists`);
      return tag;
    }

    try {
      execSync(`git tag -a ${tag} -m "${message}"`, { stdio: 'inherit' });
      console.log(`✅ Created tag ${tag}`);
      return tag;
    } catch (error) {
      console.error(`❌ Failed to create tag ${tag}:`, error.message);
      throw error;
    }
  }

  /**
   * Push tag to remote
   */
  pushTag(tag) {
    try {
      execSync(`git push origin ${tag}`, { stdio: 'inherit' });
      console.log(`✅ Pushed tag ${tag} to remote`);
    } catch (error) {
      console.error(`❌ Failed to push tag ${tag}:`, error.message);
      throw error;
    }
  }

  /**
   * Create GitHub release
   */
  createGitHubRelease(version, changelog) {
    const tag = `v${version}`;
    const title = `Release ${version}`;
    
    try {
      // Check if GitHub CLI is available
      execSync('gh --version', { stdio: 'pipe' });
      
      // Create release
      const releaseCommand = `gh release create ${tag} --title "${title}" --notes "${changelog}"`;
      execSync(releaseCommand, { stdio: 'inherit' });
      
      console.log(`✅ Created GitHub release ${tag}`);
    } catch (error) {
      console.error('❌ Failed to create GitHub release:', error.message);
      console.log('💡 Make sure GitHub CLI is installed and authenticated');
      console.log('💡 Or create the release manually at: https://github.com/ECONEURA/ECONEURA-IA/releases/new');
      throw error;
    }
  }

  /**
   * Update package version
   */
  updatePackageVersion(newVersion) {
    try {
      const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
      packageJson.version = newVersion;
      
      const updatedPackageJson = JSON.stringify(packageJson, null, 2) + '\n';
      require('fs').writeFileSync(this.packageJsonPath, updatedPackageJson);
      
      console.log(`✅ Updated package.json version to ${newVersion}`);
    } catch (error) {
      console.error('❌ Failed to update package.json:', error.message);
      throw error;
    }
  }

  /**
   * Calculate next version
   */
  calculateNextVersion(currentVersion, releaseType) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (releaseType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Create release
   */
  create(releaseType = 'patch') {
    console.log('🚀 Creating release...');
    
    const currentVersion = this.getPackageVersion();
    const newVersion = this.calculateNextVersion(currentVersion, releaseType);
    
    console.log(`📦 Current version: ${currentVersion}`);
    console.log(`📦 New version: ${newVersion}`);
    
    // Update package.json
    this.updatePackageVersion(newVersion);
    
    // Generate changelog
    try {
      const { default: ChangelogGenerator } = await import('./generate-changelog.mjs');
      const generator = new ChangelogGenerator();
      generator.generate();
    } catch (error) {
      console.error('❌ Failed to generate changelog:', error.message);
    }
    
    // Get changelog for this version
    const changelog = this.getChangelogForVersion(newVersion);
    
    // Create and push tag
    const tag = this.createTag(newVersion, `Release ${newVersion}`);
    this.pushTag(tag);
    
    // Create GitHub release
    try {
      this.createGitHubRelease(newVersion, changelog);
    } catch (error) {
      console.log('⚠️ GitHub release creation failed, but tag was created');
    }
    
    console.log(`🎉 Release ${newVersion} created successfully!`);
    console.log(`📋 Changelog: ${this.changelogPath}`);
    console.log(`🏷️ Tag: ${tag}`);
    console.log(`🔗 GitHub: https://github.com/ECONEURA/ECONEURA-IA/releases/tag/${tag}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const releaseType = process.argv[2] || 'patch';
  const creator = new ReleaseCreator();
  creator.create(releaseType);
}

export default ReleaseCreator;
