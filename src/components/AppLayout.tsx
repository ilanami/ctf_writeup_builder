// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { GeneralInfoPanel } from './GeneralInfoPanel';
import { ActiveSectionEditor } from './ActiveSectionEditor';
import { WriteUpPreview } from './WriteUpPreview';
import { useWriteUp } from '@/hooks/useWriteUp';
import { Button } from './ui/button';
import { Eye, Edit3, FileText, Download, Upload, Save, AlertTriangle, PlusCircle, TerminalSquare, ListChecks, PlaySquare, HelpCircle, Flag as FlagIcon, FileType, Languages, Coffee, Gift, KeyRound, Wand2, FileArchive, Info } from 'lucide-react';
import { PdfExportModal } from './PdfExportModal';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SectionType, WriteUpSection, WriteUp, Screenshot, AiProcessedSection } from '@/lib/types';
import { SECTION_TYPES_KEYS, getSectionItemIcon, LOCAL_STORAGE_KEY, createDefaultSection, DEFAULT_SECTIONS_TEMPLATE_KEYS } from '@/lib/constants';
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
import { extractBasicTextFromPDF } from '../utils/pdfExtractorBasic';
import { extractTextAndImagesWithPdfJSEnhanced } from '../utils/pdfExtractorEnhanced';
import ApiKeyConfigModal from './ApiKeyConfigModal';
import AboutModal from './AboutModal';
import HelpModal from './HelpModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


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
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');
  const currentLocale = useCurrentLocale();
  const changeLocale = useChangeLocale();
  const dateLocale = currentLocale === 'es' ? es : enUS;
  const tImportDialog = useScopedI18n('importDialog');
  const tLangDialog = useScopedI18n('languageSwitchDialog');
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyConfig, setApiKeyConfig] = useState({ provider: 'gemini', apiKey: '' });
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<any>(null);
  const [pendingImportType, setPendingImportType] = useState<'json' | 'md' | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    const savedProvider = localStorage.getItem('aiProvider') || 'gemini';
    const savedEncryptedKey = localStorage.getItem('aiApiKey') || '';
    let apiKey = '';
    try {
      apiKey = savedEncryptedKey ? atob(savedEncryptedKey) : '';
    } catch {
      apiKey = savedEncryptedKey;
    }
    setApiKeyConfig({ provider: savedProvider, apiKey });
  }, [isApiKeyModalOpen]);

  const handleSaveApiKey = ({ provider, apiKey }) => {
    setApiKeyConfig({ provider, apiKey });
    setIsApiKeyModalOpen(false);
  };

  const handleDeleteApiKey = () => {
    localStorage.removeItem(USER_GOOGLE_AI_API_KEY_NAME);
    setApiKeyConfig({ provider: 'gemini', apiKey: '' });
    setIsApiKeyModalOpen(false);
    toast({ title: tai('apiKeyDeletedTitle'), description: tai('apiKeyDeletedDescription') });
  };


  const toggleView = () => {
    dispatch({ type: 'SET_VIEW', payload: currentView === 'editor' ? 'preview' : 'editor' });
  };

  const handleExportMd = () => {
    const sectionsToExport = writeUp.sections.filter(section => !section.isTemplate);
    const writeUpTitleKey = writeUp.title || 'generalInfo.defaultWriteupTitle';
    const writeUpTitleText = writeUp.title?.startsWith('generalInfo.') 
      ? t(writeUpTitleKey as any) 
      : (writeUp.title || t('generalInfo.defaultWriteupTitle'));
    const writeUpAuthorKey = writeUp.author || 'generalInfo.defaultAuthor';
    const writeUpAuthorText = writeUp.author?.startsWith('generalInfo.') 
      ? t(writeUpAuthorKey as any) 
      : (writeUp.author || t('generalInfo.defaultAuthor'));

    // Validaciones detalladas
    if (!writeUpTitleText || !writeUpTitleText.trim()) {
      toast({ title: tt('error'), description: 'Falta el título del write-up.' });
      return;
    }
    if (!writeUpAuthorText || !writeUpAuthorText.trim()) {
      toast({ title: tt('error'), description: 'Falta el autor del write-up.' });
      return;
    }
    if (!writeUp.date || !writeUp.date.trim()) {
      toast({ title: tt('error'), description: 'Falta la fecha del write-up.' });
      return;
    }
    if (sectionsToExport.length === 0 && !writeUp.machineImage) {
      toast({ title: tt('info'), description: tt('noContentToExportMD') });
      return;
    }
    for (let i = 0; i < sectionsToExport.length; i++) {
      const sec = sectionsToExport[i];
      if (!sec.title || !sec.title.trim()) {
        toast({ title: tt('error'), description: `Falta el título en la sección ${i + 1}.` });
        return;
      }
      if (!sec.content || !sec.content.trim()) {
        toast({ title: tt('error'), description: `Falta el contenido en la sección "${sec.title}".` });
        return;
      }
    }

    try {
      let mdContent = '';
      
      mdContent += `# ${writeUpTitleText}\n\n`;
      mdContent += `**${t('generalInfo.author')}:** ${writeUpAuthorText}  \n`;
      mdContent += `**${t('generalInfo.date')}:** `;
      if (writeUp.date) {
        try {
          mdContent += `${format(parseISO(writeUp.date), "PPP", { locale: dateLocale })}  \n`;
        } catch {
          mdContent += `${writeUp.date}  \n`;
        }
      } else {
        mdContent += `${t('generalInfo.selectDate')}  \n`;
      }
      
      const difficultyKey = writeUp.difficulty as keyof ReturnType<typeof useScopedI18n<'difficulties'>>;
      const osKey = writeUp.os as keyof ReturnType<typeof useScopedI18n<'operatingSystems'>>;
      
      mdContent += `**${t('generalInfo.difficulty')}:** ${tDifficulties(difficultyKey) || writeUp.difficulty}  \n`;
      mdContent += `**${t('generalInfo.os')}:** ${tOS(osKey) || writeUp.os}  \n`;
      
      if (writeUp.tags && writeUp.tags.length > 0) {
        mdContent += `**${t('generalInfo.tags')}:** ${writeUp.tags.join(', ')}  \n`;
      }
      
      mdContent += '\n---\n\n';
      
      if (writeUp.machineImage) {
        mdContent += `## ${t('generalInfo.machineImage')}\n\n`;
        mdContent += `![${writeUp.machineImage.name}](${writeUp.machineImage.dataUrl})\n\n`;
        mdContent += `*Imagen: ${writeUp.machineImage.name}*\n\n`;
      }
      
      sectionsToExport.forEach((section: WriteUpSection, index: number) => {
        const sectionTitle = section.isTemplate && section.title?.startsWith('defaultSections.') 
          ? t(section.title as any) 
          : section.title;
        const sectionContent = section.isTemplate && section.content?.startsWith('defaultSectionsContent.') 
          ? t(section.content as any) 
          : section.content;
        
        mdContent += `## ${sectionTitle}\n\n`;
        
        if (section.type === 'pregunta' && section.answer?.trim()) {
          mdContent += `> **${t('activeSectionEditor.answerToQuestion')}:** ${section.answer}\n\n`;
        }
        
        if (section.type === 'flag' && section.flagValue?.trim()) {
          mdContent += `> **${t('activeSectionEditor.flagValue')}:** \`${section.flagValue}\`\n\n`;
        }
        
        if (sectionContent?.trim()) {
          mdContent += `${sectionContent}\n\n`;
        }
        
        if (section.screenshots && section.screenshots.length > 0) {
          mdContent += `### ${t('activeSectionEditor.screenshots')}\n\n`;
          section.screenshots.forEach((ss, ssIndex) => {
            mdContent += `![${ss.name}](${ss.dataUrl})\n`;
            mdContent += `*Captura ${ssIndex + 1}: ${ss.name}*\n\n`;
          });
        }
        
        if (index < sectionsToExport.length - 1) {
          mdContent += '---\n\n';
        }
      });
      
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = (writeUpTitleText || 'writeup')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 50);
      
      link.download = `${fileName}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ 
        title: tt('success'), 
        description: tt('markdownExported') 
      });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({ 
        title: tt('error'), 
        description: `Could not export Markdown file.\n${errorMsg}`,
        variant: "destructive" 
      });
    }
  };

  const mergeSections = (currentSections: WriteUpSection[], importedSections: WriteUpSection[]) => {
    const userSections = currentSections.filter(s => !s.isTemplate);
    const importedUserSections = importedSections.filter(s => !s.isTemplate);
    const normalizedImported = importedUserSections.map(s => ({
      ...s,
      id: uuidv4(),
      isTemplate: false,
    }));
    return [...userSections, ...normalizedImported];
  };

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
            setPendingImport(importedData);
            setPendingImportType('json');
            setShowImportDialog(true);
            return;
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

          // Parse the markdown content
          const lines = markdownContent.split('\n');
          let currentSection: WriteUpSection | null = null;
          const sections: WriteUpSection[] = [];
          let writeUpTitle = '';
          let writeUpAuthor = '';
          let writeUpDate = '';
          let writeUpDifficulty = '';
          let writeUpOS = '';
          let writeUpTags: string[] = [];
          let machineImage: { name: string; dataUrl: string } | null = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Parse header information
            if (i === 0 && line.startsWith('# ')) {
              writeUpTitle = line.substring(2).trim();
              continue;
            }

            // Parse metadata (author, date, difficulty, os, tags)
            if (line.startsWith('**')) {
              const metaMatch = line.match(/^\*\*(.+?):\*\*\s*(.+)$/i);
              if (metaMatch) {
                const cleanKey = metaMatch[1].replace(/\*/g, '').trim().toLowerCase();
                const cleanValue = metaMatch[2].replace(/\*/g, '').trim();
                switch (cleanKey) {
                  case 'author':
                  case 'autor':
                    writeUpAuthor = cleanValue;
                    break;
                  case 'date':
                  case 'fecha': {
                    // Intentar convertir a ISO
                    let isoDate = cleanValue;
                    // Si es formato DD/MM/YYYY o DD-MM-YYYY
                    const matchDMY = cleanValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                    if (matchDMY) {
                      isoDate = `${matchDMY[3]}-${matchDMY[2].padStart(2, '0')}-${matchDMY[1].padStart(2, '0')}`;
                    } else {
                      // Si es formato MM/DD/YYYY
                      const matchMDY = cleanValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                      if (matchMDY) {
                        isoDate = `${matchMDY[3]}-${matchMDY[1].padStart(2, '0')}-${matchMDY[2].padStart(2, '0')}`;
                      }
                    }
                    writeUpDate = isoDate;
                    break;
                  }
                  case 'difficulty':
                  case 'dificultad':
                    writeUpDifficulty = cleanValue;
                    break;
                  case 'os':
                  case 's.o.':
                  case 'operating system':
                  case 'sistema operativo':
                    writeUpOS = cleanValue;
                    break;
                  case 'tags':
                    writeUpTags = cleanValue.split(',').map(tag => tag.trim());
                    break;
                }
                continue;
              }
            }

            // Parse machine image section (do NOT create a section, assign to machineImage)
            if (line.match(/^##\s*(Machine Image|Imagen de la Máquina)/i)) {
              // Look ahead for image markdown
              let foundImage = false;
              for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const imgLine = lines[j].trim();
                const match = imgLine.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) {
                  machineImage = {
                    name: match[1],
                    dataUrl: match[2]
                  };
                  foundImage = true;
                  break;
                }
                // Si hay otra sección antes de la imagen, salir
                if (imgLine.startsWith('## ')) break;
              }
              // Saltar las siguientes líneas si se encontró imagen
              if (foundImage) {
                i += 1; // Avanzar al menos una línea
              }
              continue;
            }

            // Parse sections (ignorar Machine Image)
            if (line.startsWith('## ') && !line.match(/^##\s*(Machine Image|Imagen de la Máquina)/i)) {
              if (currentSection) {
                sections.push(currentSection);
              }
              currentSection = {
                id: uuidv4(),
                type: 'notas',
                title: line.substring(3).trim(),
                content: '',
                screenshots: [],
                isTemplate: false
              };
              continue;
            }

            // Parse answer or flag value
            if (currentSection && line.startsWith('> **')) {
              const [key, value] = line.split(':**').map(s => s.trim());
              const cleanKey = key.replace('> **', '').toLowerCase();
              const cleanValue = value.replace('**', '').trim();

              if (cleanKey.includes('answer') || cleanKey.includes('respuesta')) {
                currentSection.type = 'pregunta';
                currentSection.answer = cleanValue;
              } else if (cleanKey.includes('flag')) {
                currentSection.type = 'flag';
                currentSection.flagValue = cleanValue.replace(/`/g, '');
              }
              continue;
            }

            // Parse screenshots
            if (currentSection && line.startsWith('![')) {
              const match = line.match(/!\[(.*?)\]\((.*?)\)/);
              if (match) {
                currentSection.screenshots.push({
                  id: uuidv4(),
                  name: match[1],
                  dataUrl: match[2]
                });
              }
              continue;
            }

            // Add content to current section
            if (currentSection) {
              currentSection.content += line + '\n';
            }
          }

          // Add the last section
          if (currentSection) {
            sections.push(currentSection);
          }

          // Create the write-up object
          const importedWriteUp = {
            title: writeUpTitle || tt('mdImportDefaultTitle'),
            author: writeUpAuthor,
            date: writeUpDate,
            difficulty: writeUpDifficulty,
            os: writeUpOS,
            tags: writeUpTags,
            machineImage: machineImage,
            sections: sections
          };

          setPendingImport(importedWriteUp);
          setPendingImportType('md');
          setShowImportDialog(true);
          return;
        } catch (error) {
          console.error("Error importing Markdown:", error);
          const errorMessage = error instanceof Error ? error.message : "No se pudo procesar el archivo Markdown.";
          toast({ 
            title: tt('mdImportError'), 
            description: errorMessage, 
            variant: "destructive" 
          });
        }
      };
      reader.onerror = () => {
        toast({ 
          title: tt('error'), 
          description: "No se pudo leer el archivo Markdown seleccionado.", 
          variant: "destructive" 
        });
      };
      reader.readAsText(file);
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
    setPendingLocale(targetLocale);
    setShowLangDialog(true);
  };

  const confirmLocaleChange = () => {
    if (pendingLocale) {
      changeLocale(pendingLocale);
      setShowLangDialog(false);
      setPendingLocale(null);
    }
  };

  const cancelLocaleChange = () => {
    setShowLangDialog(false);
    setPendingLocale(null);
  };

  // Normaliza isTemplate en todas las secciones importadas
  const normalizeSections = (sections: WriteUpSection[]) => {
    const templateTitles = new Set(DEFAULT_SECTIONS_TEMPLATE_KEYS.map(t => `defaultSections.${t.titleKey}`));
    return sections.map(s => {
      if (templateTitles.has(s.title)) {
        return { ...s, isTemplate: true };
      } else {
        return { ...s, isTemplate: false };
      }
    });
  };

  // Handler para el modal de importación
  const handleImportDialogAction = (action: 'merge' | 'replace') => {
    if (!pendingImport) return;
    let importedData = pendingImportType === 'json' ? { ...pendingImport } : { ...pendingImport };
    importedData.sections = importedData.sections || [];
    importedData.sections = normalizeSections(importedData.sections);
    const templateSections = DEFAULT_SECTIONS_TEMPLATE_KEYS.map(sec => ({
      id: uuidv4(),
      type: sec.type,
      title: `defaultSections.${sec.titleKey}`,
      content: `defaultSectionsContent.${sec.contentKey}`,
      screenshots: [],
      isTemplate: true,
    }));
    if (action === 'merge') {
      const currentSections = state.writeUp.sections || [];
      const normalizedCurrent = normalizeSections(currentSections);
      const mergedUserSections = mergeSections(normalizedCurrent, importedData.sections);
      importedData.sections = [
        ...mergedUserSections,
        ...templateSections
      ];
      importedData.title = state.writeUp.title;
      importedData.author = state.writeUp.author;
      importedData.date = state.writeUp.date;
      importedData.difficulty = state.writeUp.difficulty;
      importedData.os = state.writeUp.os;
      importedData.tags = state.writeUp.tags;
      importedData.machineImage = state.writeUp.machineImage;
      dispatch({ type: 'LOAD_WRITEUP', payload: importedData });
      toast({ title: tt('success'), description: tt('jsonSectionsImported') });
    } else {
      importedData.sections = [
        ...importedData.sections.filter(s => !s.isTemplate),
        ...templateSections
      ];
      dispatch({ type: 'LOAD_WRITEUP', payload: importedData });
      toast({ title: tt('success'), description: tt('jsonSectionsImported') });
    }
    setPendingImport(null);
    setPendingImportType(null);
    setShowImportDialog(false);
  };

  return (
    <header className="flex flex-row items-start p-1 sm:p-2 border-b-4 border-l-4 border-r-4 border-[#00ff00] bg-background sticky top-0 z-10">
      <div className="flex items-center mb-1 sm:mb-0">
        <TerminalSquare className="h-8 w-8 sm:h-8 sm:w-8 text-foreground mr-1 sm:mr-2" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground whitespace-nowrap">
          <span>{t('appTitle')} {'>'}</span><span className="blinking-cursor">_</span>
        </h1>
      </div>
      <div className="flex flex-col gap-y-4 ml-12 w-full max-w-[calc(100%-350px)]">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {/* Fila superior: Nuevo, Guardar, Vista Previa/Editor, Exportar MD, Exportar PDF, API Key, Acerca de */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-2 text-[0.75rem] sm:text-[0.85rem]">
                <PlusCircle className="mr-1 h-3.5 w-3.5" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('new')}
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
          <Button onClick={handleSaveProgress} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]"><Save className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('save')}</Button>
          <Button onClick={toggleView} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
            {currentView === 'editor' ? <Eye className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> : <Edit3 className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} />}
            {currentView === 'editor' ? th('preview') : th('editor')}
          </Button>
          <Button onClick={handleExportMd} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]"><FileText className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('exportMD')}</Button>
          <PdfExportModal />
          <Button onClick={() => setIsApiKeyModalOpen(true)} variant="outline" size="sm" title={tai('configureApiKeyButton')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
            <KeyRound className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('configureApiKey')}
          </Button>
          <Button onClick={() => setIsAboutOpen(true)} variant="outline" size="sm" title={t('about.title')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
            <Info className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {t('about.title')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-0">
          {/* Fila inferior: English, Importar JSON, Importar MD, Backup JSON, Donar, Ayuda y Preguntas Frecuentes */}
          <Button onClick={handleLocaleChange} variant="outline" size="sm" title={th('toggleLanguage')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
            <Languages className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} />
            {currentLocale === 'es' ? th('switchToEnglish') : th('switchToSpanish')}
          </Button>
          <label htmlFor="import-json-input-header" className="mb-0">
            <Button variant="outline" size="sm" asChild className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
              <span><Upload className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('importJSON')}</span>
            </Button>
          </label>
          <input id="import-json-input-header" type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          <label htmlFor="import-md-input-header" className="mb-0">
            <Button variant="outline" size="sm" asChild className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
              <span><FileArchive className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('importMD')}</span>
            </Button>
          </label>
          <input id="import-md-input-header" type="file" accept=".md,.txt,text/markdown" onChange={handleImportMdFile} className="hidden" />
          <Button onClick={handleExportJsonBackup} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]"><Download className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('backup')}</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" title={tDonations('title')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
                <Gift className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('donateButton')}
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
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <AlertDialogCancel className="font-bold w-full sm:w-auto">{tDonations('closeButton')}</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <a 
                      href="https://www.paypal.me/1511amff" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-primary-foreground hover:bg-foreground/90 h-10 px-4 py-2 font-bold w-full sm:w-auto"
                    >
                      {tDonations('donateButtonAction')}
                    </a>
                  </AlertDialogAction>
                  <AlertDialogAction asChild>
                    <a
                      href="https://buymeacoffee.com/ilanami"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-yellow-400 text-black hover:bg-yellow-300 h-10 px-4 py-2 font-bold w-full sm:w-auto"
                    >
                      ☕ Buy Me a Coffee
                    </a>
                  </AlertDialogAction>
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => setIsHelpOpen(true)} variant="outline" size="sm" title={t('help.title')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-6 sm:h-7 px-1.5 text-[0.80rem] sm:text-[0.90rem]">
            <HelpCircle className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {t('help.title')}
          </Button>
        </div>
      </div>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {isApiKeyModalOpen && (
        <ApiKeyConfigModal
          onSave={handleSaveApiKey}
          onCancel={() => setIsApiKeyModalOpen(false)}
        />
      )}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tImportDialog('title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <span dangerouslySetInnerHTML={{ __html: tImportDialog('description') }} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowImportDialog(false); setPendingImport(null); setPendingImportType(null); }}>{tImportDialog('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleImportDialogAction('merge')}>{tImportDialog('addButton')}</AlertDialogAction>
            <AlertDialogAction onClick={() => handleImportDialogAction('replace')}>{tImportDialog('replaceButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showLangDialog} onOpenChange={setShowLangDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tLangDialog('title')}</AlertDialogTitle>
            <AlertDialogDescription>{tLangDialog('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLocaleChange}>{tLangDialog('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLocaleChange}>{tLangDialog('continue')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    const tempSection = createDefaultSection(type, undefined, t);
    dispatch({ type: 'SET_EDITING_SUGGESTED_SECTION', payload: { ...tempSection, isTemplate: true } });
  };

  const handleSelectSection = (id: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: id });
  };

  const handleDeleteSection = (id: string) => {
    dispatch({ type: 'DELETE_SECTION', payload: id });
  };
  
  const userSections = writeUp.sections.filter(s => !s.isTemplate);
  const templateSections = writeUp.sections.filter(s => s.isTemplate);

  // Drag & Drop handler
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(userSections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    // Mantén las plantillas sugeridas al final
    dispatch({ type: 'REORDER_SECTIONS', payload: [...reordered, ...templateSections] });
  };

  return (
    <div className="p-2 space-y-1 h-full flex flex-col bg-card rounded-lg shadow-md border-r-4 border-[#00ff00]">
      <Accordion type="multiple" defaultValue={['structure-panel', 'suggested-sections-panel', 'add-section-panel']} className="w-full">
        {/* Estructura Real */}
        <AccordionItem value="structure-panel">
          <AccordionTrigger className="py-1 hover:no-underline">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              <span>{tsp('structure')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-1">
            <ScrollArea className="h-[calc(40vh-90px)] min-h-[200px] pr-1">
              <div className="flex flex-col gap-1 pb-1">
                {/* DRAG & DROP: Secciones de usuario */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="userSections-droppable" direction="vertical">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} style={{ width: '100%' }}>
                        {userSections.map((section, index) => {
                          const Icon = getSectionItemIcon(section.type, section.title);
                          const isI18nKey = section.title?.startsWith('defaultSections.') || section.title?.startsWith('sectionTypes.');
                          const displayTitle = isI18nKey ? t(section.title as any) : section.title;
                          const description = section.type ? tst(`${section.type}.description` as any) : '';
                          return (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    background: snapshot.isDragging ? '#003300' : undefined,
                                    width: '100%',
                                    minWidth: 0,
                                    margin: 0,
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <SectionItemCard
                                    section={section}
                                    icon={<Icon className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0 text-foreground" />}
                                    isActive={section.id === activeSectionId}
                                    onSelect={() => handleSelectSection(section.id)}
                                    onDelete={() => handleDeleteSection(section.id)}
                                    className=""
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                {/* FIN DRAG & DROP */}

                {/* CÓDIGO ANTERIOR (sin drag & drop) - dejar comentado por si hay que volver atrás */}
                {false && userSections.length > 0 ? (
                  userSections.map((section) => {
                    const Icon = getSectionItemIcon(section.type, section.title);
                    const isI18nKey = section.title?.startsWith('defaultSections.') || section.title?.startsWith('sectionTypes.');
                    const displayTitle = isI18nKey ? t(section.title as any) : section.title;
                    const description = section.type ? tst(`${section.type}.description` as any) : '';
                    return (
                      <SectionItemCard
                        key={section.id}
                        section={section}
                        icon={<Icon className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0 text-foreground" />}
                        isActive={section.id === activeSectionId}
                        onSelect={() => handleSelectSection(section.id)}
                        onDelete={() => handleDeleteSection(section.id)}
                        className=""
                      />
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-4">{tsp('noSectionsYet')}</p>
                )}
                {/* FIN CÓDIGO ANTERIOR */}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        {/* Secciones Sugeridas */}
        <AccordionItem value="suggested-sections-panel">
          <AccordionTrigger className="py-1 hover:no-underline">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              <span>{tsp('suggestedSections')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-1">
            <ScrollArea className="h-[calc(30vh-90px)] min-h-[140px] pr-1">
              <div className="flex flex-col gap-1 pb-1">
                {templateSections.length > 0 ? (
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
                            dispatch({ type: 'SET_EDITING_SUGGESTED_SECTION', payload: section });
                          }}
                          onDelete={() => handleDeleteSection(section.id)}
                          className="opacity-70 hover:opacity-100 transition-opacity compact"
                        />
                       )
                    })}
                    <p className="text-xs text-center text-muted-foreground mt-2">{tsp('templateSectionsHint')}</p>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay secciones sugeridas disponibles</p>
                )}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
        
        {/* Añadir Nueva Sección */}
        <AccordionItem value="add-section-panel">
          <AccordionTrigger className="py-1 hover:no-underline">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              <span>{tsp('addSection')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {SECTION_TYPES_KEYS.map(stKey => {
                const OriginalIcon = getSectionItemIcon(stKey as SectionType); 
                const Icon = OriginalIcon || ListChecks;
                
                return (
                  <Button key={stKey} variant="outline" onClick={() => handleAddSection(stKey as SectionType)} className="justify-start text-left h-auto py-1 text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
                    <div className="flex items-start">
                      <Icon className="mr-1.5 h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-foreground" />
                      <div>
                        <span className="text-xs font-medium text-foreground">{tst(`${stKey}.label` as any)}</span>
                        <p className="text-[10px] text-muted-foreground whitespace-normal">{tst(`${stKey}.description` as any)}</p>
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
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background border-t-4 border-b-4 border-l-4 border-[#00ff00]">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[320px] min-w-[300px] max-w-[340px] h-full overflow-y-auto bg-card border-r-4 border-[#00ff00] shadow-md">
          <GeneralInfoPanel />
        </aside>

        <main className="flex-1 h-full overflow-y-auto p-0 max-w-[calc(100%-720px)]">
          {currentView === 'editor' ? <ActiveSectionEditor /> : <WriteUpPreview />}
        </main>

        {currentView === 'editor' && (
          <aside className="w-[400px] min-w-[380px] max-w-[450px] h-full overflow-y-auto border-l-4 border-[#00ff00]">
            <StructureAndAddSectionsPanel />
          </aside>
        )}
      </div>
    </div>
  );
};
    

    