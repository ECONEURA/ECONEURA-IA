#!/usr/bin/env node
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAPI_SOURCE = join(__dirname, "../../apps/api/openapi/openapi.yaml");
const SNAPSHOT_TARGET = join(__dirname, "../../.artifacts/openapi.snapshot.json");

async function createSnapshot() {
  try {
    console.log("📸 Creating OpenAPI snapshot...");
    
    // Leer el archivo OpenAPI fuente
    const openapiContent = await fs.readFile(OPENAPI_SOURCE, "utf8");
    
    // Parsear YAML (asumiendo que es válido)
    const snapshot = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      source: "apps/api/openapi/openapi.yaml",
      content: openapiContent,
      hash: Buffer.from(openapiContent).toString('base64').slice(0, 16)
    };
    
    // Crear directorio de artefactos
    await fs.mkdir(join(__dirname, "../../.artifacts"), { recursive: true });
    
    // Escribir snapshot
    await fs.writeFile(SNAPSHOT_TARGET, JSON.stringify(snapshot, null, 2));
    
    console.log(`✅ OpenAPI snapshot created: ${SNAPSHOT_TARGET}`);
    console.log(`📊 Hash: ${snapshot.hash}`);
    
  } catch (error) {
    console.error("❌ Error creating OpenAPI snapshot:", error.message);
    process.exit(1);
  }
}

createSnapshot();