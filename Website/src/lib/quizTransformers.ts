import type { QuizQuestion } from '@/types/quiz';

/**
 * Convert backend quiz JSON ({"Question number", "Question type", "Option 1"...})
 * to frontend QuizQuestion[] format.
 */
export function backendToFrontend(
  backendQuestions: any[],
  pointsConfig: { mcq: number; subjective: number; bcq: number },
): QuizQuestion[] {
  return backendQuestions.map((q) => {
    const type = (q['Question type'] as string).toLowerCase() as
      | 'mcq'
      | 'subjective'
      | 'bcq';
    const base: QuizQuestion = {
      id: String(q['Question number']),
      type,
      question: q['Question'],
      points:
        type === 'mcq'
          ? pointsConfig.mcq
          : type === 'bcq'
            ? pointsConfig.bcq
            : pointsConfig.subjective,
    };

    if (type === 'mcq') {
      base.options = [
        q['Option 1'],
        q['Option 2'],
        q['Option 3'],
        q['Option 4'],
      ];
    } else if (type === 'bcq') {
      base.options = [q['Option 1'], q['Option 2']]; // ["True", "False"]
    }

    return base;
  });
}

/**
 * Convert frontend answers map to backend format for evaluation.
 * Backend expects: [{"Question number": 1, "Answer": "..."}]
 */
export function answersToBackendFormat(
  answers: Record<string, string | number>,
  questions: QuizQuestion[],
): { 'Question number': number; Answer: string }[] {
  return questions.map((q) => {
    const answer = answers[q.id];
    let answerStr = '';
    if ((q.type === 'mcq' || q.type === 'bcq') && typeof answer === 'number') {
      answerStr = q.options?.[answer] ?? '';
    } else {
      answerStr = String(answer ?? '');
    }
    return {
      'Question number': parseInt(q.id),
      Answer: answerStr,
    };
  });
}
