import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, courses, studentProgress, exams, examQuestions, courseDocuments, chatMessages, emailVerificationCodes, aiPrompts, ragDocuments, courseAssignments } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _connection: mysql.Pool | null = null;

async function ensureCoreTables(connection: mysql.Pool) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openId VARCHAR(64) NOT NULL,
      name TEXT,
      email VARCHAR(320),
      loginMethod VARCHAR(64),
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY users_openId_unique (openId)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      instructorId INT NOT NULL,
      videoUrl VARCHAR(512),
      videoTranscript TEXT,
      prerequisites TEXT,
      startDate TIMESTAMP NULL,
      endDate TIMESTAMP NULL,
      isPublished BOOLEAN DEFAULT false,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS emailVerificationCodes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(320) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to create connection pool
      // Handle both mysql:// and mysql2:// URLs
      const dbUrl = process.env.DATABASE_URL.replace(/^mysql2:\/\//, "mysql://");
      const url = new URL(dbUrl);
      
      const config: mysql.PoolOptions = {
        host: url.hostname,
        port: parseInt(url.port || "3306"),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password || ""),
        database: url.pathname.slice(1), // Remove leading '/'
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };

      _connection = mysql.createPool(config);
      _db = drizzle(_connection);
      await ensureCoreTables(_connection);
      console.log("[Database] Connected successfully to", config.database);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _connection = null;
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


// Email-based authentication queries
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by email:", error);
    throw error;
  }
}

export async function createUserByEmail(email: string, role: "user" | "admin" = "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `email-${email}-${Date.now()}`;
  const result = await db.insert(users).values({
    openId,
    email,
    loginMethod: "email",
    role,
    lastSignedIn: new Date(),
  });

  const newUser = await getUserByEmail(email);
  if (!newUser) throw new Error("Failed to create user");
  return newUser;
}

export async function storeVerificationCode(email: string, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Code expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  return await db.insert(emailVerificationCodes).values({
    email,
    code,
    expiresAt,
  });
}

export async function verifyCode(email: string, code: string) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(emailVerificationCodes).where(
    and(eq(emailVerificationCodes.email, email), eq(emailVerificationCodes.code, code))
  ).limit(1);

  if (result.length === 0) return false;

  const record = result[0];
  
  // Check if code is expired
  if (new Date() > record.expiresAt) {
    // Delete expired code
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));
    return false;
  }

  // Delete used code
  await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));
  
  return true;
}


// AI Prompts queries
export async function getAIPromptByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(aiPrompts).where(eq(aiPrompts.courseId, courseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateAIPrompt(courseId: number, data: Partial<typeof aiPrompts.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getAIPromptByCourse(courseId);
  
  if (existing) {
    return await db.update(aiPrompts).set(data).where(eq(aiPrompts.courseId, courseId));
  } else {
    return await db.insert(aiPrompts).values({
      courseId,
      systemPrompt: data.systemPrompt || "Eres un asistente educativo útil.",
      ...data,
    });
  }
}

// RAG Documents queries
export async function getRagDocumentsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(ragDocuments).where(eq(ragDocuments.courseId, courseId));
}

export async function createRagDocument(doc: typeof ragDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(ragDocuments).values(doc);
}

export async function deleteRagDocument(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.delete(ragDocuments).where(eq(ragDocuments.id, id));
}

// Course Assignments queries
export async function assignStudentToCourse(courseId: number, userId: number, assignedBy: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(courseAssignments).values({
    courseId,
    userId,
    assignedBy,
  });
}

export async function getStudentCourseAssignments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(courseAssignments).where(eq(courseAssignments.userId, userId));
}

export async function getCourseStudents(courseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(courseAssignments).where(eq(courseAssignments.courseId, courseId));
}

export async function removeStudentFromCourse(courseId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.delete(courseAssignments).where(
    and(eq(courseAssignments.courseId, courseId), eq(courseAssignments.userId, userId))
  );
}

export async function isStudentAssignedToCourse(courseId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(courseAssignments).where(
    and(eq(courseAssignments.courseId, courseId), eq(courseAssignments.userId, userId))
  ).limit(1);

  return result.length > 0;
}
