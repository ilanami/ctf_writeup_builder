
"use client";

import React, { useState, useEffect } from 'react';
import { useWriteUp } from '@/hooks/useWriteUp';
import type { WriteUpSection, Screenshot } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownEditor } from './MarkdownEditor';
import { ImageUploader } from './ImageUploader';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, ClipboardCopy, XCircle, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { suggestSectionContent } from '@/ai/flows/section-suggester-flow'; // Comentado para usar API Key del usuario
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { useToast } from '@/hooks/use-toast';
import { useI18n, useScopedI18n } from '@/locales/client';

const USER_GOOGLE_AI_API_KEY_NAME = 'USER_GOOGLE_AI_API_KEY';

export const ActiveSectionEditor: React.FC = () => {
  const { state, dispatch } = useWriteUp();
  const { writeUp, activeSectionId } = state;
  const { toast } = useToast();
  const t = useI18n();
  const ta = useScopedI18n('activeSectionEditor');
  const tt = useScopedI18n('toasts');
  const tai = useScopedI18n('aiConfig');

  const activeSection = writeUp.sections.find(s => s.id === activeSectionId);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiGeneratedSuggestion, setAiGeneratedSuggestion] = useState<string | null>(null);

  const [editableTitle, setEditableTitle] = useState('');
  const [editableContent, setEditableContent] = useState('');

  useEffect(() => {
    if (activeSection) {
      // Si el título/contenido es una clave de plantilla, traduce. Si no, usa el valor literal.
      const titleIsKey = activeSection.isTemplate && activeSection.title?.startsWith('defaultSections.');
      const contentIsKey = activeSection.isTemplate && activeSection.content?.startsWith('defaultSectionsContent.');
      
      setEditableTitle(titleIsKey ? t(activeSection.title as any) : activeSection.title);
      setEditableContent(contentIsKey ? t(activeSection.content as any) : activeSection.content);
    } else {
      setEditableTitle('');
      setEditableContent('');
    }
  }, [activeSection, t]);


  if (!activeSection) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed border-border">
        <CardContent className="text-center text-muted-foreground">
          <p className="text-lg">{ta('selectSectionToEdit')}</p>
          <p className="text-sm">{ta('orCreateNew')}</p>
        </CardContent>
      </Card>
    );
  }
  
  const displaySectionTitleInHeader = activeSection.isTemplate && activeSection.title?.startsWith('defaultSections.')
    ? t(activeSection.title as any)
    : activeSection.title;


  const handleSectionChange = (field: keyof WriteUpSection, value: any) => {
    let valueToDispatch = value;
    if (field === 'title') {
      setEditableTitle(value);
      valueToDispatch = value;
    }
    if (field === 'content') {
      setEditableContent(value);
      valueToDispatch = value;
    }
    dispatch({ type: 'UPDATE_SECTION', payload: { id: activeSection.id, data: { [field]: valueToDispatch } } });
  };

  const handleAddScreenshot = (screenshot: Screenshot) => {
    dispatch({ type: 'ADD_SCREENSHOT_TO_SECTION', payload: { sectionId: activeSection.id, screenshot } });
  };

  const handleDeleteScreenshot = (screenshotId: string) => {
    dispatch({ type: 'DELETE_SCREENSHOT_FROM_SECTION', payload: { sectionId: activeSection.id, screenshotId } });
  };

  const handleGenerateWithAi = async () => {
    const titleForAi = activeSection.isTemplate && activeSection.title?.startsWith('defaultSections.')
      ? t(activeSection.title as any)
      : activeSection.title;

    if (!titleForAi || titleForAi.trim() === "") {
      toast({
        title: ta('titleRequiredForAI'),
        description: ta('ensureTitleForAI'),
        variant: 'destructive',
      });
      return;
    }

    const userApiKey = localStorage.getItem(USER_GOOGLE_AI_API_KEY_NAME);
    if (!userApiKey) {
      toast({
        title: tai('apiKeyMissingTitle'),
        description: tai('apiKeyMissingDescription'),
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingWithAi(true);
    setAiGeneratedSuggestion(null);
    try {
      const genAI = new GoogleGenerativeAI(userApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Usamos gemini-1.5-flash, más rápido y económico

      const generationConfig = {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];
      
      const promptText = `Eres un experto en ciberseguridad y Capture The Flag (CTF) y un redactor técnico.
Tu tarea es generar contenido Markdown inicial para una sección específica de un write-up de CTF.

Título de la Sección: ${titleForAi}
Tipo de Sección: ${activeSection.type}
${aiPrompt ? `Foco/Palabras clave del usuario para esta sección: ${aiPrompt}` : ''}

Basándote en esta información, proporciona un borrador Markdown completo y bien formateado para esta sección.
- Si el tipo de sección es 'paso', describe acciones comunes, herramientas o comandos relevantes para el título y el prompt.
- Si es 'pregunta', formula una pregunta relevante basada en el título/prompt y proporciona una respuesta común o de ejemplo.
- Si es 'flag', describe cómo una flag podría encontrarse, formatearse típicamente, o qué podría representar en el contexto del título/prompt.
- Si es 'notas', proporciona observaciones generales, consejos o puntos de investigación adicionales relacionados con el título/prompt.

Usa Markdown de forma efectiva:
- Emplea encabezados (ej. ## Sub-encabezado) si es apropiado para la estructura.
- Usa bloques de código (ej. \`\`\`bash ... \`\`\`) para comandos o fragmentos de código.
- Usa listas (con viñetas o numeradas) para pasos o ítems enumerados.
- Enfatiza términos clave usando **negrita** o *cursiva*.

Sé conciso pero informativo. Busca un punto de partida útil que el usuario pueda luego elaborar.

Contenido Markdown Generado:
`;

      const result = await model.generateContent(promptText, {generationConfig, safetySettings});
      const response = result.response;
      const suggestion = response.text();
      
      setAiGeneratedSuggestion(suggestion);
      toast({
        title: ta('suggestionGenerated'),
        description: ta('aiGeneratedSuggestionDetails'),
      });
    } catch (error) {
      console.error("Error generating content with AI:", error);
      const errorMessage = error instanceof Error ? error.message : tt('unknownError');
      toast({
        title: ta('aiError'),
        description: ta('aiErrorDetails', {errorMessage}),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingWithAi(false);
    }
  };


  const handleCopyAiSuggestion = () => {
    if (aiGeneratedSuggestion) {
      navigator.clipboard.writeText(aiGeneratedSuggestion)
        .then(() => {
          toast({ title: ta('copied'), description: ta('aiSuggestionCopied') });
        })
        .catch(err => {
          console.error('Failed to copy AI suggestion: ', err);
          toast({ title: ta('errorCopying'), description: ta('couldNotCopySuggestion'), variant: 'destructive' });
        });
    }
  };

  const handleClearAiSuggestion = () => {
    setAiGeneratedSuggestion(null);
  };

  const currentScreenshots = activeSection.screenshots || [];

  return (
    <Card className="h-full overflow-y-auto border-border">
      <CardHeader>
        <CardTitle className="text-foreground font-bold">{ta('editingSection', { title: displaySectionTitleInHeader || ta('untitledSection') })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        <div>
          <Label htmlFor={`section-title-${activeSection.id}`}>{ta('sectionTitle')}</Label>
          <Input
            id={`section-title-${activeSection.id}`}
            value={editableTitle} 
            onChange={(e) => handleSectionChange('title', e.target.value)}
            className="border-border focus:ring-foreground focus:border-foreground"
          />
        </div>

        {activeSection.type === 'pregunta' && (
          <div>
            <Label htmlFor={`section-answer-${activeSection.id}`}>{ta('answerToQuestion')}</Label>
            <Input
              id={`section-answer-${activeSection.id}`}
              value={activeSection.answer || ''}
              onChange={(e) => handleSectionChange('answer', e.target.value)}
              className="border-border focus:ring-foreground focus:border-foreground"
            />
          </div>
        )}

        {activeSection.type === 'flag' && (
          <div>
            <Label htmlFor={`section-flag-${activeSection.id}`}>{ta('flagValue')}</Label>
            <Input
              id={`section-flag-${activeSection.id}`}
              value={activeSection.flagValue || ''}
              onChange={(e) => handleSectionChange('flagValue', e.target.value)}
              className="border-border focus:ring-foreground focus:border-foreground"
            />
          </div>
        )}
        
        <div>
          <MarkdownEditor
            id={`section-content-${activeSection.id}`}
            label={ta('contentMarkdown')}
            value={editableContent} 
            onChange={(value) => handleSectionChange('content', value)}
            rows={15}
          />
        </div>
        
        {/* Sección del Asistente IA */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label htmlFor={`ai-prompt-${activeSection.id}`} className="text-lg font-semibold text-foreground flex items-center">
            <Wand2 className="mr-2 h-5 w-5 text-foreground" /> {ta('aiAssistant')}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`ai-prompt-${activeSection.id}`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={ta('aiPromptPlaceholder')}
              disabled={isGeneratingWithAi}
              className="flex-grow border-border focus:ring-foreground focus:border-foreground"
            />
            <Button onClick={handleGenerateWithAi} disabled={isGeneratingWithAi || !(activeSection.isTemplate && activeSection.title?.startsWith('defaultSections.')
      ? t(activeSection.title as any)
      : activeSection.title)?.trim()} className="whitespace-nowrap bg-foreground text-primary-foreground font-bold">
              {isGeneratingWithAi ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {ta('generating')}</>
              ) : (
                <>✨ {ta('generateWithAI')}</>
              )}
            </Button>
          </div>
        </div>
        
        {aiGeneratedSuggestion && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={`ai-suggestion-${activeSection.id}`} className="text-foreground font-medium">{ta('aiSuggestion')}</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAiSuggestion} className="text-foreground font-bold border-border hover:bg-accent hover:text-accent-foreground">
                  <ClipboardCopy className="mr-2 h-4 w-4" /> {ta('copySuggestion')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAiSuggestion} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 border-destructive hover:border-destructive">
                  <XCircle className="mr-2 h-4 w-4" /> {ta('deleteSuggestion')}
                </Button>
              </div>
            </div>
            <Textarea
              id={`ai-suggestion-${activeSection.id}`}
              value={aiGeneratedSuggestion}
              readOnly
              rows={10}
              className="bg-muted/50 focus:ring-foreground focus:border-foreground border-border"
              placeholder={ta('aiSuggestion')}
            />
          </div>
        )}

        <div>
          <Label>{ta('screenshots')}</Label>
          <ImageUploader onImageUpload={handleAddScreenshot} label={ta('addScreenshot')} />
          {currentScreenshots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {currentScreenshots.map(ss => (
                <div key={ss.id} className="relative group border border-border rounded-md p-1">
                  <Image src={ss.dataUrl} alt={ss.name} width={100} height={75} className="rounded object-contain w-full h-auto max-h-24" data-ai-hint="screenshot terminal"/>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteScreenshot(ss.id)}
                    aria-label={ta('deleteScreenshot', { title: ss.name })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

    