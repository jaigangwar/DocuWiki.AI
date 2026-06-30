// ================================================================
// API Route: /api/chat
// Streaming chat endpoint — receives user query + OKF context,
// streams Groq response with source citations
// ================================================================

import { NextRequest } from "next/server";
import { groqChatCompletionStream } from "@/lib/groq";
import { OKF_CHAT_SYSTEM_PROMPT, buildChatPrompt } from "@/lib/okf-prompts";

interface ContextFile {
  filepath: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // ---- Parse Request ----
    const body = await request.json();
    const { query, contextFiles } = body as {
      query: string;
      contextFiles: ContextFile[];
    };

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide a question." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!contextFiles || contextFiles.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "No knowledge base files available. Please process some PDFs first.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ---- Build Prompt ----
    const userPrompt = buildChatPrompt(query, contextFiles);

    // ---- Stream Response from Groq ----
    const stream = await groqChatCompletionStream(
      [
        { role: "system", content: OKF_CHAT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.3,
        max_tokens: 2048,
      }
    );

    // ---- Create ReadableStream for SSE ----
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              // Send as Server-Sent Event format
              const data = JSON.stringify({ content: delta });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Check for finish reason
            if (chunk.choices[0]?.finish_reason === "stop") {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            }
          }
        } catch (streamError: any) {
          console.error("[Chat] Stream error:", streamError);
          const errorData = JSON.stringify({
            error: streamError.message || "Stream interrupted",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[Chat] Error:", error);

    const status = error?.status || error?.statusCode;

    if (status === 429) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment and try again.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (status === 401) {
      return new Response(
        JSON.stringify({
          error: "Invalid Groq API key. Check your .env.local configuration.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: `Chat failed: ${error.message || "Unknown error"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
