"use client";
import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Link2, Underline as UnderlineIcon, Code2, Code, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

const prepareContent = (content: string): string => {
  if (!content) return '';
  if (content.startsWith('<')) return content;
  return marked.parse(content) as string;
};

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Escribe tu contenido aquí...',
  className,
  id = 'wysiwyg-editor',
}) => {
  const isInternalChange = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: prepareContent(value),
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] p-2 focus:outline-none prose prose-invert bg-background text-foreground rounded-b-md',
        id,
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(prepareContent(value) || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className={cn('w-full', className)}>
      {label && <label htmlFor={id} className="block mb-1 font-bold">{label}</label>}
      <div className="flex items-center space-x-1 p-1 border-b border-t border-border bg-muted mb-0 rounded-t-md">
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-accent' : ''} title="Negrita (Ctrl+B)"><Bold size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-accent' : ''} title="Cursiva (Ctrl+I)"><Italic size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-accent' : ''} title="Subrayado (Ctrl+U)"><UnderlineIcon size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'bg-accent' : ''} title="Bloque de código (Ctrl+Alt+C)"><Code2 size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'bg-accent' : ''} title="Código en línea (Ctrl+E)"><Code size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-accent' : ''} title="Lista de viñetas"><List size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => {
          const url = window.prompt('URL del enlace');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} className={editor.isActive('link') ? 'bg-accent' : ''} title="Enlace"><Link2 size={16} /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
