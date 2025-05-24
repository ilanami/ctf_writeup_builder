import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';

if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      const version = pdfjsLib.version || '4.4.168';
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.mjs`;
    } catch (e) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.mjs`;
    }
  }
}

// Patrones para reconocer contenido de CTF (Bilingüe)
const CTF_PATTERNS = {
  // Flags
  flags: [
    /flag\{[^}]+\}/gi,
    /ctf\{[^}]+\}/gi,
    /bandera\{[^}]+\}/gi, // Español
    /\b[a-zA-Z0-9]{20,}\b/g, // Posibles hashes largos
    /user\.txt[:=\s]*([a-zA-Z0-9]+)/gi,
    /root\.txt[:=\s]*([a-zA-Z0-9]+)/gi,
  ],
  
  // Comandos de terminal (Español e Inglés)
  commands: [
    /^\$\s+(.+)$/gm,
    /^#\s+(.+)$/gm,
    /^>\s+(.+)$/gm,
    /^sudo\s+(.+)$/gm,
    /^nmap\s+(.+)$/gm,
    /^gobuster\s+(.+)$/gm,
    /^sqlmap\s+(.+)$/gm,
    /^netcat\s+(.+)$/gm,
    /^nc\s+(.+)$/gm,
    /^curl\s+(.+)$/gm,
    /^wget\s+(.+)$/gm,
    /^python\d?\s+(.+)$/gm,
    /^php\s+(.+)$/gm,
  ],
  
  // URLs e IPs
  network: [
    /https?:\/\/[^\s]+/g,
    /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g,
    /\b(?:[a-f0-9]{1,4}:){7}[a-f0-9]{1,4}\b/gi, // IPv6
    /\b\d{1,5}\/tcp\b/gi,
    /\b\d{1,5}\/udp\b/gi,
  ],
  
  // Títulos de secciones comunes (Bilingüe)
  sections: [
    /^#{1,6}\s*(.+)$/gm,
    // Inglés
    /^(reconnaissance|recon|enumeration|exploitation|privilege escalation|post exploitation|conclusion|overview|summary|methodology|tools used|findings|vulnerabilities)[\s:]*/gmi,
    // Español
    /^(reconocimiento|enumeración|explotación|escalada de privilegios|post explotación|conclusión|resumen|metodología|herramientas utilizadas|hallazgos|vulnerabilidades|análisis|investigación)[\s:]*/gmi,
    // Patrones mixtos
    /^(step \d+|paso \d+|phase \d+|fase \d+)[\s:]*/gmi,
  ],
  
  // Herramientas comunes
  tools: [
    /\b(nmap|gobuster|dirb|dirbuster|nikto|sqlmap|burp|burpsuite|metasploit|john|johntheripper|hashcat|hydra|netcat|nc|wget|curl|ffuf|wfuzz|enum4linux|smbclient|crackmapexec|bloodhound|winpeas|linpeas|pspy|searchsploit|msfconsole|msfvenom)\b/gi,
  ],
  
  // Puertos y servicios (Bilingüe)
  services: [
    /port\s+(\d+)\/?(tcp|udp)?/gi,
    /puerto\s+(\d+)\/?(tcp|udp)?/gi, // Español
    /\b(\d+)\/(tcp|udp)\s+(open|closed|filtered|abierto|cerrado|filtrado)/gi,
    /\b(ssh|http|https|ftp|ftps|smb|rdp|telnet|smtp|dns|snmp|mysql|postgresql|vnc|ldap)\b/gi,
  ],
  
  // Vulnerabilidades
  vulnerabilities: [
    /CVE-\d{4}-\d{4,}/gi,
    /\b(xss|sqli|sql injection|rce|lfi|rfi|csrf|xxe|ssrf|idor|path traversal|directory traversal|buffer overflow|privilege escalation|authentication bypass|code injection|command injection)\b/gi,
    /\b(inyección sql|escalada de privilegios|desbordamiento de buffer|traversal de directorios|inyección de código|inyección de comandos)\b/gi, // Español
  ]
};

