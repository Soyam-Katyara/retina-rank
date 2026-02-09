import { Quiz } from '@/types/quiz';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileQuestion, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface QuizCardProps {
  quiz: Quiz;
  onClick?: () => void;
}

export const QuizCard = ({ quiz, onClick }: QuizCardProps) => {
  const formatBadge = {
    mcq: { label: 'MCQ', variant: 'default' as const },
    subjective: { label: 'Subjective', variant: 'secondary' as const },
    mixed: { label: 'Mixed', variant: 'outline' as const },
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {quiz.title}
          </h3>
          <Badge variant={formatBadge[quiz.format].variant}>
            {formatBadge[quiz.format].label}
          </Badge>
        </div>
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileQuestion className="h-4 w-4" />
            <span>{quiz.totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{quiz.timeLimit} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(quiz.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
        {quiz.topic && (
          <div className="mt-3 flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {quiz.topic}
            </Badge>
            {quiz.subtopic && (
              <Badge variant="secondary" className="text-xs">
                {quiz.subtopic}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
