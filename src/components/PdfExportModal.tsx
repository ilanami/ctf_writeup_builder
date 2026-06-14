"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PdfExportOptions, PdfTheme, PageSize, PageOrientation, WriteUpSection as AppWriteUpSection, Screenshot as AppScreenshot, WriteUp } from '@/lib/types';
import { DEFAULT_PDF_EXPORT_OPTIONS, PDF_THEMES_KEYS as APP_PDF_THEMES, PDF_PAGE_SIZES, PDF_PAGE_ORIENTATIONS_KEYS } from '@/lib/constants';
import { useWriteUp } from '@/hooks/useWriteUp';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, Palette, Settings, Eye, EyeOff, X, LayoutList, Baseline, ZoomIn, ZoomOut, Pilcrow } from 'lucide-react';
import { marked } from 'marked';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useScopedI18n, useCurrentLocale, I18nProviderClient, useI18n } from '@/locales/client';
import DOMPurify from 'dompurify';

// Define constants locally
const PDF_FONT_SIZE_OPTIONS_KEYS = [
  { key: 'pdfModal.fontSizeSmall', value: 8 },
  { key: 'pdfModal.fontSizeMedium', value: 10 },
  { key: 'pdfModal.fontSizeLarge', value: 12 },
] as const;

const PDF_IMAGE_QUALITY_OPTIONS_KEYS = [
  { key: 'pdfModal.imageQualityLow', value: 70 },
  { key: 'pdfModal.imageQualityMedium', value: 85 },
  { key: 'pdfModal.imageQualityHigh', value: 95 },
  { key: 'pdfModal.imageQualityMax', value: 100 },
] as const;

interface PdfDocumentContentProps {
  writeUp: WriteUp;
  options: PdfExportOptions;
  pdfStyles: string;
  currentLocale: string;
  tDifficulties: ReturnType<typeof useScopedI18n<'difficulties'>>;
  tOS: ReturnType<typeof useScopedI18n<'operatingSystems'>>;
  tPdfModal: ReturnType<typeof useScopedI18n<'pdfModal'>>;
}

const PDF_THEMES_CONFIG: Record<PdfTheme, { nameKey: string; backgroundColor: string; textColor: string; primaryColor: string; accentColor: string; borderColor: string; codeBg: string; codeColor: string; preBg: string; fontFamily: string; }> = {
  Hacker: { 
    nameKey: 'Hacker', 
    backgroundColor: '#0a0a0a',
    textColor: '#00ff00',
    primaryColor: '#00ff00',
    accentColor: '#00ffff',
    borderColor: '#00cc00',
    codeBg: '#1a1a1a',
    codeColor: '#00ff00',
    preBg: '#1a1a1a',
    fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
  },
  'Professional-Light': {
    nameKey: 'Professional-Light',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    primaryColor: '#0056b3',
    accentColor: '#007bff',
    borderColor: '#dddddd',
    codeBg: '#f8f9fa',
    codeColor: '#c7254e',
    preBg: '#f1f1f1',
    fontFamily: "'Arial', sans-serif",
  },
  'Professional-Dark': {
    nameKey: 'Professional-Dark',
    backgroundColor: '#2c2c2c',
    textColor: '#e0e0e0',
    primaryColor: '#5cadff',
    accentColor: '#79c3ff',
    borderColor: '#555555',
    codeBg: '#3a3a3a',
    codeColor: '#ffc0cb',
    preBg: '#333333',
    fontFamily: "'Arial', sans-serif",
  },
   Cyberpunk: {
    nameKey: 'Cyberpunk',
    backgroundColor: '#0a0a1f',
    textColor: '#f0f0f0',
    primaryColor: '#ff00ff',
    accentColor: '#00ffff',
    borderColor: '#ff00ff',
    codeBg: '#1f1f3d',
    codeColor: '#00ffff',
    preBg: '#1a1a2f',
    fontFamily: "'Orbitron', 'Fira Code', sans-serif",
  },
  Minimal: {
    nameKey: 'Minimal',
    backgroundColor: '#f8f8f8',
    textColor: '#222222',
    primaryColor: '#555555',
    accentColor: '#777777',
    borderColor: '#cccccc',
    codeBg: '#f0f0f0',
    codeColor: '#333333',
    preBg: '#e9e9e9',
    fontFamily: "'Helvetica', 'Arial', sans-serif",
  }
};

