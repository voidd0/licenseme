# licenseme

Write a LICENSE file from 18 bundled licenses, or detect which license a project already has. Use it when starting a repository or checking an old one.

[![npm](https://img.shields.io/npm/v/@v0idd0/licenseme?color=00f6d0&labelColor=050914)](https://www.npmjs.com/package/@v0idd0/licenseme)
[![test](https://github.com/voidd0/licenseme/actions/workflows/test.yml/badge.svg)](https://github.com/voidd0/licenseme/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-00f6d0?labelColor=050914)](LICENSE)

## Install

```bash
npm install -g @v0idd0/licenseme
```

Or run it once without installing: `npx @v0idd0/licenseme --help`. Needs Node.js 18 or newer. No dependencies.

## Example

Write an MIT license for one author into an empty directory, then detect it. Output from a real run on 2026-11-26:

```console
$ licenseme mit -n "Jane Doe" -y 2026
  ✓ Wrote LICENSE (MIT) → LICENSE

$ licenseme --detect

  DETECTED
  ────────
  License:     MIT License
  SPDX:        MIT
  Key:         mit
  Confidence:  98%  (fingerprint)
  Path:        LICENSE
```

List the bundled licenses.

```console
$ licenseme --list

Available licenses (18):

  mit         permissive  MIT                 MIT License
  apache      permissive  Apache-2.0          Apache License 2.0
  isc         permissive  ISC                 ISC License
  bsd3        permissive  BSD-3-Clause        BSD 3-Clause License
  bsd2        permissive  BSD-2-Clause        BSD 2-Clause License
  bsd0        permissive  0BSD                BSD Zero Clause License
  unlicense   permissive  Unlicense           The Unlicense
  wtfpl       permissive  WTFPL               Do What The F*** You Want License
  zlib        permissive  Zlib                zlib License
  bsl         permissive  BSL-1.0             Boost Software License 1.0
  cc0         permissive  CC0-1.0             Creative Commons Zero 1.0
  ccby4       permissive  CC-BY-4.0           Creative Commons Attribution 4.0
  ccbysa4     copyleft    CC-BY-SA-4.0        Creative Commons BY-SA 4.0
  mpl2        copyleft    MPL-2.0             Mozilla Public License 2.0
  gpl2        copyleft    GPL-2.0-only        GNU General Public License v2
  gpl3        copyleft    GPL-3.0-only        GNU General Public License v3
  lgpl3       copyleft    LGPL-3.0-only       GNU Lesser General Public License v3
  agpl3       copyleft    AGPL-3.0-only       GNU Affero General Public License v3
```

## Usage

```text
licenseme v2.0.4
LICENSE generator + detector

Usage:
  licenseme <license> [options]
  licenseme --detect [path]
  licenseme --update [path]
  licenseme --list

Licenses (18 total):
  permissive:  mit, apache, isc, bsd3, bsd2, bsd0, unlicense, wtfpl, zlib, bsl, cc0, ccby4
  copyleft:    ccbysa4, mpl2, gpl2, gpl3, lgpl3, agpl3
  aliases:    apache-2.0, gpl-3.0, cc-by, bsd, boost, public-domain, 0bsd, …

Options:
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

Examples:
  licenseme mit -n "Jane Doe"
  licenseme apache-2.0 -n "Acme, Inc." -y 2026
  licenseme gpl-3.0 -n "Linus Torvalds" --stdout
  licenseme mit -n "Jane Doe" --header --style jsblock --file src/index.js
  licenseme --detect ./LICENSE              # who am I licensed under?
  licenseme --update ./LICENSE              # bump year: 2023 → 2023-2026
  licenseme --list --json | jq '.[] | .spdx'
  licenseme mit --spdx                     # prints "MIT" and exits

Docs and issues: https://github.com/voidd0/licenseme
```

## Notes

Detection matches the text against the bundled licenses and prints a confidence figure, so treat it as a hint, not legal advice. `--update` changes the year in the copyright line of an existing LICENSE.

## License

MIT, see [LICENSE](LICENSE).

---

Made by [vøiddo](https://voiddo.com/?src=gh). More command line tools: [voiddo.com/packages](https://voiddo.com/packages/?src=gh).
We also run data scrapers for job boards, shops and ad libraries: [voiddo.com/scrapers](https://voiddo.com/scrapers/?src=gh).
