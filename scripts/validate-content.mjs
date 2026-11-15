import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const phasesRoot = path.join(root, 'phases');
const errors = [];
const dirs = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => path.join(directory, entry.name));

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
    const separator = line.indexOf(':');
    return separator < 0 ? [line, ''] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^"|"$/g, '')];
  }));
}

const lessons = dirs(phasesRoot).flatMap(dirs);
for (const lesson of lessons) {
  const relative = path.relative(root, lesson);
  const phaseNumber = path.basename(path.dirname(lesson)).match(/^(\d+)-/)?.[1];
  const lessonNumber = path.basename(lesson).match(/^(\d+)-/)?.[1];
  const docPath = path.join(lesson, 'docs', 'en.md');
  const quizPath = path.join(lesson, 'quiz.json');
  if (!fs.existsSync(docPath)) { errors.push(`${relative}: missing docs/en.md`); continue; }
  const meta = frontmatter(fs.readFileSync(docPath, 'utf8'));
  if (Number(meta.phaseNumber) !== Number(phaseNumber)) errors.push(`${relative}: phaseNumber does not match directory`);
  if (Number(meta.lessonNumber) !== Number(lessonNumber)) errors.push(`${relative}: lessonNumber does not match directory`);
  if (!fs.existsSync(quizPath)) { errors.push(`${relative}: missing quiz.json`); continue; }
  try {
    const quiz = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
    if (!Array.isArray(quiz) || quiz.length < 2) errors.push(`${relative}: quiz needs at least two questions`);
    for (const [index, item] of quiz.entries()) {
      if (!item.question || !Array.isArray(item.options) || item.options.length < 2) errors.push(`${relative}: question ${index + 1} is incomplete`);
      else if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) errors.push(`${relative}: question ${index + 1} has invalid answer index`);
      if (!item.explanation) errors.push(`${relative}: question ${index + 1} needs an explanation`);
    }
  } catch (error) { errors.push(`${relative}: invalid quiz JSON: ${error.message}`); }
}

const extensions = new Set(['.md', '.json', '.sql', '.py', '.yml', '.yaml']);
const forbidden = [/entropy-clickhouse-dbt/i, /entropy-data-pipeline/i, /entropy-advisors/i, /https?:\/\/(?:10\.|192\.168\.)/i, /\b[a-z0-9-]+\.internal\b/i];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'target', 'logs'].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (extensions.has(path.extname(entry.name))) {
      const relative = path.relative(root, fullPath).replaceAll('\\', '/');
      if (relative === 'docs/session-research.local.md' || relative === 'scripts/validate-content.mjs') continue;
      const text = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of forbidden) if (pattern.test(text)) errors.push(`${relative}: matches publication-safety pattern ${pattern}`);
    }
  }
}
walk(root);
if (errors.length) { console.error(errors.map((error) => `- ${error}`).join('\n')); process.exit(1); }
console.log(`Validated ${lessons.length} lessons with quizzes and publication-safety checks.`);

