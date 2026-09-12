import quizBank from '../data/quiz.generated.json';

/** 由 quiz:sync 从 docs/quiz-bank.md 生成，请勿手工编辑该 JSON；改题库请改 md 后重新同步。 */
export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

export type QuizCategory = 'asoul' | 'common' | 'ai';

const ASOUL_MIN = 3;
const ASOUL_MAX = 5;

const bank = quizBank.categories as Record<QuizCategory, QuizQuestion[]>;

export function getQuizBankStats(): Record<QuizCategory, number> {
  return { asoul: bank.asoul.length, common: bank.common.length, ai: bank.ai.length };
}

function sample(list: QuizQuestion[], count: number): QuizQuestion[] {
  const pool = [...list];
  const picked: QuizQuestion[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return picked;
}

/**
 * 组一轮答题：固定 10 题，A-SOUL 题目数量保证在 3~5 道之间，
 * 其余由常识与 AI 题库按 4:1 比例补足，最后打乱顺序。
 * 任一子题库题量不足时用其他题库补足，保证单轮题数不变。
 */
export function pickQuizRound(count = 10): QuizQuestion[] {
  const asoulCount = Math.min(ASOUL_MAX, Math.max(ASOUL_MIN, count - 5));
  const restCount = count - asoulCount;
  const aiCount = Math.max(1, Math.round(restCount * 0.2));
  const commonCount = restCount - aiCount;
  const quota: Array<[QuizCategory, number]> = [['asoul', asoulCount], ['common', commonCount], ['ai', aiCount]];
  const picked: QuizQuestion[] = [];
  for (const [category, need] of quota) {
    picked.push(...sample(bank[category], need));
  }
  // 补足缺口（题库被裁剪过小时）。
  if (picked.length < count) {
    const rest = (['common', 'asoul', 'ai'] as QuizCategory[]).flatMap((c) => bank[c]);
    picked.push(...sample(rest.filter((item) => !picked.includes(item)), count - picked.length));
  }
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, count);
}
