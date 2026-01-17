import { describe, expect, it } from "vitest";

/**
 * Utility function to calculate exam score
 * This mirrors the logic in ExamPage.tsx for testability
 */
function calculateExamScore(
  questions: Array<{ id: number; correctAnswer: string | null }>,
  answers: Record<number, string>
): number | null {
  // Return null if no questions to prevent division by zero
  if (questions.length === 0) {
    return null;
  }

  let correctCount = 0;
  questions.forEach((question) => {
    if (question.correctAnswer === answers[question.id]) {
      correctCount++;
    }
  });

  return (correctCount / questions.length) * 100;
}

describe("calculateExamScore", () => {
  it("returns null when there are no questions (prevents division by zero)", () => {
    const questions: Array<{ id: number; correctAnswer: string | null }> = [];
    const answers: Record<number, string> = {};

    const score = calculateExamScore(questions, answers);

    expect(score).toBeNull();
  });

  it("calculates 100% when all answers are correct", () => {
    const questions = [
      { id: 1, correctAnswer: "A" },
      { id: 2, correctAnswer: "B" },
      { id: 3, correctAnswer: "C" },
    ];
    const answers = { 1: "A", 2: "B", 3: "C" };

    const score = calculateExamScore(questions, answers);

    expect(score).toBe(100);
  });

  it("calculates 0% when all answers are wrong", () => {
    const questions = [
      { id: 1, correctAnswer: "A" },
      { id: 2, correctAnswer: "B" },
    ];
    const answers = { 1: "X", 2: "Y" };

    const score = calculateExamScore(questions, answers);

    expect(score).toBe(0);
  });

  it("calculates partial score correctly", () => {
    const questions = [
      { id: 1, correctAnswer: "A" },
      { id: 2, correctAnswer: "B" },
      { id: 3, correctAnswer: "C" },
      { id: 4, correctAnswer: "D" },
    ];
    const answers = { 1: "A", 2: "B", 3: "X", 4: "Y" };

    const score = calculateExamScore(questions, answers);

    expect(score).toBe(50);
  });

  it("handles missing answers as incorrect", () => {
    const questions = [
      { id: 1, correctAnswer: "A" },
      { id: 2, correctAnswer: "B" },
    ];
    const answers = { 1: "A" }; // Missing answer for question 2

    const score = calculateExamScore(questions, answers);

    expect(score).toBe(50);
  });

  it("handles questions with null correct answers", () => {
    const questions = [
      { id: 1, correctAnswer: "A" },
      { id: 2, correctAnswer: null }, // Essay question with no predefined answer
    ];
    const answers = { 1: "A", 2: "Some essay text" };

    const score = calculateExamScore(questions, answers);

    // Only question 1 can be auto-graded, question 2 won't match null
    expect(score).toBe(50);
  });

  it("handles single question exam", () => {
    const questions = [{ id: 1, correctAnswer: "A" }];
    const answers = { 1: "A" };

    const score = calculateExamScore(questions, answers);

    expect(score).toBe(100);
  });
});
