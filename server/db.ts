import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, courses, studentProgress, exams, examQuestions, courseDocuments, chatMessages, emailVerificationCodes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Course queries
export async function getCourseById(courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(courses).where(eq(courses.isPublished, true));
}

export async function getCoursesByInstructor(instructorId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(courses).where(eq(courses.instructorId, instructorId));
}

export async function createCourse(course: typeof courses.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(courses).values(course);
  return result;
}

export async function updateCourse(courseId: number, updates: Partial<typeof courses.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.update(courses).set(updates).where(eq(courses.id, courseId));
}

// Student progress queries
export async function getStudentProgress(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(studentProgress).where(
    and(eq(studentProgress.userId, userId), eq(studentProgress.courseId, courseId))
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function enrollStudent(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(studentProgress).values({
    userId,
    courseId,
  });
}

export async function updateStudentProgress(userId: number, courseId: number, updates: Partial<typeof studentProgress.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.update(studentProgress).set(updates).where(
    and(eq(studentProgress.userId, userId), eq(studentProgress.courseId, courseId))
  );
}

// Exam queries
export async function getExamByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(exams).where(eq(exams.courseId, courseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getExamQuestions(examId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));
}

export async function createExam(exam: typeof exams.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(exams).values(exam);
}

export async function createExamQuestion(question: typeof examQuestions.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(examQuestions).values(question);
}

// Course documents queries
export async function getCourseDocuments(courseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(courseDocuments).where(eq(courseDocuments.courseId, courseId));
}

export async function addCourseDocument(doc: typeof courseDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(courseDocuments).values(doc);
}

// Chat messages queries
export async function getChatHistory(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(chatMessages).where(
    and(eq(chatMessages.userId, userId), eq(chatMessages.courseId, courseId))
  );
}

export async function addChatMessage(message: typeof chatMessages.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(chatMessages).values(message);
}

// Email verification queries
export async function createVerificationCode(email: string, code: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(emailVerificationCodes).values({
    email,
    code,
    expiresAt,
  });
}

export async function getVerificationCode(email: string, code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(emailVerificationCodes).where(
    and(eq(emailVerificationCodes.email, email), eq(emailVerificationCodes.code, code))
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function deleteVerificationCode(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, id));
}
