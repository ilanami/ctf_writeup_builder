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
  // Construir features desde las claves i18n
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
      <DialogContent className="max-w-4xl max-h-[85vh] bg-black border-2 border-green-500 text-green-500 font-mono" aria-describedby="about-modal-desc">
        <div id="about-modal-desc" className="sr-only">{t('description')}</div>
        <DialogHeader className="border-b border-green-500 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-green-500 text-black font-bold rounded">
              🏴‍☠️
            </div>
            <DialogTitle className="text-2xl font-bold text-green-500 tracking-wider">
              {t('title')} <span className="text-green-400">v1.0.0</span>
            </DialogTitle>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
            <span>●</span>
            <span>Status: OPERATIONAL</span>
            <span>●</span>
            <span>Security: A+</span>
            <span>●</span>
            <span>Ready for CTF</span>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-6 py-2">
            {/* Misión */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <h3 className="text-lg font-bold text-green-400">MISSION</h3>
              </div>
              <p className="text-sm leading-relaxed">{t('description')}</p>
            </div>
            {/* Features */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h3 className="text-lg font-bold text-green-400">{t('featuresTitle')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">▶</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Tech Stack */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🛠️</span>
                <h3 className="text-lg font-bold text-green-400">TECH STACK</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-green-500/5 border border-green-500/20 rounded p-2 text-center">
                  <div className="font-bold text-green-400">Frontend</div>
                  <div>Next.js 15</div>
                  <div>React 18</div>
                  <div>TypeScript</div>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded p-2 text-center">
                  <div className="font-bold text-green-400">Styling</div>
                  <div>Tailwind CSS</div>
                  <div>Custom Terminal</div>
                  <div>Responsive</div>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded p-2 text-center">
                  <div className="font-bold text-green-400">AI</div>
                  <div>Google Gemini</div>
                  <div>OpenAI GPT</div>
                  <div>Smart Prompts</div>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded p-2 text-center">
                  <div className="font-bold text-green-400">Security</div>
                  <div>DOMPurify</div>
                  <div>Input Sanitization</div>
                  <div>XSS Protection</div>
                </div>
              </div>
            </div>
            {/* Developer Info */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👨‍💻</span>
                <h3 className="text-lg font-bold text-green-400">DEVELOPER</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Name:</span>
                    <span>Ilana Aminoff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Handle:</span>
                    <span className="bg-green-500/20 px-2 py-1 rounded text-green-300">@ilanami</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Focus:</span>
                    <span>Cybersecurity & CTF</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Contact:</span>
                    <a 
                      href="mailto:writeup_builder@proton.me" 
                      className="text-green-300 underline hover:text-green-100 transition-colors"
                    >
                      writeup_builder@proton.me
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">GitHub:</span>
                    <a 
                      href="https://github.com/ilanami" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-green-300 underline hover:text-green-100 transition-colors"
                    >
                      github.com/ilanami
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Repository:</span>
                    <a 
                      href="https://github.com/ilanami/ctf_writeup_builder" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-green-300 underline hover:text-green-100 transition-colors"
                    >
                      /ctf_writeup_builder
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <h3 className="text-lg font-bold text-green-400">PROJECT STATS</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">100%</div>
                  <div>Security Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">2</div>
                  <div>AI Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">∞</div>
                  <div>Write-ups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">0</div>
                  <div>Data Tracking</div>
                </div>
              </div>
            </div>
            {/* Acknowledgments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🙏</span>
                <h3 className="text-lg font-bold text-green-400">{t('acknowledgements')}</h3>
              </div>
              <p className="text-sm leading-relaxed bg-green-500/5 border border-green-500/20 rounded p-3">
                {t('thanks')}
              </p>
            </div>
            {/* Call to Action */}
            <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/40 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-400 mb-2">Ready to dominate CTFs? 🏴‍☠️</div>
              <div className="text-sm text-green-300">
                Create professional write-ups with AI assistance and secure your victories!
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="border-t border-green-500 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span>Made with ❤️ for the CTF community</span>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.open('https://github.com/ilanami/ctf_writeup_builder', '_blank')}
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500/10 font-mono text-xs"
              >
                ⭐ Star on GitHub
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