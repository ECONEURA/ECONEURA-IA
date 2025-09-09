#!/usr/bin/env node

// Script to help optimize package.json files
const fs = require('fs');
const path = require('path');

function analyzePackageJson(filePath) {
    try {
        const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const analysis = {
            file: filePath,
            issues: [],
            suggestions: []
        };
        
        // Check for missing fields
        if (!pkg.description) analysis.issues.push('Missing description');
        if (!pkg.keywords) analysis.issues.push('Missing keywords');
        if (!pkg.repository) analysis.issues.push('Missing repository');
        
        // Check dependencies
        const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
        
        // Look for outdated patterns
        if (deps['@types/node'] && !deps['typescript']) {
            analysis.suggestions.push('Consider adding TypeScript if using @types/node');
        }
        
        // Check for heavy dependencies
        const heavyDeps = ['lodash', 'moment', 'jquery'];
        heavyDeps.forEach(dep => {
            if (deps[dep]) {
                analysis.suggestions.push(`Consider lighter alternative to ${dep}`);
            }
        });
        
        return analysis;
    } catch (error) {
        return { file: filePath, error: error.message };
    }
}

// Find and analyze all package.json files
const packageFiles = [];
function findPackageFiles(dir) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules') {
                findPackageFiles(fullPath);
            } else if (file === 'package.json') {
                packageFiles.push(fullPath);
            }
        });
    } catch (error) {
        // Skip directories we can't read
    }
}

findPackageFiles('.');

console.log('📦 Package.json Analysis Results\n');
packageFiles.forEach(file => {
    const analysis = analyzePackageJson(file);
    console.log(`📄 ${analysis.file}`);
    if (analysis.error) {
        console.log(`  ❌ Error: ${analysis.error}`);
    } else {
        if (analysis.issues.length > 0) {
            console.log('  🚨 Issues:');
            analysis.issues.forEach(issue => console.log(`    - ${issue}`));
        }
        if (analysis.suggestions.length > 0) {
            console.log('  💡 Suggestions:');
            analysis.suggestions.forEach(suggestion => console.log(`    - ${suggestion}`));
        }
        if (analysis.issues.length === 0 && analysis.suggestions.length === 0) {
            console.log('  ✅ Looks good!');
        }
    }
    console.log('');
});
