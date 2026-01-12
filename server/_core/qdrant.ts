import { QdrantClient } from "@qdrant/js-client-rest";

let qdrantClient: QdrantClient | null = null;

/**
 * Initialize Qdrant client for RAG vector storage
 */
export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    const qdrantApiKey = process.env.QDRANT_API_KEY;

    qdrantClient = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
    });
  }

  return qdrantClient;
}

/**
 * Create or get collection for course documents
 */
export async function ensureCollection(collectionName: string): Promise<void> {
  const client = getQdrantClient();

  try {
    // Try to get collection info
    await client.getCollection(collectionName);
  } catch (error) {
    // Collection doesn't exist, create it
    console.log(`Creating Qdrant collection: ${collectionName}`);

    await client.createCollection(collectionName, {
      vectors: {
        size: 1536, // OpenAI embedding size
        distance: "Cosine",
      },
    });
  }
}

/**
 * Store document vectors in Qdrant
 */
export async function storeDocumentVector(
  collectionName: string,
  documentId: string,
  content: string,
  embedding: number[],
  metadata: Record<string, any>
): Promise<string> {
  const client = getQdrantClient();

  // Generate unique point ID
  const pointId = Math.floor(Math.random() * 1000000000);

  await client.upsert(collectionName, {
    points: [
      {
        id: pointId,
        vector: embedding,
        payload: {
          documentId,
          content,
          ...metadata,
        },
      },
    ],
  });

  return pointId.toString();
}

/**
 * Search similar documents in Qdrant
 */
export async function searchSimilarDocuments(
  collectionName: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<any[]> {
  const client = getQdrantClient();

  const results = await client.search(collectionName, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
  });

  return results;
}

/**
 * Delete document from Qdrant
 */
export async function deleteDocumentVector(
  collectionName: string,
  vectorId: string
): Promise<void> {
  const client = getQdrantClient();

  await client.delete(collectionName, {
    points: [parseInt(vectorId)],
  });
}

/**
 * Clear entire collection
 */
export async function clearCollection(collectionName: string): Promise<void> {
  const client = getQdrantClient();

  await client.deleteCollection(collectionName);
  await ensureCollection(collectionName);
}
