#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHASES_DIR = path.join(ROOT, 'phases');
const CURRICULUM_PATH = path.join(ROOT, 'curriculum.json');
const GLOSSARY_PATH = path.join(ROOT, 'glossary', 'terms.md');
const OUTPUT_PATH = path.join(__dirname, 'data.js');
const REQUIRED_LESSON_FIELDS = ['title', 'phase', 'phaseNumber', 'lessonNumber', 'type', 'status'];
const VALID_STATUSES = new Set(['draft', 'planned', 'in-progress', 'complete']);

const BOOK = {
  title: 'Caravanserai',
  subtitle: 'Every ledger is a road. Every transaction leaves a trace. This is a place to stop, look closely, and learn how onchain data becomes understanding.',
  description: 'A living field guide to blockchains, data engineering, and turning public ledgers into meaningful insight.',
  sourceBaseUrl: process.env.BOOK_SOURCE_BASE_URL || '',
  generatedAt: new Date().toISOString()
};

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error(`Missing frontmatter in ${filePath}`);
  }
  const frontmatter = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    frontmatter[key] = parseValue(value);
  }
  return {
    frontmatter,
    body: markdown.slice(match[0].length).trim()
  };
}

function parseValue(value) {
  if (value === '[]') return [];
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return splitArray(inner).map(parseValue);
  }
  return value;
}

