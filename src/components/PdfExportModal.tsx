"use client";

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWriteUp } from '@/hooks/useWriteUp';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet } from 'lucide-react';
import { marked } from 'marked';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useScopedI18n, useCurrentLocale } from '@/locales/client';
import DOMPurify from 'dompurify';
import { htmlToPdfmake, PDF_THEME_COLORS } from '@/lib/pdfRenderer';

interface PdfExportModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type PdfThemeKey = 'Hacker' | 'Dark' | 'Light';

export const PdfExportModal: React.FC<PdfExportModalProps> = ({ open: externalOpen, onOpenChange: externalOnOpenChange }) => {
  const { state } = useWriteUp();
  const { writeUp } = state;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;
  const setIsOpen = externalOnOpenChange ?? setInternalOpen;
  const [theme, setTheme] = useState<PdfThemeKey>('Dark');
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const pdfPreviewUrlRef = useRef<string | null>(null);

  const currentLocale = useCurrentLocale();
  const tPdfModal = useScopedI18n('pdfModal');
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');
  const tt = useScopedI18n('toasts');

  const loadPdfMake = async () => {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    const fontFiles = (pdfFontsModule as any).default ?? pdfFontsModule;
    for (const [name, data] of Object.entries(fontFiles as Record<string, string>)) {
      pdfMake.virtualfs.writeFileSync(name, data, 'base64');
    }
    return pdfMake;
  };

  const buildDocDefinition = () => {
    const themeKey = theme === 'Hacker' ? 'Hacker' : theme === 'Dark' ? 'Professional-Dark' : 'Professional-Light';
    const pdfTheme = PDF_THEME_COLORS[themeKey];
    const baseFontSize = 10;
    const dateLocale = currentLocale === 'es' ? es : enUS;
    const content: unknown[] = [];

    content.push({
      text: writeUp.title || tPdfModal('untitledWriteup'),
      fontSize: 22, bold: true, color: pdfTheme.primary, alignment: 'center', margin: [0, 0, 0, 4],
    });

    const metaParts: string[] = [];
    if (writeUp.author) metaParts.push(`${tPdfModal('authorLabel')}: ${writeUp.author}`);
    if (writeUp.date) {
      try { metaParts.push(`${tPdfModal('dateLabel')}: ${format(parseISO(writeUp.date), 'PPP', { locale: dateLocale })}`); } catch { /* ignore */ }
    }
    if (writeUp.difficulty) metaParts.push(`${tPdfModal('difficultyLabel')}: ${tDifficulties(writeUp.difficulty as any)}`);
    if (writeUp.os) metaParts.push(`${tPdfModal('osLabel')}: ${tOS(writeUp.os as any)}`);
    if (writeUp.tags?.length) metaParts.push(`${tPdfModal('tagsLabel')}: ${writeUp.tags.join(', ')}`);
    if (metaParts.length > 0) {
      content.push({ text: metaParts.join('   ·   '), fontSize: 9, alignment: 'center', color: pdfTheme.text, margin: [0, 0, 0, 8] });
    }

    if (writeUp.machineImage?.dataUrl) {
      content.push({ image: writeUp.machineImage.dataUrl, fit: [200, 200], alignment: 'center', margin: [0, 6, 0, 12] });
    }

    const sections = writeUp.sections.filter(s => !s.isTemplate);
    for (const section of sections) {
      // Build all content blocks first so we can anchor the title to the first one
      const sectionBlocks: unknown[] = [];
      if (section.type === 'pregunta' && section.answer) {
        sectionBlocks.push({
          text: [{ text: `${tPdfModal('answerLabel')}: `, bold: true }, section.answer],
          fontSize: baseFontSize, margin: [0, 0, 0, 4],
        });
      }
      if (section.type === 'flag' && section.flagValue) {
        sectionBlocks.push({
          text: [{ text: `${tPdfModal('flagLabel')}: `, bold: true }, { text: section.flagValue, background: pdfTheme.codeBg, color: pdfTheme.codeColor }],
          fontSize: baseFontSize, margin: [0, 0, 0, 4],
        });
      }
      if (section.content) {
        let html = section.content.trim();
        if (!html.startsWith('<')) html = DOMPurify.sanitize(marked.parse(html) as string);
        sectionBlocks.push(...htmlToPdfmake(html, pdfTheme, baseFontSize));
      }

      // FIX 1.1: title + first content block as unbreakable unit → no orphan titles
      const titleBlock = {
        text: section.title || tPdfModal('untitledSection'),
        fontSize: 16, bold: true, color: pdfTheme.primary, margin: [0, 12, 0, 6],
      };
      if (sectionBlocks.length > 0) {
        content.push({ stack: [titleBlock, sectionBlocks[0]], unbreakable: true });
        content.push(...sectionBlocks.slice(1));
      } else {
        content.push(titleBlock);
      }

      // FIX 1.2: smaller fit + image+caption as unbreakable unit → less empty space
      for (const shot of section.screenshots ?? []) {
        const imageStack: unknown[] = [
          { image: shot.dataUrl, fit: [500, 420], alignment: 'center', margin: [0, 6, 0, 2] },
        ];
        if (shot.name) {
          imageStack.push({ text: shot.name, fontSize: 8, italics: true, color: pdfTheme.accent, margin: [0, 0, 0, 8] });
        }
        content.push({ stack: imageStack, unbreakable: true });
      }
    }

    return {
      docDefinition: {
        pageSize: 'A4',
        pageMargins: [42, 50, 42, 50] as [number, number, number, number],
        defaultStyle: { fontSize: baseFontSize, color: pdfTheme.text, font: 'Roboto' },
        background: () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: pdfTheme.bg }] }),
        content,
        footer: (currentPage: number, pageCount: number) => ({
          text: `${currentPage} / ${pageCount}`, alignment: 'center', fontSize: 8, color: '#888888', margin: [0, 10, 0, 0],
        }),
      },
      safeName: (writeUp.title || 'writeup').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').toLowerCase() || 'writeup',
    };
  };

  React.useEffect(() => {
    if (!isOpen) {
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
        pdfPreviewUrlRef.current = null;
      }
      setPdfPreviewUrl(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsGeneratingPreview(true);
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
        pdfPreviewUrlRef.current = null;
      }
      setPdfPreviewUrl(null);
      try {
        const pdfMake = await loadPdfMake();
        const { docDefinition } = buildDocDefinition();
        const blob: Blob = await (pdfMake as any).createPdf(docDefinition as any).getBlob();
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          pdfPreviewUrlRef.current = url;
          setPdfPreviewUrl(url);
        }
      } catch (e) {
        console.error('PDF preview error:', e);
      } finally {
        if (!cancelled) setIsGeneratingPreview(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen, theme, writeUp]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    setIsExporting(true);
    toast({ title: tt('info'), description: tt('pdfExportStarted') });
    try {
      const pdfMake = await loadPdfMake();
      const { docDefinition, safeName } = buildDocDefinition();
      await (pdfMake as any).createPdf(docDefinition as any).download(`${safeName}.pdf`);
      toast({ title: tPdfModal('pdfExportSuccess'), description: tPdfModal('pdfExportedSuccessfully') });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: tPdfModal('exportError'),
        description: tPdfModal('pdfExportFailed', { errorMessage: error instanceof Error ? error.message : '' }),
        variant: 'destructive',
        duration: 9000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[950px] w-full h-[95vh] p-0 m-0 flex flex-col bg-background text-foreground border-2 border-border border-glow" style={{ boxShadow: 'none' }}>
        <DialogHeader className="px-4 py-3 flex flex-row justify-between items-center" style={{ borderBottom: 'none', borderTop: 'none' }}>
          <DialogTitle className="text-lg font-bold flex items-center text-glow">
            <FileSpreadsheet size={20} className="mr-2 icon-glow" />
            {tPdfModal('exportButton')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 w-full h-full">
          <div className="w-full flex flex-row items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background" style={{ borderTop: '3px solid hsl(var(--foreground))' }}>
            <div className="flex flex-row items-center gap-4 flex-wrap">
              <span className="text-sm font-extrabold uppercase tracking-wider text-glow">{tPdfModal('theme')}:</span>
              {(['Hacker', 'Dark', 'Light'] as PdfThemeKey[]).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? 'default' : 'outline'}
                  className="h-9 px-5 text-sm font-bold uppercase tracking-wider border-2 btn-glow transition-all duration-150"
                  onClick={() => setTheme(t)}
                  disabled={isGeneratingPreview}
                >
                  {tPdfModal(t as any)}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting || isGeneratingPreview}
              variant="outline"
              size="lg"
              className="h-12 px-8 text-lg font-extrabold uppercase tracking-wider border-2 btn-glow hover:bg-primary hover:text-primary-foreground transition-all duration-150"
            >
              <Download className="mr-2 h-6 w-6" />
              {isExporting ? tPdfModal('exportingButton') : tPdfModal('exportButton')}
            </Button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
            {isGeneratingPreview && (
              <div className="flex flex-col items-center justify-center gap-3 text-neutral-400 flex-1">
                <div className="h-8 w-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono">{tPdfModal('processingPDF')}</span>
              </div>
            )}
            {!isGeneratingPreview && !pdfPreviewUrl && (
              <div className="flex items-center justify-center flex-1 text-neutral-500 text-sm font-mono">
                {tPdfModal('previewHiddenDesc')}
              </div>
            )}
            {!isGeneratingPreview && pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                title="Vista previa del PDF"
                style={{ width: '100%', flex: 1, border: 'none', minHeight: '500px' }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
