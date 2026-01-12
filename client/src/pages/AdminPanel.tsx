import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Admin panel - Manage courses, exams, and documents
 */
export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    videoTranscript: "",
  });

  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    passingScore: "70",
  });

  // Queries
  const coursesQuery = trpc.courses.getByInstructor.useQuery();

  // Mutations
  const createCourseMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      setCourseForm({ title: "", description: "", videoUrl: "", videoTranscript: "" });
      setShowCreateCourse(false);
      coursesQuery.refetch();
      toast.success("Course created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create course");
    },
  });

  const updateCourseMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      coursesQuery.refetch();
      toast.success("Course updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update course");
    },
  });

  const createExamMutation = trpc.exams.create.useMutation({
    onSuccess: () => {
      setExamForm({ title: "", description: "", passingScore: "70" });
      setShowCreateExam(false);
      toast.success("Exam created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create exam");
    },
  });

  // Handlers
  const handleCreateCourse = async () => {
    if (!courseForm.title) {
      toast.error("Course title is required");
      return;
    }

    try {
      await createCourseMutation.mutateAsync({
        title: courseForm.title,
        description: courseForm.description,
        videoUrl: courseForm.videoUrl,
        videoTranscript: courseForm.videoTranscript,
      });
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  const handlePublishCourse = async (courseId: number) => {
    try {
      await updateCourseMutation.mutateAsync({
        courseId,
        isPublished: true,
      });
    } catch (error) {
      console.error("Failed to publish course:", error);
    }
  };

  const handleCreateExam = async () => {
    if (!selectedCourse || !examForm.title) {
      toast.error("Course and exam title are required");
      return;
    }

    try {
      await createExamMutation.mutateAsync({
        courseId: selectedCourse,
        title: examForm.title,
        description: examForm.description,
        passingScore: examForm.passingScore,
      });
    } catch (error) {
      console.error("Failed to create exam:", error);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You don't have permission to access this page</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Add a new course to your platform</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter course title"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter course description"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    placeholder="Enter video URL"
                    value={courseForm.videoUrl}
                    onChange={(e) => setCourseForm({ ...courseForm, videoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="transcript">Video Transcript</Label>
                  <Textarea
                    id="transcript"
                    placeholder="Enter video transcript"
                    value={courseForm.videoTranscript}
                    onChange={(e) => setCourseForm({ ...courseForm, videoTranscript: e.target.value })}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleCreateCourse}
                  disabled={createCourseMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>Manage your courses and content</CardDescription>
              </CardHeader>
              <CardContent>
                {coursesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin w-8 h-8" />
                  </div>
                ) : coursesQuery.data && coursesQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {coursesQuery.data.map((course) => (
                      <div
                        key={course.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              course.isPublished
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {!course.isPublished && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePublishCourse(course.id)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCourse(course.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Dialog open={showCreateExam && selectedCourse === course.id} onOpenChange={setShowCreateExam}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCourse(course.id)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Exam
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create Exam</DialogTitle>
                                <DialogDescription>Add an exam to this course</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="exam-title">Exam Title</Label>
                                  <Input
                                    id="exam-title"
                                    placeholder="Enter exam title"
                                    value={examForm.title}
                                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="exam-description">Description</Label>
                                  <Textarea
                                    id="exam-description"
                                    placeholder="Enter exam description"
                                    value={examForm.description}
                                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="passing-score">Passing Score (%)</Label>
                                  <Input
                                    id="passing-score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={examForm.passingScore}
                                    onChange={(e) => setExamForm({ ...examForm, passingScore: e.target.value })}
                                  />
                                </div>
                                <Button
                                  onClick={handleCreateExam}
                                  disabled={createExamMutation.isPending}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                  {createExamMutation.isPending ? "Creating..." : "Create Exam"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No courses yet. Create one to get started!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {coursesQuery.data?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Published Courses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {coursesQuery.data?.filter(c => c.isPublished).length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
