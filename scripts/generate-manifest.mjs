#!/usr/bin/env node
// Escanea materiales/ y regenera data/manifest.json.
// Convención de carpetas: materiales/<curso>/<bloque>/<tipo>/archivo.ext
// No requiere dependencias externas.

import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MATERIALES_DIR = join(ROOT, "materiales");
const MANIFEST_PATH = join(ROOT, "data", "manifest.json");

const CURSOS = {
  "1-eso": "1º ESO",
  "2-eso": "2º ESO",
  "3-eso": "3º ESO",
  "4-eso": "4º ESO",
  "1-bach": "1º Bachillerato",
  "2-bach": "2º Bachillerato",
};

const BLOQUES = {
  gramatica: "Gramática",
  literatura: "Literatura",
  "comentario-texto": "Comentario de texto",
  ortografia: "Ortografía",
  lecturas: "Lecturas",
  "expresion-escrita": "Expresión escrita",
  otros: "Otros",
};

const TIPOS = {
  apuntes: "Apuntes",
  ejercicios: "Ejercicios",
  examenes: "Exámenes",
  presentaciones: "Presentaciones",
  otros: "Otros",
};

const IGNORE_FILES = new Set([".gitkeep", "README.md", ".DS_Store"]);

function humanizeTitle(filename) {
  const base = basename(filename, extname(filename));
  const spaced = base.replace(/[-_]+/g, " ").trim();
  return spaced
    .split(" ")
    .map((w) => (w.length > 3 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") && entry !== ".gitkeep") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (!IGNORE_FILES.has(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function getLastCommitDate(absPath) {
  try {
    const relPath = relative(ROOT, absPath);
    const out = execSync(`git log -1 --format=%cI -- "${relPath}"`, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

function build() {
  const files = walk(MATERIALES_DIR);
  const entries = files.map((absPath) => {
    const rel = relative(MATERIALES_DIR, absPath).split(/[\\/]+/);
    const [cursoSlug, bloqueSlug, tipoSlug] = rel;
    const filename = rel[rel.length - 1];
    const st = statSync(absPath);

    const curso = CURSOS[cursoSlug] ? cursoSlug : null;
    const bloque = BLOQUES[bloqueSlug] ? bloqueSlug : "otros";
    const tipo = TIPOS[tipoSlug] ? tipoSlug : "otros";

    return {
      path: relative(ROOT, absPath).split("\\").join("/"),
      filename,
      title: humanizeTitle(filename),
      ext: extname(filename).replace(".", "").toLowerCase(),
      sizeBytes: st.size,
      curso,
      bloque,
      tipo,
      addedDate: getLastCommitDate(absPath),
    };
  });

  entries.sort((a, b) => {
    const orderCurso = Object.keys(CURSOS);
    const ac = orderCurso.indexOf(a.curso);
    const bc = orderCurso.indexOf(b.curso);
    if (ac !== bc) return ac - bc;
    if (a.bloque !== b.bloque) return a.bloque.localeCompare(b.bloque, "es");
    if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo, "es");
    return a.title.localeCompare(b.title, "es");
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    cursos: CURSOS,
    bloques: BLOQUES,
    tipos: TIPOS,
    files: entries,
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Manifiesto generado con ${entries.length} archivo(s).`);
}

build();
