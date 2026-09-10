import Phaser from 'phaser';
import { getActiveRogueNode, getRelicOffers, grantRelic, loadRogueRun, resolveUtilityNode, saveRogueRun, spendTickets } from '../core/RogueRun';
import { NODE_LABELS } from '../data/rogue';
import { sharpenSceneText } from '../core/TextQuality';
import { createRogueResourceBar } from '../ui/RogueResourceBar';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourText } from '../ui/RogueTheme';

export class RogueEventScene extends Phaser.Scene {
  static readonly KEY = 'RogueEventScene';
  constructor() { super(RogueEventScene.KEY); }

  create(): void {
    const run = loadRogueRun(); const node = run ? getActiveRogueNode(run) : null;
    if (!run || !node) { this.scene.start('RogueMapScene'); return; }
    createRogueBackdrop(this, 'event'); createRogueResourceBar(this, run);
    const meta = NODE_LABELS[node.type];
    createRogueHeader(this, 'ON THE ROAD', meta.name, meta.desc);
    tourPanel(this, 253, 393, 426, 486, TOUR.teal, TOUR.ink);
    tourText(this, 74, 184, `第 ${run.region} 区域  /  第 ${node.column + 1} 站`, 12, '#c5d3bd', true);
    const art = this.add.graphics();
    art.lineStyle(1, 0xdac58b, 0.45); art.strokeCircle(253, 344, 104); art.strokeCircle(253, 344, 118);
    art.fillStyle(0x41685a); art.fillCircle(253, 344, 88);
    tourText(this, 253, 338, meta.symbol, 91, '#e3c584', true).setOrigin(0.5);
    tourText(this, 253, 503, node.type === 'rest' ? '休息一下，再出发。' : node.type === 'trader' ? '带一点好物去下一站。' : '旅途的惊喜，总在转角。', 20, TOUR.white, true).setOrigin(0.5);
    tourText(this, 253, 585, 'TOUR JOURNAL  /  沿途纪事', 10, '#c5d3bd').setOrigin(0.5).setLetterSpacing(2);
    tourPanel(this, 868, 393, 744, 486);
    if (node.type === 'encounter') this.renderEncounter(run, node.column, node.row);
    else if (node.type === 'rest') this.renderRest(run);
    else if (node.type === 'trader') this.renderTrader(run);
    else this.finish(run);
    sharpenSceneText(this);
  }

  private story(title: string, body: string): void {
    tourText(this, 530, 184, '此刻，你会如何选择？', 11, TOUR.red, true);
    tourText(this, 530, 220, title, 27, TOUR.text, true);
    tourText(this, 530, 268, body, 14, TOUR.subtext).setWordWrapWidth(670, true).setLineSpacing(6);
  }

  private renderEncounter(run: NonNullable<ReturnType<typeof loadRogueRun>>, column: number, row: number): void {
    const variant = (run.seed + run.region * 13 + column * 7 + row * 3) % 3;
    if (variant === 1) {
      this.story('后台探班名额', '一位工作人员愿意带你去见仍在候场的角色。');
      this.choice(0, '接受探班邀请', '本事件结束后获得一次公开招募', () => this.finishWithRecruit(run));
      this.choice(1, '留在观众席', '应援值 +3', () => { run.hope += 3; this.finish(run); });
    } else if (variant === 2) {
      this.story('遗失的收藏箱', '箱子上贴着巡演失物招领处的标签，你可以取走其中一件纪念品。');
      this.renderRelics(run);
    } else {
      this.story('街角的即兴合唱', '路边的应援摊主向你挥手，邀请你加入这一场小小的演出。');
      this.choice(0, '加入合唱', '生命值 -2（最低保留 1），应援值 +4', () => { run.stageHp = Math.max(1, run.stageHp - 2); run.hope += 4; this.finish(run); });
      this.choice(1, '帮忙整理灯牌', '门票 +4', () => { run.tickets += 4; this.finish(run); });
    }
  }

  private renderRest(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    this.story('幕间的一点闲暇', '休息足够短，也足够重新找回节奏。用这段时间照顾舞台，或和观众聊聊天。');
    this.choice(0, '检修舞台', '恢复 4 点生命值', () => { run.stageHp = Math.min(run.maxStageHp, run.stageHp + 4); this.finish(run); });
    this.choice(1, '粉丝互动', '应援值 +2，门票 +1', () => { run.hope += 2; run.tickets += 1; this.finish(run); });
  }

  private renderTrader(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    this.story('枝江小铺，今日营业', `你带来了 ${run.tickets} 张门票。挑选一项补给，让接下来的巡演更从容。`);
    this.choice(0, '应援兑换', '2 门票 → 2 应援值', () => { if (spendTickets(run, 2)) run.hope += 2; this.finish(run); }, run.tickets >= 2);
    this.choice(1, '舞台维修', '4 门票 → 恢复 5 生命值', () => { if (spendTickets(run, 4)) run.stageHp = Math.min(run.maxStageHp, run.stageHp + 5); this.finish(run); }, run.tickets >= 4);
    this.choice(2, '看看就走', '不消耗资源，继续旅程', () => this.finish(run));
  }

  private renderRelics(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    const offers = getRelicOffers(run);
    if (!offers.length) {
      this.choice(0, '收下门票', '收藏品已经集齐，改为获得 6 张门票', () => { run.tickets += 6; this.finish(run); });
      return;
    }
    offers.forEach((relic, index) => this.choice(index, relic.name, relic.description, () => { grantRelic(run, relic.id); this.finish(run); }));
  }

  private finishWithRecruit(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    saveRogueRun(run); resolveUtilityNode(run); this.scene.start('RogueRecruitScene', { source: 'encounter' });
  }

  private choice(index: number, title: string, desc: string, onClick: () => void, enabled = true): void {
    const y = 365 + index * 94;
    tourPanel(this, 868, y, 672, 80, TOUR.line, enabled ? 0xf2f4ea : 0xe8ece2);
    tourText(this, 551, y - 23, title, 17, enabled ? TOUR.text : '#869582', true);
    tourText(this, 551, y + 9, desc, 12, TOUR.subtext).setWordWrapWidth(464, true);
    if (enabled) tourButton(this, 1141, y, 88, '选择 →', onClick, true);
    else tourText(this, 1141, y, '门票不足', 12, TOUR.subtext).setOrigin(0.5);
  }

  private finish(run: NonNullable<ReturnType<typeof loadRogueRun>>): void { saveRogueRun(run); resolveUtilityNode(run); this.scene.start(run.status === 'active' ? 'RogueMapScene' : 'RogueSummaryScene'); }
}


