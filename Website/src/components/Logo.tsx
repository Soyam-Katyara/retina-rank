import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = 'md', showText = true, className }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('gradient-primary rounded-xl flex items-center justify-center', sizeClasses[size])}>
        <Brain className={cn('text-primary-foreground', size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5')} />
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight text-foreground', textSizes[size])}>
          Telly
        </span>
      )}
    </div>
  );
};
