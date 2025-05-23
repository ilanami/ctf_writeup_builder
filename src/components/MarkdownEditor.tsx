
"use client";

import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Code2, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  id?: string;
  error?: string;
  showWordCount?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = "Escribe tu contenido Markdown aquí...",
  className,
  rows = 10,
  id = "markdown-editor",
  error,
  showWordCount = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = value?.split(/\s+/).filter(Boolean).length || 0;
  const charCount = value?.length || 0;

  const handleFormat = (type: 'bold' | 'italic' | 'ul' | 'ol' | 'codeblock' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentValue = textarea.value; 
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentValue.substring(start, end);
    
    let newText = '';
    let newSelectionStart = start;
    let newSelectionEnd = end;

    const prefix = currentValue.substring(0, start);
    const suffix = currentValue.substring(end);

    switch (type) {
      case 'bold':
        if (selectedText) {
          newText = `${prefix}**${selectedText}**${suffix}`;
          newSelectionStart = start + 2;
          newSelectionEnd = start + 2 + selectedText.length;
        } else {
          newText = `${prefix}****${suffix}`;
          newSelectionStart = start + 2;
          newSelectionEnd = start + 2;
        }
        break;
      case 'italic':
        if (selectedText) {
          newText = `${prefix}*${selectedText}*${suffix}`;
          newSelectionStart = start + 1;
          newSelectionEnd = start + 1 + selectedText.length;
        } else {
          newText = `${prefix}**${suffix}`; // For italic placeholder, should be * *
          newSelectionStart = start + 1;
          newSelectionEnd = start + 1;
        }
        break;
      case 'ul':
        if (selectedText) {
          const lines = selectedText.split('\n');
          const formattedLines = lines.map(line => `- ${line}`).join('\n');
          newText = `${prefix}${formattedLines}${suffix}`;
          newSelectionStart = start;
          newSelectionEnd = start + formattedLines.length;
        } else {
          const linePrefix = (start === 0 || currentValue[start - 1] === '\n') ? '' : '\n';
          newText = `${prefix}${linePrefix}- ${suffix}`;
          newSelectionStart = start + linePrefix.length + 2;
          newSelectionEnd = newSelectionStart;
        }
        break;
      case 'ol':
        if (selectedText) {
          const lines = selectedText.split('\n');
          const formattedLines = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
          newText = `${prefix}${formattedLines}${suffix}`;
          newSelectionStart = start;
          newSelectionEnd = start + formattedLines.length;
        } else {
          const linePrefix = (start === 0 || currentValue[start - 1] === '\n') ? '' : '\n';
          newText = `${prefix}${linePrefix}1. ${suffix}`;
          newSelectionStart = start + linePrefix.length + 3;
          newSelectionEnd = newSelectionStart;
        }
        break;
      case 'codeblock':
        if (selectedText) {
          newText = `${prefix}\`\`\`\n${selectedText}\n\`\`\`${suffix}`;
          newSelectionStart = start + prefix.length + 4;
          newSelectionEnd = newSelectionStart + selectedText.length;
        } else {
          newText = `${prefix}\`\`\`\n\n\`\`\`${suffix}`;
          newSelectionStart = start + prefix.length + 4;
          newSelectionEnd = newSelectionStart;
        }
        break;
      case 'link':
        const linkDisplayText = selectedText || 'texto_del_enlace';
        newText = `${prefix}[${linkDisplayText}](aqui_la_url)${suffix}`;
        if (selectedText) {
            newSelectionStart = prefix.length + 1 + linkDisplayText.length + 2; 
            newSelectionEnd = newSelectionStart + 'aqui_la_url'.length;
        } else {
            newSelectionStart = prefix.length + 1; 
            newSelectionEnd = newSelectionStart + linkDisplayText.length;
        }
        break;
    }

    onChange(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newSelectionStart, newSelectionEnd);
      }
    }, 0);
  };


  return (
    <Card className={cn("w-full shadow-none border-0", className)}>
      {label && (
        <CardHeader className="p-0 pb-2">
          <Label htmlFor={id} className={cn(error ? "text-destructive" : "")}>{label}</Label>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="flex items-center space-x-1 p-1 border-b border-t border-border bg-muted mb-0 rounded-t-md">
          <Button variant="ghost" size="icon" onClick={() => handleFormat('bold')} title="Negrita (Ctrl+B)" className="h-7 w-7">
            <Bold size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleFormat('italic')} title="Cursiva (Ctrl+I)" className="h-7 w-7">
            <Italic size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleFormat('ul')} title="Lista Desordenada" className="h-7 w-7">
            <List size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleFormat('ol')} title="Lista Ordenada" className="h-7 w-7">
            <ListOrdered size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleFormat('codeblock')} title="Bloque de Código" className="h-7 w-7">
            <Code2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleFormat('link')} title="Enlace" className="h-7 w-7">
            <Link2 size={16} />
          </Button>
        </div>
        <Textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "resize-y min-h-[200px] focus:ring-foreground focus:border-foreground rounded-t-none", 
            error ? "border-destructive focus:ring-destructive" : ""
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </CardContent>
      {(error || showWordCount) && (
        <CardFooter className="p-0 pt-2 flex justify-between items-center text-xs">
          {error && <p id={`${id}-error`} className="text-destructive">{error}</p>}
          {showWordCount && !error && (
            <p className="text-muted-foreground">
              Palabras: {wordCount} | Caracteres: {charCount}
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

