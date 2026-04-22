// licenseme — tests. Free forever from vøiddo. https://voiddo.com/tools/licenseme/

const {
  generate,
  generateHeader,
  list,
  getTypes,
  spdxId,
  detect,
  updateYear,
} = require('./src/generator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`\x1b[32m✓ ${name}\x1b[0m`);
    passed++;
  } catch (e) {
    console.log(`\x1b[31m✗ ${name}\x1b[0m`);
    console.log(`  ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

test('generate mit returns string', () => {
  const result = generate('mit');
  assert(typeof result === 'string', 'should be string');
  assert(result.includes('MIT License'), 'should contain MIT License');
});

test('generate apache returns string', () => {
  const result = generate('apache');
  assert(typeof result === 'string', 'should be string');
  assert(result.includes('Apache License'), 'should contain Apache License');
});

test('generate isc returns string', () => {
  const result = generate('isc');
  assert(typeof result === 'string', 'should be string');
  assert(result.includes('ISC License'), 'should contain ISC License');
});

test('generate with name replaces placeholder', () => {
  const result = generate('mit', { name: 'Test Author' });
  assert(result.includes('Test Author'), 'should contain author name');
});

test('generate with year replaces placeholder', () => {
  const result = generate('mit', { year: 2020 });
  assert(result.includes('2020'), 'should contain year');
});

test('generate invalid returns null', () => {
  const result = generate('invalid');
  assert(result === null, 'should return null for invalid');
});

test('list returns array of ≥15 licenses', () => {
  const result = list();
  assert(Array.isArray(result), 'should be array');
  assert(result.length >= 15, `should have at least 15 licenses, got ${result.length}`);
});

test('list items have key, name, spdx, permissive', () => {
  const result = list();
  result.forEach((item) => {
    assert(item.key, 'should have key');
    assert(item.name, 'should have name');
    assert(item.spdx, 'should have spdx');
    assert(typeof item.permissive === 'boolean', 'permissive should be boolean');
  });
});

test('getTypes returns array with staples', () => {
  const result = getTypes();
  assert(Array.isArray(result), 'should be array');
  ['mit', 'apache', 'isc', 'bsd3', 'gpl3', 'agpl3', 'mpl2', 'cc0'].forEach((k) => {
    assert(result.includes(k), `should include ${k}`);
  });
});

test('default year is current year', () => {
  const result = generate('mit');
  const currentYear = new Date().getFullYear().toString();
  assert(result.includes(currentYear), 'should contain current year');
});

test('spdxId returns correct SPDX identifiers', () => {
  assert(spdxId('mit') === 'MIT', 'mit → MIT');
  assert(spdxId('apache') === 'Apache-2.0', 'apache → Apache-2.0');
  assert(spdxId('gpl3') === 'GPL-3.0-only', 'gpl3 → GPL-3.0-only');
  assert(spdxId('bsd0') === '0BSD', 'bsd0 → 0BSD');
  assert(spdxId('unlicense') === 'Unlicense', 'unlicense → Unlicense');
});

test('alias resolution works', () => {
  assert(spdxId('apache-2.0') === 'Apache-2.0', 'apache-2.0 alias');
  assert(spdxId('gpl-3.0') === 'GPL-3.0-only', 'gpl-3.0 alias');
  assert(spdxId('boost') === 'BSL-1.0', 'boost alias');
  assert(spdxId('public-domain') === 'Unlicense', 'public-domain alias');
});

test('generateHeader produces jsblock comment', () => {
  const h = generateHeader('mit', { name: 'Jane', year: 2026, style: 'jsblock' });
  assert(h.startsWith('/*'), 'should start with /*');
  assert(h.includes('SPDX-License-Identifier: MIT'), 'should include SPDX tag');
  assert(h.includes('Jane'), 'should include author');
  assert(h.includes('2026'), 'should include year');
});

test('generateHeader produces hash comments for python', () => {
  const h = generateHeader('mit', { name: 'Jane', style: 'hash' });
  assert(h.startsWith('# '), 'should use # prefix');
  assert(h.includes('SPDX-License-Identifier: MIT'), 'SPDX');
});

test('detect identifies MIT via SPDX tag', () => {
  const text = 'SPDX-License-Identifier: MIT\nCopyright (c) 2026 Jane';
  const result = detect(text);
  assert(result, 'should detect');
  assert(result.spdx === 'MIT', `should be MIT, got ${result.spdx}`);
  assert(result.source === 'spdx-tag', 'should be from SPDX tag');
  assert(result.confidence === 1.0, 'should be full confidence');
});

test('detect identifies MIT via fingerprint', () => {
  const text = generate('mit', { name: 'Jane', year: 2026 });
  const result = detect(text);
  assert(result, 'should detect');
  assert(result.key === 'mit', `should be mit, got ${result.key}`);
  assert(result.confidence >= 0.7, `should have high confidence, got ${result.confidence}`);
});

test('detect identifies Apache via fingerprint', () => {
  const text = generate('apache', { name: 'Acme', year: 2026 });
  const result = detect(text);
  assert(result, 'should detect');
  assert(result.key === 'apache', `should be apache, got ${result.key}`);
});

test('detect returns null on random text', () => {
  const result = detect('hello world this is not a license');
  assert(result === null, 'should return null for non-license');
});

test('updateYear bumps single year to range', () => {
  const before = 'Copyright (c) 2023 Jane';
  const after = updateYear(before, 2026);
  assert(after.includes('2023-2026'), `should bump to range, got: ${after}`);
});

test('updateYear is idempotent when year is current', () => {
  const before = 'Copyright (c) 2026 Jane';
  const after = updateYear(before, 2026);
  assert(after === before, 'should not modify when year is current');
});

test('updateYear preserves © symbol', () => {
  const before = 'Copyright © 2023 Jane';
  const after = updateYear(before, 2026);
  assert(after.includes('©'), 'should preserve ©');
  assert(after.includes('2023-2026'), 'should bump');
});

test('gpl3 template contains v3 and link', () => {
  const result = generate('gpl3', { name: 'Linus' });
  assert(result.includes('Version 3'), 'should mention v3');
  assert(result.includes('gnu.org'), 'should link to gnu.org');
});

test('cc0 template is in catalog', () => {
  const result = generate('cc0', { name: 'Public' });
  assert(result, 'should return text');
  assert(result.includes('CC0'), 'should mention CC0');
});

console.log(`\n${passed}/${passed + failed} tests passed`);
process.exit(failed > 0 ? 1 : 0);
