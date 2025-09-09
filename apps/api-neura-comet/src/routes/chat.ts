import { Router } from "express";
import fetch from "node-fetch";
import { 
  loadShort, 
  recall, 
  getSummary, 
  persistTurn, 
  shouldRefresh, 
  upsertSummary, 
  persona 
} from "../svc/memory";
import { z } from "zod";

const router = Router();

// Request validation schema
const ChatRequestSchema = z.object({
  userId: z.string().min(1),
  dept: z.string().min(1),
  text: z.string().min(1)
});

/**
 * POST /neura/chat
 * Chat endpoint with persistent memory and tool calling
 */
router.post("/chat", async (req, res) => {
  try {
    // Validate request
    const { userId, dept, text } = ChatRequestSchema.parse(req.body);
    
    // Load context from memory
    const short = await loadShort(userId, dept, 8);                   // Redis
    const { summary } = await getSummary(userId, dept);               // PG
    const recalls = await recall(userId, dept, text, 8);              // pgvector
    
    // Build message context
    const messages = [
      { role: "system", content: persona(dept) },
      { role: "system", content: `Resumen: ${summary || "N/A"}` },
      { role: "system", content: `Memoria relevante: ${recalls.join(" | ")}` },
      ...short,
      { role: "user", content: text }
    ];

    // Call Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PPLX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "run_agent",
            description: "Execute an agent workflow",
            parameters: {
              type: "object",
              properties: {
                dept: { type: "string", description: "Department" },
                agentKey: { type: "string", description: "Agent identifier" },
                params: { type: "object", description: "Agent parameters" },
                hitl: { type: "boolean", description: "Human in the loop" }
              },
              required: ["dept", "agentKey"]
            }
          }
        }],
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content ?? "";
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];

    // Persist conversation turn
    await persistTurn(userId, dept, "user", text);
    await persistTurn(userId, dept, "assistant", content);

    // Check if we need to refresh summary
    if (shouldRefresh(userId, dept)) {
      await upsertSummary(userId, dept);
    }

    // Handle tool calls (agent execution)
    if (toolCall?.function?.name === "run_agent") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Trigger agent execution
        const agentResponse = await fetch(
          process.env.AGENTS_TRIGGER_URL || "http://localhost:3102/agents/trigger",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-idempotency-key": crypto.randomUUID(),
              "x-tenant-id": req.header("x-tenant-id") || "demo"
            },
            body: JSON.stringify({
              dept: args.dept,
              agentKey: args.agentKey,
              params: args.params || {},
              hitl: !!args.hitl
            })
          }
        );

        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          console.log(`🤖 Agent triggered: ${args.agentKey} (${agentData.runId})`);
        }
      } catch (error) {
        console.error("❌ Agent trigger failed:", error);
      }
    }

    // Response with cost tracking headers
    res.set({
      "X-Est-Cost-EUR": "0.002",
      "X-Budget-Pct": "15",
      "X-Latency-ms": "1200",
      "X-Route": "neura-chat",
      "X-Correlation-Id": req.header("x-correlation-id") || crypto.randomUUID()
    });

    res.json({
      content,
      tool: toolCall ? {
        name: toolCall.function.name,
        arguments: toolCall.function.arguments
      } : null
    });

  } catch (error) {
    console.error("❌ Chat error:", error);
    
    res.status(500).json({
      error: "Chat processing failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;

