import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { User } from '@/types/quiz';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (email: string, password: string, fullName: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (avatarUrl: string | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('telly_user');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Validate stored user has required fields
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) {
        return parsed as User;
      }
      
      localStorage.removeItem('telly_user');
      return null;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('telly_user');
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validate inputs
      if (!email || typeof email !== 'string') {
        throw new Error('Invalid email provided');
      }

      // Mock login - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockUser: User = {
        id: '1',
        email: email.trim(),
        fullName: 'John Doe',
        username: email.split('@')[0],
        createdAt: new Date(),
      };
      
      // Validate user object before setting
      if (!mockUser.id || !mockUser.email) {
        throw new Error('Failed to create user object');
      }
      
      setUser(mockUser);
      localStorage.setItem('telly_user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock Google login - in production, this would use OAuth
      // Simulating fetching user data from Google API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a random avatar from a list of profile images
      const googleProfileImages = [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      ];
      
      const selectedAvatar = googleProfileImages[Math.floor(Math.random() * googleProfileImages.length)];
      
      if (!selectedAvatar || typeof selectedAvatar !== 'string') {
        throw new Error('Failed to select avatar');
      }
      
      const mockGoogleUser: User = {
        id: Date.now().toString(),
        email: `user+${Date.now()}@gmail.com`, // Generate unique email
        fullName: 'Google User',
        username: `googleuser_${Date.now()}`,
        createdAt: new Date(),
        avatarUrl: selectedAvatar,
        isGoogleUser: true,
      };
      
      // Validate user object before setting
      if (!mockGoogleUser.id || !mockGoogleUser.email) {
        throw new Error('Failed to create Google user object');
      }
      
      setUser(mockGoogleUser);
      localStorage.setItem('telly_user', JSON.stringify(mockGoogleUser));
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string, username: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validate all inputs
      if (!email || typeof email !== 'string') {
        throw new Error('Invalid email provided');
      }
      if (!password || typeof password !== 'string') {
        throw new Error('Invalid password provided');
      }
      if (!fullName || typeof fullName !== 'string') {
        throw new Error('Invalid full name provided');
      }
      if (!username || typeof username !== 'string') {
        throw new Error('Invalid username provided');
      }

      // Mock signup - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newUser: User = {
        id: Date.now().toString(),
        email: email.trim(),
        fullName: fullName.trim(),
        username: username.trim(),
        createdAt: new Date(),
      };
      
      // Validate user object before setting
      if (!newUser.id || !newUser.email || !newUser.fullName || !newUser.username) {
        throw new Error('Failed to create user object with required fields');
      }
      
      setUser(newUser);
      localStorage.setItem('telly_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setUser(null);
      localStorage.removeItem('telly_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateAvatar = useCallback((avatarUrl: string | null) => {
    try {
      setUser(prevUser => {
        if (!prevUser) return null;
        
        const updatedUser = { ...prevUser, avatarUrl: avatarUrl || undefined };
        localStorage.setItem('telly_user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, signup, logout, updateAvatar, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
