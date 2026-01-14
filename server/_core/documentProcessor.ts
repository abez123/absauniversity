/**
 * Document processing utilities for RAG
 * Extracts text from various file formats and chunks documents
 */

/**
 * Chunk a document into smaller pieces for better embedding and retrieval
 */
export function chunkDocument(
  content: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  if (content.length <= chunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    let end = Math.min(start + chunkSize, content.length);

    // Try to break at sentence boundary if possible
    if (end < content.length) {
      const lastPeriod = content.lastIndexOf(".", end);
      const lastNewline = content.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        // Only use break point if it's not too early
        end = breakPoint + 1;
      }
    }

    const chunk = content.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Calculate next start position with overlap
    // Ensure we always advance forward to prevent infinite loops
    const nextStart = Math.max(end - overlap, start + 1);
    
    // If we've reached the end, break
    if (nextStart >= content.length) {
      break;
    }
    
    start = nextStart;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Extract text from a file URL
 * Supports TXT, PDF (basic), and DOCX (basic)
 */
export async function extractTextFromFile(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Handle different file types
    if (mimeType === "text/plain" || fileUrl.endsWith(".txt")) {
      return await response.text();
    }

    if (mimeType === "application/pdf" || fileUrl.endsWith(".pdf")) {
      // For PDF, we'll need a library. For now, return a placeholder
      // In production, use pdf-parse or similar
      const buffer = await response.arrayBuffer();
      // Basic PDF text extraction would go here
      // For now, throw an error to indicate PDF processing needs a library
      throw new Error(
        "PDF text extraction requires pdf-parse library. Please install it: npm install pdf-parse"
      );
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileUrl.endsWith(".docx")
    ) {
      // For DOCX, we'll need a library. For now, return a placeholder
      // In production, use mammoth or docx
      throw new Error(
        "DOCX text extraction requires mammoth library. Please install it: npm install mammoth"
      );
    }

    // Try to read as text for unknown types
    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
    throw new Error(`Failed to extract text from file: ${String(error)}`);
  }
}

/**
 * Process a document: extract text, chunk it, and return chunks
 */
export async function processDocument(
  fileUrl: string,
  mimeType: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Promise<string[]> {
  const text = await extractTextFromFile(fileUrl, mimeType);
  return chunkDocument(text, chunkSize, overlap);
}
