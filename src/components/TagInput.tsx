
"use client";

import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/locales/client'; // Import useI18n

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Añadir tag...",
  className,
  id = "tag-input"
}) => {
  const [inputValue, setInputValue] = useState('');
  const t = useI18n(); // Initialize useI18n

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag)) {
      onTagsChange([...tags, newTag]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder} // Placeholder should also be translated if needed
          className="flex-grow"
        />
        <Button type="button" onClick={addTag} variant="outline" size="sm">
          {t('tagInput.addButton')} {/* Use translated text */}
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 group">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="rounded-full opacity-50 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-destructive"
                aria-label={`${t('tagInput.removeTagButtonLabel')} ${tag}`} // Translate aria-label
              >
                <X size={14} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

