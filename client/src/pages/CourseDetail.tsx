import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Download, CheckCircle, Lock } from "lucide-react";
import { CourseChatBox } from "@/components/CourseChatBox";
import { useState } from "react";
import { Streamdown } from "streamdown";

interface CourseDetailProps {
  params: {
    courseId: string;
  };
}

/**
 * Course detail page - Shows video, transcript, documents, and AI chat
 */
export default function CourseDetail({ params }: CourseDetailProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const courseId = parseInt(params.courseId);
  const [videoWatched, setVideoWatched] = useState(false);

  // Queries
  const courseQuery = trpc.courses.getById.useQuery({ courseId });
  const progressQuery = trpc.studentProgress.get.useQuery({ courseId });
  const documentsQuery = trpc.documents.getByCourse.useQuery({ courseId });
  const examQuery = trpc.exams.getByCourse.useQuery({ courseId });

  // Mutations
  const enrollMutation = trpc.studentProgress.enroll.useMutation();
  const markVideoWatchedMutation = trpc.studentProgress.markVideoWatched.useMutation();

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync({ courseId });
      progressQuery.refetch();
    } catch (error) {
      console.error("Failed to enroll:", error);
    }
  };

  const handleVideoWatched = async () => {
    try {
      await markVideoWatchedMutation.mutateAsync({ courseId });
      setVideoWatched(true);
      progressQuery.refetch();
    } catch (error) {
      console.error("Failed to mark video as watched:", error);
    }
  };

  if (courseQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!courseQuery.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Course not found</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const course = courseQuery.data;
  const progress = progressQuery.data;
  const isEnrolled = !!progress;
  const hasWatchedVideo = progress?.videoWatched || videoWatched;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-2">{course.description}</p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Video and content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video section */}
            {course.videoUrl ? (
              <Card>
                <CardHeader>
                  <CardTitle>Course Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      src={course.videoUrl}
                      controls
                      className="w-full"
                      onEnded={handleVideoWatched}
                    />
                  </div>
                  {isEnrolled && !hasWatchedVideo && (
                    <Button
                      onClick={handleVideoWatched}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      Mark as Watched
                    </Button>
                  )}
                  {hasWatchedVideo && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>Video watched</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Transcript section */}
            {course.videoTranscript && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <Streamdown>{course.videoTranscript}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents section */}
            {documentsQuery.data && documentsQuery.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documentsQuery.data.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                        <Download className="w-4 h-4 text-indigo-600" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat section */}
            {isEnrolled && (
              <Card>
                <CardHeader>
                  <CardTitle>Ask Questions</CardTitle>
                  <CardDescription>Get help from our AI assistant about this course</CardDescription>
                </CardHeader>
                <CardContent>
                  <CourseChatBox courseId={courseId} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-4">
            {/* Enrollment card */}
            {!isEnrolled ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Ready to learn?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {hasWatchedVideo ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm">Watch Video</span>
                  </div>

                  {examQuery.data && (
                    <Button
                      onClick={() => navigate(`/courses/${courseId}/exam`)}
                      disabled={!hasWatchedVideo}
                      className="w-full"
                      variant={hasWatchedVideo ? "default" : "outline"}
                    >
                      {hasWatchedVideo ? (
                        "Take Exam"
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Watch video first
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
