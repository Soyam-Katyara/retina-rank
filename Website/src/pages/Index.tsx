import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ArrowRight, Brain, Shield, BarChart3, Sparkles, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      description: 'Create quizzes instantly from any topic with intelligent question generation.',
    },
    {
      icon: Shield,
      title: 'Proctored Assessments',
      description: 'Ensure integrity with real-time camera monitoring and fullscreen enforcement.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Track performance with focus metrics, score breakdowns, and progress reports.',
    },
  ];

  const benefits = [
    'AI-generated quizzes from any topic',
    'Multiple question formats: MCQ, Subjective, Mixed',
    'Real-time proctoring with camera view',
    'Automatic scoring and instant results',
    'Focus time tracking and analytics',
    'Downloadable PDF reports',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Log In
                </Button>
                <Button variant="gradient" onClick={() => navigate('/signup')}>
                  Get Started
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Quiz Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Create, Assess, and{' '}
              <span className="text-gradient">Excel</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Generate intelligent quizzes instantly with AI — no setup needed.
            </p>
          </div>



 
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful features designed to make quiz creation and assessment effortless.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose <span className="text-gradient">Telly</span>?
              </h2>
              <p className="text-muted-foreground mb-8">
                Designed for educators, trainers, and anyone who wants to create 
                engaging assessments with minimal effort.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-3xl gradient-primary opacity-10 absolute inset-0" />
              <div className="relative p-8">
                <div className="bg-card rounded-2xl shadow-xl border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary" />
                    <div className="h-4 bg-muted rounded w-32" />
                  </div>
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="h-12 bg-primary/10 rounded-lg" />
                    <div className="h-12 bg-muted rounded-lg" />
                    <div className="h-12 bg-muted rounded-lg" />
                    <div className="h-12 bg-muted rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands of educators using Telly to create smarter assessments.
          </p>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
