import Phaser from 'phaser';
import { finishBattleRewards, getRecruitOffers, loadRogueRun, recruitUnit, resolveUtilityNode, skipRecruit, type RecruitOffer } from '../core/RogueRun';
import { sharpenSceneText } from '../core/TextQuality';
import { PLANTS } from '../data/plants';
import { createRogueResourceBar } from '../ui/RogueResourceBar';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourPortrait, tourText } from '../ui/RogueTheme';

type RecruitSource = 'node' | 'battle' | 'encounter';

export class RogueRecruitScene extends Phaser.Scene {
  static readonly KEY = 'RogueRecruitScene';
  private source: RecruitSource = 'node';
  constructor() { super(RogueRecruitScene.KEY); }
  init(data: { source?: RecruitSource }): void { this.source = data?.source ?? 'node'; }

  create(): void {
    const run = loadRogueRun(); if (!run) { this.scene.start('RogueHubScene'); return; }
    createRogueBackdrop(this, 'recruit');
    createRogueHeader(this, this.source === 'battle' ? 'REWARD 02 / 02' : 'RECRUITMENT', '新的伙伴，新的可能', '选择一位伙伴加入巡演；再次招募已有角色，可以解锁进阶特性。');
    createRogueResourceBar(this, run);
    const offers = getRecruitOffers(run);
    if (offers.length === 0) {
      tourPanel(this, 640, 367, 720, 350);
      tourText(this, 640, 290, '全员集结，整装待发', 30, TOUR.text, true).setOrigin(0.5);
      tourText(this, 640, 355, '本局可招募角色均已达到最高阶级。', 15, TOUR.subtext).setOrigin(0.5);
    }
    offers.forEach((offer, index) => this.createOffer(640 + (index - (offers.length - 1) / 2) * 408, offer, run.hope));
    tourButton(this, 640, 687, 234, this.source === 'battle' ? '放弃本次招募机会' : '跳过本次招募', () => {
      const latest = loadRogueRun(); if (!latest) return; skipRecruit(latest); this.finish(latest);
    }, true);
    sharpenSceneText(this);
  }

  private createOffer(x: number, offer: RecruitOffer, hope: number): void {
    const config = PLANTS[offer.type]; const affordable = hope >= offer.cost;
    tourPanel(this, x, 393, 384, 486, affordable ? TOUR.line : 0xc8d0c1, affordable ? TOUR.paper : 0xebeee5);
    const g = this.add.graphics();
    g.fillStyle(config.accent, 0.12); g.fillRoundedRect(x - 178, 164, 356, 222, 10);
    g.lineStyle(1, config.accent, 0.3); g.strokeCircle(x, 290, 83);
    tourText(this, x - 157, 181, offer.nextRank === 2 ? 'PROMOTION  /  进阶' : 'NEW MEMBER  /  招募', 10, TOUR.red, true);
    tourText(this, x + 157, 180, offer.nextRank === 2 ? 'RANK II' : 'RANK I', 12, TOUR.text, true).setOrigin(1, 0);
    tourPortrait(this, x, 286, config.texture, 176, 177).setAlpha(affordable ? 1 : 0.55);
    tourText(this, x - 157, 410, config.name, 27, TOUR.text, true);
    tourText(this, x + 157, 423, config.role, 12, TOUR.subtext).setOrigin(1, 0.5);
    tourText(this, x - 157, 457, offer.nextRank === 2 ? '解锁进阶特性' : '首次招募 · 解锁核心能力', 13, TOUR.red, true);
    tourText(this, x - 157, 486, offer.nextRank === 2 ? this.getRankTwoDesc(offer.type) : '加入战前阵容，或与其他伙伴一起参与融合。', 12, TOUR.subtext).setWordWrapWidth(314, true).setLineSpacing(5);
    if (affordable) tourButton(this, x, 588, 320, `招募伙伴    /    ${offer.cost} 应援值`, () => {
      const run = loadRogueRun(); if (!run || !recruitUnit(run, offer)) return; this.finish(run);
    });
    else {
      this.add.rectangle(x, 588, 320, 46, 0xd7ded1);
      tourText(this, x, 588, `应援值不足   ·   还差 ${offer.cost - hope}`, 14, TOUR.subtext, true).setOrigin(0.5);
    }
  }

  private getRankTwoDesc(type: RecruitOffer['type']): string {
    if (type === 'eileen') return '解锁乃琳光环：每个 Rank II 乃琳使奶淇琳奶油概率 +15%，最多 +45%';
    if (type === 'diana') return '解锁嘉然支援：嘉心糖费用减半、生命翻倍、攻击 +50%';
    if (type === 'bella') return '解锁队长应援：贝极星产出的应援值翻倍';
    if (type === 'gladys' || type === 'fiona') return '解锁退场后的概率支援召唤';
    if (['xingkongtang', 'xilanai', 'jiaxinnaitang', 'yigehun'].includes(type)) return '解锁该融合角色的完整概率特性与场上联动';
    return '解锁完整进阶特性';
  }

  private finish(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    if (this.source === 'node') resolveUtilityNode(run);
    else if (this.source === 'battle') finishBattleRewards(run);
    this.scene.start(run.status === 'active' ? 'RogueMapScene' : 'RogueSummaryScene');
  }
}


