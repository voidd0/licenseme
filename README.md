# licenseme

**LICENSE file generator + detector.** Pick one of 18 open-source licenses, fill in your name and year, write `./LICENSE` — done. Or point it at an existing `LICENSE` and let it tell you *which* license you're actually shipping under.

Free forever gift from [vøiddo](https://voiddo.com).

```
$ licenseme mit -n "Jane Doe"
  ✓ Wrote LICENSE (MIT) → /repo/LICENSE

$ licenseme --detect ./LICENSE
  License:     Apache License 2.0
  SPDX:        Apache-2.0
  Confidence:  98%  (fingerprint)
```

## Why licenseme

`npm init` asks you to pick a license by name and dumps "MIT" into package.json without writing the actual `LICENSE` file. GitHub's "Add a license" button works but needs a browser. `choosealicense.com` is great at education but not at shelling.

licenseme is a single binary that:
- writes the **full SPDX text** of 18 open-source licenses,
- emits **source-file copyright headers** (JS / Python / HTML / plain) with SPDX tags,
- **detects** what license an existing `LICENSE` file is, via SPDX tag or token-fingerprint,
- **bumps the copyright year** in an existing `LICENSE` (`2023` → `2023-2026`),
- prints **SPDX identifiers** for your `package.json` / `pyproject.toml` / `Cargo.toml`.

## Install

```bash
npm install -g @v0idd0/licenseme
```

Or one-shot with `npx`:

```bash
npx -y @v0idd0/licenseme mit -n "Jane Doe"
```

## Quickstart

```bash
# Write ./LICENSE
licenseme mit -n "Jane Doe"
licenseme apache-2.0 -n "Acme, Inc." -y 2026

# Copyleft
licenseme gpl-3.0 -n "Linus" --stdout
licenseme agpl -n "SaaS Ltd" -o ./licenses/AGPL.txt

# Print to stdout (no file write)
licenseme isc -n "Jane" --stdout

# Source-file header with SPDX tag
licenseme mit -n "Jane" --header                             # jsblock (default)
licenseme mit -n "Jane" --header --style hash                # python / shell
licenseme mit -n "Jane" --header --style html                # html / markdown

# Detect an existing LICENSE
licenseme --detect                                           # defaults to ./LICENSE
licenseme --detect ./vendor/some-lib/LICENSE

# Update copyright year in place
licenseme --update                    # bumps to current year
licenseme --update -y 2027

# List every bundled license
licenseme --list
licenseme --list --json | jq '.[] | select(.permissive == false)'

# Get just the SPDX identifier
licenseme mit --spdx          # prints "MIT"
licenseme agpl --spdx         # prints "AGPL-3.0-only"
```

## Licenses bundled (18)

### Permissive
| Key | SPDX | Name |
|-----|------|------|
| `mit` | `MIT` | MIT License |
| `apache` | `Apache-2.0` | Apache License 2.0 (full text, all 9 sections) |
| `isc` | `ISC` | ISC License |
| `bsd3` | `BSD-3-Clause` | BSD 3-Clause ("New BSD") |
| `bsd2` | `BSD-2-Clause` | BSD 2-Clause ("Simplified BSD") |
| `bsd0` | `0BSD` | BSD Zero Clause (no-attribution BSD) |
| `unlicense` | `Unlicense` | The Unlicense (public domain) |
| `wtfpl` | `WTFPL` | Do What The F*** You Want |
| `zlib` | `Zlib` | zlib License |
| `bsl` | `BSL-1.0` | Boost Software License 1.0 |
| `cc0` | `CC0-1.0` | Creative Commons Zero (public domain) |
| `ccby4` | `CC-BY-4.0` | Creative Commons Attribution 4.0 |

### Copyleft / weak copyleft
| Key | SPDX | Name |
|-----|------|------|
| `ccbysa4` | `CC-BY-SA-4.0` | Creative Commons Attribution-ShareAlike 4.0 |
| `mpl2` | `MPL-2.0` | Mozilla Public License 2.0 |
| `gpl2` | `GPL-2.0-only` | GNU General Public License v2 |
| `gpl3` | `GPL-3.0-only` | GNU General Public License v3 |
| `lgpl3` | `LGPL-3.0-only` | GNU Lesser General Public License v3 |
| `agpl3` | `AGPL-3.0-only` | GNU Affero General Public License v3 |

### Aliases
Typed what you remember, not what the SPDX id is? It's fine:
`apache-2.0 → apache`, `gpl-3.0 → gpl3`, `cc-by → ccby4`, `boost → bsl`, `public-domain → unlicense`, `0bsd → bsd0`, `mpl-2.0 → mpl2`.

## Options

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Author / copyright holder |
| `-y, --year <year>` | Copyright year (default: current year) |
| `-o, --output <path>` | Write to this path (default: `./LICENSE`) |
| `--stdout` | Print to stdout instead of writing a file |
| `--header` | Emit a source-file copyright header with SPDX tag |
| `--style <style>` | Header comment style: `jsblock`, `jsline`, `hash`, `html` |
| `--file <name>` | Inline filename into the header (optional) |
| `--detect [path]` | Identify an existing LICENSE (SPDX tag or fingerprint) |
| `--update [path]` | Bump copyright year in place (`2023` → `2023-2026`) |
| `--spdx` | Print the SPDX identifier and exit |
| `--json` | Emit JSON (works with `--generate`, `--detect`, `--list`) |
| `-l, --list` | List every bundled license |
| `-h, --help` | Show help |
| `--version` | Show version |

## Features worth calling out

### SPDX tags on generated files
`licenseme mit -n "Jane" --header` gives you a block like:

```js
/*
 * src/index.js
 * Copyright (c) 2026 Jane
 * SPDX-License-Identifier: MIT
 *
 * Licensed under the MIT License. See LICENSE file for full text.
 */
```

The `SPDX-License-Identifier:` line is the canonical way to mark source files per [spdx.dev](https://spdx.dev). Automated scanners (REUSE, ClearlyDefined, npm packages like `license-checker`) read it directly.

### Detection — SPDX first, fingerprint fallback
`--detect` runs two passes:
1. Look for an explicit `SPDX-License-Identifier:` tag → 100% confidence.
2. Tokenize the file, compare Jaccard similarity against every bundled template → confidence score.

If confidence drops below 35%, it bails out instead of guessing. The source (`spdx-tag` vs `fingerprint`) is surfaced in the output so you can trust or double-check.

### Year bump
`licenseme --update` walks the `Copyright (c) 2023 …` / `Copyright © 2023 …` line and turns it into `Copyright (c) 2023-2026 …`. Idempotent — if the year is already current, it's a no-op.

### JSON output
Everything has a `--json` mode:
```bash
licenseme --list --json | jq '.[] | select(.spdx == "AGPL-3.0-only")'
licenseme --detect ./LICENSE --json
licenseme mit -n Jane --json
```
Great for CI / scripts that need license metadata without parsing CLI output.

## Programmatic use

```js
const { generate, generateHeader, detect, updateYear, spdxId, list } =
  require('@v0idd0/licenseme/src/generator');

// Generate
const licenseText = generate('mit', { name: 'Jane', year: 2026 });

// Source-file header
const header = generateHeader('mit', {
  name: 'Jane',
  style: 'jsblock',
  file: 'src/index.js',
});

// Detect
const existing = require('fs').readFileSync('./LICENSE', 'utf8');
const detected = detect(existing);    // { key, spdx, name, confidence, source }

// Bump year
const updated = updateYear(existing, 2026);

// SPDX
spdxId('agpl-3.0');    // "AGPL-3.0-only"

// Catalog
list();                // [{ key, name, spdx, permissive }, ...]
```

## From the same studio

vøiddo builds sharp, free-forever CLIs for devs who are tired of paywalls:

- [`@v0idd0/jsonyo`](https://voiddo.com/tools/jsonyo/) — JSON that yells at you when it's broken
- [`@v0idd0/tokcount`](https://voiddo.com/tools/tokcount/) — token counter for 60+ LLMs
- [`@v0idd0/ctxstuff`](https://voiddo.com/tools/ctxstuff/) — stuff a repo into an LLM context window
- [`@v0idd0/promptdiff`](https://voiddo.com/tools/promptdiff/) — diff two prompts
- [`@v0idd0/httpwut`](https://voiddo.com/tools/httpwut/) — HTTP debugger with phase timing
- [`@v0idd0/gitstats`](https://voiddo.com/tools/gitstats/) — local git analytics (hotspots, bus-factor, streaks)

Full catalog: [voiddo.com/tools](https://voiddo.com/tools/).

## License

MIT © [vøiddo](https://voiddo.com) — free forever, no asterisks.

## Links

- Docs: https://voiddo.com/tools/licenseme/
- Source: https://github.com/voidd0/licenseme
- npm: https://npmjs.com/package/@v0idd0/licenseme
- Studio: https://voiddo.com
- Issues: https://github.com/voidd0/licenseme/issues
- Support: support@voiddo.com

---

Built by [vøiddo](https://voiddo.com/) — a small studio shipping AI-flavoured products, free dev tools, Chrome extensions and weird browser games.
