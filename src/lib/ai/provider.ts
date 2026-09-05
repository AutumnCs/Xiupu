import "server-only";

type ChatMessage = {
  role: string;
  content: unknown;
  [key: string]: unknown;
};

type ChatParams = {
  capability?: "text" | "vision";
  model?: string;
  model_key?: string;
  messages: ChatMessage[];
  stream?: boolean;
  [key: string]: unknown;
};

type ChatCompletionLike = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type ProviderConfigInput = {
  baseUrl: string | undefined;
  apiKey: string | undefined;
  model: string | undefined;
};

export type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class AppAIUnavailableError extends Error {
  code = "app_ai_unavailable";

  constructor(message = "AI provider is not configured") {
    super(message);
    this.name = "AppAIUnavailableError";
  }
}

export function getProviderConfig(input: ProviderConfigInput): ProviderConfig {
  const baseUrl = input.baseUrl?.trim().replace(/\/+$/, "") ?? "";
  const apiKey = input.apiKey?.trim() ?? "";
  const model = input.model?.trim() ?? "";

  if (!baseUrl || !apiKey || !model) {
    throw new AppAIUnavailableError();
  }

  return { baseUrl, apiKey, model };
}

function configuredProvider(): ProviderConfig {
  return getProviderConfig({
    baseUrl: process.env.AI_PROVIDER_BASE_URL,
    apiKey: process.env.AI_PROVIDER_API_KEY,
    model: process.env.AI_PROVIDER_MODEL,
  });
}

export function isProviderConfigured(): boolean {
  try {
    configuredProvider();
    return true;
  } catch (error) {
    if (error instanceof AppAIUnavailableError) return false;
    throw error;
  }
}

async function chat(params: ChatParams): Promise<ChatCompletionLike> {
  const provider = configuredProvider();
  const body = { ...params };
  delete body.capability;
  delete body.model;
  delete body.model_key;
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({ ...body, model: provider.model }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed (${response.status})`);
  }

  return response.json() as Promise<ChatCompletionLike>;
}

export const appAi = { chat };
