
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useRef } from 'react';
import type { Screenshot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { useI18n } from '@/locales/client'; // Import I18n hook

interface ImageUploaderProps {
  onImageUpload: (screenshot: Screenshot) => void;
  onImageRemove?: () => void; // For single image uploader like machine image
  currentImage?: Screenshot;
  label?: string;
  className?: string;
  accept?: string;
  id?: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  onImageRemove,
  currentImage,
  label, // Label is passed as a prop, already translated by parent
  className,
  accept = "image/*",
  id = "image-upload"
}) => {
  const t = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t('imageUploader.fileTooLarge', { maxSize: MAX_FILE_SIZE_MB }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(t('imageUploader.invalidFileType'));
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload({
        id: uuidv4(),
        name: file.name,
        dataUrl: reader.result as string,
      });
    };
    reader.onerror = () => {
      setError(t('imageUploader.errorReadingFile'));
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn("w-full", className, isDragging ? "border-foreground ring-2 ring-foreground" : "")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <CardContent className="p-4">
        {currentImage ? (
          <div className="relative group">
            <Image
              src={currentImage.dataUrl}
              alt={currentImage.name || t('imageUploader.previewAlt')}
              width={200}
              height={150}
              className="rounded-md object-contain max-h-[150px] w-full"
            />
            {onImageRemove && (
               <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onImageRemove}
                aria-label={t('imageUploader.deleteImageAlt')}
              >
                <XCircle size={18} />
              </Button>
            )}
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-foreground transition-colors"
            onClick={triggerFileInput}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && triggerFileInput()}
          >
            <UploadCloud size={48} className="mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">{label || t('imageUploader.defaultLabel')}</p>
            <p className="text-xs text-muted-foreground">{t('imageUploader.dragDropOrClick')}</p>
            <p className="text-xs text-muted-foreground">{t('imageUploader.maxFileSize', { maxSize: MAX_FILE_SIZE_MB })}</p>
          </div>
        )}
        <Input
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
      {!currentImage && (
        <CardFooter className="p-2 pt-0">
            <Button variant="outline" size="sm" onClick={triggerFileInput} className="w-full">
                {t('imageUploader.selectFileButton')}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};
