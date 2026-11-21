// Lantern Harbor — the hand-in program (Node 22, standard library only).
//
// The game itself is the static files under game/: index.html and its ES
// modules, painted entirely with Canvas 2D, no library and no network. This
// program hands it in: it copies game/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there with
// buildDossier from the vendored make.fun library, so the judge reads the
// screenshots and the source outline of exactly what was handed in.
//
// In the grader the output directory is /output; anywhere else,
// MAKEFUN_OUTPUT_DIR names it instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// To play the game while developing: `node serve.ts`, then open the
// address it prints in a desktop browser.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own (see the competition's RULES.txt):
// buildDossier refuses anything the scorer would refuse — more than 4
// screenshots or one over 256 KiB, more than 993 entries or 48 MiB under
// game/, or a game path over 1,000 bytes — and text_max_bytes shapes how
// much of the source the dossier's text carries.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