const PdfDocumentContent: React.FC<PdfDocumentContentProps> = ({ writeUp, options, pdfStyles, currentLocale, tDifficulties, tOS, tPdfModal }) => {
  const t = useI18n();
  const sectionsToExport = writeUp.sections.filter(section => !section.isTemplate);
  const currentTheme = PDF_THEMES_CONFIG[options.theme] || PDF_THEMES_CONFIG.Hacker;
  const dateLocale = currentLocale === 'es' ? es : enUS;

  const getFontSizeValues = (sizeOption: number) => {
    if (sizeOption <= 8) return { base: 8, title: 18, sectionTitle: 14, info: 7 };
    if (sizeOption <= 10) return { base: 10, title: 22, sectionTitle: 16, info: 9 };
    return { base: 12, title: 26, sectionTitle: 18, info: 11 };
  };
  const fontSizes = getFontSizeValues(options.fontSize);

  // Estilos para la vista previa - tamaño fijo más pequeño
  const previewStyle: React.CSSProperties = {
    width: '210mm', // Mantenemos A4 pero se escalará
    minHeight: '297mm',
    margin: '0',
    background: currentTheme.backgroundColor,
    color: currentTheme.textColor,
    fontFamily: currentTheme.fontFamily,
    fontSize: '11pt',
    lineHeight: '1.5',
    // Solo en vista previa: borde y sombra
    border: '1px solid #ddd',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'visible',
    // Padding como el PDF real
    padding: '12mm 10mm 15mm 10mm',
    boxSizing: 'border-box',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pdfStyles + `
        /* Estilos específicos para la vista previa - escalada */
        .pdf-content-container * {
          box-sizing: border-box;
        }
      ` }} />
      <div className="pdf-content-container" style={{ ...previewStyle, border: `3px solid ${currentTheme.primaryColor}`, boxShadow: 'none' }}>
        {/* Header con información general */}
        <div className="pdf-header-section">
          <h1 className="pdf-main-title" style={{ 
            fontSize: `${fontSizes.title}pt`,
            color: currentTheme.primaryColor,
            textAlign: 'center',
            marginBottom: '6pt',
            marginTop: '0',
            fontWeight: 'bold'
          }}>
            {writeUp.title || tPdfModal('untitledWriteup')}
          </h1>
          
          <div className="pdf-general-info" style={{ 
            fontSize: `${fontSizes.info}pt`,
            marginBottom: '12pt',
            textAlign: 'center'
          }}>
            {writeUp.machineImage && (
              <div style={{ margin: '0 0 6pt 0' }}>
                <strong>{tPdfModal('machineImageLabel')}:</strong><br />
                <img 
                  src={writeUp.machineImage.dataUrl} 
                  alt={tPdfModal('machineImageAlt')} 
                  style={{ maxWidth: '180px', maxHeight: '180px', margin: '6pt auto', display: 'block', border: `1px solid ${currentTheme.borderColor}`, borderRadius: '6px' }}
                />
                <span style={{ fontSize: '8pt', color: currentTheme.textColor }}>{writeUp.machineImage.name}</span>
              </div>
            )}
            {writeUp.author && <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('authorLabel')}:</strong> {writeUp.author}</p>}
            {writeUp.date && (() => { try { return <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('dateLabel')}:</strong> {format(parseISO(writeUp.date!), "PPP", { locale: dateLocale })}</p>; } catch { return null; } })()}
            {writeUp.difficulty && <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('difficultyLabel')}:</strong> {tDifficulties(writeUp.difficulty as any)}</p>}
            {writeUp.os && <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('osLabel')}:</strong> {tOS(writeUp.os as any)}</p>}
            {writeUp.tags && writeUp.tags.length > 0 && <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('tagsLabel')}:</strong> {writeUp.tags.join(', ')}</p>}
          </div>
        </div>

        {/* Contenido de las secciones */}
        <div className="pdf-sections-content">
          {sectionsToExport.map((section, index) => {
            let sectionHtmlContent = '';
            if (typeof section.content === 'string') {
              try {
                sectionHtmlContent = section.content
                  ? DOMPurify.sanitize(marked.parse(section.content).toString())
                  : `<p><em>${tPdfModal('noContent')}</em></p>`;
              } catch (e) {
                console.error("Error parsing markdown for section:", section.title, e);
                sectionHtmlContent = `<p><em>${tPdfModal('errorProcessingMarkdown')}</em></p>`;
              }
            } else {
              console.error(`Invalid content type for section "${section.title || tPdfModal('untitledSection')}":`, section.content);
              sectionHtmlContent = `<p><em>${tPdfModal('errorInvalidContentType')}</em></p>`;
            }
            
            const displayTitle = section.isTemplate && section.title?.startsWith('defaultSections.')
              ? tPdfModal(section.title as any)
              : section.title;

            return (
              <React.Fragment key={section.id}>
                <div className="pdf-section" style={{ marginBottom: '10pt' }}>
                  <h2 className="pdf-section-title" style={{ 
                    fontSize: `${fontSizes.sectionTitle}pt`,
                    color: currentTheme.primaryColor,
                    borderBottom: `1px solid ${currentTheme.borderColor}`,
                    paddingBottom: '2pt',
                    marginTop: '8pt',
                    marginBottom: '4pt',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}. {displayTitle || tPdfModal('untitledSection')}
                  </h2>
                  
                  {section.type === 'pregunta' && section.answer && (
                    <p className="pdf-answer" style={{ marginBottom: '4pt' }}>
                      <strong>{tPdfModal('answerLabel')}:</strong> {section.answer}
                    </p>
                  )}
                  
                  {section.type === 'flag' && section.flagValue && (
                    <p className="pdf-flag-value" style={{ marginBottom: '4pt' }}>
                      <strong>{tPdfModal('flagLabel')}:</strong> 
                      <code style={{ 
                        backgroundColor: currentTheme.codeBg, 
                        color: currentTheme.codeColor,
                        padding: '1pt 4pt',
                        borderRadius: '2px',
                        marginLeft: '3pt',
                        fontFamily: currentTheme.fontFamily
                      }}>
                        {section.flagValue}
                      </code>
                    </p>
                  )}
                  
                  <div className="section-content" dangerouslySetInnerHTML={{ __html: sectionHtmlContent }} />
                  
                  {section.screenshots && section.screenshots.length > 0 && (
                    <div className="pdf-screenshots-container" style={{ marginTop: '6pt' }}>
                      <h4 className="pdf-screenshots-title" style={{ 
                        fontSize: `${Math.max(6, fontSizes.base - 1)}pt`,
                        marginBottom: '4pt',
                        fontWeight: 'bold',
                        color: currentTheme.primaryColor
                      }}>
                        {tPdfModal('screenshotsLabel')}:
                      </h4>
                      {section.screenshots.map((ss: AppScreenshot) => (
                        <img 
                          key={ss.id} 
                          src={ss.dataUrl} 
                          alt={ss.name} 
                          className="pdf-screenshot-image"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            border: 'none',
                            borderRadius: '3px',
                            marginTop: '2pt',
                            marginBottom: '2pt',
                            display: 'block'
                          }}
                          data-ai-hint="terminal screenshot"
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {index < sectionsToExport.length - 1 && (
                  <hr className="pdf-section-separator" style={{
                    border: '0',
                    height: '1px',
                    backgroundColor: currentTheme.borderColor,
                    margin: '8pt 0'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

const SIMPLE_PDF_THEMES_CONFIG = {
  Hacker: PDF_THEMES_CONFIG['Hacker'],
  Dark: PDF_THEMES_CONFIG['Professional-Dark'],
  Light: PDF_THEMES_CONFIG['Professional-Light'],
};

interface PdfExportModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type PdfThemeKey = 'Hacker' | 'Dark' | 'Light';
type ImageRegion = { top: number; bottom: number }; // canvas pixels (scale:2)
type RenderedPiece = {
  canvas: HTMLCanvasElement;
  scaledH: number;          // effective height in PDF points (excluding blank top)
  imageRegions: ImageRegion[]; // in full canvas coordinates
  srcStartY: number;        // first content row — blank top margin is skipped
};

// Layout constants (pt)
const MARGIN_H = 42;
const MARGIN_T = 40;
const MARGIN_B = 40;
const FOOTER_H = 18;
const PAGE_W_PT = 595.28;
const PAGE_H_PT = 841.89;
const CONTENT_W_PT = PAGE_W_PT - MARGIN_H * 2;
const USABLE_H_PT = PAGE_H_PT - MARGIN_T - MARGIN_B - FOOTER_H;
const RENDER_PX = Math.round(CONTENT_W_PT * (96 / 72)); // px width at screen dpi

// Returns the first canvas row that differs from the background color.
// Used to skip blank top-margin space so sections don't get extra padding at page tops.
const findContentStart = (canvas: HTMLCanvasElement, bgHex: string): number => {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.height === 0) return 0;
  const rr = parseInt(bgHex.slice(1, 3), 16);
  const rg = parseInt(bgHex.slice(3, 5), 16);
  const rb = parseInt(bgHex.slice(5, 7), 16);
  const w = canvas.width;
  const maxCheck = Math.min(120, canvas.height); // up to 60pt at scale:2
  const data = ctx.getImageData(0, 0, w, maxCheck).data;
  for (let row = 0; row < maxCheck; row++) {
    const off = row * w * 4;
    for (let x = 0; x < w; x++) {
      const i = off + x * 4;
      if (Math.abs(data[i] - rr) > 10 || Math.abs(data[i + 1] - rg) > 10 || Math.abs(data[i + 2] - rb) > 10) {
        return row;
      }
    }
  }
  return 0;
};

// Returns the row with minimum pixel brightness variance within [yStart, yEnd].
// Low variance = uniform row = safe cut point.
const findBestCutRow = (
  canvas: HTMLCanvasElement,
  yStart: number,
  yEnd: number
): { row: number; variance: number } | null => {
  const y0 = Math.max(0, Math.floor(yStart));
  const y1 = Math.min(canvas.height - 1, Math.floor(yEnd));
  if (y0 >= y1) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const h = y1 - y0 + 1;
  const w = canvas.width;
  const data = ctx.getImageData(0, y0, w, h).data;
  let bestRow = y0;
  let minVar = Infinity;
  for (let row = 0; row < h; row++) {
    const off = row * w * 4;
    let sum = 0;
    for (let x = 0; x < w; x++) {
      const i = off + x * 4;
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    const mean = sum / w;
    let v = 0;
    for (let x = 0; x < w; x++) {
      const i = off + x * 4;
      const b = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      v += (b - mean) ** 2;
    }
    v /= w;
    if (v < minVar) { minVar = v; bestRow = y0 + row; }
    if (v < 1) break; // perfect uniform row — stop early
  }
  return { row: bestRow, variance: minVar };
};

interface LayoutRenderer {
  addContent(canvas: HTMLCanvasElement, xPt: number, yPt: number, wPt: number, hPt: number): void;
  onNewPage(completedPageNum: number, totalPages: number): void;
}

// Smart layout: places RenderedPieces across pages with content-aware cut detection.
// For every page break it first searches for a low-variance (blank) row within
// the search window before the cut point (never past it, to avoid margin overflow).
// When the cut falls inside an image and no clean row is found, the image is scaled
// to fill the remaining space on the current page.
const doLayout = (
  pieces: RenderedPiece[],
  totalPages: number,
  bgColor: string,
  renderer: LayoutRenderer
): void => {
  const CLEAN_WINDOW = 80;     // px to search BEFORE the ideal cut for a clean row
  const CLEAN_MAX_VAR = 30;    // max variance to qualify as a clean row
  const MIN_IMG_SPACE_PT = 80; // min remaining pt before placing an image on current page

  let curY = MARGIN_T;
  let pageNum = 1;

  const availPt = () => MARGIN_T + USABLE_H_PT - curY;

  const goNewPage = () => {
    renderer.onNewPage(pageNum, totalPages);
    pageNum++;
    curY = MARGIN_T;
  };

  const makeSubCanvas = (src: HTMLCanvasElement, srcY: number, srcH: number): HTMLCanvasElement => {
    if (srcH <= 0) { const sc = document.createElement('canvas'); sc.width = 1; sc.height = 1; return sc; }
    const h = Math.max(1, Math.ceil(srcH));
    const sc = document.createElement('canvas');
    sc.width = src.width; sc.height = h;
    const ctx = sc.getContext('2d')!;
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, sc.width, h);
    ctx.drawImage(src, 0, srcY, src.width, srcH, 0, 0, src.width, h);
    return sc;
  };

  const makeScaledCanvas = (src: HTMLCanvasElement, srcY: number, srcH: number, sf: number): HTMLCanvasElement => {
    if (srcH <= 0 || sf <= 0) { const sc = document.createElement('canvas'); sc.width = 1; sc.height = 1; return sc; }
    const tw = Math.max(1, Math.round(src.width * sf));
    const th = Math.max(1, Math.round(srcH * sf));
    const sc = document.createElement('canvas');
    sc.width = tw; sc.height = th;
    const ctx = sc.getContext('2d')!;
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(src, 0, srcY, src.width, srcH, 0, 0, tw, th);
    return sc;
  };

  for (const { canvas, imageRegions, srcStartY } of pieces) {
    const ratio = CONTENT_W_PT / canvas.width;
    let srcY = srcStartY;

    while (srcY < canvas.height) {
      // Guard: curY may be slightly past the limit (e.g. inter-section +6 gap pushed it over)
      const avail = availPt();
      if (avail <= 0) { goNewPage(); continue; }

      const availPx = avail / ratio;
      const remaining = canvas.height - srcY;

      if (remaining <= availPx + 0.5) {
        // Everything remaining fits on this page
        renderer.addContent(makeSubCanvas(canvas, srcY, remaining), MARGIN_H, curY, CONTENT_W_PT, remaining * ratio);
        curY += remaining * ratio + 6;
        srcY = canvas.height;
        break;
      }

      // Hard cap: the cut must never exceed this row, to prevent overflowing the bottom margin
      const maxCutPx = Math.round(srcY + availPx);
      const idealCutPx = srcY + availPx;

      // Check whether the cut lands inside an image region
      const hitImg = imageRegions.find(r => idealCutPx > r.top + 4 && idealCutPx < r.bottom - 4);

      // Search for a clean (low-variance) row in the window BEFORE the ideal cut.
      // For images we also look slightly past the image bottom so it can stay intact.
      const searchStart = Math.max(srcY + 1, Math.round(idealCutPx - CLEAN_WINDOW));
      const searchEnd = hitImg
        ? Math.min(canvas.height - 1, Math.round(idealCutPx + CLEAN_WINDOW)) // peek past image
        : maxCutPx; // for text: strictly before the page limit
      const best = findBestCutRow(canvas, searchStart, searchEnd);
      // Cap the found row so it never exceeds the available space
      const cleanCutPx = (best && best.variance <= CLEAN_MAX_VAR)
        ? Math.min(best.row, maxCutPx)
        : null;

      if (!hitImg) {
        // ── TEXT CUT: use clean row if found, otherwise cut at ideal position
        const cutPx = cleanCutPx ?? maxCutPx;
        const slicePx = cutPx - srcY;
        if (slicePx > 0) {
          renderer.addContent(makeSubCanvas(canvas, srcY, slicePx), MARGIN_H, curY, CONTENT_W_PT, slicePx * ratio);
          curY += slicePx * ratio;
        }
        srcY = cutPx;
        goNewPage();

      } else if (cleanCutPx !== null) {
        // ── IMAGE CUT, clean row found — cut there
        const slicePx = cleanCutPx - srcY;
        if (slicePx > 1) {
          renderer.addContent(makeSubCanvas(canvas, srcY, slicePx), MARGIN_H, curY, CONTENT_W_PT, slicePx * ratio);
          curY += slicePx * ratio;
        }
        srcY = cleanCutPx;
        goNewPage();

      } else {
        // ── IMAGE CUT, no clean row — draw content above image, scale image to fit

        // 1. Content above the image (never regress srcY)
        const imgStart = Math.max(srcY, hitImg.top);
        const abovePx = imgStart - srcY;
        if (abovePx > 2) {
          renderer.addContent(makeSubCanvas(canvas, srcY, abovePx), MARGIN_H, curY, CONTENT_W_PT, abovePx * ratio);
          curY += abovePx * ratio;
        }
        srcY = imgStart;

        // 2. Scale image to fill remaining page space
        const imgPx = hitImg.bottom - imgStart;
        if (imgPx <= 0) { srcY = hitImg.bottom; continue; }

        const imgHpt = imgPx * ratio;
        let spacePt = availPt();
        if (spacePt < MIN_IMG_SPACE_PT) { goNewPage(); spacePt = availPt(); }

        const targetHpt = Math.min(imgHpt, spacePt);
        const sf = targetHpt / imgHpt;
        renderer.addContent(makeScaledCanvas(canvas, imgStart, imgPx, sf), MARGIN_H, curY, CONTENT_W_PT * sf, targetHpt);
        curY += targetHpt;
        srcY = hitImg.bottom;

        if (availPt() < 10) goNewPage();
      }
    }
  }
};

// Dry run — counts total pages without drawing anything
const countPages = (pieces: RenderedPiece[], bgColor: string): number => {
  let n = 1;
  doLayout(pieces, 0, bgColor, {
    addContent: () => {},
    onNewPage: () => { n++; },
  });
  return n;
};

export const PdfExportModal: React.FC<PdfExportModalProps> = ({ open: externalOpen, onOpenChange: externalOnOpenChange }) => {
  const { state } = useWriteUp();
  const { writeUp } = state;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;
  const setIsOpen = externalOnOpenChange ?? setInternalOpen;
  const [theme, setTheme] = useState<PdfThemeKey>('Dark');
  const { toast } = useToast();
  const exportContentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<{ current: number; total: number } | null>(null);
  const cachedPiecesRef = useRef<RenderedPiece[] | null>(null);
  const cachedThemeRef = useRef<PdfThemeKey | null>(null);

  const currentLocale = useCurrentLocale();
  const tPdfModal = useScopedI18n('pdfModal');
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');
  const tt = useScopedI18n('toasts');

  const currentThemeConfig = SIMPLE_PDF_THEMES_CONFIG[theme];

  // Renders each section to a canvas, capturing image bounding regions for smart layout
  const renderPieces = async (
    html2canvas: any,
    onProgress?: (current: number, total: number) => void
  ): Promise<RenderedPiece[]> => {
    const container = exportContentRef.current?.querySelector('.pdf-content-container') as HTMLElement | null;
    if (!container) return [];

    const headerEl = container.querySelector('.pdf-header-section') as HTMLElement | null;
    const sectionEls = Array.from(container.querySelectorAll('.pdf-section')) as HTMLElement[];
    const elements = [...(headerEl ? [headerEl] : []), ...sectionEls];
    const bg = currentThemeConfig.backgroundColor;
    const pieces: RenderedPiece[] = [];

    for (let i = 0; i < elements.length; i++) {
      onProgress?.(i + 1, elements.length);
      const el = elements[i];
      const clone = el.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: 'fixed', top: '-99999px', left: '-99999px',
        width: `${RENDER_PX}px`, maxWidth: `${RENDER_PX}px`,
        margin: '0', boxSizing: 'border-box',
      });
      clone.querySelectorAll('img').forEach((img) => {
        const im = img as HTMLImageElement;
        im.style.maxHeight = '260px';
        im.style.objectFit = 'contain';
        im.style.maxWidth = '100%';
        im.style.width = 'auto';
      });
      document.body.appendChild(clone);

      // Wait two frames so the browser finishes layout before measuring
      await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Capture image bounding boxes relative to the clone (in canvas pixels at scale:2)
      const cloneRect = clone.getBoundingClientRect();
      const imageRegions: ImageRegion[] = [];
      clone.querySelectorAll('img').forEach((img) => {
        const r = (img as HTMLElement).getBoundingClientRect();
        if (r.height > 0) {
          imageRegions.push({
            top: Math.max(0, Math.round((r.top - cloneRect.top) * 2) - 4),
            bottom: Math.round((r.bottom - cloneRect.top) * 2) + 4,
          });
        }
      });

      const canvas = await html2canvas(clone, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: bg, width: RENDER_PX, windowWidth: RENDER_PX,
      });
      document.body.removeChild(clone);
      const srcStartY = findContentStart(canvas, bg);
      const ratio = CONTENT_W_PT / canvas.width;
      pieces.push({ canvas, scaledH: (canvas.height - srcStartY) * ratio, imageRegions, srcStartY });
    }
    return pieces;
  };

  // Lays out pieces into page canvases using the smart doLayout algorithm
  const buildPageCanvases = (pieces: RenderedPiece[], totalPages: number): HTMLCanvasElement[] => {
    const bg = currentThemeConfig.backgroundColor;
    const PX_PER_PT = 1.5;
    const pageWpx = Math.round(PAGE_W_PT * PX_PER_PT);
    const pageHpx = Math.round(PAGE_H_PT * PX_PER_PT);
    const marginBpx = Math.round(MARGIN_B * PX_PER_PT);
    const footerHpx = Math.round(FOOTER_H * PX_PER_PT);

    const createPageCanvas = (): [HTMLCanvasElement, CanvasRenderingContext2D] => {
      const c = document.createElement('canvas');
      c.width = pageWpx; c.height = pageHpx;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, pageWpx, pageHpx);
      return [c, ctx];
    };

    const pages: HTMLCanvasElement[] = [];
    let [curPage, ctx] = createPageCanvas();
    let lastPageNum = 1;

    const drawPageNumber = (num: number, total: number) => {
      ctx.fillStyle = '#888888';
      ctx.font = `${Math.round(8 * PX_PER_PT)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${num} / ${total}`, pageWpx / 2, pageHpx - marginBpx + footerHpx / 2);
    };

    doLayout(pieces, totalPages, bg, {
      addContent: (canvas, xPt, yPt, wPt, hPt) => {
        ctx.drawImage(
          canvas, 0, 0, canvas.width, canvas.height,
          Math.round(xPt * PX_PER_PT), Math.round(yPt * PX_PER_PT),
          Math.round(wPt * PX_PER_PT), Math.round(hPt * PX_PER_PT)
        );
      },
      onNewPage: (completedNum, total) => {
        drawPageNumber(completedNum, total);
        pages.push(curPage);
        [curPage, ctx] = createPageCanvas();
        lastPageNum = completedNum + 1;
      },
    });

    drawPageNumber(lastPageNum, totalPages);
    pages.push(curPage);
    return pages;
  };

  // Generate preview: render pieces → count pages → build page canvases → store as data URLs
  const generatePreview = React.useCallback(async (attempt = 0) => {
    // The hidden container is mounted conditionally on isOpen. In development
    // with StrictMode / Fast Refresh the ref may not be populated yet when this
    // effect first fires, so retry a few frames before giving up.
    if (!exportContentRef.current) {
      if (attempt < 10) {
        requestAnimationFrame(() => generatePreview(attempt + 1));
      }
      return;
    }
    setIsGeneratingPreview(true);
    setPreviewPages([]);
    setPreviewProgress(null);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const pieces = await renderPieces(html2canvas, (current, total) => {
        setPreviewProgress({ current, total });
      });
      cachedPiecesRef.current = pieces;
      cachedThemeRef.current = theme;
      setPreviewProgress(null);
      const total = countPages(pieces, currentThemeConfig.backgroundColor);
      const pageCanvases = buildPageCanvases(pieces, total);
      setPreviewPages(pageCanvases.map(c => c.toDataURL('image/jpeg', 0.85)));
    } catch (e) {
      console.error('PDF preview generation error:', e);
    } finally {
      setIsGeneratingPreview(false);
      setPreviewProgress(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, isOpen]);

  React.useEffect(() => {
    if (isOpen) generatePreview();
  }, [isOpen, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const generatePdfStyles = (): string => {
    return `
      /* Configuración de página - márgenes más compactos */
      @page {
        size: A4 portrait;
        margin: 8mm 8mm 10mm 8mm; /* Más compactos para evitar saltos prematuros */
        background-color: ${currentThemeConfig.backgroundColor};
        
        /* Pie de página con numeración */
        @bottom-center {
          content: "Página " counter(page) " de " counter(pages);
          font-size: 9pt;
          color: ${currentThemeConfig.textColor};
        }
      }

      /* Reset y configuración base */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        background-color: ${currentThemeConfig.backgroundColor} !important;
        color: ${currentThemeConfig.textColor} !important;
        font-family: ${currentThemeConfig.fontFamily};
        font-size: 11pt;
        line-height: 1.5;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }

      /* Contenedor principal */
      .pdf-content-container {
        background-color: ${currentThemeConfig.backgroundColor} !important;
        color: ${currentThemeConfig.textColor} !important;
        width: 100%;
        min-height: 100%;
        font-family: ${currentThemeConfig.fontFamily};
        font-size: 11pt;
        line-height: 1.5;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        /* Reduce el min-height para evitar forzar página extra */
        min-height: auto !important;
      }

      /* Secciones principales - más compactas */
      .pdf-header-section {
        margin-bottom: 12pt;
      }

      .pdf-section {
        margin-bottom: 10pt;
        page-break-inside: avoid;
        orphans: 2;
        widows: 2;
      }

      /* Títulos - espaciado optimizado */
      .pdf-main-title {
        font-size: 20pt;
        font-weight: bold;
        color: ${currentThemeConfig.primaryColor} !important;
        text-align: center;
        margin: 0 0 6pt 0;
        page-break-after: avoid;
      }

      .pdf-section-title {
        font-size: 14pt;
        font-weight: bold;
        color: ${currentThemeConfig.primaryColor} !important;
        border-bottom: 1px solid ${currentThemeConfig.borderColor};
        padding-bottom: 2pt;
        margin: 8pt 0 4pt 0;
        page-break-after: avoid;
      }

      /* Información general - más compacta */
      .pdf-general-info {
        font-size: 8pt;
        text-align: center;
        margin-bottom: 12pt;
      }

      .pdf-general-info p {
        margin: 1pt 0;
      }

      /* Párrafos y texto - espaciado reducido */
      p {
        margin-bottom: 4pt;
        orphans: 2;
        widows: 2;
      }

      /* Listas - espaciado compacto */
      ul, ol {
        margin: 4pt 0 4pt 16pt;
        padding: 0;
      }

      li {
        margin-bottom: 2pt;
      }

      /* Enlaces */
      a {
        color: ${currentThemeConfig.accentColor} !important;
        text-decoration: underline;
      }

      /* Código inline - más compacto */
      code:not(pre code) {
        background-color: ${currentThemeConfig.codeBg} !important;
        color: ${currentThemeConfig.codeColor} !important;
        padding: 1pt 4pt;
        border-radius: 2px;
        font-family: ${currentThemeConfig.fontFamily};
        font-size: 9pt;
        border: 1px solid ${currentThemeConfig.borderColor};
      }

      /* Bloques de código - espaciado optimizado */
      pre {
        background-color: ${currentThemeConfig.preBg} !important;
        border: 1px solid ${currentThemeConfig.borderColor};
        border-radius: 4px;
        padding: 6pt;
        margin: 4pt 0;
        overflow-x: auto;
        page-break-inside: avoid;
        font-family: ${currentThemeConfig.fontFamily};
      }

      pre code {
        background-color: transparent !important;
        color: ${currentThemeConfig.codeColor} !important;
        padding: 0;
        border: none;
        border-radius: 0;
        font-family: ${currentThemeConfig.fontFamily};
        font-size: 9pt;
      }

      /* Imágenes - tamaño optimizado */
      img.pdf-screenshot-image {
        max-width: 100%;
        height: auto;
        border: none;
        border-radius: 0;
        margin: 2pt 0;
        page-break-inside: avoid;
        display: block;
        max-height: 180px;
        object-fit: contain;
        background: transparent;
      }

      /* Citas - más compactas */
      blockquote {
        border-left: 2px solid ${currentThemeConfig.borderColor};
        margin: 4pt 0;
        padding-left: 8pt;
        color: ${currentThemeConfig.accentColor} !important;
        font-style: italic;
      }

      /* Separadores - más finos */
      hr.pdf-section-separator {
        border: 0;
        height: 1px;
        background-color: ${currentThemeConfig.borderColor};
        margin: 8pt 0;
      }

      /* Encabezados - tamaños ajustados */
      h1, h2, h3, h4, h5, h6 {
        color: ${currentThemeConfig.primaryColor} !important;
        page-break-after: avoid;
        orphans: 2;
        widows: 2;
        margin-top: 8pt;
        margin-bottom: 4pt;
      }

      h1 { font-size: 16pt; }
      h2 { font-size: 14pt; }
      h3 { font-size: 12pt; }
      h4 { font-size: 11pt; }
      h5 { font-size: 10pt; }
      h6 { font-size: 9pt; }

      /* Flags y respuestas - más compactas */
      .pdf-answer, .pdf-flag-value {
        margin: 4pt 0;
      }

      .pdf-flag-value code {
        font-weight: bold;
      }

      /* Screenshots - espaciado reducido */
      .pdf-screenshots-container {
        margin-top: 6pt;
      }

      .pdf-screenshots-title {
        font-size: 9pt;
        font-weight: bold;
        margin-bottom: 4pt;
      }

      /* Específico para media print */
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        .pdf-content-container {
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          width: 100% !important;
        }

        /* Asegurar que los colores se impriman */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;
  };

  const handleExport = async () => {
    if (!exportContentRef.current) {
      toast({ title: tPdfModal('errorPreparingPDF'), description: tPdfModal('couldNotFindContentToExport'), variant: "destructive" });
      return;
    }

    setIsExporting(true);
    toast({ title: tt('info'), description: tt('pdfExportStarted') });

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Reuse cached pieces if theme matches, otherwise re-render
      const pieces: RenderedPiece[] = (cachedPiecesRef.current && cachedThemeRef.current === theme)
        ? cachedPiecesRef.current
        : await renderPieces(html2canvas);

      if (pieces.length === 0) throw new Error('No content to export');

      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const PAGE_W = pdf.internal.pageSize.getWidth();
      const PAGE_H = pdf.internal.pageSize.getHeight();
      const bg = currentThemeConfig.backgroundColor;

      // Fill each PDF page with the theme background color.
      // jsPDF creates white pages by default — without this the gaps between
      // section canvases (and blank space at the bottom of pages) show as white
      // even for Dark/Hacker themes.
      const fillPageBg = () => {
        const h = bg.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b2 = parseInt(h.slice(4, 6), 16);
        pdf.setFillColor(r, g, b2);
        pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
      };

      // Count total pages (dry run — uses same smart algorithm as preview)
      const totalPagesCount = countPages(pieces, bg);

      // Render to PDF using the shared doLayout engine
      let exportPageNum = 1;

      const addPageNumber = (num: number, total: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`${num} / ${total}`, PAGE_W / 2, PAGE_H - MARGIN_B + FOOTER_H / 2, { align: 'center' });
      };

      // Fill the first page background before adding any content
      fillPageBg();

      doLayout(pieces, totalPagesCount, bg, {
        addContent: (canvas, xPt, yPt, wPt, hPt) => {
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', xPt, yPt, wPt, hPt);
        },
        onNewPage: (completedNum, total) => {
          addPageNumber(completedNum, total);
          pdf.addPage();
          fillPageBg(); // fill background before adding content to the new page
          exportPageNum = completedNum + 1;
        },
      });

      addPageNumber(exportPageNum, totalPagesCount);

      const safeName = (writeUp.title || 'writeup')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase() || 'writeup';

      pdf.save(`${safeName}.pdf`);
      toast({ title: tPdfModal('pdfExportSuccess'), description: tPdfModal('pdfExportedSuccessfully') });

    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({ title: tPdfModal('exportError'), description: tPdfModal('pdfExportFailed', { errorMessage: '' }), variant: "destructive", duration: 9000 });
    } finally {
      setIsExporting(false);
    }
  };

  const pdfPreviewContent = (
    <I18nProviderClient locale={currentLocale}>
      <PdfDocumentContent
        writeUp={writeUp}
        options={{
          ...DEFAULT_PDF_EXPORT_OPTIONS,
          theme: theme === 'Hacker' ? 'Hacker' : theme === 'Dark' ? 'Professional-Dark' : 'Professional-Light',
          pageSize: 'A4',
          orientation: 'Vertical'
        }}
        pdfStyles={generatePdfStyles()}
        currentLocale={currentLocale}
        tDifficulties={tDifficulties}
        tOS={tOS}
        tPdfModal={tPdfModal}
      />
    </I18nProviderClient>
  );

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
          {/* Barra superior de controles */}
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

          {/* Preview paginado — muestra exactamente cómo quedará el PDF */}
          <div className="flex-1 flex flex-col items-center overflow-auto bg-neutral-900 py-8 gap-6">
            {/* Contenedor oculto que renderiza el contenido para html2canvas */}
            {isOpen && (
              <div ref={exportContentRef} style={{ position: 'absolute', top: '-99999px', left: '-99999px', pointerEvents: 'none' }}>
                {pdfPreviewContent}
              </div>
            )}

            {isGeneratingPreview && (
              <div className="flex flex-col items-center justify-center gap-3 text-neutral-400 mt-16">
                <div className="h-8 w-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono">
                  {previewProgress
                    ? `Procesando sección ${previewProgress.current} de ${previewProgress.total}...`
                    : tPdfModal('processingPDF')}
                </span>
              </div>
            )}

            {!isGeneratingPreview && previewPages.length === 0 && (
              <div className="text-neutral-500 text-sm font-mono mt-16">{tPdfModal('previewHiddenDesc')}</div>
            )}

            {!isGeneratingPreview && previewPages.map((dataUrl, i) => (
              <div key={i} className="shadow-2xl" style={{ width: 'min(680px, 90vw)' }}>
                <img
                  src={dataUrl}
                  alt={`Page ${i + 1}`}
                  style={{ width: '100%', display: 'block', border: `2px solid ${currentThemeConfig.borderColor}` }}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};