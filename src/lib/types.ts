export type Difficulty = 'Fácil' | 'Medio' | 'Difícil' | 'Insano' | 'Personalizado';
export type OperatingSystem = 'Linux' | 'Windows' | 'macOS' | 'Android' | 'iOS' | 'Otro';
export type SectionType = 'paso' | 'pregunta' | 'flag' | 'notas';

export interface Screenshot {
  id: string;
  name: string;
  dataUrl: string; // Base64 Data URL
}

export interface WriteUpSection {
  id: string;
  type: SectionType;
  title: string;
  content: string; // Markdown content
  answer?: string; // For 'pregunta' type
  flagValue?: string; // For 'flag' type
  screenshots: Screenshot[];
  isTemplate?: boolean; // True if section is from template and not yet modified by user
}

export interface WriteUp {
  id: string; // Added for potential future use (e.g. multiple writeups in a list)
  title: string;
  author: string;
  date: string; // ISO date string
  difficulty: Difficulty;
  tags: string[];
  os: OperatingSystem;
  machineImage?: Screenshot; // Single image as Screenshot object
  sections: WriteUpSection[];
}

// For PDF Export Modal
export type PdfTheme = 'Hacker' | 'Professional-Light' | 'Professional-Dark' | 'Cyberpunk' | 'Minimal';
export type PageSize = 'A4' | 'Letter';
export type PageOrientation = 'Vertical' | 'Horizontal';

export interface PdfExportOptions {
  theme: PdfTheme;
  includeHeader: boolean;
  includeFooter: boolean;
  pageSize: PageSize;
  orientation: PageOrientation;
  fontFamily: string;
  fontSize: number;
  imageQuality: number; // 0-100
  autoSplitSections: boolean;
  pageNumbers: boolean;
  headerText?: string;
  footerText?: string;
}

// For global view state
export type AppView = 'editor' | 'preview';
