
"use client";

import React from 'react';
import type { WriteUpSection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useI18n, useScopedI18n } from '@/locales/client';

interface SectionItemCardProps {
  section: WriteUpSection; 
  icon: React.ReactNode;
  onSelect: () => void;
  onDelete: () => void;
  isActive: boolean;
  className?: string; 
}

export const SectionItemCard: React.FC<SectionItemCardProps> = ({
  section,
  icon,
  onSelect,
  onDelete,
  isActive,
  className,
}) => {
  const t = useI18n();
  const tsp = useScopedI18n('structurePanel');
  const th = useScopedI18n('header');
  const displayTitle = section.title?.startsWith('defaultSections.') || section.title?.startsWith('sectionTypes.') 
    ? t(section.title as any) 
    : section.title;


  return (
    <Card 
      className={cn(
        "transition-all duration-150 ease-in-out cursor-pointer border",
        "bg-card hover:bg-accent/10", 
        isActive ? "border-foreground ring-2 ring-foreground shadow-lg" : "border-border hover:shadow-md",
        className 
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center flex-grow min-w-0">
          {icon}
          <span className={cn("text-sm truncate ml-2", isActive ? "text-foreground font-bold" : "text-foreground font-medium")} title={displayTitle}>
            {displayTitle || tsp('untitledSection')}
          </span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-7 w-7 ml-2 flex-shrink-0" 
              onClick={(e) => { e.stopPropagation(); }}
              aria-label={tsp('deleteSectionAriaLabel', { title: displayTitle })}
            >
              <Trash2 size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tsp('deleteSectionTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {tsp('deleteSectionDescription', { title: displayTitle })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>{th('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete();}} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{th('continue')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
