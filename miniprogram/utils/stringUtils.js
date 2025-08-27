const calcDisplayLen = (str = '') => {
  let len = 0;
  for (const ch of str) {
    // Unicode < 0x0100 considered half-width (ASCII, basic Latin, etc.) counts 0.5
    len += (/^[\u0000-\u00ff]$/.test(ch) ? 0.5 : 1);
  }
  return len;
};

// limit in display units (e.g., 7). Append ellipsis if exceeded.
const truncateDisplay = (str = '', limit = 7) => {
  if (!str) return '';
  let len = 0;
  let result = '';
  for (const ch of str) {
    const chLen = (/^[\u0000-\u00ff]$/.test(ch) ? 0.5 : 1);
    if (len + chLen > limit) break;
    result += ch;
    len += chLen;
  }
  if (len < calcDisplayLen(str)) {
    result += '…';
  }
  return result;
};

module.exports = {
  calcDisplayLen,
  truncateDisplay
}; 