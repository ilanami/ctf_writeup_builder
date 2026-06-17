export interface PdfThemeColors {
  bg: string;
  text: string;
  primary: string;
  accent: string;
  codeBg: string;
  codeColor: string;
  border: string;
}

export const PDF_THEME_COLORS: Record<string, PdfThemeColors> = {
  Hacker:               { bg: '#0a0a0a', text: '#00ff00', primary: '#00ff00', accent: '#00ffff', codeBg: '#1a1a1a', codeColor: '#00ff00', border: '#00cc00' },
  'Professional-Light': { bg: '#ffffff', text: '#333333', primary: '#0056b3', accent: '#007bff', codeBg: '#f8f9fa', codeColor: '#c7254e', border: '#dddddd' },
  'Professional-Dark':  { bg: '#2c2c2c', text: '#e0e0e0', primary: '#5cadff', accent: '#79c3ff', codeBg: '#3a3a3a', codeColor: '#ffc0cb', border: '#555555' },
  Cyberpunk:            { bg: '#0a0a1f', text: '#f0f0f0', primary: '#ff00ff', accent: '#00ffff', codeBg: '#1f1f3d', codeColor: '#00ffff', border: '#ff00ff' },
  Minimal:              { bg: '#f8f8f8', text: '#222222', primary: '#555555', accent: '#777777', codeBg: '#f0f0f0', codeColor: '#333333', border: '#cccccc' },
};

const MAX_IMG_W = 511;
const MAX_IMG_H = 700;

// Recursively parse inline nodes (text, bold, italic, code, links, etc.)
function parseInlineNodes(node: Node, theme: PdfThemeColors): unknown[] {
  const result: unknown[] = [];

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) result.push(text);
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'strong':
      case 'b':
        result.push({ text: parseInlineNodes(el, theme), bold: true });
        break;
      case 'em':
      case 'i':
        result.push({ text: parseInlineNodes(el, theme), italics: true });
        break;
      case 'u':
        result.push({ text: parseInlineNodes(el, theme), decoration: 'underline' });
        break;
      case 'code':
        result.push({ text: el.textContent ?? '', background: theme.codeBg, color: theme.codeColor });
        break;
      case 'a': {
        const href = el.getAttribute('href') ?? '';
        result.push({ text: parseInlineNodes(el, theme), link: href, color: theme.accent, decoration: 'underline' });
        break;
      }
      case 'br':
        result.push('\n');
        break;
      default:
        result.push(...parseInlineNodes(el, theme));
    }
  });

  return result;
}

// Inline array → pdfmake text value (string if single plain string, else array)
function inlineText(nodes: unknown[]): unknown {
  if (nodes.length === 0) return '';
  if (nodes.length === 1 && typeof nodes[0] === 'string') return nodes[0];
  return nodes;
}

// Parse <li> elements; TipTap wraps content in <p> inside each <li>
function parseListItems(listEl: Element, theme: PdfThemeColors): unknown[] {
  const items: unknown[] = [];

  listEl.querySelectorAll(':scope > li').forEach((li) => {
    const pEl = li.querySelector(':scope > p');
    const contentEl = pEl ?? li;
    const text = inlineText(parseInlineNodes(contentEl, theme));

    const nestedUl = li.querySelector(':scope > ul');
    const nestedOl = li.querySelector(':scope > ol');

    if (nestedUl) {
      items.push({ stack: [{ text }, { ul: parseListItems(nestedUl, theme), margin: [0, 2, 0, 0] }] });
    } else if (nestedOl) {
      items.push({ stack: [{ text }, { ol: parseListItems(nestedOl, theme), margin: [0, 2, 0, 0] }] });
    } else {
      items.push(text);
    }
  });

  return items;
}

/**
 * Convert TipTap HTML output to an array of pdfmake content blocks.
 * Must be called in a browser environment (uses DOMParser).
 */
export function htmlToPdfmake(html: string, theme: PdfThemeColors, baseFontSize: number): unknown[] {
  if (!html || typeof window === 'undefined') return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: unknown[] = [];

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'h1':
        blocks.push({ text: el.textContent ?? '', fontSize: 20, bold: true, color: theme.primary, headlineLevel: 1, margin: [0, 10, 0, 4] });
        break;
      case 'h2':
        blocks.push({ text: el.textContent ?? '', fontSize: 16, bold: true, color: theme.primary, headlineLevel: 1, margin: [0, 8, 0, 4] });
        break;
      case 'h3':
        blocks.push({ text: el.textContent ?? '', fontSize: 13, bold: true, color: theme.primary, headlineLevel: 1, margin: [0, 6, 0, 3] });
        break;
      case 'h4':
        blocks.push({ text: el.textContent ?? '', fontSize: 11, bold: true, color: theme.primary, headlineLevel: 1, margin: [0, 4, 0, 2] });
        break;

      case 'p': {
        // Paragraph containing only an image
        const imgEl = el.querySelector('img');
        if (imgEl && el.childNodes.length === 1) {
          const src = imgEl.getAttribute('src') ?? '';
          if (src) blocks.push({ image: src, fit: [MAX_IMG_W, MAX_IMG_H], alignment: 'center', margin: [0, 6, 0, 6] });
          break;
        }
        const text = inlineText(parseInlineNodes(el, theme));
        if (text === '' || (Array.isArray(text) && text.length === 0)) break;
        blocks.push({ text, fontSize: baseFontSize, margin: [0, 0, 0, 6] });
        break;
      }

      case 'ul':
        blocks.push({ ul: parseListItems(el, theme), fontSize: baseFontSize, margin: [0, 0, 0, 6] });
        break;
      case 'ol':
        blocks.push({ ol: parseListItems(el, theme), fontSize: baseFontSize, margin: [0, 0, 0, 6] });
        break;

      case 'pre': {
        const codeEl = el.querySelector('code');
        const text = (codeEl ?? el).textContent ?? '';
        blocks.push({
          text,
          fontSize: Math.max(baseFontSize - 1, 7),
          background: theme.codeBg,
          color: theme.codeColor,
          margin: [0, 4, 0, 6],
          preserveLeadingSpaces: true,
        });
        break;
      }

      case 'img': {
        const src = el.getAttribute('src') ?? '';
        if (src) blocks.push({ image: src, fit: [MAX_IMG_W, MAX_IMG_H], alignment: 'center', margin: [0, 6, 0, 6] });
        break;
      }

      case 'hr':
        blocks.push({
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 511, y2: 0, lineWidth: 1, lineColor: theme.border }],
          margin: [0, 8, 0, 8],
        });
        break;

      case 'blockquote': {
        const text = inlineText(parseInlineNodes(el, theme));
        blocks.push({ text, fontSize: baseFontSize, margin: [10, 0, 0, 6], italics: true, color: theme.accent });
        break;
      }

      default:
        break;
    }
  });

  return blocks;
}
