
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
import { useScopedI18n, useCurrentLocale, I18nProviderClient } from '@/locales/client'; 

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
  const sectionsToExport = writeUp.sections.filter(section => !section.isTemplate);
  const currentTheme = PDF_THEMES_CONFIG[options.theme] || PDF_THEMES_CONFIG.Hacker;
  const dateLocale = currentLocale === 'es' ? es : enUS;

  const getFontSizeValues = (sizeOption: number) => {
    if (sizeOption <= 8) return { base: 8, title: 18, sectionTitle: 14, info: 7 };
    if (sizeOption <= 10) return { base: 10, title: 22, sectionTitle: 16, info: 9 };
    return { base: 12, title: 26, sectionTitle: 18, info: 11 };
  };
  const fontSizes = getFontSizeValues(options.fontSize);

  return (
    <div className="pdf-page-content-wrapper"> 
      <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
        <div className="pdf-section pdf-header-info">
          <h1 className="pdf-main-title" style={{ fontSize: `${fontSizes.title}pt`, color: currentTheme.primaryColor }}>{writeUp.title || tPdfModal('untitledWriteup')}</h1>
          <div className="pdf-general-info" style={{ fontSize: `${fontSizes.info}pt`}}>
            {writeUp.author && <p><strong>{tPdfModal('authorLabel')}:</strong> {writeUp.author}</p>}
            {writeUp.date && <p><strong>{tPdfModal('dateLabel')}:</strong> {format(parseISO(writeUp.date), "PPP", { locale: dateLocale })}</p>}
            {writeUp.difficulty && <p><strong>{tPdfModal('difficultyLabel')}:</strong> {tDifficulties(writeUp.difficulty as any)}</p>}
            {writeUp.os && <p><strong>{tPdfModal('osLabel')}:</strong> {tOS(writeUp.os as any)}</p>}
            {writeUp.tags && writeUp.tags.length > 0 && <p><strong>{tPdfModal('tagsLabel')}:</strong> {writeUp.tags.join(', ')}</p>}
          </div>
        </div>

        {writeUp.machineImage && (
          <div className="pdf-section machine-image-section">
            <h2 className="pdf-section-title" style={{ fontSize: `${fontSizes.sectionTitle}pt`, color: currentTheme.primaryColor }}>{tPdfModal('machineImageLabel')}</h2>
            <img 
                src={writeUp.machineImage.dataUrl} 
                alt={writeUp.machineImage.name || tPdfModal('machineImageAlt')} 
                className="pdf-machine-image"
                data-ai-hint="server security"
            />
          </div>
        )}
         {sectionsToExport.length > 0 && <hr className="pdf-section-separator" />}


        {sectionsToExport.map((section, index) => {
          let sectionHtmlContent = '';
          if (typeof section.content === 'string') {
            try {
              sectionHtmlContent = section.content ? marked.parse(section.content) : `<p><em>${tPdfModal('noContent')}</em></p>`;
            } catch (e) {
              console.error("Error parsing markdown for section:", section.title, e);
              sectionHtmlContent = `<p><em>${tPdfModal('errorProcessingMarkdown')}</em></p>`;
            }
          } else {
            console.error(`Invalid content type for section "${section.title || tPdfModal('untitledSection')}":`, section.content);
            sectionHtmlContent = `<p><em>${tPdfModal('errorInvalidContentType')}</em></p>`;
          }
          const sectionTypeKey = `pdfModal.sectionType${section.type.charAt(0).toUpperCase() + section.type.slice(1)}` as any;

          return (
            <React.Fragment key={section.id}>
              <div className="pdf-section section-item">
                <h2 className="pdf-section-title" style={{ fontSize: `${fontSizes.sectionTitle}pt`, color: currentTheme.primaryColor }}>
                  {index + 1}. {section.title || tPdfModal('untitledSection')} 
                  <span className="pdf-section-type" style={{ color: currentTheme.accentColor }}>({tPdfModal(sectionTypeKey)})</span>
                </h2>
                {section.type === 'pregunta' && section.answer && (
                  <p className="pdf-answer"><strong>{tPdfModal('answerLabel')}:</strong> {section.answer}</p>
                )}
                {section.type === 'flag' && section.flagValue && (
                  <p className="pdf-flag-value"><strong>{tPdfModal('flagLabel')}:</strong> <code style={{ backgroundColor: currentTheme.codeBg, color: currentTheme.codeColor }}>{section.flagValue}</code></p>
                )}
                <div dangerouslySetInnerHTML={{ __html: sectionHtmlContent }} />

                {section.screenshots && section.screenshots.length > 0 && (
                  <div className="pdf-screenshots-container">
                    <h4 className="pdf-screenshots-title" style={{ fontSize: `${Math.max(6, fontSizes.base -1)}pt` }}>{tPdfModal('screenshotsLabel')}:</h4>
                    {section.screenshots.map((ss: AppScreenshot) => (
                      <img key={ss.id} src={ss.dataUrl} alt={ss.name} className="pdf-screenshot-image" data-ai-hint="terminal screenshot"/>
                    ))}
                  </div>
                )}
              </div>
              {index < sectionsToExport.length - 1 && <hr className="pdf-section-separator" />}
            </React.Fragment>
          );
        })}
    </div>
  );
};


