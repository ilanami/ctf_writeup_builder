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
  const t = useScopedI18n();
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
      <div className="pdf-content-container" style={previewStyle}>
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
            {writeUp.author && <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('authorLabel')}:</strong> {writeUp.author}</p>}
            {writeUp.date && <p style={{ margin: '1pt 0' }}><strong>{tPdfModal('dateLabel')}:</strong> {format(parseISO(writeUp.date), "PPP", { locale: dateLocale })}</p>}
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
                sectionHtmlContent = section.content ? marked.parse(section.content).toString() : `<p><em>${tPdfModal('noContent')}</em></p>`;
              } catch (e) {
                console.error("Error parsing markdown for section:", section.title, e);
                sectionHtmlContent = `<p><em>${tPdfModal('errorProcessingMarkdown')}</em></p>`;
              }
            } else {
              console.error(`Invalid content type for section "${section.title || tPdfModal('untitledSection')}":`, section.content);
              sectionHtmlContent = `<p><em>${tPdfModal('errorInvalidContentType')}</em></p>`;
            }
            
            const displayTitle = section.isTemplate && section.title?.startsWith('defaultSections.') 
              ? t(section.title as any) 
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
                            border: `1px solid ${currentTheme.borderColor}`,
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
  Light: PDF_THEMES_CONFIG['Professional-Light'],
  Dark: PDF_THEMES_CONFIG['Hacker'],
};

export const PdfExportModal: React.FC = () => {
  const { state } = useWriteUp();
  const { writeUp } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'Light' | 'Dark'>('Dark');
  const { toast } = useToast();
  const exportContentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const currentLocale = useCurrentLocale();
  const tPdfModal = useScopedI18n('pdfModal');
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');

  const currentThemeConfig = SIMPLE_PDF_THEMES_CONFIG[theme];

  const generatePdfStyles = (): string => {
    return `
      /* Configuración de página - márgenes más compactos */
      @page {
        size: A4 portrait;
        margin: 12mm 10mm 15mm 10mm; /* Reducidos de 18mm 15mm 20mm 15mm */
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
        border: 1px solid ${currentThemeConfig.borderColor};
        border-radius: 3px;
        margin: 2pt 0;
        page-break-inside: avoid;
        display: block;
        max-height: 180px; /* Limitamos altura para aprovechar mejor el espacio */
        object-fit: contain;
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
      toast({ 
        title: tPdfModal('errorPreparingPDF'), 
        description: tPdfModal('couldNotFindContentToExport'), 
        variant: "destructive" 
      });
      return;
    }

    setIsExporting(true);
    toast({ 
      title: tPdfModal('processingPDF'), 
      description: tPdfModal('generatingPDF') 
    });

    try {
      // Crear iframe para la impresión
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.left = '-9999px';
      printFrame.style.top = '-9999px';
      printFrame.style.width = '210mm';
      printFrame.style.height = '297mm';
      document.body.appendChild(printFrame);

      // Esperar a que el iframe se cargue
      await new Promise<void>((resolve) => {
        printFrame.onload = () => resolve();
        printFrame.src = 'about:blank';
      });

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!frameDoc) throw new Error('Could not access iframe document');

      // Obtener el contenido HTML del componente
      const contentElement = exportContentRef.current.querySelector('.pdf-content-container');
      if (!contentElement) throw new Error('Content element not found');

      // Crear el HTML completo para imprimir
      const htmlToPrint = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${writeUp.title || 'WriteUp Export'}</title>
          <style>
            ${generatePdfStyles()}
          </style>
        </head>
        <body>
          ${contentElement.outerHTML}
        </body>
        </html>
      `;

      // Escribir el contenido en el iframe
      frameDoc.open();
      frameDoc.write(htmlToPrint);
      frameDoc.close();

      // Esperar un momento para que se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 500));

      // Imprimir
      printFrame.contentWindow?.print();

      // Limpiar después de un delay
      setTimeout(() => {
        document.body.removeChild(printFrame);
        setIsExporting(false);
        toast({ 
          title: tPdfModal('pdfExportSuccess'), 
          description: tPdfModal('pdfExportedSuccessfully') 
        });
      }, 1000);

    } catch (error: any) {
      console.error('PDF Export Error:', error);
      toast({ 
        title: tPdfModal('exportError'), 
        description: tPdfModal('pdfExportFailed'), 
        variant: "destructive", 
        duration: 9000 
      });
      setIsExporting(false);
    }
  };

  const pdfPreviewContent = (
    <I18nProviderClient locale={currentLocale}>
      <PdfDocumentContent 
        writeUp={writeUp} 
        options={{ 
          ...DEFAULT_PDF_EXPORT_OPTIONS, 
          theme: theme === 'Dark' ? 'Hacker' : 'Professional-Light', 
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
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="mr-1 h-4 w-4" /> 
          Exportar PDF
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 m-0 flex flex-col bg-background text-foreground border-foreground/30">
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center">
            <FileSpreadsheet size={20} className="mr-2" />
            Exportar PDF
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"> 
              <X size={18} /> 
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[160px] min-w-[160px] p-2 border-r border-border overflow-y-auto bg-card text-card-foreground flex flex-col">
            <div className="mb-3 w-full">
              <h3 className="text-xs font-semibold text-foreground mb-2">
                Tema
              </h3>
              <div className="flex flex-col gap-1 w-full">
                <Button 
                  variant={theme === 'Dark' ? 'default' : 'outline'} 
                  className="w-full text-xs h-7" 
                  onClick={() => setTheme('Dark')}
                >
                  Oscuro
                </Button>
                <Button 
                  variant={theme === 'Light' ? 'default' : 'outline'} 
                  className="w-full text-xs h-7" 
                  onClick={() => setTheme('Light')}
                >
                  Claro
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleExport} 
              disabled={isExporting} 
              className="w-full font-bold h-8 text-xs"
            > 
              <Download className="mr-1 h-3 w-3" /> 
              {isExporting ? 'Exporting...' : 'Export PDF'} 
            </Button>
          </aside>
          
          <main className="flex-1 overflow-auto">
            <div className="h-full w-full" style={{ 
              transform: 'scale(0.7)', 
              transformOrigin: 'top left',
              width: '142.86%', // Compensa el scale(0.7) = 1/0.7 = 1.4286
              height: '142.86%'
            }}>
              {isOpen && (
                <div ref={exportContentRef} className="w-full">
                  {pdfPreviewContent}
                </div>
              )}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};