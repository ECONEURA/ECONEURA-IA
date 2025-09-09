import { Pool } from 'pg';
import { createClient } from 'redis';

// Database and Redis connections
const pgPool = new Pool({
  connectionString: process.env.MEM_PG_URL || 'postgres://localhost:5432/econeura_mem'
});

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize Redis connection
redis.on('error', (err) => console.error('Redis Client Error', err));
redis.connect().catch(console.error);

// Persona definitions for different departments
export function persona(dept: string): string {
  const personas = {
    ceo: "Eres NEURA, asistente ejecutivo del CEO. Proporcionas insights estratégicos, análisis de mercado y recomendaciones de alto nivel. Eres conciso y orientado a resultados.",
    cfo: "Eres NEURA, asistente financiero del CFO. Ayudas con análisis financieros, presupuestos, costos y optimización de recursos. Eres preciso con números y datos.",
    ciso: "Eres NEURA, asistente de seguridad del CISO. Proporcionas análisis de riesgos, recomendaciones de seguridad y cumplimiento. Eres meticuloso con la seguridad.",
    cto: "Eres NEURA, asistente técnico del CTO. Ayudas con arquitectura, decisiones técnicas y optimización de sistemas. Eres técnico pero accesible.",
    cpo: "Eres NEURA, asistente de producto del CPO. Ayudas con estrategia de producto, análisis de usuarios y roadmap. Eres centrado en el usuario.",
    cmo: "Eres NEURA, asistente de marketing del CMO. Ayudas con estrategias de marketing, análisis de campañas y crecimiento. Eres creativo y analítico.",
    chro: "Eres NEURA, asistente de recursos humanos del CHRO. Ayudas con gestión de talento, cultura organizacional y desarrollo. Eres empático y estratégico.",
    coo: "Eres NEURA, asistente operacional del COO. Ayudas con optimización de procesos, eficiencia operacional y gestión de recursos. Eres sistemático y eficiente.",
    cso: "Eres NEURA, asistente de ventas del CSO. Ayudas con estrategias de ventas, análisis de pipeline y crecimiento de ingresos. Eres orientado a resultados.",
    cco: "Eres NEURA, asistente de cumplimiento del CCO. Ayudas con regulaciones, compliance y gestión de riesgos. Eres detallista y preciso."
  };
  
  return personas[dept as keyof typeof personas] || "Eres NEURA, asistente inteligente. Ayudas con análisis, recomendaciones y automatización de tareas.";
}

// Load short-term memory from Redis
export async function loadShort(userId: string, dept: string, limit: number = 8): Promise<Array<{role: string, content: string}>> {
  try {
    const key = `chat:${userId}:${dept}`;
    const messages = await redis.lRange(key, -limit, -1);
    
    return messages.map(msg => {
      const parsed = JSON.parse(msg);
      return { role: parsed.role, content: parsed.content };
    });
  } catch (error) {
    console.error('❌ Error loading short memory:', error);
    return [];
  }
}

// Recall relevant memories using vector similarity
export async function recall(userId: string, dept: string, query: string, limit: number = 8): Promise<string[]> {
  try {
    // For demo purposes, we'll use a simple text search
    // In production, you'd generate embeddings for the query and use vector similarity
    const result = await pgPool.query(`
      SELECT content 
      FROM chat_memory 
      WHERE user_id = $1 AND dept = $2 
      ORDER BY ts DESC 
      LIMIT $3
    `, [userId, dept, limit]);
    
    return result.rows.map(row => row.content);
  } catch (error) {
    console.error('❌ Error recalling memories:', error);
    return [];
  }
}

// Get conversation summary
export async function getSummary(userId: string, dept: string): Promise<{summary: string}> {
  try {
    const result = await pgPool.query(`
      SELECT summary 
      FROM chat_summaries 
      WHERE user_id = $1 AND dept = $2
    `, [userId, dept]);
    
    return { summary: result.rows[0]?.summary || "" };
  } catch (error) {
    console.error('❌ Error getting summary:', error);
    return { summary: "" };
  }
}

// Persist conversation turn
export async function persistTurn(userId: string, dept: string, role: 'user' | 'assistant', content: string): Promise<void> {
  try {
    // Store in Redis for short-term access
    const key = `chat:${userId}:${dept}`;
    const message = JSON.stringify({ role, content, timestamp: new Date().toISOString() });
    await redis.lPush(key, message);
    await redis.lTrim(key, 0, 19); // Keep last 20 messages
    await redis.expire(key, 86400); // Expire after 24 hours
    
    // Store in PostgreSQL for long-term storage
    await pgPool.query(`
      INSERT INTO chat_messages (user_id, dept, role, content)
      VALUES ($1, $2, $3, $4)
    `, [userId, dept, role, content]);
    
    // Store important memories
    if (role === 'assistant' && content.length > 50) {
      await pgPool.query(`
        INSERT INTO chat_memory (user_id, dept, kind, content)
        VALUES ($1, $2, 'episodic', $3)
      `, [userId, dept, content]);
    }
  } catch (error) {
    console.error('❌ Error persisting turn:', error);
  }
}

// Check if summary should be refreshed
export function shouldRefresh(userId: string, dept: string): boolean {
  // Simple heuristic: refresh every 10 messages
  // In production, you'd use a more sophisticated approach
  return Math.random() < 0.1; // 10% chance
}

// Update conversation summary
export async function upsertSummary(userId: string, dept: string): Promise<void> {
  try {
    // Get recent messages for summarization
    const result = await pgPool.query(`
      SELECT role, content 
      FROM chat_messages 
      WHERE user_id = $1 AND dept = $2 
      ORDER BY ts DESC 
      LIMIT 20
    `, [userId, dept]);
    
    if (result.rows.length === 0) return;
    
    // Create a simple summary (in production, use AI summarization)
    const messages = result.rows.reverse();
    const summary = `Conversación con ${messages.length} mensajes. Último tema: ${messages[messages.length - 1]?.content?.substring(0, 100)}...`;
    
    await pgPool.query(`
      INSERT INTO chat_summaries (user_id, dept, summary)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, dept)
      DO UPDATE SET summary = $3, updated_at = now()
    `, [userId, dept, summary]);
    
  } catch (error) {
    console.error('❌ Error updating summary:', error);
  }
}

