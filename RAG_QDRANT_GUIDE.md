# RAG (Retrieval-Augmented Generation) con Qdrant

Esta guía explica cómo usar Qdrant para mejorar las respuestas del asistente de IA mediante RAG.

## ¿Qué es RAG?

RAG combina búsqueda de información relevante con generación de texto. El asistente busca documentos relacionados en la base de datos vectorial y usa esa información para dar respuestas más precisas y contextualizadas.

## Arquitectura

```
Documento → Embedding → Qdrant (Vector DB)
                            ↓
                        Búsqueda Vectorial
                            ↓
Query → Embedding → Encontrar docs similares → Contexto → LLM → Respuesta
```

## Instalación de Qdrant

### Opción 1: Docker Local (Desarrollo)

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest
```

### Opción 2: Qdrant Cloud (Producción)

1. Crea una cuenta en [qdrant.io](https://qdrant.io)
2. Crea un cluster
3. Obtén la URL y API Key
4. Configura en variables de entorno

## Configuración

### Variables de Entorno

```bash
# .env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key-if-using-cloud

# Para embeddings (OpenAI)
OPENAI_API_KEY=sk-your-key
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

## Flujo de Trabajo

### 1. Cargar Documentos

Cuando un admin sube documentos a un curso:

```typescript
// 1. Leer contenido del documento
const content = await readDocumentContent(fileUrl);

// 2. Generar embedding
const embedding = await generateEmbedding(content);

// 3. Guardar en Qdrant
const vectorId = await storeDocumentVector(
  `course-${courseId}`,
  documentId,
  content,
  embedding,
  { courseId, documentTitle, fileType }
);

// 4. Guardar referencia en BD
await createRagDocument({
  courseId,
  documentId,
  title: documentTitle,
  content,
  qdrantVectorId: vectorId,
  fileUrl,
  mimeType,
});
```

### 2. Procesar Preguntas del Estudiante

Cuando un estudiante hace una pregunta:

```typescript
// 1. Generar embedding de la pregunta
const queryEmbedding = await generateEmbedding(studentQuestion);

// 2. Buscar documentos similares en Qdrant
const similarDocs = await searchSimilarDocuments(
  `course-${courseId}`,
  queryEmbedding,
  limit: 5
);

// 3. Construir contexto
const context = similarDocs
  .map(doc => doc.payload.content)
  .join("\n\n");

// 4. Enviar a LLM con contexto
const response = await invokeLLM({
  messages: [
    {
      role: "system",
      content: `${systemPrompt}\n\nContexto relevante:\n${context}`
    },
    {
      role: "user",
      content: studentQuestion
    }
  ]
});
```

### 3. Eliminar Documentos

Cuando se elimina un documento:

```typescript
// 1. Obtener vectorId de BD
const ragDoc = await getRagDocument(documentId);

// 2. Eliminar de Qdrant
await deleteDocumentVector(
  `course-${courseId}`,
  ragDoc.qdrantVectorId
);

// 3. Eliminar de BD
await deleteRagDocument(ragDoc.id);
```

## Tipos de Documentos Soportados

- **PDF**: Extraer texto con `pdf2image` + OCR
- **DOCX**: Extraer texto con `python-docx`
- **TXT**: Usar directamente
- **Presentaciones (PPTX)**: Extraer texto de diapositivas
- **Videos**: Usar transcripción

## Mejores Prácticas

### 1. Chunking de Documentos

Para documentos muy largos, dividir en chunks:

```typescript
function chunkDocument(content: string, chunkSize: number = 1000) {
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}
```

### 2. Metadata Enriquecida

Guardar metadata útil en Qdrant:

```typescript
{
  courseId: 123,
  documentTitle: "Capítulo 5: Introducción a Python",
  documentType: "pdf",
  pageNumber: 5,
  uploadedAt: "2024-01-12",
  instructor: "Juan Pérez"
}
```

### 3. Limpieza de Texto

Preprocesar documentos antes de embeddings:

```typescript
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.?!]/g, "")
    .trim();
}
```

### 4. Filtrado de Resultados

Usar score de similitud para filtrar:

```typescript
const relevantDocs = similarDocs.filter(doc => doc.score > 0.7);
```

## Monitoreo

### Ver Estadísticas de Colecciones

```bash
curl http://localhost:6333/collections
```

### Ver Puntos en una Colección

```bash
curl http://localhost:6333/collections/course-123/points
```

## Troubleshooting

### Qdrant no responde

```bash
# Verificar que está corriendo
docker ps | grep qdrant

# Ver logs
docker logs qdrant

# Reiniciar
docker restart qdrant
```

### Embeddings incorrectos

- Verificar que OPENAI_API_KEY es válido
- Verificar que el modelo es correcto
- Verificar dimensiones (1536 para text-embedding-3-small)

### Búsqueda sin resultados

- Aumentar el threshold de similitud
- Verificar que los documentos fueron cargados correctamente
- Probar con queries más similares al contenido

## Costos

### OpenAI Embeddings

- `text-embedding-3-small`: $0.02 por 1M tokens
- `text-embedding-3-large`: $0.13 por 1M tokens

### Qdrant

- **Local**: Gratis (auto-hospedado)
- **Cloud**: Desde $20/mes

## Próximos Pasos

1. Implementar extracción de texto de PDFs
2. Agregar soporte para múltiples idiomas
3. Implementar re-ranking de resultados
4. Agregar caché de embeddings
5. Implementar actualización incremental de documentos

---

**Última actualización**: Enero 2026
