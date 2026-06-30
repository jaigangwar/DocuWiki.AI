// ================================================================
// API Route: /api/process-okf
// Receives extracted PDF text, sends to Groq with OKF system prompt,
// returns structured OKF files with YAML frontmatter
// ================================================================

import { NextRequest, NextResponse } from "next/server";
import { groqChatCompletion } from "@/lib/groq";
import {
  OKF_INGESTION_SYSTEM_PROMPT,
  buildOkfIngestionPrompt,
} from "@/lib/okf-prompts";

interface DocumentInput {
  filename: string;
  text: string;
  pages: number;
}

interface OKFFileOutput {
  filepath: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // ---- Parse Request ----
    const body = await request.json();
    const documents: DocumentInput[] = body.documents;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: "No documents provided. Please upload at least one PDF." },
        { status: 400 }
      );
    }

    // Validate each document has text
    const nonEmptyDocs = documents.filter(
      (d) => d.text && d.text.trim().length > 0
    );

    if (nonEmptyDocs.length === 0) {
      return NextResponse.json(
        {
          error:
            "All provided documents appear to be empty or contain no extractable text.",
        },
        { status: 400 }
      );
    }

    // ---- Build Prompt ----
    const timestamp = new Date().toISOString();
    const userPrompt = buildOkfIngestionPrompt(nonEmptyDocs, timestamp);

    // Check total text size (warn if very large)
    const totalChars = nonEmptyDocs.reduce((sum, d) => sum + d.text.length, 0);
    console.log(
      `[OKF] Processing ${nonEmptyDocs.length} documents, ${totalChars} total characters`
    );

    // ---- Call Groq API ----
    const completion = await groqChatCompletion(
      [
        { role: "system", content: OKF_INGESTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }
    );

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: "Groq API returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // ---- Parse Response ----
    let parsedFiles: OKFFileOutput[];

    try {
      const parsed = JSON.parse(responseContent);

      // Handle both { files: [...] } and direct array format
      if (Array.isArray(parsed)) {
        parsedFiles = parsed;
      } else if (parsed.files && Array.isArray(parsed.files)) {
        parsedFiles = parsed.files;
      } else {
        throw new Error("Response does not contain a valid files array");
      }

      // Validate each file entry
      parsedFiles = parsedFiles.filter((f) => {
        if (!f.filepath || !f.content) {
          console.warn("[OKF] Skipping invalid file entry:", f);
          return false;
        }
        return true;
      });

      if (parsedFiles.length === 0) {
        throw new Error("No valid files in the response");
      }
    } catch (parseError: any) {
      console.error("[OKF] Failed to parse Groq response:", parseError);
      console.error("[OKF] Raw response:", responseContent.slice(0, 500));

      return NextResponse.json(
        {
          error: `Failed to parse OKF structure from AI response: ${parseError.message}`,
          rawResponse: responseContent.slice(0, 1000),
        },
        { status: 422 }
      );
    }

    // ---- Return Structured Files ----
    return NextResponse.json({
      success: true,
      files: parsedFiles,
      stats: {
        inputDocuments: nonEmptyDocs.length,
        outputFiles: parsedFiles.length,
        totalInputChars: totalChars,
        processingTimestamp: timestamp,
        model: completion.model,
        usage: completion.usage,
      },
    });
  } catch (error: any) {
    console.error("[OKF] Processing error:", error);

    const status = error?.status || error?.statusCode;
    const errorBody = error?.body || error?.message || "";
    const isTokenLimit = errorBody?.includes?.("tokens per minute") || status === 413;

    if (status === 429 || isTokenLimit) {
      return NextResponse.json(
        {
          error:
            "Your PDF text exceeds the Groq free tier token limit (12K TPM). " +
            "Either process smaller/fewer PDFs, or upgrade at https://console.groq.com/settings/billing",
          upgradeUrl: "https://console.groq.com/settings/billing",
        },
        { status: 429 }
      );
    }

    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid Groq API key. Please check your GROQ_API_KEY in .env.local.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: `Processing failed: ${error.message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
