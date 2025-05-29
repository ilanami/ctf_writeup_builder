import React, { useState } from 'react';
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  // Manually construct the faq array from flattened keys
  const faq: { q: string; a: string; category?: string }[] = [];
  let i = 0;
  while (true) {
    try {
      const qKey = `faq.${i}.q` as any;
      const aKey = `faq.${i}.a` as any;
      const question = t(qKey);
      const answer = t(aKey);
      if (question && answer && question !== qKey && answer !== aKey) {
        // Categorize questions based on content
        let category = 'general';
        if (question.toLowerCase().includes('api') || question.toLowerCase().includes('ia')) {
          category = 'ai';
        } else if (question.toLowerCase().includes('export') || question.toLowerCase().includes('pdf')) {
          category = 'export';
        } else if (question.toLowerCase().includes('privad') || question.toLowerCase().includes('datos')) {
          category = 'privacy';
        } else if (question.toLowerCase().includes('bug') || question.toLowerCase().includes('error')) {
          category = 'support';
        }
        
        faq.push({ q: question, a: answer, category });
        i++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  const categories = [
    { id: 'all', label: t('categories.all'), icon: '📋' },
    { id: 'ai', label: t('categories.ai'), icon: '🤖' },
    { id: 'export', label: t('categories.export'), icon: '📄' },
    { id: 'privacy', label: t('categories.privacy'), icon: '🔒' },
    { id: 'support', label: t('categories.support'), icon: '🛠️' }
  ];

  const filteredFAQ = activeCategory === 'all' 
    ? faq 
    : faq.filter(item => item.category === activeCategory);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return '🤖';
      case 'export': return '📄';
      case 'privacy': return '🔒';
      case 'support': return '🛠️';
      default: return '❓';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-black border-2 border-green-500 text-green-500 font-mono" aria-describedby="help-modal-desc">
        <div id="help-modal-desc" className="sr-only">{t('intro')}</div>
        <DialogHeader className="border-b border-green-500 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-green-500 text-black font-bold rounded">
              ❓
            </div>
            <DialogTitle className="text-2xl font-bold text-green-500 tracking-wider">
              {t('title')}
            </DialogTitle>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
            <span>●</span>
            <span>Knowledge Base</span>
            <span>●</span>
            <span>{faq.length} FAQ Items</span>
            <span>●</span>
            <span>Community Driven</span>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-4 h-[55vh]">
          {/* Category Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📂</span>
                <h3 className="text-lg font-bold text-green-400">{t('categories.label')}</h3>
              </div>
              <div className="space-y-2">
                {categories.map((category) => {
                  const count = category.id === 'all' 
                    ? faq.length 
                    : faq.filter(item => item.category === category.id).length;
                  
                  if (count === 0 && category.id !== 'all') return null;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded border transition-colors ${
                        activeCategory === category.id
                          ? 'bg-green-500/20 border-green-400 text-green-300'
                          : 'bg-green-500/5 border-green-500/30 hover:bg-green-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <span className="text-xs bg-green-500/20 px-2 py-1 rounded">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded">
                <div className="text-sm font-bold text-green-400 mb-2">{t('quickActions.label')}</div>
                <div className="space-y-2 text-xs">
                  <button 
                    onClick={() => window.open('https://github.com/ilanami/ctf_writeup_builder/issues', '_blank')}
                    className="w-full text-left text-green-300 hover:text-green-100 transition-colors"
                  >
                    → {t('quickActions.reportBug')}
                  </button>
                  <button 
                    onClick={() => window.open('mailto:writeup_builder@proton.me', '_blank')}
                    className="w-full text-left text-green-300 hover:text-green-100 transition-colors"
                  >
                    → {t('quickActions.contact')}
                  </button>
                  <button 
                    onClick={() => window.open('https://github.com/ilanami/ctf_writeup_builder/wiki', '_blank')}
                    className="w-full text-left text-green-300 hover:text-green-100 transition-colors"
                  >
                    → {t('quickActions.docs')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="flex-1">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-2">
                {/* Intro */}
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <span className="text-sm font-bold text-green-400">{t('infoTitle')}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{t('intro')}</p>
                </div>

                {/* FAQ Items */}
                {filteredFAQ.length === 0 ? (
                  <div className="text-center py-8 text-green-400">
                    <div className="text-2xl mb-2">🔍</div>
                    <div>{t('noQuestions')}</div>
                  </div>
                ) : (
                  filteredFAQ.map((item, i) => (
                    <div 
                      key={i} 
                      className="border border-green-500/30 rounded-lg overflow-hidden bg-green-500/5 hover:bg-green-500/10 transition-colors"
                    >
                      <button
                        onClick={() => toggleExpanded(i)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-green-500/5"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-sm">{getCategoryIcon(item.category || 'general')}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-green-300 mb-1">
                              Q: {item.q}
                            </div>
                            {expandedItems.has(i) && (
                              <div className="text-sm text-green-200 leading-relaxed mt-2 pl-4 border-l-2 border-green-500/30">
                                <strong className="text-green-400">A:</strong> {item.a}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          <span className={`text-green-400 transition-transform ${expandedItems.has(i) ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </button>
                    </div>
                  ))
                )}

                {/* Contact Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/40 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-400 mb-2">{t('contactTitle')}</div>
                  <div className="text-sm text-green-300 mb-3">
                    {t('contactDesc')}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={() => window.open('mailto:writeup_builder@proton.me', '_blank')}
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-500/10 font-mono text-xs"
                    >
                      📧 Email Support
                    </Button>
                    <Button
                      onClick={() => window.open('https://github.com/ilanami/ctf_writeup_builder/issues', '_blank')}
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-500/10 font-mono text-xs"
                    >
                      🐛 Report Issue
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="border-t border-green-500 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span>💚 {t('communityHelp')}</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setExpandedItems(new Set(filteredFAQ.map((_, i) => i)))}
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500/10 font-mono text-xs"
              >
                📖 {t('expandAll')}
              </Button>
              <Button 
                onClick={onClose} 
                className="bg-green-500 text-black hover:bg-green-400 font-bold font-mono"
              >
                {t('closeButton')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 