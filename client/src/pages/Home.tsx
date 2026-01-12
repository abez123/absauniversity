import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Loader2, BookOpen, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { ES } from "@/constants/es";

/**
 * Home page - Shows available courses for students and admin dashboard for instructors
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const coursesQuery = trpc.courses.list.useQuery();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src="/logo-absa.png" alt="ABSA" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">{ES.appName}</CardTitle>
              <CardDescription>{ES.appDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {ES.signInToAccess}
              </p>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {ES.signIn}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo-absa.png" alt="ABSA" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold text-gray-900">{ES.appName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
            {user?.role === "admin" && (
              <Button
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                {ES.adminPanel}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {ES.signOut}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{ES.availableCourses}</h2>
          <p className="text-gray-600">{ES.chooseACourse}</p>
        </div>

        {coursesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
          </div>
        ) : coursesQuery.data && coursesQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesQuery.data.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Sin descripción disponible"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.startDate && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">{ES.starts}:</span> {new Date(course.startDate).toLocaleDateString('es-ES')}
                      </div>
                    )}
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}`);
                      }}
                    >
                      {ES.viewCourse}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{ES.noCourses}</p>
          </div>
        )}
      </main>
    </div>
  );
}
