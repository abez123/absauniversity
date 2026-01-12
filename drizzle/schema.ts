import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Courses table - Stores course information
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructorId: int("instructorId").notNull(),
  videoUrl: varchar("videoUrl", { length: 512 }),
  videoTranscript: text("videoTranscript"),
  prerequisites: text("prerequisites"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isPublished: boolean("isPublished").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Course documents table - Stores documents for each course
 */
export const courseDocuments = mysqlTable("courseDocuments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  documentUrl: varchar("documentUrl", { length: 512 }).notNull(),
  documentKey: varchar("documentKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourseDocument = typeof courseDocuments.$inferSelect;
export type InsertCourseDocument = typeof courseDocuments.$inferInsert;

/**
 * Exams table - Stores exam information
 */
export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: decimal("passingScore", { precision: 5, scale: 2 }).default("70"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

/**
 * Exam questions table - Stores individual questions
 */
export const examQuestions = mysqlTable("examQuestions", {
  id: int("id").autoincrement().primaryKey(),
  examId: int("examId").notNull(),
  question: text("question").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "short_answer", "essay"]).default("multiple_choice"),
  options: text("options"),
  correctAnswer: text("correctAnswer"),
  points: int("points").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExamQuestion = typeof examQuestions.$inferSelect;
export type InsertExamQuestion = typeof examQuestions.$inferInsert;

/**
 * Student progress table - Tracks course progress
 */
export const studentProgress = mysqlTable("studentProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  videoWatched: boolean("videoWatched").default(false),
  videoWatchedAt: timestamp("videoWatchedAt"),
  examTaken: boolean("examTaken").default(false),
  examScore: decimal("examScore", { precision: 5, scale: 2 }),
  examTakenAt: timestamp("examTakenAt"),
  completedAt: timestamp("completedAt"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertStudentProgress = typeof studentProgress.$inferInsert;

/**
 * Exam responses table - Stores student answers
 */
export const examResponses = mysqlTable("examResponses", {
  id: int("id").autoincrement().primaryKey(),
  examId: int("examId").notNull(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  answer: text("answer"),
  isCorrect: boolean("isCorrect"),
  pointsEarned: int("pointsEarned").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExamResponse = typeof examResponses.$inferSelect;
export type InsertExamResponse = typeof examResponses.$inferInsert;

/**
 * Chat messages table - Stores AI chat history
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Email verification codes table - For email-based authentication
 */
export const emailVerificationCodes = mysqlTable("emailVerificationCodes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

/**
 * AI Prompts table - Stores system prompts for AI agents per course
 */
export const aiPrompts = mysqlTable("aiPrompts", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  systemPrompt: text("systemPrompt").notNull(),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: int("maxTokens").default(2000),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIPrompt = typeof aiPrompts.$inferSelect;
export type InsertAIPrompt = typeof aiPrompts.$inferInsert;

/**
 * RAG Documents table - Stores document vectors for Qdrant RAG
 */
export const ragDocuments = mysqlTable("ragDocuments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  documentId: varchar("documentId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  qdrantVectorId: varchar("qdrantVectorId", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileUrl: varchar("fileUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RAGDocument = typeof ragDocuments.$inferSelect;
export type InsertRAGDocument = typeof ragDocuments.$inferInsert;

/**
 * Course assignments table - Assigns students to courses
 */
export const courseAssignments = mysqlTable("courseAssignments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  userId: int("userId").notNull(),
  assignedBy: int("assignedBy").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourseAssignment = typeof courseAssignments.$inferSelect;
export type InsertCourseAssignment = typeof courseAssignments.$inferInsert;
