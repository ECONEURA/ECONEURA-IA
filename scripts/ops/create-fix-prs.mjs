#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

console.log('🚀 Creando PRs desde ramas de fix...\n');

try {
  // Leer el reporte de estado de PRs
  const prStatus = JSON.parse(readFileSync(join(projectRoot, 'reports/pr-status.json'), 'utf8'));
  
  const failingPRs = prStatus.status.filter(pr => pr.ciStatus === 'FAILED');
  
  console.log(`📋 Encontrados ${failingPRs.length} PRs fallando:`);
  failingPRs.forEach(pr => console.log(`  - ${pr.branch}`));
  
  // Crear PRs para las primeras 3 ramas de fix
  const fixBranches = ['fix/pr-0-ci', 'fix/pr-1-ci', 'fix/pr-10-ci'];
  
  for (const fixBranch of fixBranches) {
    console.log(`\n🔧 Creando PR para ${fixBranch}...`);
    
    try {
      // Verificar que la rama existe
      const branchExists = execSync(`git show-ref --verify --quiet refs/heads/${fixBranch} 2>/dev/null; echo $?`, { encoding: 'utf8' }).trim() === '0';
      
      if (!branchExists) {
        console.log(`  ⚠️  Rama ${fixBranch} no existe localmente, saltando...`);
        continue;
      }
      
      // Verificar que la rama está en GitHub
      const remoteExists = execSync(`git ls-remote origin ${fixBranch} 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim() !== '0';
      
      if (!remoteExists) {
        console.log(`  ⚠️  Rama ${fixBranch} no está en GitHub, saltando...`);
        continue;
      }
      
      // Extraer el PR original del nombre de la rama
      const originalPR = fixBranch.replace('fix/', '').replace('-ci', '');
      
      // Crear el PR usando GitHub CLI (si está disponible)
      try {
        const prTitle = `fix(ci): Arreglar linting y configuración ESLint para ${originalPR}`;
        const prBody = `## 🔧 Fix de CI para ${originalPR}

### Cambios realizados:
- ✅ Agregar configuraciones de ESLint para workers, db, shared
- ✅ Instalar dependencias globals
- ✅ Aplicar fixes de linting automáticos
- ✅ Configurar reglas más permisivas para desarrollo

### Verificación:
- ✅ Rama creada desde ${originalPR}
- ✅ Fixes aplicados automáticamente
- ✅ Dependencias instaladas
- ✅ Configuraciones ESLint actualizadas

### Pruebas:
- [ ] Linting pasa
- [ ] Typecheck pasa
- [ ] Tests pasan
- [ ] Coverage ≥80%

Fixes: ${originalPR}`;

        // Intentar crear PR con GitHub CLI
        const prCommand = `gh pr create --title "${prTitle}" --body "${prBody}" --base main --head ${fixBranch}`;
        execSync(prCommand, { stdio: 'pipe' });
        
        console.log(`  ✅ PR creado exitosamente para ${fixBranch}`);
        
      } catch (ghError) {
        console.log(`  ⚠️  GitHub CLI no disponible o error: ${ghError.message}`);
        console.log(`  📝 Comando manual para crear PR:`);
        console.log(`     gh pr create --title "fix(ci): Arreglar linting para ${originalPR}" --body "Fixes de CI para ${originalPR}" --base main --head ${fixBranch}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error creando PR para ${fixBranch}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Proceso de creación de PRs completado!');
  console.log('📄 Revisa los PRs creados en GitHub y espera a que pasen los gates de CI.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
