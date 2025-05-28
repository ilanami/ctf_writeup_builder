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

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const t = useScopedI18n('help');
  
  // Manually construct the faq array from flattened keys
  const faq: { q: string; a: string }[] = [];
  let i = 0;
  while (true) {
    try {
      const qKey = `faq.${i}.q` as any;
      const aKey = `faq.${i}.a` as any;
      const question = t(qKey);
      const answer = t(aKey);
      if (question && answer && question !== qKey && answer !== aKey) {
        faq.push({ q: question, a: answer });
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
            <p className="text-sm">{t('intro')}</p>
            
            <div className="space-y-4">
              {faq.map((item, i) => (
                <div key={i} className="text-sm">
                  <p className="font-bold mb-1">Q: {item.q}</p>
                  <p className="mb-3">A: {item.a}</p>
                </div>
              ))}
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