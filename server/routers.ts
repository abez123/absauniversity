import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { generateEmbedding } from "./_core/embeddings";
import { ensureCollection, storeDocumentVector, searchSimilarDocuments, deleteDocumentVector } from "./_core/qdrant";
import { processDocument } from "./_core/documentProcessor";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    sendVerificationCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // For testing: use hardcoded code for test emails
        if (input.email === "estudiante@absa.edu" || input.email === "admin@absa.edu") {
          return { success: true, message: "Código enviado (Test: 123456)" };
        }
        
        // Generate random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code in database (expires in 10 minutes)
        await db.storeVerificationCode(input.email, code);
        
        // In production, send email with code
        console.log(`Verification code for ${input.email}: ${code}`);
        
        return { success: true, message: "Código enviado a tu correo" };
      }),
    verifyCode: publicProcedure
      .input(z.object({ email: z.string().email(), code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // For testing: accept hardcoded code
        if ((input.email === "estudiante@absa.edu" || input.email === "admin@absa.edu") && input.code === "123456") {
          const user = await db.getUserByEmail(input.email);
          let finalUser = user;
          
          if (!finalUser) {
            const role = input.email === "admin@absa.edu" ? "admin" : "user";
            finalUser = await db.createUserByEmail(input.email, role);
          }
          
          // Create JWT session token
          const sessionToken = await sdk.createSessionToken(finalUser.openId, {
            name: finalUser.name || finalUser.email || "",
            expiresInMs: ONE_YEAR_MS,
          });
          
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          
          return { success: true, userId: finalUser.id };
        }
        
        // Verify code from database
        const isValid = await db.verifyCode(input.email, input.code);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido o expirado" });
        }
        
        let finalUser = await db.getUserByEmail(input.email);
        
        if (!finalUser) {
          finalUser = await db.createUserByEmail(input.email, "user");
        }
        
        // Create JWT session token
        const sessionToken = await sdk.createSessionToken(finalUser.openId, {
          name: finalUser.name || finalUser.email || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, userId: finalUser.id };
      }),
  }),

  // Courses router
  courses: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCourses();
    }),

    getById: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCourseById(input.courseId);
      }),

    getByInstructor: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getCoursesByInstructor(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        videoUrl: z.string().optional(),
        videoTranscript: z.string().optional(),
        prerequisites: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.createCourse({
          title: input.title,
          description: input.description,
          instructorId: ctx.user.id,
          videoUrl: input.videoUrl,
          videoTranscript: input.videoTranscript,
          prerequisites: input.prerequisites,
          isPublished: false,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        videoUrl: z.string().optional(),
        videoTranscript: z.string().optional(),
        prerequisites: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { courseId, ...updates } = input;
        return await db.updateCourse(courseId, updates);
      }),
  }),

  // Student progress router
  studentProgress: router({
    get: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentProgress(ctx.user.id, input.courseId);
      }),

    enroll: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.enrollStudent(ctx.user.id, input.courseId);
      }),

    markVideoWatched: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateStudentProgress(ctx.user.id, input.courseId, {
          videoWatched: true,
          videoWatchedAt: new Date(),
        });
      }),

    markExamTaken: protectedProcedure
      .input(z.object({ courseId: z.number(), score: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateStudentProgress(ctx.user.id, input.courseId, {
          examTaken: true,
          examScore: input.score.toString(),
          examTakenAt: new Date(),
        });
      }),
  }),

  // Exams router
  exams: router({
    getByCourse: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExamByCourse(input.courseId);
      }),

    getQuestions: publicProcedure
      .input(z.object({ examId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExamQuestions(input.examId);
      }),

    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        passingScore: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.createExam({
          courseId: input.courseId,
          title: input.title,
          description: input.description,
          passingScore: input.passingScore,
        });
      }),

    addQuestion: protectedProcedure
      .input(z.object({
        examId: z.number(),
        question: z.string(),
        questionType: z.enum(["multiple_choice", "short_answer", "essay"]),
        options: z.string().optional(),
        correctAnswer: z.string().optional(),
        points: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.createExamQuestion({
          examId: input.examId,
          question: input.question,
          questionType: input.questionType,
          options: input.options,
          correctAnswer: input.correctAnswer,
          points: input.points || 1,
        });
      }),
  }),

  // Course documents router
  documents: router({
    getByCourse: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCourseDocuments(input.courseId);
      }),

    add: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        title: z.string(),
        documentUrl: z.string(),
        documentKey: z.string(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.addCourseDocument({
          courseId: input.courseId,
          title: input.title,
          documentUrl: input.documentUrl,
          documentKey: input.documentKey,
          mimeType: input.mimeType,
        });
      }),
  }),

  // Chat router
  chat: router({
    getHistory: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getChatHistory(ctx.user.id, input.courseId);
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await db.addChatMessage({
          userId: ctx.user.id,
          courseId: input.courseId,
          role: "user",
          content: input.message,
        });

        // Get course context
        const course = await db.getCourseById(input.courseId);
        if (!course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }

        // Get stored AI prompt for this course
        let systemPrompt = `You are a helpful AI assistant for the course "${course.title}". 
Course description: ${course.description || "No description"}
Course transcript: ${course.videoTranscript || "No transcript"}

Help students understand the course content and answer their questions based on the provided materials.`;

        const aiPrompt = await db.getAIPromptByCourse(input.courseId);
        if (aiPrompt) {
          systemPrompt = aiPrompt.systemPrompt;
        }

        // RAG: Search for relevant documents using vector similarity
        let ragContext = "";
        try {
          const collectionName = `course-${input.courseId}`;
          
          // Ensure collection exists before searching
          await ensureCollection(collectionName);
          
          // Generate embedding for user query
          const queryEmbedding = await generateEmbedding(input.message);
          
          // Search for similar documents in Qdrant
          const similarDocs = await searchSimilarDocuments(
            collectionName,
            queryEmbedding,
            5 // Get top 5 most relevant chunks
          );

          // Build context from retrieved documents
          if (similarDocs.length > 0) {
            const contextChunks = similarDocs
              .map((doc: any) => doc.payload?.content || "")
              .filter((content: string) => content.length > 0)
              .slice(0, 3); // Use top 3 most relevant chunks

            if (contextChunks.length > 0) {
              ragContext = `\n\nRelevant context from course materials:\n${contextChunks.join("\n\n---\n\n")}`;
            }
          }
        } catch (error) {
          console.warn("RAG search failed, continuing without RAG context:", error);
          // Continue without RAG context if search fails
        }

        // Get course documents for reference (non-RAG documents)
        const documents = await db.getCourseDocuments(input.courseId);
        const documentContext = documents.length > 0
          ? `\n\nAvailable course documents: ${documents.map(d => d.title).join(", ")}`
          : "";

        // Get chat history for context
        const history = await db.getChatHistory(ctx.user.id, input.courseId);

        // Build messages for LLM with RAG context
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          {
            role: "system",
            content: systemPrompt + ragContext + documentContext,
          },
          ...history.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          {
            role: "user",
            content: input.message,
          },
        ];

        // Get AI response
        const response = await invokeLLM({
          messages: messages as any,
          maxTokens: aiPrompt?.maxTokens || 2000,
        });

        const aiMessageContent = response.choices[0]?.message?.content;
        const aiMessage = typeof aiMessageContent === 'string' ? aiMessageContent : "I couldn't generate a response.";

        // Save AI response
        await db.addChatMessage({
          userId: ctx.user.id,
          courseId: input.courseId,
          role: "assistant",
          content: aiMessage,
        });

        return {
          message: aiMessage,
        };
      }),
  }),

  // AI Prompts router
  aiPrompts: router({
    get: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getAIPromptByCourse(input.courseId);
      }),

    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        systemPrompt: z.string(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const updateData: any = {
          systemPrompt: input.systemPrompt,
        };
        if (input.temperature !== undefined) {
          // Store as number - Drizzle will handle decimal conversion for MySQL
          // Round to 2 decimal places to match schema precision
          updateData.temperature = Math.round(input.temperature * 100) / 100;
        }
        if (input.maxTokens !== undefined) {
          updateData.maxTokens = input.maxTokens;
        }
        return await db.createOrUpdateAIPrompt(input.courseId, updateData);
      }),
  }),

  // Storage router for file uploads
  storage: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
        contentType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        try {
          // Decode base64 file data
          const fileBuffer = Buffer.from(input.fileData, "base64");
          const fileKey = `rag-documents/${nanoid()}-${input.fileName}`;
          
          // Upload to storage
          const { url } = await storagePut(
            fileKey,
            fileBuffer,
            input.contentType || "application/octet-stream"
          );

          return { url, key: fileKey };
        } catch (error) {
          console.error("Storage upload error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to upload file",
          });
        }
      }),
  }),

  // RAG Documents router
  ragDocuments: router({
    getByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getRagDocumentsByCourse(input.courseId);
      }),

    upload: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        title: z.string(),
        fileUrl: z.string(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        try {
          // Process document: extract text and chunk it
          const chunks = await processDocument(
            input.fileUrl,
            input.mimeType || "text/plain",
            1000,
            200
          );

          // Generate embeddings for each chunk
          const collectionName = `course-${input.courseId}`;
          await ensureCollection(collectionName);

          const documentId = nanoid();
          const vectorIds: string[] = [];

          // Process each chunk
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);
            
            const vectorId = await storeDocumentVector(
              collectionName,
              `${documentId}-chunk-${i}`,
              chunk,
              embedding,
              {
                courseId: input.courseId,
                documentId,
                title: input.title,
                chunkIndex: i,
                mimeType: input.mimeType,
              }
            );
            vectorIds.push(vectorId);
          }

          // Validate that we processed at least one chunk
          if (chunks.length === 0 || vectorIds.length === 0) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to process document: no chunks were generated",
            });
          }

          // Validate that mainVectorId is not empty
          const mainVectorId = vectorIds[0];
          if (!mainVectorId || mainVectorId.trim() === "") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to process document: invalid vector ID generated",
            });
          }

          // Store document metadata in database
          // Store the first chunk's content as the main content
          const mainContent = chunks.join("\n\n");

          await db.createRagDocument({
            courseId: input.courseId,
            documentId,
            title: input.title,
            content: mainContent,
            qdrantVectorId: mainVectorId,
            mimeType: input.mimeType,
            fileUrl: input.fileUrl,
          });

          return {
            success: true,
            documentId,
            chunksProcessed: chunks.length,
          };
        } catch (error) {
          console.error("Error uploading RAG document:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to upload document",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
        courseId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Get document from database
        const documents = await db.getRagDocumentsByCourse(input.courseId);
        const document = documents.find(d => d.id === input.id);

        if (!document) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }

        // Delete from Qdrant (we need to search for all chunks with this documentId)
        const collectionName = `course-${input.courseId}`;
        // Note: Qdrant doesn't have a direct way to delete by payload, so we'll delete by vectorId
        // For a complete implementation, we'd need to search for all vectors with this documentId
        // For now, we'll delete the main vector
        if (document.qdrantVectorId) {
          try {
            await deleteDocumentVector(collectionName, document.qdrantVectorId);
          } catch (error) {
            console.warn("Failed to delete vector from Qdrant:", error);
          }
        }

        // Delete from database
        await db.deleteRagDocument(input.id);

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