export const PdfExportModal: React.FC = () => {
  const { state } = useWriteUp();
  const { writeUp } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_EXPORT_OPTIONS);
  const { toast } = useToast();
  const exportContentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const currentLocale = useCurrentLocale();
  const tPdfModal = useScopedI18n('pdfModal');
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');


  useEffect(() => {
    if (isOpen) {
      setOptions(prev => ({
        ...prev,
        headerText: `${writeUp.title || tPdfModal('untitledWriteup')} - ${writeUp.author || tPdfModal('anonymousAuthor')}`,
        footerText: tPdfModal('defaultPageFooter', {p: '%p', P: '%P'}),
      }));
    }
  }, [isOpen, writeUp.title, writeUp.author, tPdfModal]);

  const handleOptionChange = (field: keyof PdfExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };
  
  const currentThemeConfig = PDF_THEMES_CONFIG[options.theme] || PDF_THEMES_CONFIG.Hacker;

  const generatePdfStyles = (): string => {
    const pageMarginsCSS = `15mm`; 
    const fontOptionValue = options.fontSize;
    const themeFontSizes = {
        base: fontOptionValue,
        title: fontOptionValue + (fontOptionValue <= 8 ? 10 : fontOptionValue <= 10 ? 12 : 14), 
        sectionTitle: fontOptionValue + (fontOptionValue <= 8 ? 6 : fontOptionValue <= 10 ? 6 : 6), 
        info: Math.max(6, fontOptionValue -1),
    };

    return `
      @page {
        margin: 0; 
      }
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        height: 100%; 
        background-color: ${currentThemeConfig.backgroundColor} !important; 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box;
      }
      .pdf-page-content-wrapper { 
         background-color: ${currentThemeConfig.backgroundColor} !important; 
         min-height: 100%;
         padding: ${pageMarginsCSS};
         font-family: "${currentThemeConfig.fontFamily}", monospace, sans-serif;
         font-size: ${themeFontSizes.base}pt;
         line-height: 1.35; 
         color: ${currentThemeConfig.textColor} !important;
      }
      .pdf-section { margin-bottom: 0.3em; page-break-inside: avoid; } 
      .pdf-header-info { margin-bottom: 0.5em; text-align: center;} 
      .pdf-general-info p { margin-bottom: 0.1em; font-size: ${themeFontSizes.info}pt; } 
      .pdf-main-title {
        font-size: ${themeFontSizes.title}pt;
        font-weight: bold;
        color: ${currentThemeConfig.primaryColor};
        margin-bottom: 0.1em; 
        text-align: center;
      }
      .pdf-section-title {
        font-size: ${themeFontSizes.sectionTitle}pt;
        font-weight: bold;
        color: ${currentThemeConfig.primaryColor};
        margin-top: 0.2em; 
        margin-bottom: 0.1em; 
        border-bottom: 1px solid ${currentThemeConfig.borderColor};
        padding-bottom: 0.05em; 
      }
      .pdf-section-type { font-size: ${Math.max(6, themeFontSizes.base * 0.8)}pt; color: ${currentThemeConfig.accentColor}; font-weight: normal; margin-left: 5px; }
      .pdf-answer, .pdf-flag-value { margin-top: 0.2em; margin-bottom: 0.2em; } 
      .pdf-flag-value code {
        font-weight: bold;
        background-color: ${currentThemeConfig.codeBg};
        color: ${currentThemeConfig.codeColor};
        padding: 0.1em 0.3em;
        border-radius: 3px;
        border: 1px solid ${currentThemeConfig.borderColor};
      }
      h1, h2, h3, h4, h5, h6 { color: ${currentThemeConfig.primaryColor}; page-break-after: avoid; }
      p, div, li { margin-bottom: 0.15em; } 
      ul, ol { margin-left: 15px; padding-left: 0; } 
      a { color: ${currentThemeConfig.accentColor}; text-decoration: underline; }
      code:not(pre > code) { 
        background-color: ${currentThemeConfig.codeBg};
        color: ${currentThemeConfig.codeColor};
        padding: 0.1em 0.3em;
        border-radius: 3px;
        font-family: "${currentThemeConfig.fontFamily}", monospace;
        font-size: ${Math.max(6, themeFontSizes.base * 0.9)}pt;
      }
      pre {
        background-color: ${currentThemeConfig.preBg};
        padding: 0.4em; 
        border-radius: 5px;
        overflow-x: auto;
        border: 1px solid ${currentThemeConfig.borderColor};
        page-break-inside: avoid;
        margin-top: 0.2em; 
        margin-bottom: 0.2em; 
      }
      pre code { 
        background-color: transparent; 
        color: ${currentThemeConfig.codeColor}; 
        padding: 0; 
        font-family: "${currentThemeConfig.fontFamily}", monospace;
        font-size: ${Math.max(6, themeFontSizes.base * 0.85)}pt; 
        border-radius:0; 
        border: none;
      }
      img.pdf-machine-image { display: block; max-width: 70%; margin: 0.5em auto; border: 1px solid ${currentThemeConfig.borderColor}; border-radius: 4px; max-height: 250px; object-fit: contain; page-break-inside: avoid; } 
      .pdf-screenshots-container { margin-top: 0.3em; } 
      .pdf-screenshots-title { font-size: ${Math.max(6, themeFontSizes.base -1)}pt; font-weight: bold; margin-bottom: 0.2em; } 
      img.pdf-screenshot-image { max-width: 100%; height: auto; border: 1px solid ${currentThemeConfig.borderColor}; margin-top: 0.2em; margin-bottom: 0.2em; border-radius: 4px; max-height: 200px; object-fit: contain; page-break-inside: avoid; } 
      blockquote { border-left: 3px solid ${currentThemeConfig.borderColor}; margin-left: 0; padding-left: 0.5em; color: ${currentThemeConfig.accentColor}; font-style: italic; margin-bottom: 0.2em; } 
      hr.pdf-section-separator {
        border: 0;
        height: 1px;
        background-color: ${currentThemeConfig.borderColor};
        margin: 0.8em 0;
      }
    `;
  };

  const handleExport = async () => {
    if (!exportContentRef.current) {
      toast({ title: tPdfModal('errorPreparingPDF'), description: tPdfModal('couldNotFindContentToExport'), variant: "destructive" });
      return;
    }
    setIsExporting(true);
    toast({ title: tPdfModal('processingPDF'), description: tPdfModal('generatingPDF') });
    
    let elementToExport: HTMLElement | null = null;
    let temporaryClone: HTMLElement | null = null;

    if (exportContentRef.current) {
        temporaryClone = exportContentRef.current.cloneNode(true) as HTMLElement;
        temporaryClone.style.position = 'absolute';
        temporaryClone.style.left = '-9999px';
        temporaryClone.style.top = '-9999px';
        document.body.appendChild(temporaryClone);
        elementToExport = temporaryClone;
    } else {
         toast({ title: tPdfModal('exportError'), description: tPdfModal('contentToExportIsEmpty'), variant: "destructive" });
         setIsExporting(false);
         return;
    }
    
    if (!elementToExport || elementToExport.innerHTML.trim() === "") {
        console.error("PDF Export: Element to process is empty or contains only whitespace.");
        toast({ title: tPdfModal('exportError'), description: tPdfModal('contentToExportIsEmpty'), variant: "destructive" });
        setIsExporting(false);
        if (temporaryClone && temporaryClone.parentNode) {
            temporaryClone.parentNode.removeChild(temporaryClone);
        }
        return;
    }
    
    const jsPdfOrientation = options.orientation === 'Vertical' ? 'portrait' : 'landscape';
    console.log("PDF Export: jsPDF orientation:", jsPdfOrientation, "Theme BG:", currentThemeConfig.backgroundColor, "HTML2CANVAS BG:", currentThemeConfig.backgroundColor);


    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule; 

      if (typeof html2pdf !== 'function') {
        console.error("html2pdf is not a function. Imported module:", html2pdfModule);
        toast({ title: tPdfModal('exportError'), description: tPdfModal('couldNotLoadPDFLibrary'), variant: "destructive" });
        setIsExporting(false);
        if (temporaryClone && temporaryClone.parentNode) {
            temporaryClone.parentNode.removeChild(temporaryClone);
        }
        return;
      }
      
      const pdfWorkerOptions = {
        margin:       0, 
        filename:     `${(writeUp.title || 'writeup').replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: options.imageQuality / 100 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: true, 
          letterRendering: true, 
          backgroundColor: currentThemeConfig.backgroundColor 
        },
        jsPDF:        { 
          unit: 'mm', 
          format: options.pageSize.toLowerCase() as 'a4' | 'letter', 
          orientation: jsPdfOrientation, 
          compress: true,
        },
        pagebreak:    { mode: ['css', 'avoid-all'] } 
      };
      console.log("PDF Export: html2pdf worker options:", pdfWorkerOptions);
      
      const worker = html2pdf().from(elementToExport).set(pdfWorkerOptions);
      
      if (options.includeHeader || options.includeFooter || options.pageNumbers) {
        await worker.toPdf().get('pdf').then(function (pdf: any) {
          const totalPages = pdf.internal.getNumberOfPages();
          const headerFooterFontSize = Math.max(7, options.fontSize - 2);
          
          const textMarginFromEdge = 10; 
          const headerY = textMarginFromEdge; 
          const footerY = pdf.internal.pageSize.getHeight() - textMarginFromEdge; 
          
          const themeColors = currentThemeConfig;

          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            const hexToRgb = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return [r, g, b];
            };
            try {
                const [r, g, b] = hexToRgb(themeColors.textColor);
                pdf.setTextColor(r, g, b);
            } catch (e) {
                console.error("Error setting text color for PDF header/footer:", e);
                pdf.setTextColor(0,0,0); 
            }
            
            let pdfFontFamily = 'helvetica'; 
            const selectedFontFamily = PDF_THEMES_CONFIG[options.theme]?.fontFamily || 'Fira Code';
            if (selectedFontFamily.toLowerCase().includes('fira') || selectedFontFamily.toLowerCase().includes('consolas') || selectedFontFamily.toLowerCase().includes('courier')) {
                pdfFontFamily = 'courier';
            } else if (selectedFontFamily.toLowerCase().includes('times')) {
                pdfFontFamily = 'times';
            }
            pdf.setFont(pdfFontFamily, 'normal');

            if (options.includeHeader && options.headerText) {
              pdf.setFontSize(headerFooterFontSize);
              pdf.text(options.headerText, pdf.internal.pageSize.getWidth() / 2, headerY, { align: 'center' });
            }
            if ((options.includeFooter && options.footerText) || options.pageNumbers) {
               let footerTxt = '';
               const defaultFooter = tPdfModal('defaultPageFooter', { p: String(i), P: String(totalPages) });
               if (options.pageNumbers) {
                  footerTxt = (options.footerText || defaultFooter).replace('%p', String(i)).replace('%P', String(totalPages));
               } else if (options.includeFooter && options.footerText) {
                  footerTxt = options.footerText;
               }
               pdf.setFontSize(headerFooterFontSize);
               pdf.text(footerTxt, pdf.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
            }
          }
        }).save(); 
      } else {
        await worker.save(); 
      }
      toast({ title: tPdfModal('pdfExportSuccess'), description: tPdfModal('pdfExportedSuccessfully') });

    } catch (error: any) {
      console.error("PDF Export: Error during export process:", error);
      toast({ 
        title: tPdfModal('exportError'), 
        description: tPdfModal('pdfExportFailed', { errorMessage: error.message || String(error) || tPdfModal('unknownError')}), 
        variant: "destructive",
        duration: 9000,
      });
    } finally {
      setIsExporting(false);
      if (temporaryClone && temporaryClone.parentNode) {
        temporaryClone.parentNode.removeChild(temporaryClone);
      }
    }
  };
  
  const currentPdfStyles = generatePdfStyles();
  const previewContainerBg = PDF_THEMES_CONFIG[options.theme]?.backgroundColor || '#0a0a0a'; 
  
  const OptionGroup: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
        {Icon && <Icon size={16} className="mr-2" />}
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const ThemeButton: React.FC<{themeKey: PdfTheme}> = ({themeKey}) => {
    const themeConfig = PDF_THEMES_CONFIG[themeKey];
    const themeDisplayName = tPdfModal(themeConfig.nameKey as any) || themeKey; 
    return (
       <Button
            variant={options.theme === themeKey ? 'default' : 'outline'}
            onClick={() => handleOptionChange('theme', themeKey)}
            className="h-20 w-full flex flex-col items-center justify-center text-xs p-2 transition-all duration-150"
            style={{ 
              backgroundColor: options.theme === themeKey ? currentThemeConfig.primaryColor : themeConfig.backgroundColor,
              color: options.theme === themeKey ? (['#00ff00', '#ff00ff', '#00ffff', '#5cadff'].includes(currentThemeConfig.primaryColor) ? '#000' : currentThemeConfig.textColor) : themeConfig.textColor,
              borderColor: options.theme === themeKey ? themeConfig.primaryColor : themeConfig.borderColor,
              borderWidth: '2px'
            }}
            title={themeDisplayName}
        >
            <span className="font-bold mb-1">{themeDisplayName}</span>
            <div className="w-8 h-3 rounded-full mt-1" style={{ background: themeConfig.primaryColor, opacity: 0.7 }} />
        </Button>
    );
  };

  const pdfPreviewContent = (
    <I18nProviderClient locale={currentLocale}>
       <PdfDocumentContent 
            writeUp={writeUp} 
            options={options} 
            pdfStyles={currentPdfStyles} 
            currentLocale={currentLocale}
            tDifficulties={tDifficulties}
            tOS={tOS}
            tPdfModal={tPdfModal}
        />
    </I18nProviderClient>
  );


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setShowPreview(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><FileSpreadsheet className="mr-1 h-4 w-4" /> {tPdfModal('exportButton')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-none w-[95vw] h-[90vh] p-0 m-0 flex flex-col bg-background text-foreground border-foreground/30">
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center">
            <FileSpreadsheet size={20} className="mr-2" />
            {tPdfModal('title')}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"> <X size={18} /> </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[380px] min-w-[350px] p-4 border-r border-border overflow-y-auto space-y-1 bg-card text-card-foreground">
            <OptionGroup title={tPdfModal('theme')} icon={Palette}>
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PDF_THEMES_CONFIG) as PdfTheme[]).map(themeKey => (
                        <ThemeButton key={themeKey} themeKey={themeKey} />
                    ))}
                </div>
            </OptionGroup>

            <OptionGroup title={tPdfModal('settings')} icon={Settings}>
                <div className="flex items-center justify-between">
                    <Label htmlFor="pdf-includeHeader" className="cursor-pointer text-sm">{tPdfModal('includeHeader')}</Label>
                    <Switch id="pdf-includeHeader" checked={options.includeHeader} onCheckedChange={v => handleOptionChange('includeHeader', v)} />
                </div>
                {options.includeHeader && <div className="pl-2"><Label htmlFor="pdf-headerText" className="text-xs">{tPdfModal('headerText')}</Label><Input id="pdf-headerText" value={options.headerText} onChange={e => handleOptionChange('headerText', e.target.value)} className="h-8 text-xs"/></div>}
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="pdf-includeFooter" className="cursor-pointer text-sm">{tPdfModal('includeFooter')}</Label>
                    <Switch id="pdf-includeFooter" checked={options.includeFooter} onCheckedChange={v => handleOptionChange('includeFooter', v)} />
                </div>
                 {options.includeFooter && <div className="pl-2"><Label htmlFor="pdf-footerText" className="text-xs">{tPdfModal('footerText')}</Label><Input id="pdf-footerText" value={options.footerText} onChange={e => handleOptionChange('footerText', e.target.value)} placeholder={tPdfModal('defaultPageFooter', {p: '%p', P: '%P'})} className="h-8 text-xs"/></div>}

                <div className="flex items-center justify-between">
                    <Label htmlFor="pdf-pageNumbers" className="cursor-pointer text-sm">{tPdfModal('pageNumbering')}</Label>
                    <Switch id="pdf-pageNumbers" checked={options.pageNumbers} onCheckedChange={v => handleOptionChange('pageNumbers', v)} />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="pdf-autoSplitSections" className="cursor-pointer text-sm">{tPdfModal('autoSplitSections')}</Label>
                    <Switch id="pdf-autoSplitSections" checked={options.autoSplitSections} onCheckedChange={v => handleOptionChange('autoSplitSections', v)} disabled title={tPdfModal('futureFeatureTooltip')}/>
                </div>
            </OptionGroup>

            <OptionGroup title={tPdfModal('pageLayout')} icon={LayoutList}>
                <div>
                    <Label htmlFor="pdf-pageSize" className="text-sm">{tPdfModal('pageSize')}</Label>
                    <Select value={options.pageSize} onValueChange={(v: PageSize) => handleOptionChange('pageSize', v)}>
                        <SelectTrigger id="pdf-pageSize" className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{PDF_PAGE_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="pdf-orientation" className="text-sm">{tPdfModal('orientation')}</Label>
                    <Select value={options.orientation} onValueChange={(v: PageOrientation) => handleOptionChange('orientation', v)}>
                        <SelectTrigger id="pdf-orientation" className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {PDF_PAGE_ORIENTATIONS_KEYS.map(oKey => (
                                <SelectItem key={oKey} value={oKey}>
                                    {tPdfModal(`orientation${oKey}` as any)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </OptionGroup>
            
            <OptionGroup title={tPdfModal('typographyAndMedia')} icon={Baseline}>
                <div>
                  <Label htmlFor="pdf-fontSize" className="text-sm">{tPdfModal('fontSize')}</Label>
                  <Select value={String(options.fontSize)} onValueChange={(v: string) => handleOptionChange('fontSize', parseInt(v))}>
                    <SelectTrigger id="pdf-fontSize" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PDF_FONT_SIZE_OPTIONS_KEYS.map(f => 
                            <SelectItem key={f.value} value={String(f.value)}>
                                {tPdfModal(f.key as any)} ({f.value}pt)
                            </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pdf-imageQuality" className="text-sm">{tPdfModal('imageQuality')}</Label>
                   <Select value={String(options.imageQuality)} onValueChange={(v: string) => handleOptionChange('imageQuality', parseInt(v))}>
                    <SelectTrigger id="pdf-imageQuality" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PDF_IMAGE_QUALITY_OPTIONS_KEYS.map(q => 
                            <SelectItem key={q.value} value={String(q.value)}>
                                {tPdfModal(q.key as any)} ({q.value}%)
                            </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
            </OptionGroup>

            <div className="bg-muted/50 p-3 rounded-md mt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center"><Pilcrow size={14} className="mr-1.5"/>{tPdfModal('pdfTipsTitle')}</h4>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                    <li>{tPdfModal('pdfTip1')}</li>
                    <li>{tPdfModal('pdfTip2')}</li>
                    <li>{tPdfModal('pdfTip3')}</li>
                </ul>
            </div>

            {showPreview && (
                <OptionGroup title={tPdfModal('previewZoom')} icon={ZoomIn}>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.1))} className="h-8 w-8"><ZoomOut size={16}/></Button>
                        <Input type="range" min="0.25" max="2" step="0.05" value={zoomLevel} onChange={e => setZoomLevel(parseFloat(e.target.value))} className="h-8"/>
                        <Button variant="outline" size="icon" onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="h-8 w-8"><ZoomIn size={16}/></Button>
                        <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                    </div>
                </OptionGroup>
            )}
            
            <div className="mt-6 space-y-2">
                <Button onClick={handleExport} disabled={isExporting} className="w-full font-bold h-10"> 
                    <Download className="mr-2 h-4 w-4" /> {isExporting ? tPdfModal('exportingButton') : tPdfModal('exportButton')}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="w-full h-9">
                    {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showPreview ? tPdfModal('hidePreview') : tPdfModal('showPreview')}
                </Button>
            </div>
          </aside>

          {showPreview && (
            <main 
                className="flex-1 overflow-auto p-6" 
                style={{ backgroundColor: previewContainerBg }}
            >
              <div 
                id="pdf-export-container-for-h2p" 
                className="mx-auto shadow-2xl" 
                style={{ 
                  transform: `scale(${zoomLevel})`, 
                  transformOrigin: 'top center',
                  width: options.pageSize === 'Letter' ? '8.5in' : '210mm', 
                  minHeight: options.pageSize === 'Letter' ? '11in': '297mm', 
                }}
              >
                {isOpen && ( 
                  <div ref={exportContentRef}>
                     {pdfPreviewContent}
                  </div>
                )}
              </div>
            </main>
          )}
          {!showPreview && (
             <main className="flex-1 flex items-center justify-center p-6" style={{ backgroundColor: previewContainerBg }}>
                <div className="text-center text-muted-foreground">
                    <Eye size={48} className="mx-auto mb-3 opacity-50"/>
                    <p className="text-lg">{tPdfModal('previewHiddenTitle')}</p>
                    <p className="text-sm">{tPdfModal('previewHiddenDesc')}</p>
                </div>
             </main>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

