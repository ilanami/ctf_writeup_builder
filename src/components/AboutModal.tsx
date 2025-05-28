import React from 'react';
import { useScopedI18n } from '@/locales/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const t = useScopedI18n('about');
  
  // Manually construct the features array from flattened keys
  const features: string[] = [];
  let i = 0;
  while (true) {
    try {
      const key = `features.${i}` as any;
      const feature = t(key);
      if (feature && feature !== key) {
        features.push(feature);
        i++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black border-2 border-green-500 text-green-500 font-mono">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-500">{t('title')}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <p className="text-sm"><b>{t('version')}:</b> 1.0.0</p>
            <p className="text-sm">{t('description')}</p>
            
            <div>
              <h3 className="text-base font-bold mb-2">{t('featuresTitle')}</h3>
              <ul className="text-sm space-y-1 pl-4 list-disc">
                {features.map((feature: string, i: number) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2 text-sm">
              <p><b>{t('author')}:</b> {t('authorName')}</p>
              <p><b>{t('contact')}:</b> <a href={`mailto:${t('contactEmail')}`} className="text-green-500 underline hover:text-green-400">{t('contactEmail')}</a></p>
              <p><b>{t('github')}:</b> <a href={t('githubUrl')} target="_blank" rel="noopener noreferrer" className="text-green-500 underline hover:text-green-400">{t('githubUrl')}</a></p>
            </div>
            
            <div>
              <h4 className="text-sm font-bold mb-1">{t('acknowledgements')}</h4>
              <p className="text-sm">{t('thanks')}</p>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button 
            onClick={onClose} 
            className="bg-green-500 text-black hover:bg-green-400 font-bold font-mono"
          >
            {t('closeButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 