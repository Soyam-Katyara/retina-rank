import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Pure validation function - no side effects
  const isValidEmail = (emailValue: string): boolean => {
    if (!emailValue) {
      return false;
    }
    
    // Email must end with .com
    if (!emailValue.endsWith('.com')) {
      return false;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    return emailRegex.test(emailValue);
  };

  // Validation function with error messages
  const validateEmail = (emailValue: string): { isValid: boolean; error: string } => {
    if (!emailValue) {
      return { isValid: false, error: '' };
    }
    
    // Email must end with .com
    if (!emailValue.endsWith('.com')) {
      return { isValid: false, error: 'Email must end with .com' };
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    if (!emailRegex.test(emailValue)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true, error: '' };
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      const { error } = validateEmail(value);
      setEmailError(error);
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const { isValid } = validateEmail(email);
    if (!isValid) {
      toast.error('Email must be a valid .com address');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      // Prevent multiple simultaneous login attempts
      if (isLoading || isGoogleLoading) {
        return;
      }

      setIsLoading(true);
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Prevent multiple simultaneous login attempts
      if (isGoogleLoading || isLoading) {
        return;
      }

      setIsGoogleLoading(true);
      
      const success = await loginWithGoogle();
      if (success) {
        toast.success('Welcome!');
        navigate('/dashboard');
      } else {
        toast.error('Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <Logo size="lg" className="mb-8" />
          
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Create, Assess, Excel
          </h1>
          <p className="text-lg opacity-90 mb-8 max-w-md">
            Build intelligent quizzes with AI, conduct proctored assessments, and track performance with detailed analytics.
          </p>
          
          <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 max-w-sm">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm">AI-powered quiz generation from any content</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                autoComplete="off"
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-sm text-destructive mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-sm text-destructive mt-1">Password must be at least 8 characters.</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading || !email || !isValidEmail(email) || password.length < 8}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
              or continue with
            </span>
          </div>

          {/* Google Login */}
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-3"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/landing" className="text-primary font-medium hover:underline">
              Learn more about our platform
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
