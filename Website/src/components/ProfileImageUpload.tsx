import { useState, useRef, useCallback } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProfileImageUploadProps {
  currentImage?: string;
  fallbackInitial: string;
  onImageChange?: (imageUrl: string | null) => void;
  isEditing?: boolean;
}

export const ProfileImageUpload = ({
  currentImage,
  fallbackInitial,
  onImageChange,
  isEditing = false,
}: ProfileImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageChange?.(url);
    toast.success('Profile image updated');
  }, [onImageChange]);

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null);
    onImageChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageChange]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {/* Avatar Display */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {fallbackInitial}
          </div>
        )}
        
        {/* Edit Overlay */}
        {isEditing && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            onClick={triggerFileSelect}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Edit Controls */}
      {isEditing && (
        <div className="absolute -bottom-2 -right-2 flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7 rounded-full shadow-md"
            onClick={triggerFileSelect}
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
          {previewUrl && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-7 w-7 rounded-full shadow-md"
              onClick={handleRemoveImage}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
