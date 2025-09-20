#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

console.log('🔍 Verificando estado de PRs...\n');

try {
  // Obtener ramas remotas que parecen PRs
  const branches = execSync('git branch -r', { encoding: 'utf8' })
    .split('\n')
    .filter(line => line.includes('origin/pr-') || line.includes('origin/fix-'))
    .map(line => line.trim().replace('origin/', ''))
    .filter(branch => branch && !branch.includes('HEAD'));

  console.log(`📋 Encontradas ${branches.length} ramas de PRs:`);
  branches.forEach(branch => console.log(`  - ${branch}`));

  // Verificar estado de cada rama
  const prStatus = [];
  
  for (const branch of branches.slice(0, 10)) { // Limitar a 10 para no sobrecargar
    try {
      console.log(`\n🔍 Verificando ${branch}...`);
      
      // Verificar si la rama existe localmente
      const localExists = execSync(`git show-ref --verify --quiet refs/heads/${branch} 2>/dev/null; echo $?`, { encoding: 'utf8' }).trim() === '0';
      
      if (!localExists) {
        console.log(`  ⚠️  Rama no existe localmente, creando...`);
        execSync(`git fetch origin ${branch}:${branch}`, { stdio: 'pipe' });
      }
      
      // Verificar estado de CI
      const ciStatus = execSync(`cd ${projectRoot} && git checkout ${branch} 2>/dev/null && pnpm -w lint 2>&1 | tail -1 || echo "FAILED"`, { encoding: 'utf8' }).trim();
      
      prStatus.push({
        branch,
        localExists,
        ciStatus: ciStatus.includes('FAILED') ? 'FAILED' : 'PASSED',
        lastCommit: execSync(`git log -1 --format="%h %s" ${branch}`, { encoding: 'utf8' }).trim()
      });
      
      console.log(`  📊 CI Status: ${ciStatus.includes('FAILED') ? '❌ FAILED' : '✅ PASSED'}`);
      
    } catch (error) {
      console.log(`  ❌ Error verificando ${branch}: ${error.message}`);
      prStatus.push({
        branch,
        localExists: false,
        ciStatus: 'ERROR',
        lastCommit: 'N/A'
      });
    }
  }
  
  // Volver a main
  execSync('git checkout main', { stdio: 'pipe' });
  
  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    totalBranches: branches.length,
    checkedBranches: prStatus.length,
    status: prStatus
  };
  
  writeFileSync(join(projectRoot, 'reports/pr-status.json'), JSON.stringify(report, null, 2));
  
  console.log('\n📊 RESUMEN:');
  console.log('===========');
  console.log(`Total ramas: ${branches.length}`);
  console.log(`Verificadas: ${prStatus.length}`);
  console.log(`✅ Pasando: ${prStatus.filter(p => p.ciStatus === 'PASSED').length}`);
  console.log(`❌ Fallando: ${prStatus.filter(p => p.ciStatus === 'FAILED').length}`);
  console.log(`⚠️  Errores: ${prStatus.filter(p => p.ciStatus === 'ERROR').length}`);
  
  console.log('\n📄 Reporte guardado en: reports/pr-status.json');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
