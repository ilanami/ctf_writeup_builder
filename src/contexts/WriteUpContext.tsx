
"use client";

import type { ReactNode } from 'react';
import * as React from 'react'; // Changed import
import type { WriteUp, WriteUpSection, SectionType, Screenshot, AppView } from '@/lib/types';
import { createDefaultWriteUp, LOCAL_STORAGE_KEY, createDefaultSection } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

interface WriteUpState {
  writeUp: WriteUp;
  currentView: AppView;
  activeSectionId: string | null;
  isDirty: boolean; // To track unsaved changes for localStorage
}

type WriteUpAction =
  | { type: 'LOAD_WRITEUP'; payload: WriteUp }
  | { type: 'UPDATE_GENERAL_INFO'; payload: Partial<WriteUp> }
  | { type: 'ADD_SECTION'; payload: { type: SectionType; title?: string } }
  | { type: 'ADD_PREBUILT_SECTION'; payload: WriteUpSection }
  | { type: 'ADD_IMPORTED_SECTIONS'; payload: WriteUpSection[] }
  | { type: 'UPDATE_SECTION'; payload: { id: string; data: Partial<WriteUpSection> } }
  | { type: 'DELETE_SECTION'; payload: string } // id of section
  | { type: 'REORDER_SECTIONS'; payload: WriteUpSection[] }
  | { type: 'ADD_SCREENSHOT_TO_SECTION'; payload: { sectionId: string; screenshot: Screenshot } }
  | { type: 'DELETE_SCREENSHOT_FROM_SECTION'; payload: { sectionId: string; screenshotId: string } }
  | { type: 'SET_MACHINE_IMAGE'; payload: Screenshot | undefined }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'RESET_WRITEUP' }
  | { type: 'SET_IS_DIRTY', payload: boolean };

const initialState: WriteUpState = {
  writeUp: createDefaultWriteUp(),
  currentView: 'editor',
  activeSectionId: null,
  isDirty: false,
};

const sanitizeSection = (section: WriteUpSection): WriteUpSection => {
  return {
    ...section,
    screenshots: section.screenshots || [],
    // Ensure title and content are strings, especially if they might be keys or undefined initially
    title: typeof section.title === 'string' ? section.title : '',
    content: typeof section.content === 'string' ? section.content : '',
  };
};

