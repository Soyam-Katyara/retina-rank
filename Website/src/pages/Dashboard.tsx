import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { QuizCard } from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Quiz } from '@/types/quiz';
import { Plus, Sparkles, Upload } from 'lucide-react';


const Dashboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Load quizzes from localStorage on mount
  useEffect(() => {
    const loaded: Quiz[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_data_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            loaded.push({
              id: data.id,
              title: data.title,
              format: data.format ?? 'mixed',
              totalQuestions: data.questions?.length ?? 0,
              timeLimit: data.timeLimit ?? 15,
              createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
              questions: data.questions ?? [],
              topic: data.topic ?? '',
              subtopic: data.subtopic ?? '',
            });
          }
        } catch {
          // skip malformed entries
        }
      }
    }
    loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setQuizzes(loaded);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8 animate-fade-in">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Create new quizzes and take existing quizzes.
          </p>
        </div>

        {/* Action Button with Dropdown Menu */}
        <div className="mb-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="gradient" size="xl" className="gap-3">
                <Plus className="h-5 w-5" />
                Create a New Quiz
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => navigate('/create-quiz?type=content')} className="gap-3 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Generate with PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/create-quiz?type=ai')} className="gap-3 cursor-pointer">
                <Sparkles className="h-4 w-4" />
                <span>Generate with AI</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>



        {/* Existing Quizzes Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Quizzes</h2>
            <span className="text-sm text-muted-foreground">{quizzes.length} quizzes</span>
          </div>

          {quizzes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard 
                  key={quiz.id} 
                  quiz={quiz}
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first quiz to get started
              </p>
              <div className="flex justify-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Quiz
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/create-quiz?type=content')} className="gap-3 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <span>Generate with PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/create-quiz?type=ai')} className="gap-3 cursor-pointer">
                      <Sparkles className="h-4 w-4" />
                      <span>Generate with AI</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
