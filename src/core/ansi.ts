

// Token types for parsed ANSI text
type AnsiToken =
  | { type: 'text'; value: string }
  | { type: 'style'; style: Partial<AnsiStyle> }
  | { type: 'reset' };

interface AnsiStyle {
  color?: string;
  backgroundColor?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
  textDecoration?: 'underline' | 'none';
}

// Helper: escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Color tables for 8-bit and standard colors
const ansiColors: Record<number, string> = {
  // Standard colors (foreground)
  30: '#000000', 31: '#ff4d4f', 32: '#52c41a', 33: '#faad14', 34: '#1677ff', 35: '#d4380d', 36: '#13c2c2', 37: '#ffffff',
  // Bright colors (foreground)
  90: '#bfbfbf', 91: '#ff7875', 92: '#95de64', 93: '#ffe58f', 94: '#69c0ff', 95: '#ff85c0', 96: '#5cdbd3', 97: '#f5f5f5',
  // Standard colors (background)
  40: '#000000', 41: '#ff4d4f', 42: '#52c41a', 43: '#faad14', 44: '#1677ff', 45: '#d4380d', 46: '#13c2c2', 47: '#ffffff',
  // Bright colors (background)
 100: '#bfbfbf', 101: '#ff7875', 102: '#95de64', 103: '#ffe58f', 104: '#69c0ff', 105: '#ff85c0', 106: '#5cdbd3', 107: '#f5f5f5',
};

function parseAnsi(text: string): AnsiToken[] {
  const tokens: AnsiToken[] = [];
  let i = 0;
  let style: AnsiStyle = {};
  let buffer = '';
  const flush = () => {
    if (buffer) {
      tokens.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };
  const setStyle = (s: Partial<AnsiStyle>) => {
    flush();
    style = { ...style, ...s };
    tokens.push({ type: 'style', style: { ...style } });
  };
  const resetStyle = () => {
    flush();
    style = {};
    tokens.push({ type: 'reset' });
  };

  while (i < text.length) {
    if (text[i] === '\x1b' && text[i + 1] === '[') {
      // Find end of CSI
      // Use string matching instead of regex for control characters
      let end = i + 2;
      while (end < text.length && text[end] !== 'm') end++;
      if (text[end] === 'm') {
        const codeStr = text.slice(i + 2, end);
        const codes = codeStr.split(';').map(Number).filter(n => !isNaN(n));
        flush();
        let j = 0;
        while (j < codes.length) {
          const code = codes[j];
          if (code === 0) {
            resetStyle();
          } else if (code === 1) {
            setStyle({ fontWeight: 'bold' });
          } else if (code === 3) {
            setStyle({ fontStyle: 'italic' });
          } else if (code === 4) {
            setStyle({ textDecoration: 'underline' });
          } else if (code === 22) {
            setStyle({ fontWeight: 'normal' });
          } else if (code === 23) {
            setStyle({ fontStyle: 'normal' });
          } else if (code === 24) {
            setStyle({ textDecoration: 'none' });
          } else if ((30 <= code && code <= 37) || (90 <= code && code <= 97)) {
            setStyle({ color: ansiColors[code] });
          } else if ((40 <= code && code <= 47) || (100 <= code && code <= 107)) {
            setStyle({ backgroundColor: ansiColors[code] });
          } else if (code === 38 || code === 48) {
            // 8-bit or true color
            const isFg = code === 38;
            if (codes[j + 1] === 5 && typeof codes[j + 2] === 'number') {
              // 8-bit color
              const color = ansi8bitToHex(codes[j + 2]);
              setStyle(isFg ? { color } : { backgroundColor: color });
              j += 2;
            } else if (codes[j + 1] === 2 && codes.length >= j + 4) {
              // True color
              const r = codes[j + 2], g = codes[j + 3], b = codes[j + 4];
              const color = rgbToHex(r, g, b);
              setStyle(isFg ? { color } : { backgroundColor: color });
              j += 4;
            }
          }
          j++;
        }
        i = end + 1;
        continue;
      }
  // (logic moved to string-matching block above)
    }
    buffer += text[i];
    i++;
  }
  flush();
  return tokens;
}

function ansi8bitToHex(n: number): string {
  // 0-7: standard, 8-15: high intensity, 16-231: 6x6x6 color cube, 232-255: grayscale
  if (n < 16) {
    // Standard colors
    const table = [
      '#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
      '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
    ];
    return table[n] || '#000000';
  } else if (n < 232) {
    n -= 16;
    const r = Math.floor(n / 36), g = Math.floor((n % 36) / 6), b = n % 6;
    return rgbToHex(r * 51, g * 51, b * 51);
  } else {
    // Grayscale
    const gray = 8 + (n - 232) * 10;
    return rgbToHex(gray, gray, gray);
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

async function ansiToHtml(text: string): Promise<string> {
  const tokens = parseAnsi(text);
  let html = '';
  let open = false;
  // let currentStyle: AnsiStyle = {};
  for (const token of tokens) {
    if (token.type === 'text') {
      html += escapeHtml(token.value);
    } else if (token.type === 'style') {
      if (open) html += '</span>';
      html += `<span style="${styleToCss(token.style)}">`;
      open = true;
  // currentStyle = { ...token.style };
    } else if (token.type === 'reset') {
      if (open) html += '</span>';
      open = false;
  // currentStyle = {};
    }
  }
  if (open) html += '</span>';
  return html;
}

function styleToCss(style: Partial<AnsiStyle>): string {
  let css = '';
  if (style.color) css += `color:${style.color};`;
  if (style.backgroundColor) css += `background:${style.backgroundColor};`;
  if (style.fontWeight) css += `font-weight:${style.fontWeight};`;
  if (style.fontStyle) css += `font-style:${style.fontStyle};`;
  if (style.textDecoration) css += `text-decoration:${style.textDecoration};`;
  return css;
}

async function ansiToPlain(text: string): Promise<string> {
  const tokens = parseAnsi(text);
  return tokens
    .filter(t => t.type === 'text')
    .map(t => (t as { value: string }).value)
    .join('');
}

export { ansiToHtml, ansiToPlain };