const writeUpReducer = (state: WriteUpState, action: WriteUpAction): WriteUpState => {
  let newState = { ...state, isDirty: true }; // Assume most actions make it dirty

  switch (action.type) {
    case 'LOAD_WRITEUP':
      const loadedWriteUp = {
        ...createDefaultWriteUp(), // Ensure all defaults are present
        ...action.payload,
        sections: (action.payload.sections || []).map(sanitizeSection), 
        machineImage: action.payload.machineImage || undefined, 
        tags: action.payload.tags || [], 
      };
      newState = { ...state, writeUp: loadedWriteUp, isDirty: false, activeSectionId: loadedWriteUp.sections.find(s => !s.isTemplate)?.[0]?.id || loadedWriteUp.sections[0]?.id || null };
      break;
    case 'UPDATE_GENERAL_INFO':
      newState = { ...state, writeUp: { ...state.writeUp, ...action.payload } };
      break;
    case 'ADD_SECTION':
      const newSection = createDefaultSection(action.payload.type, action.payload.title);
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: [...state.writeUp.sections, newSection], 
        },
        activeSectionId: newSection.id, 
      };
      break;
    case 'ADD_PREBUILT_SECTION':
      const prebuiltSectionWithNewId = sanitizeSection({ ...action.payload, id: uuidv4(), isTemplate: false });
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: [...state.writeUp.sections, prebuiltSectionWithNewId],
        },
        activeSectionId: prebuiltSectionWithNewId.id,
      };
      break;
    case 'ADD_IMPORTED_SECTIONS':
      const newSectionsWithNewIds = action.payload.map(sec => sanitizeSection({
        ...sec,
        id: uuidv4(), 
        isTemplate: false, 
      }));
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: [...state.writeUp.sections, ...newSectionsWithNewIds],
        },
        activeSectionId: newSectionsWithNewIds.length > 0 ? newSectionsWithNewIds[0].id : state.activeSectionId,
      };
      break;
    case 'UPDATE_SECTION':
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: state.writeUp.sections.map((s) =>
            s.id === action.payload.id ? sanitizeSection({ ...s, ...action.payload.data, isTemplate: false }) : s
          ),
        },
      };
      break;
    case 'DELETE_SECTION':
      const remainingSections = state.writeUp.sections.filter((s) => s.id !== action.payload);
      let newActiveSectionId = state.activeSectionId;
      if (state.activeSectionId === action.payload) {
        const firstUserSection = remainingSections.find(s => !s.isTemplate);
        const firstSectionOverall = remainingSections[0];
        newActiveSectionId = firstUserSection ? firstUserSection.id : (firstSectionOverall ? firstSectionOverall.id : null);
      }
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: remainingSections,
        },
        activeSectionId: newActiveSectionId,
      };
      break;
    case 'REORDER_SECTIONS':
      newState = { ...state, writeUp: { ...state.writeUp, sections: action.payload.map(sanitizeSection) } };
      break;
    case 'ADD_SCREENSHOT_TO_SECTION':
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: state.writeUp.sections.map((s) =>
            s.id === action.payload.sectionId
              ? sanitizeSection({ ...s, screenshots: [...(s.screenshots || []), action.payload.screenshot], isTemplate: false }) 
              : s
          ),
        },
      };
      break;
    case 'DELETE_SCREENSHOT_FROM_SECTION':
      newState = {
        ...state,
        writeUp: {
          ...state.writeUp,
          sections: state.writeUp.sections.map((s) =>
            s.id === action.payload.sectionId
              ? sanitizeSection({ ...s, screenshots: (s.screenshots || []).filter(sc => sc.id !== action.payload.screenshotId), isTemplate: (s.screenshots || []).length > 1 ? false : s.isTemplate })
              : s
          ),
        },
      };
      break;
    case 'SET_MACHINE_IMAGE':
      newState = { ...state, writeUp: { ...state.writeUp, machineImage: action.payload } };
      break;
    case 'SET_ACTIVE_SECTION':
      newState = { ...state, activeSectionId: action.payload, isDirty: false }; 
      break;
    case 'SET_VIEW':
      newState = { ...state, currentView: action.payload, isDirty: false }; 
      break;
    case 'RESET_WRITEUP':
      const defaultWriteUp = createDefaultWriteUp(); 
      // No active section by default after reset
      newState = { ...initialState, writeUp: defaultWriteUp, isDirty: false, activeSectionId: null };
      break;
    case 'SET_IS_DIRTY':
      newState = { ...state, isDirty: action.payload };
      break;
    default:
      // https://github.com/typescript-eslint/typescript-eslint/issues/6149
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
      const exhaustiveCheck: never = action;
      return state;
  }
  return newState;
};

export const WriteUpContext = React.createContext<{ // Changed createContext to React.createContext
  state: WriteUpState;
  dispatch: React.Dispatch<WriteUpAction>;
} | undefined>(undefined);

export const WriteUpProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = React.useReducer(writeUpReducer, initialState); // Changed useReducer

  React.useEffect(() => { // Changed useEffect
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft: WriteUp = JSON.parse(savedDraft);
        // Sanitize the loaded draft to ensure it matches the expected structure
        const sanitizedDraft = {
          ...createDefaultWriteUp(), // Start with defaults
          ...parsedDraft, // Override with saved values
          sections: (parsedDraft.sections || []).map(sanitizeSection),
          machineImage: parsedDraft.machineImage || undefined,
          tags: Array.isArray(parsedDraft.tags) ? parsedDraft.tags : [],
          // Ensure other fields like title, author, etc., are strings
          title: typeof parsedDraft.title === 'string' ? parsedDraft.title : '',
          author: typeof parsedDraft.author === 'string' ? parsedDraft.author : '',
          date: typeof parsedDraft.date === 'string' ? parsedDraft.date : new Date().toISOString().split('T')[0],
        };
        dispatch({ type: 'LOAD_WRITEUP', payload: sanitizedDraft });
      }
    } catch (error) {
      console.error("Error loading draft from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); 
    }
  }, []);

  React.useEffect(() => { // Changed useEffect
    if (state.isDirty) {
      try {
        const timeoutId = setTimeout(() => {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.writeUp));
          dispatch({ type: 'SET_IS_DIRTY', payload: false }); 
          console.log("Draft saved to localStorage");
        }, 1000); 
        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error saving draft to localStorage:", error);
      }
    }
  }, [state.writeUp, state.isDirty]);


  return (
    <WriteUpContext.Provider value={{ state, dispatch }}>
      {children}
    </WriteUpContext.Provider>
  );
};
