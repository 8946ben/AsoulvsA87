// 校验 levels.ts 波次 delay 是否符合杂交版阶梯公式
import { ALL_LEVELS } from '../src/data/levels';

let problems = 0;
for (const level of ALL_LEVELS) {
  level.waves.forEach((wave, i) => {
    let expected: number;
    if (i === 0) expected = 9000;
    else if (i === 1) expected = 40000;
    else if (i === 2) expected = 30000;
    else expected = 20000 + (level.waves[i - 1].isHuge ? 5000 : 0);
    if (wave.delay !== expected) {
      console.log(`L${level.id} 波${i + 1}「${wave.title}」delay=${wave.delay} 期望=${expected}${level.waves[i - 1]?.isHuge ? '（前波为旗帜波）' : ''}`);
      problems++;
    }
  });
}
console.log(problems === 0 ? '全部符合公式' : `发现 ${problems} 处不符`);
