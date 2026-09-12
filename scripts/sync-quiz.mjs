// 将 docs/quiz-bank.md 同步为游戏题库 src/data/quiz.generated.json。
// 格式约定见 md 文件头部说明；脚本会校验每行的列数与答案合法性并打印统计。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'docs', 'quiz-bank.md');
const TARGET = join(root, 'src', 'data', 'quiz.generated.json');

const SECTION_TO_CATEGORY = {
  'A-SOUL 相关': 'asoul',
  '常识题': 'common',
  'AI 与高性能计算': 'ai',
};

function parseQuizBank(markdown) {
  const categories = { asoul: [], common: [], ai: [] };
  const errors = [];
  let current = null;
  let lineNo = 0;

  for (const rawLine of markdown.split(/\r?\n/)) {
    lineNo += 1;
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      current = SECTION_TO_CATEGORY[heading[1].trim()] ?? null;
      continue;
    }
    if (!line.startsWith('|')) continue;
    if (!current) {
      errors.push(`第 ${lineNo} 行：题目出现在未知章节下（须位于三个二级标题之一）`);
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === '题干' || /^-{3,}$/.test(cells[0])) continue; // 表头与分隔行
    if (cells.length !== 6) {
      errors.push(`第 ${lineNo} 行：应为 6 列（题干+4 选项+答案），实际 ${cells.length} 列`);
      continue;
    }
    const [question, ...options] = cells.slice(0, 5);
    const answerLetter = cells[5].toUpperCase();
    const answerIndex = 'ABCD'.indexOf(answerLetter);
    if (!question || options.some((option) => !option)) {
      errors.push(`第 ${lineNo} 行：题干或选项存在空值`);
      continue;
    }
    if (answerIndex < 0) {
      errors.push(`第 ${lineNo} 行：答案必须是 A/B/C/D，实际「${cells[5]}」`);
      continue;
    }
    categories[current].push({ q: question, options, answer: answerIndex });
  }
  return { categories, errors };
}

// 用题干做种子的确定性伪随机数：同一题每次同步的洗牌结果一致，md 增删不影响其他题。
function seededRandom(seedText) {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash ^= hash << 13; hash ^= hash >>> 17; hash ^= hash << 5;
    return ((hash >>> 0) % 10000) / 10000;
  };
}

// md 中答案列常偏向某个选项，同步时做确定性洗牌，保证游戏内 A/B/C/D 均衡。
function shuffleOptions(item) {
  const indices = [0, 1, 2, 3];
  const random = seededRandom(item.q + item.options[item.answer]);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const options = indices.map((index) => item.options[index]);
  return { q: item.q, options, answer: indices.indexOf(item.answer) };
}

const { categories, errors } = parseQuizBank(readFileSync(SOURCE, 'utf-8'));
if (errors.length > 0) {
  console.error(`[quiz:sync] 题库格式错误 ${errors.length} 处：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
for (const key of Object.keys(categories)) {
  categories[key] = categories[key].map(shuffleOptions);
}

const total = categories.asoul.length + categories.common.length + categories.ai.length;
const bank = {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'docs/quiz-bank.md',
  categories,
};
writeFileSync(TARGET, JSON.stringify(bank), 'utf-8');

// 答案分布统计，便于保持 A/B/C/D 均衡。
const distribution = (list) => {
  const counts = [0, 0, 0, 0];
  for (const item of list) counts[item.answer] += 1;
  return counts.join('/');
};
console.log(`[quiz:sync] 已生成 ${TARGET}`);
console.log(`[quiz:sync] A-SOUL 相关：${categories.asoul.length} 题（A/B/C/D 分布 ${distribution(categories.asoul)}）`);
console.log(`[quiz:sync] 常识题：    ${categories.common.length} 题（A/B/C/D 分布 ${distribution(categories.common)}）`);
console.log(`[quiz:sync] AI 与HPC： ${categories.ai.length} 题（A/B/C/D 分布 ${distribution(categories.ai)}）`);
console.log(`[quiz:sync] 合计 ${total} 题`);
