import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateQuiz from "./pages/CreateQuiz";
import QuizInterface from "./pages/QuizInterface";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/landing" element={<Index />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/create-quiz" element={<CreateQuiz />} />
    <Route path="/quiz/:id" element={<QuizInterface />} />
    <Route path="/results/:id" element={<Results />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
