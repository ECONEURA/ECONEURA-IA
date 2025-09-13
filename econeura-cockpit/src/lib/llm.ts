// Conector LLM - ECONEURA Cockpit
import { env } from './env';
import type { LlmMsg } from './models';

export interface LLMClient {
  chat(messages: LlmMsg[], opts?: { temp?: number; maxTokens?: number }): Promise<string>;
}

export function createLLM(): LLMClient {
  if (env.NEXT_PUBLIC_LLM_PROVIDER === 'azure') return azure();
  if (env.NEXT_PUBLIC_LLM_PROVIDER === 'mistral') return mistral();
  return mock();
}

function azure(): LLMClient {
  const {
    AZURE_OPENAI_ENDPOINT: endpoint,
    AZURE_OPENAI_DEPLOYMENT: deployment,
    AZURE_OPENAI_API_KEY: apiKey,
    AZURE_OPENAI_API_VERSION: apiVersion
  } = env;

  return {
    async chat(messages, opts) {
      const response = await fetch(
        `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': String(apiKey)
          },
          body: JSON.stringify({
            messages,
            temperature: opts?.temp ?? 0.2,
            max_tokens: opts?.maxTokens ?? 512
          })
        }
      );
      
      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? '';
    }
  };
}

function mistral(): LLMClient {
  const { MISTRAL_API_KEY: apiKey, MISTRAL_MODEL: model } = env;

  return {
    async chat(messages, opts) {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts?.temp ?? 0.2,
          max_tokens: opts?.maxTokens ?? 512
        })
      });
      
      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? '';
    }
  };
}

function mock(): LLMClient {
  return {
    async chat(messages) {
      const lastMessage = messages.at(-1)?.content || '';
      return `NEURA demo: ${lastMessage}`;
    }
  };
}

