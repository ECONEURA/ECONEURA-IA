#!/bin/bash

# ============================================================================
# OPTIMIZE BUNDLE - Optimización de bundles y dependencias
# ============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "📦 Optimizing bundles and dependencies..."

REPORT_DIR=".optimization-reports"
mkdir -p "$REPORT_DIR"

# 1. Analyze bundle sizes
log_info "Analyzing current bundle sizes..."

if command -v pnpm &> /dev/null; then
    # Generate bundle analysis if build exists
    if [[ -d "dist" ]] || [[ -d ".next" ]] || [[ -d "build" ]]; then
        find . -name "*.js" -path "*/dist/*" -o -path "*/.next/*" -o -path "*/build/*" | head -10 | while read file; do
            size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "unknown")
            echo "  📄 $file: $size"
        done > "$REPORT_DIR/current_bundle_sizes.txt"
        log_info "Bundle sizes saved to $REPORT_DIR/current_bundle_sizes.txt"
    fi
fi

# 2. Find unused dependencies
log_info "Analyzing dependencies..."

cat > "$REPORT_DIR/dependency_analysis.md" << 'EOF'
# 📦 Dependency Analysis Report

## 🎯 Package.json Files Found
EOF

find . -name "package.json" | grep -v node_modules | while read pkg_file; do
    echo "- $pkg_file" >> "$REPORT_DIR/dependency_analysis.md"
    
    # Check for common heavy dependencies that might be optimizable
    if grep -q '"lodash"' "$pkg_file"; then
        echo "  ⚠️ Contains lodash - consider lodash-es or individual functions" >> "$REPORT_DIR/dependency_analysis.md"
    fi
    if grep -q '"moment"' "$pkg_file"; then
        echo "  ⚠️ Contains moment.js - consider date-fns or dayjs for smaller bundle" >> "$REPORT_DIR/dependency_analysis.md"
    fi
    if grep -q '"@mui/material"' "$pkg_file"; then
        echo "  💡 Using Material-UI - ensure tree shaking is configured" >> "$REPORT_DIR/dependency_analysis.md"
    fi
    if grep -q '"react"' "$pkg_file"; then
        echo "  ✅ React app detected" >> "$REPORT_DIR/dependency_analysis.md"
    fi
done

# 3. Check for duplicate dependencies across packages
log_info "Checking for duplicate dependencies..."

echo "" >> "$REPORT_DIR/dependency_analysis.md"
echo "## 🔍 Potential Duplicate Dependencies" >> "$REPORT_DIR/dependency_analysis.md"

# Create temporary files for analysis
find . -name "package.json" | grep -v node_modules | while read pkg_file; do
    if [[ -f "$pkg_file" ]]; then
        jq -r '.dependencies // {} | keys[]' "$pkg_file" 2>/dev/null | while read dep; do
            echo "$dep:$pkg_file"
        done
    fi
done | sort > "$REPORT_DIR/all_deps.txt" 2>/dev/null || true

# Find dependencies that appear in multiple packages
if [[ -f "$REPORT_DIR/all_deps.txt" ]]; then
    cut -d: -f1 "$REPORT_DIR/all_deps.txt" | sort | uniq -c | sort -nr | while read count dep; do
        if [[ $count -gt 1 ]]; then
            echo "- **$dep** appears in $count packages" >> "$REPORT_DIR/dependency_analysis.md"
        fi
    done
fi

# 4. Generate optimization recommendations
log_info "Generating optimization recommendations..."

cat >> "$REPORT_DIR/dependency_analysis.md" << 'EOF'

## 💡 Optimization Recommendations

### Bundle Size Optimization
1. **Tree Shaking**: Ensure webpack/vite tree shaking is enabled
2. **Code Splitting**: Implement route-based code splitting
3. **Dynamic Imports**: Use dynamic imports for heavy libraries
4. **Bundle Analysis**: Run bundle analyzer to identify large dependencies

### Dependency Optimization
1. **Remove Unused**: Remove dependencies that are no longer used
2. **Consolidate Versions**: Use same version of dependencies across packages
3. **Lighter Alternatives**: Consider lighter alternatives for heavy libraries
4. **Peer Dependencies**: Move common dependencies to peer dependencies

### Performance Improvements
1. **Lazy Loading**: Implement lazy loading for components and routes
2. **Image Optimization**: Optimize and compress images
3. **Caching**: Implement proper caching strategies
4. **CDN**: Use CDN for static assets

EOF

# 5. Check for large files that could be optimized
log_info "Finding large files that could be optimized..."

echo "## 📁 Large Files Analysis" >> "$REPORT_DIR/dependency_analysis.md"
echo "" >> "$REPORT_DIR/dependency_analysis.md"

find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" \) \
    ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" \
    -size +100k | while read file; do
    size=$(du -h "$file" 2>/dev/null | cut -f1)
    echo "- **$file**: $size" >> "$REPORT_DIR/dependency_analysis.md"
done 2>/dev/null || true

# 6. Create package.json optimization script
log_info "Creating package.json optimization script..."

cat > "$REPORT_DIR/optimize-package-json.js" << 'EOF'
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
EOF

chmod +x "$REPORT_DIR/optimize-package-json.js"

# 7. Run package.json analysis
log_info "Running package.json analysis..."
node "$REPORT_DIR/optimize-package-json.js" > "$REPORT_DIR/package_json_analysis.txt" 2>/dev/null || echo "Node.js analysis skipped"

# 8. Generate webpack/vite optimization config
log_info "Generating build optimization recommendations..."

cat > "$REPORT_DIR/build-optimization.md" << 'EOF'
# 🚀 Build Optimization Guide

## Webpack Optimizations

```javascript
// webpack.config.js optimizations
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    usedExports: true,
    sideEffects: false,
  },
  resolve: {
    alias: {
      // Add path aliases to reduce bundle size
    },
  },
};
```

## Vite Optimizations

```javascript
// vite.config.js optimizations
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
};
```

## Next.js Optimizations

```javascript
// next.config.js optimizations
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups.commons = {
        name: 'commons',
        chunks: 'all',
        minChunks: 2,
      };
    }
    return config;
  },
};
```

EOF

log_success "Bundle optimization analysis completed!"

echo ""
echo "📊 Optimization Reports Generated:"
echo "  📄 $REPORT_DIR/dependency_analysis.md - Main analysis report"
echo "  📄 $REPORT_DIR/package_json_analysis.txt - Package.json issues"
echo "  📄 $REPORT_DIR/build-optimization.md - Build configuration guide"
echo "  🔧 $REPORT_DIR/optimize-package-json.js - Analysis script"
echo ""
echo "💡 Next Steps:"
echo "  1. Review dependency analysis report"
echo "  2. Remove unused dependencies"
echo "  3. Implement build optimizations"
echo "  4. Set up bundle size monitoring"
echo "  5. Consider dependency alternatives"