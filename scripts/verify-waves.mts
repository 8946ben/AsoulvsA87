// 校验 levels.ts 波次时间轴与 background.md 逐波编排一致性
import { ALL_LEVELS } from '../src/data/levels';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let problems = 0;
const doc = readFileSync(resolve(process.cwd(), 'background.md'), 'utf-8');

for (const level of ALL_LEVELS) {
  let cursor = 0;
  let totalZombies = 0;
  level.waves.forEach((wave, i) => {
    const prevStart = cursor;
    cursor += wave.delay;
    let tail = 0;
    for (const s of wave.spawns) {
      totalZombies += s.count;
      tail = Math.max(tail, (s.count - 1) * s.gap);
    }
    const waveEnd = cursor + tail;
    const next = level.waves[i + 1];
    if (next) {
      const nextStart = cursor + next.delay;
      if (waveEnd > nextStart) {
        console.log(`[重叠] L${level.id} 第${i + 1}波「${wave.title}」出怪尾巴 ${Math.round(waveEnd - prevStart)}ms 超过下一波开始 ${Math.round(nextStart - prevStart)}ms`);
        problems++;
      }
    }
  });
  const docLine = doc.split('\n').find((l) => l.includes(`第 ${level.id} 幕（`));
  const docWaves = docLine ? Number(docLine.match(/（(\d+) 波）/)?.[1] ?? -1) : -1;
  const nameMap: Record<string, string> = { basic: 'A87', cone: '路障', phone: '刷手机', screen: '铁门网', balloon: '气球', ladder: '梯子', bucket: '铁桶', pole: '撑杆跳', football: '橄榄球', sled: '雪橇车', miner: '矿工', dragon: '化龙' };
  let docZombies = 0;
  for (const [, count] of docLine?.matchAll(/×(\d+)/g) ?? []) docZombies += Number(count);
  const codeZombies = level.waves.reduce((sum, w) => sum + w.spawns.reduce((s, e) => s + e.count, 0), 0);
  const okWaves = docWaves === level.waves.length;
  const okCount = docZombies === codeZombies;
  if (!okWaves || !okCount) problems++;
  console.log(`L${level.id}: ${level.waves.length} 波, ${codeZombies} 只怪(文档${docZombies}), 总时长≈${Math.round(cursor / 1000)}s ${okWaves && okCount ? '✓' : '✗ 文档不一致'}`);
}
console.log(problems === 0 ? '\n全部通过' : `\n发现 ${problems} 个问题`);
