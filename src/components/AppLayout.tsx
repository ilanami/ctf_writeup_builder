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
import { extractBasicTextFromPDF } from '../utils/pdfExtractorBasic';
import { extractTextAndImagesWithPdfJSEnhanced } from '../utils/pdfExtractorEnhanced';
import ApiKeyConfigModal from './ApiKeyConfigModal';
import AboutModal from './AboutModal';
import HelpModal from './HelpModal';


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

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyConfig, setApiKeyConfig] = useState({ provider: 'gemini', apiKey: '' });
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
      mdContent += `**${t('generalInfo.date')}:** ${writeUp.date ? format(parseISO(writeUp.date), "PPP", { locale: dateLocale }) : t('generalInfo.selectDate')}  \n`;
      
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
            dispatch({ type: 'LOAD_WRITEUP', payload: importedData });
            toast({ title: tt('success'), description: tt('jsonSectionsImported') });
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
    <header className="flex items-center justify-between p-3 border-b-4 border-l-4 border-r-4 border-[#00ff00] bg-background sticky top-0 z-10">
      <div className="flex items-center">
        <TerminalSquare className="h-8 w-8 text-foreground mr-2" />
        <h1 className="text-2xl font-bold text-foreground">
          <span>{t('appTitle')} {'>'}</span><span className="blinking-cursor">_</span>
        </h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
              <PlusCircle className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('new')}
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
        <Button onClick={() => setIsAboutOpen(true)} variant="outline" size="sm" title={t('about.title')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
          <Info className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {t('about.title')}
        </Button>
        <Button onClick={() => setIsHelpOpen(true)} variant="outline" size="sm" title={t('help.title')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
          <HelpCircle className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {t('help.title')}
        </Button>
        <Button onClick={handleExportMd} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}><FileText className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('exportMD')}</Button>
        <PdfExportModal />
        
        <label htmlFor="import-json-input-header" className="mb-0">
          <Button variant="outline" size="sm" asChild className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
            <span><Upload className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('importJSON')}</span>
          </Button>
        </label>
        <input id="import-json-input-header" type="file" accept=".json" onChange={handleImportJson} className="hidden" />

        <label htmlFor="import-md-input-header" className="mb-0">
          <Button variant="outline" size="sm" asChild className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
            <span><FileArchive className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('importMD')}</span>
          </Button>
        </label>
        <input id="import-md-input-header" type="file" accept=".md,.txt,text/markdown" onChange={handleImportMdFile} className="hidden" />
        
        <Button onClick={handleSaveProgress} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}><Save className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('save')}</Button>
        
        <Button onClick={() => setIsApiKeyModalOpen(true)} variant="outline" size="sm" title={tai('configureApiKeyButton')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
          <KeyRound className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('configureApiKey')}
        </Button>
        {isApiKeyModalOpen && (
          <ApiKeyConfigModal
            onSave={handleSaveApiKey}
            onCancel={() => setIsApiKeyModalOpen(false)}
          />
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" title={tDonations('title')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
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

        <Button onClick={toggleView} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
          {currentView === 'editor' ? <Eye className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> : <Edit3 className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} />}
          {currentView === 'editor' ? th('preview') : th('editor')}
        </Button>
        <Button onClick={handleExportJsonBackup} variant="outline" size="sm" className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}><Download className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} /> {th('backup')}</Button>
        <Button onClick={handleLocaleChange} variant="outline" size="sm" title={th('toggleLanguage')} className="border-2 border-[#00ff00] text-[#00ff00] bg-black shadow-[0_0_8px_#00ff00,0_0_2px_#00ff00] font-extrabold uppercase tracking-wider h-7 px-1.5 text-[0.90rem]" style={{ boxShadow: '0 0 8px #00ff00, 0 0 2px #00ff00' }}>
          <Languages className="mr-1 h-3 w-3" style={{ color: '#00ff00', filter: 'drop-shadow(0 0 4px #00ff00)' }} />
          {currentLocale === 'es' ? th('switchToEnglish') : th('switchToSpanish')}
        </Button>
      </div>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
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
    const tempSection = createDefaultSection(type);
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

  return (
    <div className="p-3 space-y-2 h-full flex flex-col bg-card rounded-lg shadow-md border-r-4 border-[#00ff00]">
      <Accordion type="multiple" defaultValue={['structure-panel', 'suggested-sections-panel', 'add-section-panel']} className="w-full">
        {/* Estructura Real */}
        <AccordionItem value="structure-panel">
          <AccordionTrigger className="py-2 hover:no-underline">
            <h3 className="text-lg font-bold text-foreground">
              <span>{tsp('structure')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-2">
            <ScrollArea className="h-[calc(40vh-110px)] min-h-[190px] pr-1">
              <div className="flex flex-col gap-2 pb-2">
                {userSections.length > 0 ? (
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
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        {/* Secciones Sugeridas */}
        <AccordionItem value="suggested-sections-panel">
          <AccordionTrigger className="py-2 hover:no-underline">
            <h3 className="text-lg font-bold text-foreground">
              <span>{tsp('suggestedSections')}&nbsp;&gt;</span><span className="blinking-cursor">_</span>
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-2">
            <ScrollArea className="h-[calc(40vh-110px)] min-h-[190px] pr-1">
              <div className="flex flex-col gap-2 pb-2">
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
                          className="opacity-70 hover:opacity-100 transition-opacity"
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
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background border-t-4 border-b-4 border-l-4 border-[#00ff00]">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[320px] min-w-[300px] max-w-[350px] h-full overflow-y-auto bg-card border-r-4 border-[#00ff00] shadow-md">
          <GeneralInfoPanel />
        </aside>

        <main className="flex-1 h-full overflow-y-auto p-0">
          {currentView === 'editor' ? <ActiveSectionEditor /> : <WriteUpPreview />}
        </main>

        {currentView === 'editor' && (
          <aside className="w-[450px] min-w-[420px] max-w-[550px] h-full overflow-y-auto border-l-4 border-[#00ff00]">
            <StructureAndAddSectionsPanel />
          </aside>
        )}
      </div>
    </div>
  );
};
    

    