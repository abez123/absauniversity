import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CourseDetail from "./pages/CourseDetail";
import ExamPage from "./pages/ExamPage";
import AdminPanel from "./pages/AdminPanel";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {user ? <Home /> : <Login />}
      </Route>
      <Route path="/course/:courseId">
        {user ? (params: any) => <CourseDetail params={params} /> : <Login />}
      </Route>
      <Route path="/exam/:courseId">
        {user ? (params: any) => <ExamPage params={params} /> : <Login />}
      </Route>
      <Route path="/admin">
        {user?.role === "admin" ? <AdminPanel /> : <NotFound />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