// Palabras clave para clasificar secciones (Bilingüe)
const SECTION_KEYWORDS = {
  reconnaissance: {
    en: ['nmap', 'scan', 'discovery', 'reconnaissance', 'recon', 'enumeration', 'footprinting', 'information gathering'],
    es: ['reconocimiento', 'escaneo', 'descubrimiento', 'enumeración', 'recopilación de información', 'análisis']
  },
  exploitation: {
    en: ['exploit', 'payload', 'shell', 'reverse', 'metasploit', 'sqlmap', 'vulnerability', 'attack', 'compromise'],
    es: ['explotación', 'exploit', 'carga útil', 'shell', 'reversa', 'vulnerabilidad', 'ataque', 'compromiso']
  },
  privilege_escalation: {
    en: ['privilege', 'escalation', 'sudo', 'root', 'admin', 'privesc', 'elevation'],
    es: ['privilegios', 'escalada', 'escalación', 'sudo', 'root', 'administrador', 'elevación']
  },
  web_exploitation: {
    en: ['web', 'http', 'burp', 'gobuster', 'dirb', 'xss', 'sql injection', 'web application', 'website'],
    es: ['web', 'http', 'aplicación web', 'sitio web', 'inyección sql', 'xss']
  },
  flags: {
    en: ['flag', 'ctf{', 'flag{', 'user.txt', 'root.txt', 'proof', 'evidence'],
    es: ['bandera', 'flag', 'ctf{', 'flag{', 'user.txt', 'root.txt', 'prueba', 'evidencia']
  },
  notes: {
    en: ['note', 'observation', 'important', 'remember', 'tip', 'remark', 'comment'],
    es: ['nota', 'observación', 'importante', 'recordar', 'consejo', 'comentario', 'apunte']
  }
};

interface ExtractedContent {
  sections: Array<{
    title: string;
    content: string;
    type: 'paso' | 'pregunta' | 'flag' | 'notas';
    flags?: string[];
    commands?: string[];
    urls?: string[];
    ips?: string[];
  }>;
  images: Array<{
    name: string;
    dataUrl: string;
  }>;
}

export const extractTextAndImagesWithPdfJSEnhanced = async (file: File): Promise<ExtractedContent> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const images: Array<{ name: string; dataUrl: string }> = [];
    
    // Extraer texto e imágenes de todas las páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Extraer texto
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n--- Página ${pageNum} ---\n${pageText}\n`;
      
      // Extraer imágenes
      const pageImages = await extractImagesFromPage(page, pageNum);
      images.push(...pageImages);
    }
    
    // Procesar y estructurar el contenido
    const structuredContent = processTextContent(fullText);
    
    return {
      sections: structuredContent,
      images: images
    };
    
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw error;
  }
};

const processTextContent = (text: string): Array<any> => {
  const sections: Array<any> = [];
  
  // Detectar idioma predominante del texto
  const language = detectLanguage(text);
  
  // Buscar y extraer flags
  const foundFlags = extractPatterns(text, CTF_PATTERNS.flags);
  if (foundFlags.length > 0) {
    sections.push({
      title: language === 'es' ? 'Flags Encontradas' : 'Found Flags',
      content: foundFlags.map(flag => `\`${flag}\``).join('\n\n'),
      type: 'flag',
      flags: foundFlags
    });
  }
  
  // Buscar y extraer comandos
  const foundCommands = extractPatterns(text, CTF_PATTERNS.commands);
  if (foundCommands.length > 0) {
    sections.push({
      title: language === 'es' ? 'Comandos Utilizados' : 'Commands Used',
      content: foundCommands.map(cmd => `\`\`\`bash\n${cmd.trim()}\n\`\`\``).join('\n\n'),
      type: 'paso',
      commands: foundCommands
    });
  }
  
  // Buscar información de red
  const networkInfo = [
    ...extractPatterns(text, CTF_PATTERNS.network),
    ...extractPatterns(text, CTF_PATTERNS.services)
  ];
  if (networkInfo.length > 0) {
    sections.push({
      title: language === 'es' ? 'Información de Red' : 'Network Information',
      content: networkInfo.map(info => `- ${info}`).join('\n'),
      type: 'paso',
      urls: networkInfo.filter(info => info.startsWith('http')),
      ips: networkInfo.filter(info => /^\d{1,3}\./.test(info))
    });
  }
  
  // Buscar herramientas mencionadas
  const foundTools = extractPatterns(text, CTF_PATTERNS.tools);
  if (foundTools.length > 0) {
    const uniqueTools = [...new Set(foundTools.map(tool => tool.toLowerCase()))];
    sections.push({
      title: language === 'es' ? 'Herramientas Utilizadas' : 'Tools Used',
      content: uniqueTools.map(tool => `- **${tool}**`).join('\n'),
      type: 'notas'
    });
  }
  
  // Buscar vulnerabilidades
  const foundVulns = extractPatterns(text, CTF_PATTERNS.vulnerabilities);
  if (foundVulns.length > 0) {
    const uniqueVulns = [...new Set(foundVulns.map(vuln => vuln.toLowerCase()))];
    sections.push({
      title: language === 'es' ? 'Vulnerabilidades Identificadas' : 'Identified Vulnerabilities',
      content: uniqueVulns.map(vuln => `- **${vuln}**`).join('\n'),
      type: 'paso'
    });
  }
  
  // Intentar identificar secciones por títulos
  const identifiedSections = identifySectionsByTitles(text, language);
  sections.push(...identifiedSections);
  
  // Si no se encontró contenido estructurado, crear una sección general
  if (sections.length === 0) {
    sections.push({
      title: language === 'es' ? 'Contenido Extraído del PDF' : 'PDF Extracted Content',
      content: text.replace(/--- Página \d+ ---/g, '').replace(/--- Page \d+ ---/g, '').trim(),
      type: 'notas'
    });
  }
  
  return sections;
};

