import Groq from "groq-sdk";

// ================================================================
// Groq SDK Client — Centralized initialization with retry logic
// ================================================================

let groqClient: Groq | null = null;

/**
 * Returns a singleton Groq SDK client instance.
 * Throws a clear error if the API key is missing.
 */
export function getGroqClient(): Groq {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[DocuWiki.AI] GROQ_API_KEY is not set. Please add it to your .env.local file."
    );
  }

  groqClient = new Groq({ apiKey });
  return groqClient;
}

/**
 * Default model configuration for all Groq completions.
 */
export const GROQ_MODEL = "llama-3.3-70b-versatile" as const;

export const GROQ_DEFAULTS = {
  model: GROQ_MODEL,
  temperature: 0.3,
  max_tokens: 8192,
  top_p: 0.9,
} as const;

/**
 * Retry configuration for handling rate limits and transient failures.
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep utility for retry backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a Groq chat completion with automatic retry on rate limits (429)
 * and transient server errors (500, 502, 503).
 */
export async function groqChatCompletion(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" } | { type: "text" };
  },
  retryConfig: RetryConfig = DEFAULT_RETRY
): Promise<Groq.Chat.Completions.ChatCompletion> {
  const client = getGroqClient();

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        ...GROQ_DEFAULTS,
        ...options,
        messages,
      });

      return completion;
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const isRetryable =
        status === 429 || status === 500 || status === 502 || status === 503;

      if (isRetryable && attempt < retryConfig.maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(
          retryConfig.baseDelayMs * Math.pow(2, attempt) +
            Math.random() * 500,
          retryConfig.maxDelayMs
        );

        console.warn(
          `[Groq] Request failed with status ${status}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})...`
        );

        await sleep(delay);
        continue;
      }

      // Non-retryable or exhausted retries
      throw error;
    }
  }

  throw new Error("[Groq] Exhausted all retry attempts.");
}

/**
 * Executes a streaming Groq chat completion.
 * Returns an async iterable of delta chunks.
 */
export async function groqChatCompletionStream(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk>> {
  const client = getGroqClient();

  const stream = await client.chat.completions.create({
    ...GROQ_DEFAULTS,
    ...options,
    messages,
    stream: true,
  });

  return stream;
}
