import { ENV } from "./env";

/**
 * Generate embedding vector for text using OpenAI embeddings API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  const apiUrl = "https://api.openai.com/v1/embeddings";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI embeddings API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding response from OpenAI API");
    }

    return embedding;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to generate embedding: ${String(error)}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  const apiUrl = "https://api.openai.com/v1/embeddings";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI embeddings API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const data = await response.json();
    const embeddings = data.data?.map((item: any) => item.embedding) || [];

    if (embeddings.length !== texts.length) {
      throw new Error(
        `Expected ${texts.length} embeddings, got ${embeddings.length}`
      );
    }

    return embeddings;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to generate embeddings: ${String(error)}`);
  }
}
