import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, ArrowLeft } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Track browser history availability for back button
  const [canGoBack, setCanGoBack] = useState<boolean>(() => typeof window !== 'undefined' && window.history.length > 1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = () => {
      setCanGoBack(window.history.length > 1);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Go back" disabled={!canGoBack} title={canGoBack ? 'Go back' : 'No history'}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Link to="/dashboard">
            <Logo size="sm" />
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.fullName} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-3 p-3">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.fullName} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <Settings className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
