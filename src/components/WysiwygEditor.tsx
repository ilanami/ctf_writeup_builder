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
import { Bold, Italic, Link2, Underline as UnderlineIcon, Code2, Code, List, Heading1, Heading2, Heading3, Heading4 } from 'lucide-react';
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
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
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
        class: 'min-h-[200px] p-2 focus:outline-none prose prose-sm bg-background text-foreground rounded-b-md prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-foreground prose-strong:text-foreground prose-code:text-foreground',
        id,
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        if (link?.href) {
          event.preventDefault();
          window.open(link.href, '_blank', 'noopener,noreferrer');
          return true;
        }
        return false;
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
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''} title="Título 1 (H1)"><Heading1 size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''} title="Título 2 (H2)"><Heading2 size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''} title="Título 3 (H3)"><Heading3 size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={editor.isActive('heading', { level: 4 }) ? 'bg-accent' : ''} title="Título 4 (H4)"><Heading4 size={16} /></Button>
        <span className="w-px h-4 bg-border mx-0.5" />
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-accent' : ''} title="Negrita (Ctrl+B)"><Bold size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-accent' : ''} title="Cursiva (Ctrl+I)"><Italic size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-accent' : ''} title="Subrayado (Ctrl+U)"><UnderlineIcon size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'bg-accent' : ''} title="Bloque de código (Ctrl+Alt+C)"><Code2 size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'bg-accent' : ''} title="Código en línea (Ctrl+E)"><Code size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-accent' : ''} title="Lista de viñetas"><List size={16} /></Button>
        <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => {
          const raw = window.prompt('URL del enlace');
          if (!raw) return;
          const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
          editor.chain().focus().setLink({ href: url }).run();
        }} className={editor.isActive('link') ? 'bg-accent' : ''} title="Enlace"><Link2 size={16} /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
