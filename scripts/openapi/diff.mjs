#!/usr/bin/env node
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAPI_SOURCE = join(__dirname, "../../apps/api/openapi/openapi.yaml");
const SNAPSHOT_TARGET = join(__dirname, "../../.artifacts/openapi.snapshot.json");
const DIFF_REPORT = join(__dirname, "../../reports/openapi-diff.json");

async function checkOpenAPIDiff() {
  try {
    console.log("🔍 Checking OpenAPI diff...");
    
    // Leer archivo fuente actual
    const currentContent = await fs.readFile(OPENAPI_SOURCE, "utf8");
    const currentHash = Buffer.from(currentContent).toString('base64').slice(0, 16);
    
    // Leer snapshot si existe
    let snapshotHash = null;
    let snapshotTimestamp = null;
    
    try {
      const snapshotContent = await fs.readFile(SNAPSHOT_TARGET, "utf8");
      const snapshot = JSON.parse(snapshotContent);
      snapshotHash = snapshot.hash;
      snapshotTimestamp = snapshot.timestamp;
    } catch (error) {
      console.log("⚠️ No snapshot found, creating baseline...");
    }
    
    // Comparar hashes
    const hasChanges = snapshotHash !== currentHash;
    
    const diffReport = {
      timestamp: new Date().toISOString(),
      hasChanges,
      currentHash,
      snapshotHash,
      snapshotTimestamp,
      status: hasChanges ? "CHANGED" : "UNCHANGED",
      message: hasChanges ? "OpenAPI specification has changed" : "OpenAPI specification is unchanged"
    };
    
    // Crear directorio de reportes
    await fs.mkdir(join(__dirname, "../../reports"), { recursive: true });
    
    // Escribir reporte
    await fs.writeFile(DIFF_REPORT, JSON.stringify(diffReport, null, 2));
    
    console.log(`📊 OpenAPI diff status: ${diffReport.status}`);
    console.log(`📋 Report: ${DIFF_REPORT}`);
    
    if (hasChanges) {
      console.log("⚠️ OpenAPI has changed - review required");
      console.log(`   Current: ${currentHash}`);
      console.log(`   Snapshot: ${snapshotHash || 'none'}`);
    } else {
      console.log("✅ OpenAPI is stable");
    }
    
    // Exit code 0 para success, 1 para changes
    process.exit(hasChanges ? 1 : 0);
    
  } catch (error) {
    console.error("❌ Error checking OpenAPI diff:", error.message);
    process.exit(1);
  }
}

checkOpenAPIDiff();