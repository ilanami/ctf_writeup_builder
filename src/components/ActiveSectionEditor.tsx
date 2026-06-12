"use client";

import React, { useState, useEffect } from 'react';
import { useWriteUp } from '@/hooks/useWriteUp';
import type { WriteUpSection, Screenshot } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WysiwygEditor } from './WysiwygEditor';
import { ImageUploader } from './ImageUploader';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, ClipboardCopy, XCircle, Wand2, PlusCircle } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { STORAGE_KEYS } from '@/lib/constants';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { suggestSectionContent } from '@/ai/flows/section-suggester-flow'; // Comentado para usar API Key del usuario
import { useToast } from '@/hooks/use-toast';
import { useI18n, useScopedI18n } from '@/locales/client';

export const ActiveSectionEditor: React.FC = () => {
  const { state, dispatch } = useWriteUp();
  const { writeUp, activeSectionId, editingSuggestedSection } = state;
  const { toast } = useToast();
  const t = useI18n();
  const ta = useScopedI18n('activeSectionEditor');
  const tt = useScopedI18n('toasts');
  const tai = useScopedI18n('aiConfig');
  const tst = useScopedI18n('sectionTypes');

  const sectionToEdit = editingSuggestedSection || writeUp.sections.find(s => s.id === activeSectionId);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiGeneratedSuggestion, setAiGeneratedSuggestion] = useState<string | null>(null);

  const [editableTitle, setEditableTitle] = useState('');
  const [editableContent, setEditableContent] = useState('');

  const MAX_TITLE_LENGTH = 100;
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (sectionToEdit) {
      if (sectionToEdit.isTemplate) {
        // Sugerida: traducir la clave content
        setEditableTitle(t(sectionToEdit.title as any, {}));
        setEditableContent(t(sectionToEdit.content as any, {}));
      } else if (sectionToEdit.title?.startsWith('sectionTypes.')) {
        // Base: ejemplo/descripcion traducida
        const examples = {
          paso: (tst as any)['paso.example'],
          pregunta: (tst as any)['pregunta.example'],
          flag: (tst as any)['flag.example'],
          notas: (tst as any)['notas.example'],
        };
        const example = examples[sectionToEdit.type];
        if (example && !example.startsWith(sectionToEdit.type)) {
          setEditableContent(example);
        } else {
          const titles = {
            paso: t('sectionTypes.paso.label'),
            pregunta: t('sectionTypes.pregunta.label'),
            flag: t('sectionTypes.flag.label'),
            notas: t('sectionTypes.notas.label'),
          };
          const descriptions = {
            paso: (tst as any)['paso.description'],
            pregunta: (tst as any)['pregunta.description'],
            flag: (tst as any)['flag.description'],
            notas: (tst as any)['notas.description'],
          };
          const title = titles[sectionToEdit.type] || '';
          const description = descriptions[sectionToEdit.type] || '';
          setEditableContent(`<h2>${title}</h2><p><em>${description}</em></p>`);
        }
        setEditableTitle(t(sectionToEdit.title as any, {}));
      } else {
        // Personalizada
        setEditableTitle(sectionToEdit.title);
        setEditableContent(sectionToEdit.content);
      }
    } else {
      setEditableTitle('');
      setEditableContent('');
    }
  }, [sectionToEdit, t, tst, activeSectionId, editingSuggestedSection]);


  if (!sectionToEdit) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed border-border bg-transparent">
        <CardContent className="w-full flex flex-col items-center justify-center">
          <span className="text-glow text-center tracking-wide py-1 font-bold font-mono text-lg block leading-snug">
            {ta('selectSectionToEdit')}<br />{ta('orCreateNew')}
          </span>
        </CardContent>
      </Card>
    );
  }
  
  const displaySectionTitleInHeader = editableTitle;


  const handleSectionChange = (field: keyof WriteUpSection, value: any) => {
    let valueToDispatch = value;
    let extraData: Partial<WriteUpSection> = {};
    if (field === 'title') {
      setEditableTitle(value);
      valueToDispatch = value;
    }
    if (field === 'content') {
      setEditableContent(value);
      valueToDispatch = value;
    }
    // Si estamos editando una sugerida, solo actualizar estado local (sin auto-commit)
    // El usuario debe pulsar "Añadir a estructura" para confirmar
    if (editingSuggestedSection) {
      return;
    }
    // Si es una sección real, actualizar normalmente
    dispatch({ type: 'UPDATE_SECTION', payload: { id: sectionToEdit.id, data: { [field]: valueToDispatch, ...extraData } } });
  };

  const handleAddToStructure = () => {
    if (!editingSuggestedSection) return;
    let content = editableContent;

    // If content is still raw markdown (user didn't edit), convert to HTML
    if (content && !content.trim().startsWith('<')) {
      const lines = content.split('\n');
      if (lines[0].trim().startsWith('##')) {
        lines.shift();
        content = lines.join('\n').replace(/^\n+/, '');
      }
      content = marked.parse(content) as string;
    }

    // Sanitize HTML before storing — defense in depth
    if (typeof window !== 'undefined') {
      content = DOMPurify.sanitize(content);
    }

    const newSection = {
      ...editingSuggestedSection,
      isTemplate: false,
      title: editableTitle,
      content,
    };
    dispatch({ type: 'COMMIT_SUGGESTED_SECTION_EDIT', payload: newSection });
  };

  const handleAddScreenshot = (screenshot: Screenshot) => {
    // No permitir si la sección es plantilla o no tiene título/contenido real
    if (sectionToEdit.isTemplate || !sectionToEdit.title?.trim() || !sectionToEdit.content?.trim()) {
      toast({
        title: ta('editingSection', { title: displaySectionTitleInHeader || ta('untitledSection') }),
        description: ta('untitledSection'),
        variant: 'destructive'
      });
      return;
    }
    dispatch({ type: 'ADD_SCREENSHOT_TO_SECTION', payload: { sectionId: sectionToEdit.id, screenshot } });
  };

  const handleDeleteScreenshot = (screenshotId: string) => {
    dispatch({ type: 'DELETE_SCREENSHOT_FROM_SECTION', payload: { sectionId: sectionToEdit.id, screenshotId } });
  };

  const handleGenerateWithAi = async () => {
    const titleForAi = sectionToEdit.isTemplate && sectionToEdit.title?.startsWith('defaultSections.')
      ? t(sectionToEdit.title as any, {})
      : sectionToEdit.title;

    if (!titleForAi || titleForAi.trim() === "") {
      toast({
        title: ta('titleRequiredForAI'),
        description: ta('ensureTitleForAI'),
        variant: 'destructive',
      });
      return;
    }

    // Leer proveedor y clave desde localStorage
    let provider = 'gemini';
    let apiKey = '';
    try {
      provider = localStorage.getItem(STORAGE_KEYS.aiProvider) || 'gemini';
      const encrypted = localStorage.getItem(STORAGE_KEYS.aiApiKey) || '';
      try {
        apiKey = encrypted ? atob(encrypted) : '';
      } catch {
        apiKey = encrypted;
      }
    } catch (error) {
      console.error("Error reading API key from storage:", error);
    }
    if (!apiKey) {
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
      let suggestion = '';
      const promptText = "Eres un experto en ciberseguridad y Capture The Flag (CTF) y un redactor técnico.\nTu tarea es generar contenido Markdown inicial para una sección específica de un write-up de CTF.\n\nTítulo de la Sección: " + titleForAi + "\nTipo de Sección: " + sectionToEdit.type + "\n" + (aiPrompt ? "Foco/Palabras clave del usuario para esta sección: " + aiPrompt : "") + "\n\nBasándote en esta información, proporciona un borrador Markdown completo y bien formateado para esta sección.\n- Si el tipo de sección es 'paso', describe acciones comunes, herramientas o comandos relevantes para el título y el prompt.\n- Si es 'pregunta', formula una pregunta relevante basada en el título/prompt y proporciona una respuesta común o de ejemplo.\n- Si es 'flag', describe cómo una flag podría encontrarse, formatearse típicamente, o qué podría representar en el contexto del título/prompt.\n- Si es 'notas', proporciona observaciones generales, consejos o puntos de investigación adicionales relacionados con el título/prompt.\n\nUsa Markdown de forma efectiva:\n- Emplea encabezados (ej. ## Sub-encabezado) si es apropiado para la estructura.\n- Usa bloques de código (ej. ```bash ... ```) para comandos o fragmentos de código.\n- Usa listas (con viñetas o numeradas) para pasos o ítems enumerados.\n- Enfatiza términos clave usando **negrita** o *cursiva*.\n\nSé conciso pero informativo. Busca un punto de partida útil que el usuario pueda luego elaborar.\n\nContenido Markdown Generado:\n";
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          provider,
          apiKey
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      suggestion = data.content || '';
      setAiGeneratedSuggestion(suggestion);
      toast({
        title: ta('suggestionGenerated'),
        description: ta('aiGeneratedSuggestionDetails'),
      });
    } catch (error) {
      console.error("Error generating content with AI:", error);
      let errorMessage = '';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      } else {
        errorMessage = tt('unknownError');
      }
      toast({
        title: ta('aiError'),
        description: ta('aiErrorDetails', { errorMessage }),
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

  const currentScreenshots = sectionToEdit.screenshots || [];

  const canAddScreenshot = () => {
    if (sectionToEdit.isTemplate || !sectionToEdit.title?.trim() || !sectionToEdit.content?.trim()) {
      toast({
        title: ta('editingSection', { title: displaySectionTitleInHeader || ta('untitledSection') }),
        description: ta('untitledSection'),
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  const handleTitleChange = (value: string) => {
    const trimmed = value.trimStart();
    if (trimmed.length > MAX_TITLE_LENGTH) {
      setTitleError(`El título no puede superar ${MAX_TITLE_LENGTH} caracteres.`);
    } else if (trimmed.length === 0) {
      setTitleError('El título no puede estar vacío.');
    } else {
      setTitleError(null);
    }
    setEditableTitle(trimmed);
    // Solo despacha si es válido
    if (trimmed.length > 0 && trimmed.length <= MAX_TITLE_LENGTH) {
      handleSectionChange('title', trimmed);
    }
  };

  return (
    <Card className="h-full overflow-y-auto border-border">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-bold text-foreground">{ta('editingSection', { title: displaySectionTitleInHeader || ta('untitledSection') })}</CardTitle>
          {editingSuggestedSection && (
            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToStructure}
                className="w-full btn-glow hover:bg-primary hover:text-primary-foreground uppercase tracking-wider transition-all duration-200"
                aria-label={ta('addSection')}
              >
                <PlusCircle size={18} className="mr-2 icon-glow" />
                {ta('addSection')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'DISCARD_SUGGESTED_SECTION' })}
                className="w-full border-2 border-destructive/60 text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground font-bold uppercase tracking-wider transition-all duration-200"
                aria-label={ta('discardSection')}
              >
                <XCircle size={18} className="mr-2" />
                {ta('discardSection')}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        <div>
          <Label htmlFor={`section-title-${sectionToEdit.id}`}>{ta('sectionTitle')}</Label>
          <Input
            id={`section-title-${sectionToEdit.id}`}
            value={editableTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={MAX_TITLE_LENGTH + 1}
            className={`border-border focus:ring-foreground focus:border-foreground ${titleError ? 'border-destructive' : ''}`}
            readOnly={false}
          />
          {sectionToEdit.isTemplate && sectionToEdit.title?.startsWith('sectionTypes.') && (
            <div className="text-xs text-muted-foreground mt-1">
              <div>{(() => {
                const descriptions = {
                  paso: (tst as any)['paso.description'],
                  pregunta: (tst as any)['pregunta.description'],
                  flag: (tst as any)['flag.description'],
                  notas: (tst as any)['notas.description'],
                };
                return descriptions[sectionToEdit.type] || '';
              })()}</div>
              {(() => {
                const examples = {
                  paso: (tst as any)['paso.example'],
                  pregunta: (tst as any)['pregunta.example'],
                  flag: (tst as any)['flag.example'],
                  notas: (tst as any)['notas.example'],
                };
                const example = examples[sectionToEdit.type];
                return example && !example.startsWith(sectionToEdit.type) ? (
                  <div className="mt-1"><b>Ejemplo:</b> {example}</div>
                ) : null;
              })()}
            </div>
          )}
          {titleError && <p className="text-xs text-destructive mt-1">{titleError}</p>}
        </div>

        {sectionToEdit.type === 'pregunta' && (
          <div>
            <Label htmlFor={`section-answer-${sectionToEdit.id}`}>{ta('answerToQuestion')}</Label>
            <Input
              id={`section-answer-${sectionToEdit.id}`}
              value={sectionToEdit.answer || ''}
              onChange={(e) => handleSectionChange('answer', e.target.value)}
              className="border-border focus:ring-foreground focus:border-foreground"
            />
          </div>
        )}

        {sectionToEdit.type === 'flag' && (
          <div>
            <Label htmlFor={`section-flag-${sectionToEdit.id}`}>{ta('flagValue')}</Label>
            <Input
              id={`section-flag-${sectionToEdit.id}`}
              value={sectionToEdit.flagValue || ''}
              onChange={(e) => handleSectionChange('flagValue', e.target.value)}
              className="border-border focus:ring-foreground focus:border-foreground"
            />
          </div>
        )}
        
        <div>
          <WysiwygEditor
            id={`section-content-${sectionToEdit.id}`}
            label={ta('contentMarkdown')}
            value={editableContent}
            onChange={(value) => handleSectionChange('content', value)}
          />
        </div>
        
        {/* Sección del Asistente IA */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label htmlFor={`ai-prompt-${sectionToEdit.id}`} className="text-lg font-semibold text-foreground flex items-center">
            <Wand2 className="mr-2 h-5 w-5 text-foreground" /> {ta('aiAssistant')}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`ai-prompt-${sectionToEdit.id}`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={ta('aiPromptPlaceholder')}
              disabled={isGeneratingWithAi}
              className="flex-grow border-border focus:ring-foreground focus:border-foreground"
            />
            <Button
              onClick={handleGenerateWithAi}
              disabled={isGeneratingWithAi || !(sectionToEdit.isTemplate && sectionToEdit.title?.startsWith('defaultSections.')
                ? t(sectionToEdit.title as any, {})
                : sectionToEdit.title)?.trim()}
              className="whitespace-nowrap btn-glow hover:bg-primary hover:text-primary-foreground h-8 px-2 text-[0.95rem] flex items-center justify-center uppercase tracking-wider"
            >
              {isGeneratingWithAi ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin icon-glow" /> {ta('generating')}</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4 icon-glow" /> {ta('generateWithAI')}</>
              )}
            </Button>
          </div>
        </div>
        
        {aiGeneratedSuggestion && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={`ai-suggestion-${sectionToEdit.id}`} className="text-foreground font-medium">{ta('aiSuggestion')}</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAiSuggestion}
                  className="btn-glow hover:bg-primary hover:text-primary-foreground h-8 px-2 text-[0.95rem] flex items-center uppercase tracking-wider"
                >
                  <ClipboardCopy className="mr-2 h-4 w-4 icon-glow" /> {ta('copySuggestion')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAiSuggestion}
                  className="btn-glow hover:bg-primary hover:text-primary-foreground h-8 px-2 text-[0.95rem] flex items-center uppercase tracking-wider"
                >
                  <XCircle className="mr-2 h-4 w-4 icon-glow" /> {ta('deleteSuggestion')}
                </Button>
              </div>
            </div>
            <Textarea
              id={`ai-suggestion-${sectionToEdit.id}`}
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
          <ImageUploader onImageUpload={handleAddScreenshot} label={ta('addScreenshot')} canUpload={canAddScreenshot} />
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

    