function splitArray(input) {
  const parts = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if ((ch === '"' || ch === "'") && input[i - 1] !== '\\') {
      quote = quote === ch ? null : quote || ch;
    }
    if (ch === ',' && !quote) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function slugFromPathPart(part) {
  return part.replace(/\\/g, '/').split('/').filter(Boolean).pop() || '';
}

function sourceUrl(relativePath) {
  if (!BOOK.sourceBaseUrl) return `../${relativePath}`;
  return `${BOOK.sourceBaseUrl.replace(/\/$/, '')}/${relativePath}`;
}

function readQuiz(lessonDir) {
  const quizPath = path.join(lessonDir, 'quiz.json');
  if (!fs.existsSync(quizPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
    if (!Array.isArray(parsed)) {
      throw new Error('quiz root must be an array');
    }
    parsed.forEach((item, index) => {
      if (!item || typeof item.question !== 'string' || !Array.isArray(item.options) || item.options.length < 2) {
        throw new Error(`question ${index + 1} must include text and at least two options`);
      }
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) {
        throw new Error(`question ${index + 1} has an invalid answer index`);
      }
    });
    return parsed;
  } catch (err) {
    throw new Error(`Invalid quiz JSON at ${quizPath}: ${err.message}`);
  }
}

function validateFrontmatter(frontmatter, filePath) {
  const missing = REQUIRED_LESSON_FIELDS.filter((field) => {
    return !Object.prototype.hasOwnProperty.call(frontmatter, field) || frontmatter[field] === '';
  });
  if (missing.length) {
    throw new Error(`Missing required frontmatter in ${filePath}: ${missing.join(', ')}`);
  }
  if (!Number.isInteger(Number(frontmatter.phaseNumber)) || Number(frontmatter.phaseNumber) < 0) {
    throw new Error(`phaseNumber must be a non-negative integer in ${filePath}`);
  }
  if (!Number.isInteger(Number(frontmatter.lessonNumber)) || Number(frontmatter.lessonNumber) < 1) {
    throw new Error(`lessonNumber must be a positive integer in ${filePath}`);
  }
  if (!VALID_STATUSES.has(frontmatter.status)) {
    throw new Error(`Unsupported status "${frontmatter.status}" in ${filePath}`);
  }
}

function parseLessons() {
  const docs = walk(PHASES_DIR)
    .filter((file) => toPosix(file).endsWith('/docs/en.md'))
    .sort();

  return docs.map((docPath) => {
    const markdown = fs.readFileSync(docPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(markdown, docPath);
    validateFrontmatter(frontmatter, docPath);
    const lessonDir = path.dirname(path.dirname(docPath));
    const phaseDir = path.dirname(lessonDir);
    const relativeLessonDir = toPosix(path.relative(ROOT, lessonDir));
    const relativeDoc = toPosix(path.relative(ROOT, docPath));
    const phaseSlug = slugFromPathPart(phaseDir);
    const lessonSlug = slugFromPathPart(lessonDir);

    return {
      id: `${phaseSlug}/${lessonSlug}`,
      path: relativeLessonDir,
      docPath: relativeDoc,
      phaseSlug,
      lessonSlug,
      title: frontmatter.title || titleFromSlug(lessonSlug),
      phase: frontmatter.phase || titleFromSlug(phaseSlug.replace(/^\d+-/, '')),
      phaseNumber: Number(frontmatter.phaseNumber || phaseSlug.match(/^\d+/)?.[0] || 0),
      lessonNumber: Number(frontmatter.lessonNumber || lessonSlug.match(/^\d+/)?.[0] || 0),
      type: frontmatter.type || 'Read',
      status: frontmatter.status || 'draft',
      tools: asArray(frontmatter.tools),
      chains: asArray(frontmatter.chains),
      protocols: asArray(frontmatter.protocols),
      datasets: asArray(frontmatter.datasets),
      time: frontmatter.time || '',
      body,
      quiz: readQuiz(lessonDir),
      links: {
        source: sourceUrl(relativeLessonDir),
        docs: BOOK.sourceBaseUrl ? sourceUrl(relativeDoc) : null,
        code: BOOK.sourceBaseUrl && fs.existsSync(path.join(lessonDir, 'code')) ? sourceUrl(`${relativeLessonDir}/code/`) : null,
        outputs: BOOK.sourceBaseUrl && fs.existsSync(path.join(lessonDir, 'outputs')) ? sourceUrl(`${relativeLessonDir}/outputs/`) : null
      }
    };
  }).sort((a, b) => (a.phaseNumber - b.phaseNumber) || (a.lessonNumber - b.lessonNumber));
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function titleFromSlug(slug) {
  return slug.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildPhases(lessons) {
  if (!fs.existsSync(CURRICULUM_PATH)) {
    throw new Error(`Missing curriculum manifest at ${CURRICULUM_PATH}`);
  }

  let sections;
  try {
    sections = JSON.parse(fs.readFileSync(CURRICULUM_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`Invalid curriculum JSON at ${CURRICULUM_PATH}: ${err.message}`);
  }
  if (!Array.isArray(sections) || !sections.length) {
    throw new Error('curriculum.json must contain a non-empty array of sections');
  }

  const seenNumbers = new Set();
  const seenSlugs = new Set();
  const phases = sections.map((section, index) => {
    const number = Number(section.number);
    if (!Number.isInteger(number) || number < 0) {
      throw new Error(`Curriculum section ${index + 1} has an invalid number`);
    }
    if (!section.slug || !section.title || !section.summary) {
      throw new Error(`Curriculum section ${number} requires slug, title, and summary`);
    }
    if (!Array.isArray(section.topics) || !section.topics.length || section.topics.some((topic) => typeof topic !== 'string' || !topic.trim())) {
      throw new Error(`Curriculum section ${number} requires at least one topic`);
    }
    if (seenNumbers.has(number) || seenSlugs.has(section.slug)) {
      throw new Error(`Duplicate curriculum section number or slug: ${number} / ${section.slug}`);
    }
    seenNumbers.add(number);
    seenSlugs.add(section.slug);
    return {
      number,
      slug: section.slug,
      title: section.title,
      summary: section.summary,
      topics: section.topics,
      status: 'planned',
      lessons: []
    };
  });

  const phaseMap = new Map(phases.map((phase) => [phase.number, phase]));
  for (const lesson of lessons) {
    const phase = phaseMap.get(lesson.phaseNumber);
    if (!phase) {
      throw new Error(`Lesson ${lesson.id} belongs to phase ${lesson.phaseNumber}, which is missing from curriculum.json`);
    }
    if (phase.slug !== lesson.phaseSlug) {
      throw new Error(`Lesson ${lesson.id} uses phase folder ${lesson.phaseSlug}; curriculum.json defines ${phase.slug}`);
    }
    if (phase.title !== lesson.phase) {
      throw new Error(`Lesson ${lesson.id} names its phase "${lesson.phase}"; curriculum.json defines "${phase.title}"`);
    }
    phase.lessons.push(lesson.id);
  }

  phases.forEach((phase) => {
    const phaseLessons = phase.lessons.map((id) => lessons.find((lesson) => lesson.id === id));
    if (!phaseLessons.length) return;
    if (phaseLessons.every((lesson) => lesson.status === 'complete')) phase.status = 'complete';
    else if (phaseLessons.some((lesson) => lesson.status === 'in-progress')) phase.status = 'in-progress';
    else phase.status = 'draft';
  });

  return phases.sort((a, b) => a.number - b.number);
}

function parseGlossary() {
  if (!fs.existsSync(GLOSSARY_PATH)) return [];
  const content = fs.readFileSync(GLOSSARY_PATH, 'utf8');
  const terms = [];
  const chunks = content.split(/^###\s+/m).slice(1);
  for (const chunk of chunks) {
    const lines = chunk.split(/\r?\n/);
    const term = (lines.shift() || '').trim();
    const definition = lines.join('\n').trim();
    if (!term || !definition) continue;
    terms.push({
      term,
      slug: term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      definition
    });
  }
  return terms.sort((a, b) => a.term.localeCompare(b.term));
}

function writeData({ lessons, phases, glossary }) {
  const payload = `// Auto-generated by site/build.js. Do not edit by hand.
// Last built: ${BOOK.generatedAt}

const BOOK = ${JSON.stringify(BOOK, null, 2)};
const PHASES = ${JSON.stringify(phases, null, 2)};
const LESSONS = ${JSON.stringify(lessons, null, 2)};
const GLOSSARY = ${JSON.stringify(glossary, null, 2)};
`;
  fs.writeFileSync(OUTPUT_PATH, payload, 'utf8');
}

function build() {
  const lessons = parseLessons();
  const phases = buildPhases(lessons);
  const glossary = parseGlossary();
  writeData({ lessons, phases, glossary });

  console.log(`Generated ${toPosix(path.relative(ROOT, OUTPUT_PATH))}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Phases: ${phases.length}`);
  console.log(`Glossary terms: ${glossary.length}`);
}

build();
