
// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { GeneralInfoPanel } from './GeneralInfoPanel';
import { ActiveSectionEditor } from './ActiveSectionEditor';
import { WriteUpPreview } from './WriteUpPreview';
import { useWriteUp } from '@/hooks/useWriteUp';
import { Button } from './ui/button';
import { Eye, Edit3, FileText, Download, Upload, Save, AlertTriangle, PlusCircle, TerminalSquare, ListChecks, PlaySquare, HelpCircle, Flag as FlagIcon, FileType, Languages, Coffee, Gift, KeyRound, Wand2, FileArchive } from 'lucide-react';
import { PdfExportModal } from './PdfExportModal';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SectionType, WriteUpSection, WriteUp, Screenshot, AiProcessedSection } from '@/lib/types';
import { SECTION_TYPES_KEYS, getSectionItemIcon, LOCAL_STORAGE_KEY, createDefaultSection } from '@/lib/constants';
import { SectionItemCard } from './SectionItemCard';
import { ScrollArea } from './ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { useI18n, useScopedI18n, useCurrentLocale, useChangeLocale } from '@/locales/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { processPdf as processPdfWithAIModels, PdfInput, AiPdfParseOutput } from '@/ai/flows/pdf-processor-flow';


const USER_GOOGLE_AI_API_KEY_NAME = 'USER_GOOGLE_AI_API_KEY';