// Función para detectar idioma predominante
const detectLanguage = (text: string): 'en' | 'es' => {
  const spanishWords = ['que', 'con', 'por', 'para', 'una', 'del', 'los', 'las', 'este', 'esta', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'porque', 'cuando', 'muy', 'sin', 'sobre', 'también', 'hasta', 'después', 'desde', 'hacer', 'años', 'tiempo', 'estado', 'mientras', 'durante', 'puede', 'debe', 'manera', 'entonces'];
  const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'run', 'she', 'use', 'way', 'web', 'what', 'when', 'where', 'which', 'with'];
  
  const words = text.toLowerCase().split(/\s+/);
  let spanishCount = 0;
  let englishCount = 0;
  
  words.forEach(word => {
    if (spanishWords.includes(word)) spanishCount++;
    if (englishWords.includes(word)) englishCount++;
  });
  
  return spanishCount > englishCount ? 'es' : 'en';
};

const extractPatterns = (text: string, patterns: RegExp[]): string[] => {
  const results: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches);
    }
  });
  return [...new Set(results)]; // Eliminar duplicados
};

const identifySectionsByTitles = (text: string, language: 'en' | 'es' = 'en'): Array<any> => {
  const sections: Array<any> = [];
  const lines = text.split('\n');
  
  let currentSection: any = null;
  let currentContent: string[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Detectar títulos (líneas que empiecen con # o sean títulos obvios en ambos idiomas)
    const isSectionTitle = 
      /^#{1,6}\s+/.test(trimmedLine) || 
      // Inglés
      /^(reconnaissance|recon|enumeration|exploitation|privilege escalation|post exploitation|conclusion|overview|summary|methodology|tools used|findings|vulnerabilities|step \d+|phase \d+)/i.test(trimmedLine) ||
      // Español
      /^(reconocimiento|enumeración|explotación|escalada de privilegios|post explotación|conclusión|resumen|metodología|herramientas utilizadas|hallazgos|vulnerabilidades|análisis|investigación|paso \d+|fase \d+)/i.test(trimmedLine) ||
      // Patrones numerados
      /^\d+[\.\)]\s+/.test(trimmedLine) ||
      // Líneas en mayúsculas (posibles títulos)
      (/^[A-Z\s]{3,}$/.test(trimmedLine) && trimmedLine.length < 50);
    
    if (isSectionTitle) {
      // Guardar sección anterior si existe
      if (currentSection && currentContent.length > 0) {
        currentSection.content = currentContent.join('\n').trim();
        if (currentSection.content && currentSection.content.length > 10) { // Mínimo de contenido
          sections.push(currentSection);
        }
      }
      
      // Crear nueva sección
      const title = trimmedLine
        .replace(/^#{1,6}\s*/, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .trim();
      
      if (title.length > 0) {
        const sectionType = classifySectionType(title, '');
        
        currentSection = {
          title: title,
          content: '',
          type: sectionType
        };
        currentContent = [];
      }
    } else if (trimmedLine && 
               !trimmedLine.startsWith('--- Página') && 
               !trimmedLine.startsWith('--- Page') &&
               trimmedLine.length > 3) {
      // Agregar contenido a la sección actual
      currentContent.push(trimmedLine);
    }
  });
  
  // Agregar última sección
  if (currentSection && currentContent.length > 0) {
    currentSection.content = currentContent.join('\n').trim();
    if (currentSection.content && currentSection.content.length > 10) {
      sections.push(currentSection);
    }
  }
  
  return sections;
};

