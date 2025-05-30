"use client";

import * as React from 'react';
import { useWriteUp } from '@/hooks/useWriteUp';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea as CustomScrollArea } from '@/components/ui/scroll-area'; // Changed import alias
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n, useScopedI18n, useCurrentLocale } from '@/locales/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { WriteUpSection } from '@/lib/types';
import DOMPurify from 'dompurify';

// Custom renderer for code blocks to add copy button and styling
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const { toast } = useToast();
  const tt = useScopedI18n('toasts');
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    const codeToCopy = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(codeToCopy)
      .then(() => toast({ title: tt('success'), description: "Code block copied to clipboard." }))
      .catch(() => toast({ title: tt('error'), description: "Could not copy code.", variant: "destructive" }));
  };

  return !inline ? (
    <div className="my-4 rounded-md bg-muted relative group">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-xs text-muted-foreground">{language}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy} aria-label="Copiar código">
          <ClipboardCopy size={14} />
        </Button>
      </div>
      <pre className="p-3 text-sm overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  ) : (
    <code className="px-1 py-0.5 bg-muted rounded-sm text-sm text-foreground font-semibold" {...props}>
      {children}
    </code>
  );
};

export const WriteUpPreview: React.FC = () => {
  const { state } = useWriteUp();
  const { writeUp } = state;
  const t = useI18n();
  const tg = useScopedI18n('generalInfo');
  const ta = useScopedI18n('activeSectionEditor');
  const tp = useScopedI18n('writeupPreview');
  const currentLocale = useCurrentLocale();
  const dateLocale = currentLocale === 'es' ? es : enUS;
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');

  const sectionsToPreview = writeUp.sections.filter(section => !section.isTemplate);
  const writeUpTitle = t(writeUp.title as any, {});
  const writeUpAuthor = t(writeUp.author as any, {});
  const difficultyDisplay = tDifficulties(writeUp.difficulty as any) || writeUp.difficulty;
  const osDisplay = tOS(writeUp.os as any) || writeUp.os;

  // Create an array of all section IDs to have them expanded by default
  const defaultExpandedSectionIds = sectionsToPreview.map(section => `section-preview-accordion-${section.id}`);

  return (
    <CustomScrollArea className="h-full p-1"> {/* Used aliased import */}
      <Card className="m-2 shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-3xl text-foreground font-bold">{writeUpTitle}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {tg('author')}: {writeUpAuthor} | {tg('date')}: {writeUp.date ? (() => {
              try {
                return format(parseISO(writeUp.date), "PPP", { locale: dateLocale });
              } catch {
                return writeUp.date;
              }
            })() : t('generalInfo.selectDate')}
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{tg('difficulty')}: {difficultyDisplay}</Badge>
            <Badge variant="secondary">{tg('os')}: {osDisplay}</Badge>
            {writeUp.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
          </div>
        </CardHeader>
        {sectionsToPreview.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              width: '100%',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#00ff00',
                textAlign: 'center',
                background: 'none',
                letterSpacing: '0.5px',
                textShadow: '0 0 8px #00ff00',
                padding: '0.5em 0',
                fontFamily: 'monospace, Fira Code, Consolas, Courier New',
              }}
            >
              Select a section to edit or create a new one from the sections panel.
            </span>
          </div>
        ) : (
          <CardContent className="p-6 prose prose-sm md:prose-base dark:prose-invert max-w-none 
                                  prose-headings:text-foreground prose-headings:font-bold 
                                  prose-strong:text-foreground 
                                  prose-a:text-foreground prose-a:font-bold hover:prose-a:text-accent-foreground 
                                  prose-code:text-foreground prose-code:font-semibold
                                  prose-pre:bg-muted prose-pre:text-foreground 
                                  prose-blockquote:border-foreground prose-blockquote:text-muted-foreground">
            {writeUp.machineImage && (
              <div className="my-6">
                <h2 className="text-xl font-semibold text-foreground">{tg('machineImage')}</h2>
                <Image
                  src={writeUp.machineImage.dataUrl}
                  alt={t(writeUp.machineImage.name as any, {}) || tg('machineImage')}
                  width={600}
                  height={400}
                  className="rounded-md border border-border shadow-md object-contain"
                  data-ai-hint="server security" 
                />
              </div>
            )}
            
            {sectionsToPreview.length > 0 && (
              <>
                <Separator className="my-8" />
                <div id="table-of-contents" className="mb-8 p-4 border border-border rounded-md bg-card/30 not-prose">
                  <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                    <ListChecks className="mr-2 h-6 w-6" />
                    {tp('tableOfContents')}
                  </h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {sectionsToPreview.map((section: WriteUpSection) => (
                      <li key={section.id}>
                        <a 
                          href={`#section-preview-accordion-trigger-${section.id}`} 
                          className="text-foreground hover:text-accent-foreground hover:underline"
                        >
                          {t(section.title as any, {})}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            <Separator className="my-8" />

            <Accordion type="multiple" defaultValue={defaultExpandedSectionIds} className="w-full">
              {sectionsToPreview.map((section: WriteUpSection, index: number) => {
                const sectionTitle = t(section.title as any, {});
                const sectionContent = t(section.content as any, {});
                const sectionTypeKey = section.type as keyof ReturnType<typeof useScopedI18n<'sectionTypes'>>;
                const sectionTypeDisplay = t(`sectionTypes.${sectionTypeKey}.label` as any, {}) || section.type;
                const accordionItemId = `section-preview-accordion-${section.id}`;
                const accordionTriggerId = `section-preview-accordion-trigger-${section.id}`;

                // SSR safety for DOMPurify
                const sanitizedContent = typeof window !== 'undefined'
                  ? DOMPurify.sanitize(sectionContent)
                  : sectionContent;

                return (
                  <AccordionItem value={accordionItemId} key={section.id} id={accordionItemId}>
                    <AccordionTrigger id={accordionTriggerId} className="hover:no-underline focus:no-underline scroll-mt-20">
                      <h2 className="text-2xl font-semibold text-foreground text-left w-full">
                        {index + 1}. {sectionTitle}
                        <span className="text-xs ml-2 text-muted-foreground font-normal">({sectionTypeDisplay})</span>
                      </h2>
                    </AccordionTrigger>
                    <AccordionContent>
                      <article className="mb-12">
                        {section.type === 'pregunta' && section.answer && (
                          <p className="italic text-muted-foreground"><strong>{ta('answerToQuestion')}:</strong> {section.answer}</p>
                        )}
                        {section.type === 'flag' && section.flagValue && (
                          <p className="font-mono p-2 bg-muted rounded text-foreground font-bold"><strong>{ta('flagValue')}:</strong> {section.flagValue}</p>
                        )}
                        <div
                          className="prose prose-green prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                        />
                        {section.screenshots && section.screenshots.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{ta('screenshots')}:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {section.screenshots.map(ss => (
                                <div key={ss.id} className="border border-border rounded-md p-1 shadow">
                                  <Image
                                    src={ss.dataUrl}
                                    alt={ss.name}
                                    width={300}
                                    height={200}
                                    className="rounded object-contain w-full h-auto"
                                    data-ai-hint="screenshot terminal"
                                  />
                                  <p className="text-xs text-center text-muted-foreground mt-1 truncate" title={ss.name}>{ss.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        )}
      </Card>
    </CustomScrollArea> 
  );
};

