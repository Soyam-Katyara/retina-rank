import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const PDFUploadHero = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      toast.success(`"${file.name}" ready for quiz generation`);
    } else {
      toast.error('Please upload a PDF file');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      toast.success(`"${file.name}" ready for quiz generation`);
    } else if (file) {
      toast.error('Please upload a PDF file');
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const handleGenerateQuiz = useCallback(async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    
    // Simulate PDF processing in background
    // In production, this would send the PDF to an API for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Quiz generated successfully!');
    setIsProcessing(false);
    navigate('/quiz/demo');
  }, [uploadedFile, navigate]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : uploadedFile 
              ? 'border-success bg-success/5' 
              : 'border-muted-foreground/30 hover:border-primary/50 bg-card/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          id="pdf-upload-hero"
          onChange={handleFileInput}
        />
        
        {uploadedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="font-semibold text-lg">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button
                variant="gradient"
                onClick={handleGenerateQuiz}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Quiz
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <label htmlFor="pdf-upload-hero" className="cursor-pointer block">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-lg font-semibold mb-1">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload any PDF document to generate a quiz instantly
            </p>
            <Button variant="outline" size="sm" className="pointer-events-none">
              <FileText className="h-4 w-4 mr-2" />
              Select PDF
            </Button>
          </label>
        )}
      </div>
    </div>
  );
};