if (typeof window !== 'undefined') {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      const version = pdfjsLib.version;
      if (version) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.mjs`;
      } else {
        console.warn("pdfjsLib.version not found, using hardcoded worker version for pdf.js. PDF import may be slow or fail.");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.mjs`; // Fallback
      }
    } catch (e) {
      console.warn("Could not set pdf.js workerSrc automatically, using hardcoded version. PDF import might be slow or fail.", e);
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.mjs`; // Fallback
    }
  }
}

const AppHeader: React.FC = () => {
  const { state, dispatch } = useWriteUp();
  const { toast } = useToast();
  const { currentView, writeUp } = state;
  const t = useI18n();
  const th = useScopedI18n('header');
  const tt = useScopedI18n('toasts');
  const tDonations = useScopedI18n('donations');
  const tai = useScopedI18n('aiConfig');
  const currentLocale = useCurrentLocale();
  const changeLocale = useChangeLocale();
  const dateLocale = currentLocale === 'es' ? es : enUS;

  const [apiKeyInputValue, setApiKeyInputValue] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem(USER_GOOGLE_AI_API_KEY_NAME);
    setCurrentApiKey(storedKey);
    if (isApiKeyModalOpen) {
      setApiKeyInputValue(storedKey || '');
    }
  }, [isApiKeyModalOpen]);

  const handleSaveApiKey = () => {
    if (apiKeyInputValue.trim()) {
      localStorage.setItem(USER_GOOGLE_AI_API_KEY_NAME, apiKeyInputValue.trim());
      setCurrentApiKey(apiKeyInputValue.trim());
      toast({ title: tai('apiKeySavedTitle'), description: tai('apiKeySavedDescription') });
      setIsApiKeyModalOpen(false);
    } else {
      toast({ title: tai('apiKeyEmptyTitle'), description: tai('apiKeyEmptyDescription'), variant: 'destructive' });
    }
  };

  const handleDeleteApiKey = () => {
    localStorage.removeItem(USER_GOOGLE_AI_API_KEY_NAME);
    setCurrentApiKey(null);
    setApiKeyInputValue('');
    toast({ title: tai('apiKeyDeletedTitle'), description: tai('apiKeyDeletedDescription') });
  };


  const toggleView = () => {
    dispatch({ type: 'SET_VIEW', payload: currentView === 'editor' ? 'preview' : 'editor' });
  };

  const handleExportMd = () => {
    const sectionsToExport = writeUp.sections.filter(section => !section.isTemplate);
    const writeUpTitleKey = writeUp.title || 'generalInfo.defaultWriteupTitle';
    const writeUpTitleText = writeUp.title?.startsWith('generalInfo.') ? t(writeUpTitleKey as any) : (writeUp.title || t('generalInfo.defaultWriteupTitle'));
    const writeUpAuthorKey = writeUp.author || 'generalInfo.defaultAuthor';
    const writeUpAuthorText = writeUp.author?.startsWith('generalInfo.') ? t(writeUpAuthorKey as any) : (writeUp.author || t('generalInfo.defaultAuthor'));
    
    if (sectionsToExport.length === 0 && !writeUp.machineImage && !writeUpTitleText) {
        toast({ title: tt('info'), description: tt('noContentToExportMD') });
        return;
    }

    let mdContent = `# ${writeUpTitleText}\n\n`;
    mdContent += `**${t('generalInfo.author')}:** ${writeUpAuthorText}\n`;
    mdContent += `**${t('generalInfo.date')}:** ${writeUp.date ? format(parseISO(writeUp.date), "PPP", { locale: dateLocale }) : t('generalInfo.selectDate')}\n`;
    
    const difficultyKey = writeUp.difficulty as keyof ReturnType<typeof useScopedI18n<'difficulties'>>;
    const osKey = writeUp.os as keyof ReturnType<typeof useScopedI18n<'operatingSystems'>>;
    const tDifficulties = useScopedI18n('difficulties');
    const tOS = useScopedI18n('operatingSystems');

    mdContent += `**${t('generalInfo.difficulty')}:** ${tDifficulties(difficultyKey) || writeUp.difficulty}\n`;
    mdContent += `**${t('generalInfo.os')}:** ${tOS(osKey) || writeUp.os}\n`;
    
    if (writeUp.tags && writeUp.tags.length > 0) {
        mdContent += `**${t('generalInfo.tags')}:** ${writeUp.tags.join(', ')}\n`;
    }
    mdContent += '\n---\n\n';

    if (writeUp.machineImage) {
        mdContent += `## ${t('generalInfo.machineImage')}\n\n`;
        mdContent += `(Reference to image: ${writeUp.machineImage.name})\n\n`;
    }

    sectionsToExport.forEach((section: WriteUpSection, index: number) => {
        const sectionTitle = section.isTemplate && section.title?.startsWith('defaultSections.') ? t(section.title as any) : section.title;
        const sectionContent = section.isTemplate && section.content?.startsWith('defaultSectionsContent.') ? t(section.content as any) : section.content;
        mdContent += `## ${index + 1}. ${sectionTitle}\n\n`;
        if (section.type === 'pregunta' && section.answer) {
            mdContent += `**${t('activeSectionEditor.answerToQuestion')}:** ${section.answer}\n\n`;
        }
        if (section.type === 'flag' && section.flagValue) {
            mdContent += `**${t('activeSectionEditor.flagValue')}:** \`${section.flagValue}\`\n\n`;
        }
        mdContent += `${sectionContent}\n\n`;

        if (section.screenshots && section.screenshots.length > 0) {
            mdContent += `### ${t('activeSectionEditor.screenshots')}:\n`;
            section.screenshots.forEach(ss => {
                mdContent += `- ${ss.name}\n`;
            });
            mdContent += '\n';
        }
        mdContent += '---\n\n';
    });

    try {
        const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = (writeUpTitleText || 'writeup').replace(/\s+/g, '_').toLowerCase();
        link.download = `${fileName}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: tt('success'), description: tt('markdownExported') });
    } catch (error) {
        console.error("Error exporting Markdown:", error);
        toast({ title: tt('error'), description: tt('couldNotExportMD'), variant: "destructive" });
    }
  };

  const handleGistExport = () => toast({ title: tt('info'), description: tt('gistNotImplemented') });

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedContent = e.target?.result as string;
          if (!importedContent) {
            throw new Error(tt('jsonImportErrorDetails', {errorMessage: "El archivo JSON está vacío o no se pudo leer."}));
          }
          const importedData = JSON.parse(importedContent);
          
          if (typeof importedData !== 'object' || importedData === null) {
             throw new Error(tt('jsonImportErrorDetails', {errorMessage: "Formato JSON inválido. El contenido debe ser un objeto."}));
          }
          
          if (importedData.hasOwnProperty('sections')) {
            if (!Array.isArray(importedData.sections)) {
               throw new Error(tt('jsonImportErrorDetails', {errorMessage: "Formato JSON inválido. La propiedad 'sections' debe ser un array."}));
            }
            const sectionsToImport = importedData.sections as WriteUpSection[];
            if (sectionsToImport.length > 0) {
              dispatch({ type: 'ADD_IMPORTED_SECTIONS', payload: sectionsToImport });
              toast({ title: tt('success'), description: tt('jsonSectionsImported') });
            } else {
              toast({ title: tt('info'), description: tt('jsonNoSectionsToImport') });
            }
          } else {
             toast({ title: tt('info'), description: tt('jsonNoSectionsToImportNothingToAdd') });
          }

        } catch (error) {
          console.error("Error importing JSON:", error);
          const errorMessage = error instanceof Error ? error.message : "Formato de archivo JSON incorrecto o corrupto.";
          toast({ title: tt('jsonImportError'), description: tt('jsonImportErrorDetails', {errorMessage}), variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: tt('error'), description: "No se pudo leer el archivo seleccionado.", variant: "destructive" });
      };
      reader.readAsText(file);
    }
    if (event.target) event.target.value = ''; 
  };

  const handleImportMdFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const markdownContent = e.target?.result as string;
          if (typeof markdownContent !== 'string') {
            throw new Error("El contenido del archivo Markdown no es válido.");
          }
          
          let sectionTitle = file.name.replace(/\.md$/i, '') || tt('mdImportDefaultTitle');
          const h1Match = markdownContent.match(/^#\s+(.*)/m);
          if (h1Match && h1Match[1]) {
             sectionTitle = h1Match[1].trim();
          }

          const newSection: WriteUpSection = {
            id: uuidv4(), 
            type: 'notas', 
            title: sectionTitle,
            content: markdownContent,
            screenshots: [],
            isTemplate: false, 
          };
          
          dispatch({ type: 'ADD_PREBUILT_SECTION', payload: newSection });
          toast({ title: tt('success'), description: tt('mdSectionImported', {sectionTitle}) });

        } catch (error) {
          console.error("Error importing Markdown:", error);
          const errorMessage = error instanceof Error ? error.message : "No se pudo procesar el archivo Markdown.";
          toast({ title: tt('mdImportError'), description: errorMessage, variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: tt('error'), description: "No se pudo leer el archivo Markdown seleccionado.", variant: "destructive" });
      };
      reader.readAsText(file);
    }
    if (event.target) event.target.value = ''; 
  };
  
 
  const processPdfWithAI = async (pdfDataUri: string, fileName: string): Promise<AiProcessedSection[]> => {
    const userApiKey = localStorage.getItem(USER_GOOGLE_AI_API_KEY_NAME);
    if (!userApiKey) {
      console.warn(tai('apiKeyMissingDescriptionForPdf'));
      return []; 
    }

    toast({ title: tt('pdfProcessingWithAI'), description: tt('pdfProcessingWithAIDescription') });
    try {
      const genAI = new GoogleGenerativeAI(userApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

      const promptText = `You are an expert in analyzing technical documents, especially cybersecurity CTF (Capture The Flag) write-ups.
Your task is to process the provided PDF content and extract its structure into logical sections.

For the PDF provided (internally represented by the data URI):
1. Identify the main sections or logical parts of the document. These could be chapters, major headings, or distinct topics.
2. For each section you identify:
    a. Extract or formulate a concise and descriptive title for that section.
    b. Extract the relevant textual content for that section and format it as well-structured Markdown. Ensure code blocks, lists, and other formatting are preserved or appropriately converted to Markdown.
    c. **Crucially**: If you encounter any images within a section of the PDF, you MUST insert a placeholder string in the Markdown content *exactly where the image appeared*. The placeholder format is: "[IMAGEN: Provide a 1-2 sentence, human-readable description of the image's content and its relevance or context within the section. For example: '[IMAGEN: Nmap scan results showing open ports 22, 80, and 443 on the target IP.]' or '[IMAGEN: Screenshot of the web application's dashboard after successful login.]']". Do NOT attempt to describe the image in prose outside this placeholder. Do NOT try to reproduce the image data itself.
3. Return the extracted information as a JSON object matching the output schema: { "parsed_sections": [ { "title": "string", "content": "string" }, ... ] }.

If the PDF is unparsable, contains no discernible text, or is not a document format you can understand, return an empty "parsed_sections" array.
Do not invent content. Only extract and structure what is present in the PDF.
Focus on clear, well-formatted Markdown output for the content of each section.`;
      
      const dataUriParts = pdfDataUri.split(',');
      const base64Data = dataUriParts.length > 1 ? dataUriParts[1] : '';
      if (!base64Data) {
        console.error("Could not extract base64 data from PDF Data URI for AI processing.");
        toast({ title: tt('pdfAIError'), description: tt('pdfAIErrorInvalidDataUri'), variant: "destructive" });
        return [];
      }

      const parts = [
        { text: promptText },
        {
          inlineData: {
            mimeType: 'application/pdf', 
            data: base64Data
          }
        }
      ];
      
      const generationConfig = {
        responseMimeType: "application/json", 
      };
       const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      const result = await model.generateContent({ contents: [{ role: "user", parts }], generationConfig, safetySettings });
      const response = result.response;
      const responseText = response.text(); 
      
      let parsedJsonResponse;
      try {
        parsedJsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON response from AI for PDF processing:", parseError, "Raw response:", responseText);
        toast({ title: tt('pdfAIError'), description: tt('pdfAIErrorParsing', {rawResponse: responseText}), variant: "destructive" });
        return [];
      }

      if (parsedJsonResponse && Array.isArray(parsedJsonResponse.parsed_sections)) {
        return parsedJsonResponse.parsed_sections as AiProcessedSection[];
      } else {
        console.warn("AI response for PDF did not contain 'parsed_sections' array or was not as expected. Parsed JSON:", parsedJsonResponse, "Raw Text:", responseText);
        return [];
      }

    } catch (error) {
      console.error("Error processing PDF with AI (user key):", error);
      const errorMessage = error instanceof Error ? error.message : tt('unknownError');
      toast({ title: tt('pdfAIError'), description: tt('pdfAIErrorDetails', { errorMessage }), variant: "destructive" });
      return [];
    }
  };


  const extractTextAndImagesWithPdfJS = async (file: File): Promise<{ textContent: string; images: Screenshot[] }> => {
    console.log("extractTextAndImagesWithPdfJS: Starting extraction for file:", file.name);
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    const extractedImages: Screenshot[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      console.log(`extractTextAndImagesWithPdfJS: Processing page ${i}`);
      const page = await pdfDoc.getPage(i);
      const textContentItems = await page.getTextContent();
      
      // Join text items with single spaces to form page text
      const pageText = textContentItems.items.map((item: any) => item.str).join(' ');
      fullText += pageText.trim();
      if (i < pdfDoc.numPages) { // Add double newline between pages if not the last page
        fullText += "\n\n";
      }

      const operatorList = await page.getOperatorList();
      for (let j = 0; j < operatorList.fnArray.length; j++) {
        if (operatorList.fnArray[j] === OPS.paintImageXObject) {
          const imageName = operatorList.argsArray[j][0];
          console.log(`extractTextAndImagesWithPdfJS: Found image operation for '${imageName}' on page ${i}`);
          try {
            // @ts-ignore
            const imgData = await page.objs.get(imageName);
            console.log(`extractTextAndImagesWithPdfJS: imgData for '${imageName}':`, { width: imgData?.width, height: imgData?.height, kind: imgData?.kind, dataType: typeof imgData?.data });

            if (imgData && imgData.data && imgData.width && imgData.height) {
              const canvas = document.createElement('canvas');
              canvas.width = imgData.width;
              canvas.height = imgData.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                let pixelDataArray;
                 if (imgData.data instanceof Uint8Array || imgData.data instanceof Uint8ClampedArray || Array.isArray(imgData.data)) {
                    pixelDataArray = new Uint8ClampedArray(imgData.data);
                } else if (imgData.data instanceof ArrayBuffer) {
                    pixelDataArray = new Uint8ClampedArray(imgData.data);
                } else {
                    console.warn(`extractTextAndImagesWithPdfJS: Unexpected image data type for ${imageName} on page ${i}. Type: ${typeof imgData.data}`);
                    continue;
                }
                
                const imageData = ctx.createImageData(imgData.width, imgData.height);
                
                if (pixelDataArray.length === imgData.width * imgData.height * 4) { // RGBA
                    console.log(`extractTextAndImagesWithPdfJS: Processing RGBA image '${imageName}'`);
                    imageData.data.set(pixelDataArray);
                } else if (pixelDataArray.length === imgData.width * imgData.height * 3) { // RGB
                    console.log(`extractTextAndImagesWithPdfJS: Processing RGB image '${imageName}', converting to RGBA.`);
                    const rgbaData = new Uint8ClampedArray(imgData.width * imgData.height * 4);
                    for (let k = 0, l = 0; k < pixelDataArray.length; k += 3, l += 4) {
                        rgbaData[l] = pixelDataArray[k];
                        rgbaData[l + 1] = pixelDataArray[k + 1];
                        rgbaData[l + 2] = pixelDataArray[k + 2];
                        rgbaData[l + 3] = 255; 
                    }
                    imageData.data.set(rgbaData);
                } else if (pixelDataArray.length === imgData.width * imgData.height && (imgData.kind === 1 || imgData.bpc === 8)) { // Grayscale, assuming 8-bit per component
                    console.log(`extractTextAndImagesWithPdfJS: Processing Grayscale image '${imageName}', converting to RGBA.`);
                    const rgbaData = new Uint8ClampedArray(imgData.width * imgData.height * 4);
                    for (let k = 0, l = 0; k < pixelDataArray.length; k++, l += 4) {
                        rgbaData[l] = pixelDataArray[k];
                        rgbaData[l + 1] = pixelDataArray[k];
                        rgbaData[l + 2] = pixelDataArray[k];
                        rgbaData[l + 3] = 255; 
                    }
                    imageData.data.set(rgbaData);
                } else {
                    console.warn(`extractTextAndImagesWithPdfJS: Unsupported image data format for ${imageName} on page ${i}. Kind: ${imgData.kind}, BPC: ${imgData.bpc}, Length: ${pixelDataArray.length}, Expected RGB: ${imgData.width * imgData.height * 3}, Expected RGBA: ${imgData.width * imgData.height * 4}`);
                    continue;
                }
                
                try {
                  ctx.putImageData(imageData, 0, 0);
                  const dataUrl = canvas.toDataURL('image/png');
                  extractedImages.push({ id: uuidv4(), name: `pdf_image_p${i}_${imageName}.png`, dataUrl: dataUrl });
                  console.log(`extractTextAndImagesWithPdfJS: Successfully extracted image '${imageName}' from page ${i} as PNG data URI.`);
                } catch (canvasError) {
                  console.error(`extractTextAndImagesWithPdfJS: Error putting ImageData or converting canvas to DataURL for '${imageName}':`, canvasError);
                }
              }
            } else {
              console.warn(`extractTextAndImagesWithPdfJS: imgData for '${imageName}' missing critical properties (data, width, or height).`);
            }
          } catch (imgError) {
            console.warn(`extractTextAndImagesWithPdfJS: Could not extract or process image ${imageName} from page ${i}:`, imgError);
          }
        }
      }
    }
    console.log(`extractTextAndImagesWithPdfJS: Finished. Extracted ${fullText.trim().length > 0 ? 'text' : 'no text'} and ${extractedImages.length} images.`);
    return { textContent: fullText.trim(), images: extractedImages };
  };


  const handleImportPdfFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let sectionsToAdd: WriteUpSection[] = [];
    let aiProcessedSuccessfully = false;
    let pdfjsTextExtracted = false;
    let pdfjsImagesExtractedCount = 0;

    const userApiKey = localStorage.getItem(USER_GOOGLE_AI_API_KEY_NAME);
    if (userApiKey) {
        try {
            const reader = new FileReader();
            const pdfDataUri = await new Promise<string>((resolve, reject) => {
                reader.onload = (e_reader) => resolve(e_reader.target?.result as string);
                reader.onerror = (err) => reject(new Error(tt('pdfCannotReadFileForAI')));
                reader.readAsDataURL(file);
            });

            if (!pdfDataUri) throw new Error(tt('pdfCannotReadFileForAI'));
            
            // Usar processPdfWithAIModels que es el flujo Genkit adaptado
            const aiFlowInput: PdfInput = { pdfDataUri };
            const aiResult: AiPdfParseOutput = await processPdfWithAIModels(aiFlowInput); // Llamada al flujo Genkit
            
            if (aiResult && Array.isArray(aiResult.parsed_sections) && aiResult.parsed_sections.length > 0) {
                aiResult.parsed_sections.forEach(sec => {
                    sectionsToAdd.push({
                        id: uuidv4(),
                        type: 'notas',
                        title: sec.title || `${tt('pdfAISectionTitlePrefix')} - ${file.name.replace(/\.pdf$/i, '')}`,
                        content: sec.content || tt('pdfAISectionContentPlaceholder'),
                        screenshots: [],
                        isTemplate: false,
                    });
                });
                aiProcessedSuccessfully = true;
            } else if (aiResult && Array.isArray(aiResult.parsed_sections) && aiResult.parsed_sections.length === 0) {
                toast({ title: tt('info'), description: tt('pdfAINoSectionsFound') });
            }
        } catch (error) { 
            console.error("Error during AI processing stage for PDF (Genkit flow):", error);
            // El toast de error debería manejarse dentro de processPdfWithAIModels o su wrapper,
            // o aquí si la promesa es rechazada.
             const errorMessage = error instanceof Error ? error.message : tt('unknownError');
             toast({ title: tt('pdfAIError'), description: tt('pdfAIErrorDetails', { errorMessage }), variant: "destructive" });
        }
    } else {
      // Si no hay API key, informa al usuario que la IA no se usará.
      toast({ title: tt('info'), description: tai('apiKeyMissingDescriptionForPdf') });
    }
    
    toast({ title: tt('pdfProcessingWithPdfjs'), description: tt('pdfProcessingWithPdfjsDescription') });
    try {
        const { textContent, images } = await extractTextAndImagesWithPdfJS(file);

        if (textContent.trim().length > 0) {
            pdfjsTextExtracted = true;
            if (!aiProcessedSuccessfully || sectionsToAdd.every(s => s.content.trim().length === 0)) {
                 sectionsToAdd.push({
                    id: uuidv4(),
                    type: 'notas',
                    title: `${tt('pdfTextSectionTitlePrefix')} - ${file.name.replace(/\.pdf$/i, '')}`,
                    content: textContent,
                    screenshots: [],
                    isTemplate: false,
                });
            } else if (aiProcessedSuccessfully && !sectionsToAdd.some(s => s.content.includes(textContent.substring(0,100)))) {
                console.log("AI provided sections, adding raw text from pdfjs-dist as an additional/fallback section.");
                 sectionsToAdd.push({
                    id: uuidv4(),
                    type: 'notas',
                    title: `${tt('pdfTextSectionTitlePrefix')} (Fallback) - ${file.name.replace(/\.pdf$/i, '')}`,
                    content: textContent,
                    screenshots: [],
                    isTemplate: false,
                });
            }
        }

        if (images.length > 0) {
            pdfjsImagesExtractedCount = images.length;
            sectionsToAdd.push({
                id: uuidv4(),
                type: 'paso', 
                title: `${tt('pdfImageSectionTitlePrefix')} - ${file.name.replace(/\.pdf$/i, '')}`,
                content: tt('pdfImageSectionContent', { imageCount: images.length.toString() }),
                screenshots: images,
                isTemplate: false,
            });
        }

        if (sectionsToAdd.length > 0) {
            dispatch({ type: 'ADD_IMPORTED_SECTIONS', payload: sectionsToAdd });
            
            let summaryMessage = "";
            if (aiProcessedSuccessfully) {
                const aiAddedCount = sectionsToAdd.filter(s => !(s.title.startsWith(tt('pdfTextSectionTitlePrefix')) || s.title.startsWith(tt('pdfImageSectionTitlePrefix')))).length;
                summaryMessage += tt('pdfAISectionsImportedShort', {count: aiAddedCount.toString() });
            }
            if (pdfjsTextExtracted && (!aiProcessedSuccessfully || sectionsToAdd.some(s => s.title.startsWith(tt('pdfTextSectionTitlePrefix'))))) {
                summaryMessage += (summaryMessage ? " " : "") + tt('pdfTextImportedShort');
            }
            if (pdfjsImagesExtractedCount > 0) {
                 summaryMessage += (summaryMessage ? " " : "") + tt('pdfImagesImportedShort', {imageCount: pdfjsImagesExtractedCount.toString()});
            }
            
            if (summaryMessage.trim()) {
                toast({ title: tt('success'), description: summaryMessage.trim() });
            } else {
                 toast({ title: tt('info'), description: tt('pdfImportCompletedNoNewContent') });
            }

        } else {
            toast({ title: tt('info'), description: tt('pdfNoContentFromPdfjs') });
        }

    } catch (error) {
        console.error("Error importing PDF with pdf.js-dist:", error);
        const errorMessage = error instanceof Error ? error.message : tt('pdfImportErrorPdfjs');
        toast({ title: tt('pdfImportError'), description: errorMessage, variant: "destructive" });
    }

    if (event.target) event.target.value = '';
  };


  const handleExportJsonBackup = () => { 
    try {
      const jsonString = JSON.stringify(state.writeUp, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const writeUpTitleKey = writeUp.title || 'generalInfo.defaultWriteupTitle';
      const writeUpTitleText = writeUp.title?.startsWith('generalInfo.') ? t(writeUpTitleKey as any) : (writeUp.title || t('generalInfo.defaultWriteupTitle'));
      const fileName = (writeUpTitleText).replace(/\s+/g, '_').toLowerCase();
      link.download = `${fileName}_backup.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: tt('success'), description: tt('jsonBackupExported') });
    } catch (error) {
      console.error("Error exporting JSON backup:", error);
      toast({ title: tt('error'), description: tt('couldNotExportJsonBackup'), variant: "destructive" });
    }
  };
  
  const handleNewWriteUp = () => {
    const hasUserContent = writeUp.sections.some(s => !s.isTemplate) || 
                           writeUp.title.trim() !== "" || 
                           writeUp.author.trim() !== "" ||
                           (writeUp.tags && writeUp.tags.length > 0) ||
                           writeUp.machineImage;

    if (hasUserContent) {
        dispatch({ type: 'RESET_WRITEUP' });
        toast({ title: tt('success'), description: tt('newWriteupCreated') });
    } else {
        dispatch({ type: 'RESET_WRITEUP' });
        toast({ title: tt('success'), description: tt('newWriteupCreated') });
    }
  };

  const handleSaveProgress = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.writeUp));
      toast({ title: tt('progressSaved'), description: tt('progressSavedDetails') });
      dispatch({ type: 'SET_IS_DIRTY', payload: false }); 
    } catch (error) {
      console.error("Error saving progress to localStorage:", error);
      toast({ title: tt('errorSavingProgress'), description: tt('couldNotSaveProgress'), variant: "destructive" });
    }
  };

  const handleLocaleChange = () => {
    const targetLocale = currentLocale === 'es' ? 'en' : 'es';
    console.log(`AppLayout: Changing locale from ${currentLocale} to ${targetLocale}`);
    changeLocale(targetLocale);
  };


  return (
    <header className="flex items-center justify-between p-3 border-b border-border bg-background sticky top-0 z-10">
      <div className="flex items-center">
        <TerminalSquare className="h-8 w-8 text-foreground mr-2" />
        <h1 className="text-2xl font-bold text-foreground">
          <span>{t('appTitle')} ></span><span className="blinking-cursor">_</span>
        </h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={handleExportMd} variant="outline" size="sm" className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground"><FileText className="mr-1 h-4 w-4" /> {th('exportMD')}</Button>
        <PdfExportModal />
        
        <label htmlFor="import-json-input-header" className="mb-0">
          <Button variant="outline" size="sm" asChild className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
            <span><Upload className="mr-1 h-4 w-4" /> {th('importJSON')}</span>
          </Button>
        </label>
        <input id="import-json-input-header" type="file" accept=".json" onChange={handleImportJson} className="hidden" />

        <label htmlFor="import-md-input-header" className="mb-0">
          <Button variant="outline" size="sm" asChild className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
            <span><FileArchive className="mr-1 h-4 w-4" /> {th('importMD')}</span>
          </Button>
        </label>
        <input id="import-md-input-header" type="file" accept=".md,.txt,text/markdown" onChange={handleImportMdFile} className="hidden" />
        
        <label htmlFor="import-pdf-input-header" className="mb-0">
          <Button variant="outline" size="sm" asChild className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
            <span><FileType className="mr-1 h-4 w-4" /> {th('importPDF')}</span>
          </Button>
        </label>
        <input id="import-pdf-input-header" type="file" accept=".pdf" onChange={handleImportPdfFile} className="hidden" />

        <Button onClick={handleGistExport} variant="outline" size="sm" className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground"><AlertTriangle className="mr-1 h-4 w-4" /> {th('gist')}</Button>
        <Button onClick={handleSaveProgress} variant="outline" size="sm" className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground"><Save className="mr-1 h-4 w-4" /> {th('save')}</Button>
        
         <AlertDialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" title={tai('configureApiKeyButton')} className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
              <KeyRound className="mr-1 h-4 w-4" /> {th('configureApiKey')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tai('configureApiKeyTitle')}</AlertDialogTitle>
              <AlertDialogDescription className="text-left whitespace-pre-wrap">
                {tai('configureApiKeyDescription')}
                {currentApiKey && <p className="mt-2 text-xs text-muted-foreground">{tai('currentKey')}: <span className="font-mono break-all">{currentApiKey.substring(0,4)}...{currentApiKey.substring(currentApiKey.length - 4)}</span></p>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="api-key-input">{tai('apiKeyLabel')}</Label>
              <Input 
                id="api-key-input" 
                type="password" 
                value={apiKeyInputValue} 
                onChange={(e) => setApiKeyInputValue(e.target.value)}
                placeholder={tai('apiKeyPlaceholder')}
                className="border-border focus:ring-foreground focus:border-foreground"
              />
            </div>
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel onClick={() => setIsApiKeyModalOpen(false)} className="font-bold">{th('cancel')}</AlertDialogCancel>
              {currentApiKey && (
                <Button variant="destructive" onClick={handleDeleteApiKey} className="font-bold">{tai('deleteKeyButton')}</Button>
              )}
              <AlertDialogAction onClick={handleSaveApiKey} className="bg-foreground text-primary-foreground font-bold">{tai('saveKeyButton')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" title={tDonations('title')} className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
              <Gift className="mr-1 h-4 w-4" /> {th('donateButton')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tDonations('title')}</AlertDialogTitle>
              <AlertDialogDescription className="text-left whitespace-pre-wrap">
                {tDonations('message')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-bold">{tDonations('closeButton')}</AlertDialogCancel>
              <AlertDialogAction asChild>
                <a 
                  href="https://www.paypal.me/1511amff" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-primary-foreground hover:bg-foreground/90 h-10 px-4 py-2 font-bold"
                >
                  {tDonations('donateButtonAction')}
                </a>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={toggleView} variant="outline" size="sm" className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
          {currentView === 'editor' ? <Eye className="mr-1 h-4 w-4" /> : <Edit3 className="mr-1 h-4 w-4" />}
          {currentView === 'editor' ? th('preview') : th('editor')}
        </Button>
        <Button onClick={handleExportJsonBackup} variant="outline" size="sm" className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground"><Download className="mr-1 h-4 w-4" /> {th('backup')}</Button>
        <Button onClick={handleLocaleChange} variant="outline" size="sm" title={th('toggleLanguage')} className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
          <Languages className="mr-1 h-4 w-4" />
          {currentLocale === 'es' ? th('switchToEnglish') : th('switchToSpanish')}
        </Button>
         <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-foreground text-primary-foreground font-bold">
                <PlusCircle className="mr-1 h-4 w-4" /> {th('new')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{th('newWriteupTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {th('newWriteupDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-bold">{th('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleNewWriteUp} className="bg-foreground text-primary-foreground font-bold">{th('continue')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </header>
  );
};

const StructureAndAddSectionsPanel: React.FC = () => {
  const { state, dispatch } = useWriteUp();
  const { writeUp, activeSectionId } = state;
  const tsp = useScopedI18n('structurePanel');
  const tst = useScopedI18n('sectionTypes');
  const t = useI18n();

  const handleAddSection = (type: SectionType) => {
    const newSection = createDefaultSection(type); 
    dispatch({ type: 'ADD_SECTION', payload: { type: newSection.type, title: newSection.title } });
  };

  const handleSelectSection = (id: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: id });
  };

  const handleDeleteSection = (id: string) => {
    dispatch({ type: 'DELETE_SECTION', payload: id });
  };
  
  const userSections = writeUp.sections.filter(s => !s.isTemplate);
  const templateSections = writeUp.sections.filter(s => s.isTemplate);

  return (
    <div className="p-3 space-y-2 h-full flex flex-col bg-card rounded-lg shadow-md border-l border-border">
      <Accordion type="multiple" defaultValue={['structure-panel', 'add-section-panel']} className="w-full">
        <AccordionItem value="structure-panel">
          <AccordionTrigger className="py-2 hover:no-underline">
            <h3 className="text-lg font-bold text-foreground">
              <span>{tsp('structure')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-2">
            <ScrollArea className="h-[calc(45vh-110px)] min-h-[190px] pr-1">
              <div className="flex flex-col gap-2 pb-2">
                {userSections.length > 0 ? (
                  userSections.map((section) => {
                    const Icon = getSectionItemIcon(section.type, section.title);
                    const displayTitle = section.title?.startsWith('defaultSections.') || section.title?.startsWith('sectionTypes.') ? t(section.title as any) : section.title; 
                    return (
                      <SectionItemCard
                        key={section.id}
                        section={{...section, title: displayTitle}} 
                        icon={<Icon size={16} className="mr-2 flex-shrink-0 text-foreground" />}
                        isActive={section.id === activeSectionId}
                        onSelect={() => handleSelectSection(section.id)}
                        onDelete={() => handleDeleteSection(section.id)}
                      />
                    );
                  })
                ) : templateSections.length > 0 ? (
                  <>
                    {templateSections.map((section) => {
                       const Icon = getSectionItemIcon(section.type, section.title);
                       const displayTitle = t(section.title as any);
                       return (
                         <SectionItemCard
                          key={section.id}
                          section={{...section, title: displayTitle}}
                          icon={<Icon size={16} className="mr-2 flex-shrink-0 text-foreground/70" />}
                          isActive={section.id === activeSectionId}
                          onSelect={() => {
                            dispatch({ type: 'UPDATE_SECTION', payload: { id: section.id, data: { isTemplate: false } } });
                            handleSelectSection(section.id);
                          }}
                          onDelete={() => handleDeleteSection(section.id)}
                          className="opacity-70 hover:opacity-100 transition-opacity"
                        />
                       )
                    })}
                    <p className="text-xs text-center text-muted-foreground mt-2">{tsp('templateSectionsHint')}</p>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">{tsp('noSectionsYet')}</p>
                )}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="add-section-panel">
          <AccordionTrigger className="py-2 hover:no-underline">
            <h3 className="text-lg font-bold text-foreground">
              <span>{tsp('addSection')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPES_KEYS.map(stKey => {
                const OriginalIcon = getSectionItemIcon(stKey as SectionType); 
                const Icon = OriginalIcon || ListChecks;
                
                return (
                  <Button key={stKey} variant="outline" onClick={() => handleAddSection(stKey as SectionType)} className="justify-start text-left h-auto py-2 text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
                    <div className="flex items-start">
                      <Icon className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0 text-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{tst(`${stKey}.label` as any)}</span>
                        <p className="text-xs text-muted-foreground whitespace-normal">{tst(`${stKey}.description` as any)}</p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}


export const AppLayout: React.FC = () => {
  const { state } = useWriteUp();
  const { currentView } = state;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[320px] min-w-[300px] max-w-[350px] h-full overflow-y-auto bg-card border-r border-border shadow-md">
          <GeneralInfoPanel />
        </aside>

        <main className="flex-1 h-full overflow-y-auto p-0">
          {currentView === 'editor' ? <ActiveSectionEditor /> : <WriteUpPreview />}
        </main>

        {currentView === 'editor' && (
          <aside className="w-[450px] min-w-[420px] max-w-[550px] h-full overflow-y-auto">
            <StructureAndAddSectionsPanel />
          </aside>
        )}
      </div>
    </div>
  );
};
    

    