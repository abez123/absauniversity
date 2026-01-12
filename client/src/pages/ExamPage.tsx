import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ExamPageProps {
  params: {
    courseId: string;
  };
}

/**
 * Exam page - Shows exam questions and handles exam submission
 */
export default function ExamPage({ params }: ExamPageProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const courseId = parseInt(params.courseId);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Queries
  const courseQuery = trpc.courses.getById.useQuery({ courseId });
  const examQuery = trpc.exams.getByCourse.useQuery({ courseId });
  const questionsQuery = trpc.exams.getQuestions.useQuery(
    { examId: examQuery.data?.id || 0 },
    { enabled: !!examQuery.data?.id }
  );

  // Mutations
  const markExamTakenMutation = trpc.studentProgress.markExamTaken.useMutation();

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitExam = async () => {
    if (!examQuery.data || !questionsQuery.data) return;

    // Calculate score (simple scoring based on correct answers)
    let correctCount = 0;
    questionsQuery.data.forEach((question) => {
      if (question.correctAnswer === answers[question.id]) {
        correctCount++;
      }
    });

    const calculatedScore = (correctCount / questionsQuery.data.length) * 100;
    setScore(calculatedScore);
    setSubmitted(true);

    try {
      await markExamTakenMutation.mutateAsync({
        courseId,
        score: calculatedScore,
      });
    } catch (error) {
      console.error("Failed to submit exam:", error);
    }
  };

  if (courseQuery.isLoading || examQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!courseQuery.data || !examQuery.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Exam not found</p>
          <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline">
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const exam = examQuery.data;
  const questions = questionsQuery.data || [];

  if (submitted) {
    const passed = score !== null && score >= parseFloat(exam.passingScore || "70");

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                {passed ? (
                  <CheckCircle className="w-16 h-16 text-green-600" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-red-600" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {passed ? "Congratulations!" : "Try Again"}
              </CardTitle>
              <CardDescription className="text-xl mt-2">
                Your Score: {score?.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Passing score: {exam.passingScore}%
              </p>
              <Button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-600 mt-2">{exam.description}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {questions.map((question, idx) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {idx + 1} ({question.points} points)
                </CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                {question.questionType === "multiple_choice" && question.options ? (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className="space-y-3">
                      {JSON.parse(question.options).map((option: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q${question.id}-${idx}`} />
                          <Label htmlFor={`q${question.id}-${idx}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <Textarea
                    placeholder="Enter your answer..."
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={handleSubmitExam}
            disabled={markExamTakenMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
          >
            {markExamTakenMutation.isPending ? "Submitting..." : "Submit Exam"}
          </Button>
        </div>
      </main>
    </div>
  );
}
