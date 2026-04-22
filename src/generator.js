// licenseme — license generator. Free forever from vøiddo. https://voiddo.com/tools/licenseme/

const licenses = require('./licenses');
const { resolveAlias } = licenses;

function resolveType(type) {
  if (!type) return null;
  const direct = licenses[String(type).toLowerCase()];
  if (direct && direct.template) return String(type).toLowerCase();
  return resolveAlias(type);
}

function generate(type, options = {}) {
  const key = resolveType(type);
  if (!key) return null;
  const license = licenses[key];

  const year = options.year || new Date().getFullYear();
  const name = options.name || 'Your Name';

  return license.template
    .replace(/\{year\}/g, year)
    .replace(/\{name\}/g, name);
}

function generateHeader(type, options = {}) {
  const key = resolveType(type);
  if (!key) return null;
  const license = licenses[key];

  const year = options.year || new Date().getFullYear();
  const name = options.name || 'Your Name';
  const file = options.file || '';

  const style = options.style || 'jsblock';

  const body = [
    file ? `${file}` : null,
    `Copyright (c) ${year} ${name}`,
    `SPDX-License-Identifier: ${license.spdx}`,
    '',
    `Licensed under the ${license.name}. See LICENSE file for full text.`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  if (style === 'jsblock') {
    return '/*\n' + body.split('\n').map((l) => ' * ' + l).join('\n') + '\n */\n';
  }
  if (style === 'jsline' || style === 'jsline2') {
    return body.split('\n').map((l) => '// ' + l).join('\n') + '\n';
  }
  if (style === 'hash') {
    return body.split('\n').map((l) => '# ' + l).join('\n') + '\n';
  }
  if (style === 'html') {
    return '<!--\n' + body.split('\n').map((l) => '  ' + l).join('\n') + '\n-->\n';
  }
  return body + '\n';
}

function list() {
  return Object.entries(licenses)
    .filter(([, v]) => v && v.template && v.spdx)
    .map(([key, val]) => ({
      key,
      name: val.name,
      spdx: val.spdx,
      permissive: val.permissive,
    }));
}

function getTypes() {
  return list().map((l) => l.key);
}

function spdxId(type) {
  const key = resolveType(type);
  if (!key) return null;
  return licenses[key].spdx;
}

const NORMALIZE = /\s+/g;
function normalize(text) {
  return String(text || '')
    .replace(/\{year\}/g, '')
    .replace(/\{name\}/g, '')
    .replace(NORMALIZE, ' ')
    .trim()
    .toLowerCase();
}

function detect(text) {
  if (!text) return null;
  const target = normalize(text);

  const spdxMatch = text.match(/SPDX-License-Identifier:\s*([A-Za-z0-9.\-+_]+)/i);
  if (spdxMatch) {
    const spdx = spdxMatch[1];
    for (const [key, val] of Object.entries(licenses)) {
      if (val && val.spdx && val.spdx.toLowerCase() === spdx.toLowerCase()) {
        return { key, spdx: val.spdx, name: val.name, confidence: 1.0, source: 'spdx-tag' };
      }
    }
  }

  let best = null;
  for (const [key, val] of Object.entries(licenses)) {
    if (!val || !val.template) continue;
    const candidate = normalize(val.template);
    const score = similarity(target, candidate);
    if (!best || score > best.confidence) {
      best = { key, spdx: val.spdx, name: val.name, confidence: score, source: 'fingerprint' };
    }
  }

  if (best && best.confidence >= 0.35) return best;
  return null;
}

function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const tokensA = new Set(a.split(' ').filter((t) => t.length > 3));
  const tokensB = new Set(b.split(' ').filter((t) => t.length > 3));
  if (!tokensA.size || !tokensB.size) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union;
}

function updateYear(text, newYear) {
  if (!text) return text;
  const year = newYear || new Date().getFullYear();
  const YEAR_RE = /(Copyright\s*(?:\(c\)|©)?\s*)(\d{4})(?:\s*[-–]\s*\d{4}|\s*,\s*\d{4})*/gi;
  return text.replace(YEAR_RE, (match, prefix, firstYear) => {
    const first = parseInt(firstYear, 10);
    if (!first || first >= year) return match;
    return `${prefix}${first}-${year}`;
  });
}

module.exports = {
  generate,
  generateHeader,
  list,
  getTypes,
  spdxId,
  detect,
  updateYear,
  licenses,
};
