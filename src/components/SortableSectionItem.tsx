"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WriteUpSection } from '@/lib/types';
import { SectionItemCard } from './SectionItemCard';

interface SortableSectionItemProps {
  section: WriteUpSection;
  icon: React.ReactNode;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  className?: string;
}

export function SortableSectionItem({
  section,
  icon,
  isActive,
  onSelect,
  onDelete,
  className,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#003300' : undefined,
    width: '100%',
    minWidth: 0,
    margin: 0,
    boxSizing: 'border-box',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SectionItemCard
        section={section}
        icon={icon}
        isActive={isActive}
        onSelect={onSelect}
        onDelete={onDelete}
        className={className}
      />
    </div>
  );
}