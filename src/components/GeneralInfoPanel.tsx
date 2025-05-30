"use client";

import React from 'react';
import { useWriteUp } from '@/hooks/useWriteUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { DIFFICULTIES_KEYS, OS_KEYS } from '@/lib/constants';
import type { Difficulty, OperatingSystem, Screenshot } from '@/lib/types';
import { ImageUploader } from './ImageUploader';
import { TagInput } from './TagInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScopedI18n, useCurrentLocale } from '@/locales/client';

export const GeneralInfoPanel: React.FC = () => {
  const { state, dispatch } = useWriteUp();
  const { writeUp } = state;
  const t = useScopedI18n('generalInfo');
  const currentLocale = useCurrentLocale();
  const dateLocale = currentLocale === 'es' ? es : enUS;
  const tDifficulties = useScopedI18n('difficulties');
  const tOS = useScopedI18n('operatingSystems');


  const handleInputChange = (field: keyof typeof writeUp, value: any) => {
    dispatch({ type: 'UPDATE_GENERAL_INFO', payload: { [field]: value } });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      handleInputChange('date', date.toISOString().split('T')[0]);
    }
  };

  const handleMachineImageUpload = (screenshot: Screenshot) => {
    dispatch({ type: 'SET_MACHINE_IMAGE', payload: screenshot });
  };

  const handleMachineImageRemove = () => {
    dispatch({ type: 'SET_MACHINE_IMAGE', payload: undefined });
  };

  return (
    <ScrollArea className="h-full p-1">
      <div className="space-y-4 p-4">
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('title')}</h2>

        <div>
          <Label htmlFor="title">{t('writeupTitle')}</Label>
          <Input
            id="title"
            value={writeUp.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder={t('writeupTitlePlaceholder')}
          />
        </div>

        <div>
          <Label htmlFor="author">{t('author')}</Label>
          <Input
            id="author"
            value={writeUp.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            placeholder={t('authorPlaceholder')}
          />
        </div>

        <div>
          <Label htmlFor="date">{t('date')}</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {writeUp.date ? (() => {
                  try {
                    return format(parseISO(writeUp.date), "PPP", { locale: dateLocale });
                  } catch {
                    return writeUp.date;
                  }
                })() : <span>{t('selectDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
              <Calendar
                mode="single"
                selected={writeUp.date ? parseISO(writeUp.date) : undefined}
                onSelect={handleDateChange}
                locale={dateLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="difficulty">{t('difficulty')}</Label>
          <Select
            value={writeUp.difficulty}
            onValueChange={(value: Difficulty) => handleInputChange('difficulty', value)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder={t('selectDifficulty')} />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES_KEYS.map(dKey => (
                <SelectItem key={dKey} value={dKey}>
                  {tDifficulties(dKey as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
         <div>
          <Label htmlFor="tags">{t('tags')}</Label>
          <TagInput
            id="tags"
            tags={writeUp.tags}
            onTagsChange={(tags) => handleInputChange('tags', tags)}
            placeholder={t('addTag')}
          />
        </div>

        <div>
          <Label htmlFor="os">{t('os')}</Label>
          <Select
            value={writeUp.os}
            onValueChange={(value: OperatingSystem) => handleInputChange('os', value)}
          >
            <SelectTrigger id="os">
              <SelectValue placeholder={t('selectOS')} />
            </SelectTrigger>
            <SelectContent>
              {OS_KEYS.map(osKey => (
                <SelectItem key={osKey} value={osKey}>
                  {tOS(osKey as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="machineImage">{t('machineImage')}</Label>
          <ImageUploader
            id="machineImage"
            onImageUpload={handleMachineImageUpload}
            onImageRemove={handleMachineImageRemove}
            currentImage={writeUp.machineImage}
            label={t('addImage')}
          />
        </div>
      </div>
    </ScrollArea>
  );
};
