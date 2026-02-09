import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizFormat, QuizCreationParams } from '@/types/quiz';
import { Upload, Sparkles, FileText, Brain, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { backendToFrontend } from '@/lib/quizTransformers';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGen = searchParams.get('type') === 'content' ? 'content' : 'ai';
  const [generationType, setGenerationType] = useState<'content' | 'ai'>(initialGen);

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'content' || t === 'ai') setGenerationType(t);
  }, [searchParams]);
  const [format, setFormat] = useState<QuizFormat>('mcq');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formData, setFormData] = useState<Partial<QuizCreationParams>>({
    title: '',
    timeLimit: 15,
    totalQuestions: 10,
    mcqCount: 5,
    mcqPoints: 10,
    subjectiveCount: 5,
    subjectivePoints: 20,
    bcqCount: 3,
    bcqPoints: 5,
    topic: '',
    subtopic: '',
    toDo: '',
    toAvoid: '',
  });

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/dashboard');
    }
  };

  const handleChange = (field: keyof QuizCreationParams, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const ACCEPTED_TYPES = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ];
  const ACCEPTED_EXTS = ['.pdf', '.txt', '.docx', '.pptx', '.ppt'];

  const isFileAccepted = (file: File) => {
    if (ACCEPTED_TYPES.includes(file.type)) return true;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTS.includes(ext);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isFileAccepted(file)) {
      setUploadedFile(file);
      toast.success(`File "${file.name}" uploaded successfully`);
    } else {
      toast.error('Please upload a PDF, DOCX, PPTX, or TXT file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isFileAccepted(file)) {
        setUploadedFile(file);
        toast.success(`File "${file.name}" uploaded successfully`);
      } else {
        toast.error('Please upload a PDF, DOCX, PPTX, or TXT file');
      }
    }
  };

  // Form validity: Title always required. Topic+Subtopic required for AI mode. File required for content mode.
  const isFormValid = Boolean(
    formData.title &&
    (generationType === 'content'
      ? uploadedFile
      : formData.topic && formData.subtopic)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Please enter a quiz title');
      return;
    }

    if (generationType === 'content' && !uploadedFile) {
      toast.error('Please upload a file');
      return;
    }

    if (generationType === 'ai') {
      if (!formData.topic) {
        toast.error('Please enter a topic');
        return;
      }
      if (!formData.subtopic) {
        toast.error('Please enter a subtopic');
        return;
      }
    }

    setIsGenerating(true);

    try {
      // Determine question mode and counts
      let mode: string;
      let numMcq = 0;
      let numSubjective = 0;
      let numBcq = 0;

      if (format === 'mcq') {
        mode = 'only_mcq';
        numMcq = formData.totalQuestions || 10;
      } else if (format === 'subjective') {
        mode = 'only_subjective';
        numSubjective = formData.totalQuestions || 10;
      } else {
        mode = 'mixed';
        numMcq = formData.mcqCount || 5;
        numSubjective = formData.subjectiveCount || 5;
        numBcq = formData.bcqCount || 0;
      }

      let backendQuestions: any[];
      let markdownContent: string | null = null;

      if (generationType === 'content') {
        // Step 1: Convert file to markdown
        setLoadingMessage('Converting file to text...');
        const ext = uploadedFile!.name.split('.').pop()?.toLowerCase();

        if (ext === 'txt') {
          // TXT files don't need conversion — read directly
          markdownContent = await uploadedFile!.text();
        } else {
          const convertResult = await api.convertFile(uploadedFile!);
          markdownContent = convertResult.markdown;
        }

        // Step 2: Generate quiz from markdown
        setLoadingMessage('Generating quiz questions...');
        const genResult = await api.generateQuizFromContent({
          markdown_content: markdownContent,
          mode,
          num_mcq: numMcq,
          num_subjective: numSubjective,
          num_bcq: numBcq,
        });
        backendQuestions = genResult.questions;
      } else {
        // AI-based generation
        setLoadingMessage('Generating quiz questions with AI...');
        const genResult = await api.generateQuizFromAI({
          topic: formData.topic!,
          sub_topic: formData.subtopic!,
          todo: formData.toDo || undefined,
          to_avoid: formData.toAvoid || undefined,
          mode,
          num_mcq: numMcq,
          num_subjective: numSubjective,
          num_bcq: numBcq,
        });
        backendQuestions = genResult.questions;
      }

      // Transform to frontend format
      const pointsConfig = {
        mcq: formData.mcqPoints || 10,
        subjective: formData.subjectivePoints || 20,
        bcq: formData.bcqPoints || 5,
      };
      const questions = backendToFrontend(backendQuestions, pointsConfig);

      // Store quiz for QuizInterface to consume
      const quizId = `quiz-${Date.now()}`;
      const quizPayload = {
        id: quizId,
        title: formData.title,
        questions,
        rawBackendQuestions: backendQuestions,
        markdownContent,
        format,
        timeLimit: formData.timeLimit || 15,
        topic: formData.topic,
        subtopic: formData.subtopic,
        totalQuestions: questions.length,
        createdAt: new Date().toISOString(),
        pointsConfig,
      };
      localStorage.setItem(`quiz_data_${quizId}`, JSON.stringify(quizPayload));

      // Also add to the quiz list for dashboard
      const quizList = JSON.parse(localStorage.getItem('created_quizzes') || '[]');
      quizList.push({
        id: quizId,
        title: formData.title,
        format,
        totalQuestions: questions.length,
        timeLimit: formData.timeLimit || 15,
        topic: formData.topic,
        subtopic: formData.subtopic,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('created_quizzes', JSON.stringify(quizList));

      toast.success('Quiz generated successfully!');
      navigate(`/quiz/${quizId}`);
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      toast.error(err.message || 'Failed to generate quiz. Is the backend running?');
    } finally {
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8 max-w-4xl animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Create a New Quiz</h1>
        <p className="text-muted-foreground mb-8">
          Generate intelligent quizzes from your content or let AI create them for you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              placeholder="e.g., JavaScript Fundamentals Quiz"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          {/* Generation Type Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                generationType === 'content' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setGenerationType('content')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${generationType === 'content' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Generate with Content</CardTitle>
                    <CardDescription>Upload PDF or TXT files</CardDescription>
                  </div>
                  {generationType === 'content' && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                </div>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                generationType === 'ai' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setGenerationType('ai')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${generationType === 'ai' ? 'gradient-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Generate with AI</CardTitle>
                    <CardDescription>AI creates questions from topic</CardDescription>
                  </div>
                  {generationType === 'ai' && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Content Upload (for content type) */}
          {generationType === 'content' && (
            <div className="space-y-2">
              <Label>Upload Content</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : uploadedFile 
                      ? 'border-success bg-success/5' 
                      : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.pptx,.ppt"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileInput}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-10 w-10 text-success" />
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">Supports PDF, DOCX, PPTX, and TXT files</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Topic, Subtopic & optional instructions (AI mode only) */}
          {generationType === 'ai' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Web Development"
                    value={formData.topic}
                    onChange={(e) => handleChange('topic', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtopic">Subtopic *</Label>
                  <Input
                    id="subtopic"
                    placeholder="e.g., React Hooks"
                    value={formData.subtopic}
                    onChange={(e) => handleChange('subtopic', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="toDo">Focus Areas (Optional)</Label>
                  <Textarea
                    id="toDo"
                    placeholder="Specify topics or concepts to focus on..."
                    value={formData.toDo}
                    onChange={(e) => handleChange('toDo', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toAvoid">Areas to Avoid (Optional)</Label>
                  <Textarea
                    id="toAvoid"
                    placeholder="Specify content or question types to exclude..."
                    value={formData.toAvoid}
                    onChange={(e) => handleChange('toAvoid', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Common Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Limit */}
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  max={180}
                  value={formData.timeLimit}
                  onChange={(e) => handleChange('timeLimit', parseInt(e.target.value))}
                  className="max-w-32"
                />
              </div>

              {/* Quiz Format */}
              <div className="space-y-3">
                <Label>Quiz Format</Label>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as QuizFormat)}>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mcq" id="mcq" />
                      <Label htmlFor="mcq" className="font-normal cursor-pointer">MCQ Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="subjective" id="subjective" />
                      <Label htmlFor="subjective" className="font-normal cursor-pointer">Subjective Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed" className="font-normal cursor-pointer">Mixed</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Question Count & Points */}
              {format === 'mixed' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                    <h4 className="font-medium">MCQ Questions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Count</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.mcqCount}
                          onChange={(e) => handleChange('mcqCount', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Points Each</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.mcqPoints}
                          onChange={(e) => handleChange('mcqPoints', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                    <h4 className="font-medium">Subjective Questions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Count</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.subjectiveCount}
                          onChange={(e) => handleChange('subjectiveCount', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Points Each</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.subjectivePoints}
                          onChange={(e) => handleChange('subjectivePoints', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                    <h4 className="font-medium">True/False Questions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Count</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.bcqCount}
                          onChange={(e) => handleChange('bcqCount', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Points Each</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.bcqPoints}
                          onChange={(e) => handleChange('bcqPoints', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="totalQuestions">Total Questions</Label>
                  <Input
                    id="totalQuestions"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.totalQuestions}
                    onChange={(e) => handleChange('totalQuestions', parseInt(e.target.value))}
                    className="max-w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button variant="gradient" size="lg" type="submit" className="gap-2" disabled={!isFormValid || isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {loadingMessage || 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Quiz
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateQuiz;
