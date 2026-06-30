// ================================================================
// PDF Text Extraction — Client-side using pdfjs-dist
// Extracts raw text with page-level metadata from PDF files
// ================================================================

import * as pdfjsLib from "pdfjs-dist";

// Configure the worker source for pdfjs-dist
// In Next.js, the worker needs to be loaded from the CDN or local copy
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Size limits for PDF processing.
 */
export const PDF_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
  MAX_BATCH_SIZE: 50 * 1024 * 1024, // 50MB total batch
  MAX_FILES: 20, // Max files per batch
} as const;

/**
 * Represents a single page's extracted text.
 */
export interface PDFPageContent {
  pageNumber: number;
  text: string;
}

/**
 * Represents a fully extracted PDF document.
 */
export interface ExtractedDocument {
  filename: string;
  totalPages: number;
  pages: PDFPageContent[];
  fullText: string;
  sizeBytes: number;
}

/**
 * Progress callback for extraction status updates.
 */
export type ExtractionProgressCallback = (progress: {
  filename: string;
  currentPage: number;
  totalPages: number;
  phase: "loading" | "extracting" | "complete" | "error";
  percentage: number;
}) => void;

/**
 * Validates a PDF file against size and type constraints.
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: `"${file.name}" is not a PDF file.` };
  }

  if (file.size > PDF_LIMITS.MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `"${file.name}" is ${sizeMB}MB. Maximum allowed is 10MB per file.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" is empty.` };
  }

  return { valid: true };
}

/**
 * Validates an entire batch of PDF files.
 */
export function validatePDFBatch(
  files: File[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length === 0) {
    return { valid: false, errors: ["No files selected."] };
  }

  if (files.length > PDF_LIMITS.MAX_FILES) {
    errors.push(
      `Too many files (${files.length}). Maximum is ${PDF_LIMITS.MAX_FILES} files per batch.`
    );
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > PDF_LIMITS.MAX_BATCH_SIZE) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
    errors.push(
      `Total batch size is ${totalMB}MB. Maximum allowed is 50MB total.`
    );
  }

  for (const file of files) {
    const result = validatePDFFile(file);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extracts text content from a single PDF file.
 * Returns per-page text and a combined full text string.
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: ExtractionProgressCallback
): Promise<ExtractedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    filename: file.name,
    currentPage: 0,
    totalPages: 0,
    phase: "loading",
    percentage: 0,
  });

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  }).promise;

  const totalPages = pdf.numPages;
  const pages: PDFPageContent[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({
      filename: file.name,
      currentPage: pageNum,
      totalPages,
      phase: "extracting",
      percentage: Math.round((pageNum / totalPages) * 100),
    });

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct text with proper spacing
    const pageText = textContent.items
      .map((item: any) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber: pageNum,
      text: pageText,
    });
  }

  const fullText = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join("\n\n");

  onProgress?.({
    filename: file.name,
    currentPage: totalPages,
    totalPages,
    phase: "complete",
    percentage: 100,
  });

  return {
    filename: file.name,
    totalPages,
    pages,
    fullText,
    sizeBytes: file.size,
  };
}

/**
 * Extracts text from multiple PDF files in sequence.
 * Returns an array of extracted documents.
 */
export async function extractTextFromPDFs(
  files: File[],
  onProgress?: (
    fileIndex: number,
    totalFiles: number,
    fileProgress: {
      filename: string;
      currentPage: number;
      totalPages: number;
      phase: "loading" | "extracting" | "complete" | "error";
      percentage: number;
    }
  ) => void
): Promise<ExtractedDocument[]> {
  const documents: ExtractedDocument[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const doc = await extractTextFromPDF(files[i], (progress) => {
        onProgress?.(i, files.length, progress);
      });
      documents.push(doc);
    } catch (error) {
      console.error(`Failed to extract text from ${files[i].name}:`, error);
      onProgress?.(i, files.length, {
        filename: files[i].name,
        currentPage: 0,
        totalPages: 0,
        phase: "error",
        percentage: 0,
      });
      // Continue with other files even if one fails
    }
  }

  return documents;
}

/**
 * Truncates document text to fit within Groq free tier limits (12K TPM).
 * Input chars + system prompt + output tokens must stay under 12K.
 * Using ~20K chars (~5K tokens) + 1K sys prompt + 4K output = ~10K total.
 * Upgrade at https://console.groq.com/settings/billing for higher limits
 * (set MAX_OKF_CHARS env var or use maxChars param).
 */
export function truncateForLLM(
  documents: ExtractedDocument[],
  maxChars: number = 20000
): Array<{ filename: string; text: string; pages: number }> {
  const totalChars = documents.reduce((sum, d) => sum + d.fullText.length, 0);

  if (totalChars <= maxChars) {
    return documents.map((d) => ({
      filename: d.filename,
      text: d.fullText,
      pages: d.totalPages,
    }));
  }

  // Proportionally allocate characters across documents
  const ratio = maxChars / totalChars;

  return documents.map((d) => {
    const charBudget = Math.floor(d.fullText.length * ratio);
    return {
      filename: d.filename,
      text: d.fullText.slice(0, charBudget) + "\n\n[...truncated for processing]",
      pages: d.totalPages,
    };
  });
}
