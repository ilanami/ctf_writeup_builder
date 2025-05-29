import type { WriteUp, WriteUpSection, Difficulty, OperatingSystem, SectionType, PdfExportOptions, PdfTheme, PageSize, PageOrientation } from './types';
import { v4 as uuidv4 } from 'uuid';
import { FileText, Flag, HelpCircle, PlaySquare, ListChecks, Users, Server, Brain, FileType as NotesIcon } from 'lucide-react';

export const DIFFICULTIES_KEYS: Difficulty[] = ['Fácil', 'Medio', 'Difícil', 'Insano', 'Personalizado'];
export const OS_KEYS: OperatingSystem[] = ['Linux', 'Windows', 'macOS', 'Android', 'iOS', 'Otro'];
export const SECTION_TYPES_KEYS: SectionType[] = ['paso', 'pregunta', 'flag', 'notas'];


export interface SectionTypeUIDefinition {
  value: SectionType;
  icon?: React.ElementType;
  defaultContent?: string;
}

export const createDefaultSection = (type: SectionType = 'paso', title?: string, t?: (key: string) => string): WriteUpSection => {
  const key = `sectionTypes.${type}.label`;
  const defaultTitle = title || (t ? t(key) : key);
  const exampleKey = `sectionTypes.${type}.example`;
  return {
    id: uuidv4(),
    type,
    title: defaultTitle,
    content: t ? t(exampleKey) : `## ${defaultTitle}\n\nContenido de la sección...`,
    screenshots: [],
    isTemplate: false,
  };
};

export const SECTION_TYPES_DETAILS: Array<{ value: SectionType; icon: React.ElementType }> = [
  { value: 'paso', icon: PlaySquare },
  { value: 'pregunta', icon: HelpCircle },
  { value: 'flag', icon: Flag },
  { value: 'notas', icon: NotesIcon },
];

export const DEFAULT_SECTIONS_TEMPLATE_KEYS: Array<{ titleKey: string; type: SectionType; contentKey: string }> = [
  { titleKey: 'initialReconnaissance', type: 'paso', contentKey: 'initialReconnaissanceContent' },
  { titleKey: 'webEnumeration', type: 'paso', contentKey: 'webEnumerationContent' },
  { titleKey: 'exploitation', type: 'paso', contentKey: 'exploitationContent' },
  { titleKey: 'privilegeEscalation', type: 'paso', contentKey: 'privilegeEscalationContent' },
  { titleKey: 'userFlag', type: 'flag', contentKey: 'userFlagContent' },
  { titleKey: 'rootFlag', type: 'flag', contentKey: 'rootFlagContent' },
  { titleKey: 'mainVulnerability', type: 'pregunta', contentKey: 'mainVulnerabilityContent' },
  { titleKey: 'lessonsLearned', type: 'notas', contentKey: 'lessonsLearnedContent' },
];


export const createDefaultWriteUp = (): WriteUp => ({
  id: uuidv4(),
  title: "", // Changed from translation key to empty string
  author: "", // Changed from translation key to empty string
  date: new Date().toISOString().split('T')[0],
  difficulty: 'Medio',
  tags: [],
  os: 'Linux',
  machineImage: undefined,
  sections: DEFAULT_SECTIONS_TEMPLATE_KEYS.map(sec => ({
    id: uuidv4(),
    type: sec.type,
    title: `defaultSections.${sec.titleKey}`,
    content: `defaultSectionsContent.${sec.contentKey}`,
    screenshots: [],
    isTemplate: true,
  })),
});

export const PDF_THEMES_KEYS: PdfTheme[] = ['Hacker', 'Professional-Light', 'Professional-Dark', 'Cyberpunk', 'Minimal'];
export const PDF_PAGE_SIZES: PageSize[] = ['A4', 'Letter'];
export const PDF_PAGE_ORIENTATIONS_KEYS: PageOrientation[] = ['Vertical', 'Horizontal'];


export const DEFAULT_PDF_EXPORT_OPTIONS: PdfExportOptions = {
  theme: 'Hacker',
  includeHeader: true,
  includeFooter: true,
  pageSize: 'A4',
  orientation: 'Vertical',
  fontFamily: 'Fira Code',
  fontSize: 10,
  imageQuality: 90,
  autoSplitSections: true,
  pageNumbers: true,
  headerText: '',
  footerText: '',
};

export const LOCAL_STORAGE_KEY = 'ctfWriteUpBuilder_draft';

export const getSectionItemIcon = (type: SectionType, titleKey: string = '') => {
  const lowerTitleKey = titleKey.toLowerCase();
  if (lowerTitleKey.includes('user') || lowerTitleKey.includes('usuario')) return Users;
  if (lowerTitleKey.includes('root') || lowerTitleKey.includes('admin')) return Server;
  if (lowerTitleKey.includes('recon') || lowerTitleKey.includes('enum')) return Brain;

  const sectionDetail = SECTION_TYPES_DETAILS.find(s => s.value === type);
  return sectionDetail?.icon || ListChecks;
};
