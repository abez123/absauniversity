import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

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
          let userId = user?.id;
          
          if (!userId) {
            const role = input.email === "admin@absa.edu" ? "admin" : "user";
            const newUser = await db.createUserByEmail(input.email, role);
            userId = newUser.id;
          }
          
          // Create session
          const sessionId = nanoid();
          const cookieOptions = getSessionCookieOptions(ctx.req);
          const cookieString = `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None`;
          ctx.res.setHeader("Set-Cookie", cookieString);
          
          return { success: true, userId };
        }
        
        // Verify code from database
        const isValid = await db.verifyCode(input.email, input.code);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido o expirado" });
        }
        
        const user = await db.getUserByEmail(input.email);
        let userId = user?.id;
        
        if (!userId) {
          const newUser = await db.createUserByEmail(input.email, "user");
          userId = newUser.id;
        }
        
        // Create session
        const sessionId = nanoid();
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const cookieString = `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None`;
        ctx.res.setHeader("Set-Cookie", cookieString);
        
        return { success: true, userId };
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

        // Get course documents for context
        const documents = await db.getCourseDocuments(input.courseId);
        const documentContext = documents.map(d => `${d.title}: ${d.documentUrl}`).join("\n");

        // Get chat history for context
        const history = await db.getChatHistory(ctx.user.id, input.courseId);

        // Build messages for LLM
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          {
            role: "system",
            content: `You are a helpful AI assistant for the course "${course.title}". 
            Course description: ${course.description || "No description"}
            Course transcript: ${course.videoTranscript || "No transcript"}
            Available documents: ${documentContext || "No documents"}
            
            Help students understand the course content and answer their questions based on the provided materials.`,
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
});

export type AppRouter = typeof appRouter;
