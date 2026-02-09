import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText } from 'lucide-react';

interface AttemptedQuizCardProps {
  quizId: string;
  quizTitle: string;
  quizType: 'mcq' | 'subjective' | 'mixed';
  quizImage?: string;
  startedAt: Date;
  completedAt: Date;
  onClick?: () => void;
}

const typeLabels: Record<string, string> = {
  mcq: 'Multiple Choice',
  subjective: 'Subjective',
  mixed: 'Mixed Format',
};

const typeColors: Record<string, string> = {
  mcq: 'bg-primary/10 text-primary',
  subjective: 'bg-accent/10 text-accent',
  mixed: 'bg-secondary text-secondary-foreground',
};

export const AttemptedQuizCard = ({
  quizTitle,
  quizType,
  quizImage,
  startedAt,
  completedAt,
  onClick,
}: AttemptedQuizCardProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 overflow-hidden group"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Quiz Image */}
        <div className="relative w-full sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0 overflow-hidden">
          {quizImage ? (
            <img 
              src={quizImage} 
              alt={quizTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary-foreground/80" />
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 sm:p-5">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                  {quizTitle}
                </h3>
                <Badge 
                  variant="secondary" 
                  className={`flex-shrink-0 ${typeColors[quizType]}`}
                >
                  {typeLabels[quizType]}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Started: {format(new Date(startedAt), 'MMM d, h:mm a')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Ended: {format(new Date(completedAt), 'MMM d, h:mm a')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