const classifySectionType = (title: string, content?: string): 'paso' | 'pregunta' | 'flag' | 'notas' => {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content?.toLowerCase() || '';
  const combinedText = `${lowerTitle} ${lowerContent}`;
  
  // Buscar palabras clave en inglés y español
  const hasKeywords = (category: keyof typeof SECTION_KEYWORDS) => {
    const keywords = SECTION_KEYWORDS[category];
    return [...keywords.en, ...keywords.es].some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
  };
  
  // Clasificar por palabras clave (bilingüe)
  if (hasKeywords('flags')) {
    return 'flag';
  }
  
  if (hasKeywords('reconnaissance') || 
      hasKeywords('exploitation') || 
      hasKeywords('privilege_escalation') || 
      hasKeywords('web_exploitation')) {
    return 'paso';
  }
  
  // Detectar preguntas por patrones típicos
  if (lowerTitle.includes('?') || 
      lowerTitle.includes('question') || 
      lowerTitle.includes('pregunta') ||
      lowerTitle.includes('how') ||
      lowerTitle.includes('what') ||
      lowerTitle.includes('why') ||
      lowerTitle.includes('cómo') ||
      lowerTitle.includes('qué') ||
      lowerTitle.includes('por qué')) {
    return 'pregunta';
  }
  
  // Por defecto, usar 'notas'
  return 'notas';
};

const extractImagesFromPage = async (page: any, pageNum: number): Promise<Array<{ name: string; dataUrl: string }>> => {
  const images: Array<{ name: string; dataUrl: string }> = [];
  
  try {
    // Método más robusto para extraer imágenes
    const operatorList = await page.getOperatorList();
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imageName = operatorList.argsArray[i][0];
        
        try {
          // Esperar a que el objeto esté disponible
          await new Promise((resolve, reject) => {
            const checkImage = () => {
              const image = page.objs.get(imageName);
              if (image) {
                resolve(image);
              } else {
                // Esperar un poco más si no está listo
                setTimeout(() => {
                  const image2 = page.objs.get(imageName);
                  if (image2) {
                    resolve(image2);
                  } else {
                    reject(new Error(`Image ${imageName} not available`));
                  }
                }, 100);
              }
            };
            checkImage();
          });
          
          const image = page.objs.get(imageName);
          if (image && image.data) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.warn(`Cannot get canvas context for image ${imageName}`);
              continue;
            }
            
            canvas.width = image.width || 100;
            canvas.height = image.height || 100;
            
            try {
              const imageData = ctx.createImageData(canvas.width, canvas.height);
              
              // Manejar diferentes formatos de imagen de manera más segura
              if (image.kind === 1 && image.data.length >= imageData.data.length) { 
                // RGBA
                imageData.data.set(image.data.slice(0, imageData.data.length));
              } else if (image.kind === 2) { 
                // RGB - convertir a RGBA
                const rgbData = image.data;
                for (let j = 0, k = 0; j < rgbData.length && k < imageData.data.length - 3; j += 3, k += 4) {
                  imageData.data[k] = rgbData[j] || 0;       // R
                  imageData.data[k + 1] = rgbData[j + 1] || 0; // G  
                  imageData.data[k + 2] = rgbData[j + 2] || 0; // B
                  imageData.data[k + 3] = 255;               // A
                }
              } else if (image.kind === 3) { 
                // Grayscale - convertir a RGBA
                const grayData = image.data;
                for (let j = 0, k = 0; j < grayData.length && k < imageData.data.length - 3; j++, k += 4) {
                  const gray = grayData[j] || 0;
                  imageData.data[k] = gray;     // R
                  imageData.data[k + 1] = gray; // G
                  imageData.data[k + 2] = gray; // B
                  imageData.data[k + 3] = 255;  // A
                }
              } else {
                // Formato desconocido - crear imagen en blanco
                console.warn(`Unknown image format for ${imageName}, kind: ${image.kind}`);
                for (let k = 0; k < imageData.data.length; k += 4) {
                  imageData.data[k] = 200;     // R
                  imageData.data[k + 1] = 200; // G
                  imageData.data[k + 2] = 200; // B
                  imageData.data[k + 3] = 255; // A
                }
              }
              
              ctx.putImageData(imageData, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              
              images.push({
                name: `page_${pageNum}_image_${images.length + 1}.png`,
                dataUrl: dataUrl
              });
              
            } catch (canvasError) {
              console.warn(`Error processing image data for ${imageName}:`, canvasError);
            }
          }
        } catch (imageError) {
          console.warn(`Error extracting image ${imageName} from page ${pageNum}:`, imageError);
          // Continuar con la siguiente imagen en lugar de fallar completamente
        }
      }
    }
  } catch (error) {
    console.warn(`Error extracting images from page ${pageNum}:`, error);
  }
  
  return images;
}; 