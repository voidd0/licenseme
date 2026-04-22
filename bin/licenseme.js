#!/usr/bin/env node
// licenseme — LICENSE file generator + detector, free forever from vøiddo.
// https://voiddo.com/tools/licenseme/

const fs = require('fs');
const path = require('path');
const {
  generate,
  generateHeader,
  list,
  spdxId,
  detect,
  updateYear,
} = require('../src/generator');
const { maybeShowPromo, getHelpFooter } = require('../src/promo');

const pkg = require('../package.json');
const args = process.argv.slice(2);

const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function showHelp() {
  const permissive = list().filter((l) => l.permissive).map((l) => l.key).join(', ');
  const copyleft = list().filter((l) => !l.permissive).map((l) => l.key).join(', ');
  console.log(`
${YELLOW}licenseme${RESET} ${DIM}v${pkg.version}${RESET}
${DIM}LICENSE generator + detector — free forever from vøiddo${RESET}

${CYAN}Usage:${RESET}
  licenseme <license> [options]
  licenseme --detect [path]
  licenseme --update [path]
  licenseme --list

${CYAN}Licenses (${list().length} total):${RESET}
  ${DIM}permissive:${RESET}  ${permissive}
  ${DIM}copyleft:${RESET}    ${copyleft}
  ${DIM}aliases:${RESET}    apache-2.0, gpl-3.0, cc-by, bsd, boost, public-domain, 0bsd, …

${CYAN}Options:${RESET}
  -n, --name <name>     Author / copyright holder (default: "Your Name")
  -y, --year <year>     Copyright year (default: current year)
  -o, --output <path>   Write to file (default: ./LICENSE)
  --stdout              Print to stdout instead of writing a file
  --header              Emit a short copyright header instead of full text
  --style <style>       Header comment style: jsblock, jsline, hash, html (default jsblock)
  --file <file>         Filename to inline into the header (optional)
  --detect [path]       Identify an existing LICENSE via SPDX tag or fingerprint
  --update [path]       Bump copyright year in an existing LICENSE (in-place)
  --spdx                Print the SPDX identifier for the picked license, then exit
  --json                Emit a JSON envelope (for --generate, --detect, --list)
  -l, --list            List every bundled license with SPDX id
  -h, --help            Show this help
  --version             Show version

${CYAN}Examples:${RESET}
  licenseme mit -n "Jane Doe"
  licenseme apache-2.0 -n "Acme, Inc." -y 2026
  licenseme gpl-3.0 -n "Linus Torvalds" --stdout
  licenseme mit -n "Jane Doe" --header --style jsblock --file src/index.js
  licenseme --detect ./LICENSE              ${DIM}# who am I licensed under?${RESET}
  licenseme --update ./LICENSE              ${DIM}# bump year: 2023 → 2023-2026${RESET}
  licenseme --list --json | jq '.[] | .spdx'
  licenseme mit --spdx                     ${DIM}# prints "MIT" and exits${RESET}

${DIM}docs: https://voiddo.com/tools/licenseme/${RESET}${getHelpFooter()}
`);
}

function parseArgs(argList) {
  const opts = {
    type: null,
    name: 'Your Name',
    year: new Date().getFullYear(),
    output: null,
    stdout: false,
    header: false,
    style: 'jsblock',
    file: '',
    detect: null,
    update: null,
    spdx: false,
    json: false,
    list: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argList.length; i++) {
    const arg = argList[i];

    if (arg === '-h' || arg === '--help') { opts.help = true; continue; }
    if (arg === '--version') { opts.version = true; continue; }
    if (arg === '-l' || arg === '--list') { opts.list = true; continue; }
    if (arg === '--json') { opts.json = true; continue; }
    if (arg === '--spdx') { opts.spdx = true; continue; }
    if (arg === '--stdout') { opts.stdout = true; continue; }
    if (arg === '--header') { opts.header = true; continue; }
    if (arg === '--detect') {
      const next = argList[i + 1];
      opts.detect = next && !next.startsWith('-') ? (i++, next) : './LICENSE';
      continue;
    }
    if (arg === '--update') {
      const next = argList[i + 1];
      opts.update = next && !next.startsWith('-') ? (i++, next) : './LICENSE';
      continue;
    }
    if (arg === '-n' || arg === '--name') { opts.name = argList[++i] || opts.name; continue; }
    if (arg === '-y' || arg === '--year') {
      const parsed = parseInt(argList[++i], 10);
      if (parsed) opts.year = parsed;
      continue;
    }
    if (arg === '-o' || arg === '--output') { opts.output = argList[++i] || null; continue; }
    if (arg === '--style') { opts.style = argList[++i] || 'jsblock'; continue; }
    if (arg === '--file') { opts.file = argList[++i] || ''; continue; }
    if (!arg.startsWith('-') && !opts.type) { opts.type = arg; }
  }

  return opts;
}

