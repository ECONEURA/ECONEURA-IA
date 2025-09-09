# 📦 Dependency Analysis Report

## 🎯 Package.json Files Found
- ./apps/api/package.json
- ./apps/api-neura-comet/package.json
- ./apps/workers/package.json
- ./apps/web/package.json
  ✅ React app detected
- ./apps/api-agents-make/package.json
- ./tests/e2e/package.json
- ./studio/package.json
- ./econeura-cockpit/package.json
  ✅ React app detected
- ./package.json
- ./packages/agents/package.json
- ./packages/sdk/package.json
- ./packages/config/package.json
- ./packages/shared/package.json
- ./packages/db/package.json

## 🔍 Potential Duplicate Dependencies
- **zod** appears in 10 packages
- **axios** appears in 5 packages
- **helmet** appears in 4 packages
- **express** appears in 4 packages
- **cors** appears in 4 packages
- **react-dom** appears in 2 packages
- **react** appears in 2 packages
- **prom-client** appears in 2 packages
- **pg** appears in 2 packages
- **node-fetch** appears in 2 packages
- **next** appears in 2 packages
- **lucide-react** appears in 2 packages
- **ioredis** appears in 2 packages
- **drizzle-orm** appears in 2 packages
- **crypto** appears in 2 packages
- **bull** appears in 2 packages
- **body-parser** appears in 2 packages
- **@microsoft/microsoft-graph-client** appears in 2 packages
- **@econeura/shared** appears in 2 packages
- **@azure/msal-node** appears in 2 packages

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

## 📁 Large Files Analysis

- **./package-lock.json**: 808K
- **./apps/api/backup/index.full.ts**: 204K
- **./docs/audit/ESLINT.json**: 212K