function cmdList(opts) {
  const all = list();
  if (opts.json) {
    console.log(JSON.stringify(all, null, 2));
    return 0;
  }
  console.log(`\n${CYAN}Available licenses (${all.length}):${RESET}\n`);
  for (const l of all) {
    const tag = l.permissive ? `${GREEN}permissive${RESET}` : `${YELLOW}copyleft${RESET}  `;
    console.log(`  ${l.key.padEnd(10)}  ${tag}  ${DIM}${l.spdx.padEnd(18)}${RESET}  ${l.name}`);
  }
  console.log();
  return 0;
}

function cmdDetect(opts) {
  const target = path.resolve(opts.detect);
  if (!fs.existsSync(target)) {
    console.error(`${RED}bruh. file not found: ${target}${RESET}`);
    return 1;
  }
  const text = fs.readFileSync(target, 'utf8');
  const result = detect(text);
  if (!result) {
    if (opts.json) {
      console.log(JSON.stringify({ detected: null, path: target }, null, 2));
    } else {
      console.log(`\n  ${YELLOW}Could not confidently identify the license.${RESET}`);
      console.log(`  ${DIM}Looked at: ${target}${RESET}\n`);
    }
    return 2;
  }
  if (opts.json) {
    console.log(JSON.stringify({ ...result, path: target }, null, 2));
    return 0;
  }
  const confPct = (result.confidence * 100).toFixed(0);
  console.log(`\n  ${CYAN}DETECTED${RESET}`);
  console.log(`  ${DIM}${'─'.repeat(8)}${RESET}`);
  console.log(`  License:     ${result.name}`);
  console.log(`  SPDX:        ${result.spdx}`);
  console.log(`  Key:         ${result.key}`);
  console.log(`  Confidence:  ${confPct}%  ${DIM}(${result.source})${RESET}`);
  console.log(`  Path:        ${target}`);
  console.log();
  return 0;
}

function cmdUpdate(opts) {
  const target = path.resolve(opts.update);
  if (!fs.existsSync(target)) {
    console.error(`${RED}bruh. file not found: ${target}${RESET}`);
    return 1;
  }
  const text = fs.readFileSync(target, 'utf8');
  const updated = updateYear(text, opts.year);
  if (updated === text) {
    console.log(`  ${DIM}Copyright year already current; no changes.${RESET}`);
    return 0;
  }
  fs.writeFileSync(target, updated);
  console.log(`  ${GREEN}✓${RESET} Bumped copyright year to ${opts.year} in ${target}`);
  return 0;
}

function cmdGenerate(opts) {
  if (!opts.type) {
    console.error(`${RED}bruh. pick a license (try --list).${RESET}`);
    return 1;
  }

  const sid = spdxId(opts.type);
  if (!sid) {
    console.error(`${RED}Unknown license: ${opts.type}${RESET}`);
    console.error(`${DIM}Use --list to see available licenses.${RESET}`);
    return 1;
  }

  if (opts.spdx) {
    console.log(sid);
    return 0;
  }

  const content = opts.header
    ? generateHeader(opts.type, { name: opts.name, year: opts.year, style: opts.style, file: opts.file })
    : generate(opts.type, { name: opts.name, year: opts.year });

  if (!content) {
    console.error(`${RED}Could not render template.${RESET}`);
    return 1;
  }

  if (opts.json) {
    console.log(JSON.stringify({
      license: opts.type,
      spdx: sid,
      year: opts.year,
      name: opts.name,
      content,
    }, null, 2));
    return 0;
  }

  if (opts.stdout) {
    process.stdout.write(content);
    if (!content.endsWith('\n')) process.stdout.write('\n');
    return 0;
  }

  const outPath = path.resolve(opts.output || 'LICENSE');
  fs.writeFileSync(outPath, content.endsWith('\n') ? content : content + '\n');
  console.log(`  ${GREEN}✓${RESET} Wrote ${path.basename(outPath)} ${DIM}(${sid})${RESET} → ${outPath}`);
  return 0;
}

function main() {
  const opts = parseArgs(args);

  if (opts.help || (!args.length && !opts.type)) {
    showHelp();
    return 0;
  }

  if (opts.version) {
    console.log(pkg.version);
    return 0;
  }

  if (opts.list) {
    return cmdList(opts);
  }

  if (opts.detect) {
    return cmdDetect(opts);
  }

  if (opts.update) {
    return cmdUpdate(opts);
  }

  const exitCode = cmdGenerate(opts);
  maybeShowPromo();
  return exitCode;
}

process.exit(main() || 0);
