import Phaser from 'phaser';
import { advanceBattleRewardsToRecruit, beginBattleRewards, getRelicOffers, grantRelic, loadRogueRun, saveRogueRun } from '../core/RogueRun';
import { sharpenSceneText } from '../core/TextQuality';
import type { RogueRelic } from '../data/rogue';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourText } from '../ui/RogueTheme';
import { createRogueResourceBar } from '../ui/RogueResourceBar';

export class RogueRewardScene extends Phaser.Scene {
  static readonly KEY = 'RogueRewardScene';
  constructor() { super(RogueRewardScene.KEY); }

  create(): void {
    const run = loadRogueRun(); if (!run) { this.scene.start('RogueHubScene'); return; }
    if (!run.rewardPending) { this.route(run); return; }
    if (run.rewardStage === 'recruit') { this.scene.start('RogueRecruitScene', { source: 'battle' }); return; }
    createRogueBackdrop(this, 'reward'); createRogueResourceBar(this, run);
    if (run.rewardStage === 'relic') this.renderRelicStage(run);
    else this.renderOverview(run);
    sharpenSceneText(this);
  }

  private renderOverview(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    createRogueHeader(this, 'BATTLE CLEARED', '掌声之后，收获满载', '本场三项奖励全部获得，领取后依次选择收藏品与招募伙伴。');
    const rewards = [
      { icon: '♥', title: '舞台维护', desc: '恢复 3 点生命值', note: '领取时立即生效', color: TOUR.coral },
      { icon: '◇', title: '巡演收藏', desc: '从候选收藏品中选择一件', note: '下一步 · 选择收藏品', color: 0x997d9f },
      { icon: '+', title: '公开招募', desc: '招募新角色或进阶已有伙伴', note: '最后一步 · 招募伙伴', color: TOUR.teal },
    ];
    rewards.forEach((reward, index) => {
      const x = 232 + index * 408;
      tourPanel(this, x, 351, 384, 354);
      tourText(this, x - 158, 198, `0${index + 1}  /  演出回馈`, 11, TOUR.subtext, true);
      this.add.circle(x, 293, 58, reward.color, 0.1).setStrokeStyle(1, reward.color, 0.4);
      tourText(this, x, 293, reward.icon, 51, Phaser.Display.Color.IntegerToColor(reward.color).rgba, true).setOrigin(0.5);
      tourText(this, x, 381, reward.title, 25, TOUR.text, true).setOrigin(0.5);
      tourText(this, x, 425, reward.desc, 14, TOUR.subtext).setOrigin(0.5);
      tourText(this, x, 485, reward.note, 11, TOUR.red, true).setOrigin(0.5);
    });
    tourText(this, 640, 558, '门票、应援值与探索经验已在战斗结束时记入本局。', 12, TOUR.subtext).setOrigin(0.5);
    tourButton(this, 640, 612, 320, '领取全部奖励    →', () => { if (beginBattleRewards(run)) this.scene.restart(); });
  }

  private renderRelicStage(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    createRogueHeader(this, 'REWARD 01 / 02', '把这段星光，收入行囊', '选择一件收藏品。完成后将继续公开招募。');
    const offers = getRelicOffers(run);
    if (!offers.length) {
      run.tickets += 6; saveRogueRun(run); advanceBattleRewardsToRecruit(run);
      tourPanel(this, 640, 364, 720, 372);
      tourText(this, 640, 285, '收藏品已经集齐', 30, TOUR.text, true).setOrigin(0.5);
      tourText(this, 640, 352, '本项奖励自动替换为 6 张门票', 15, TOUR.subtext).setOrigin(0.5);
      tourButton(this, 640, 463, 320, '继续公开招募    →', () => this.scene.start('RogueRecruitScene', { source: 'battle' }));
      return;
    }
    offers.forEach((relic, index) => this.createRelicCard(640 + (index - (offers.length - 1) / 2) * 408, relic, index, () => {
      grantRelic(run, relic.id); advanceBattleRewardsToRecruit(run); this.scene.start('RogueRecruitScene', { source: 'battle' });
    }));
  }

  private createRelicCard(x: number, relic: RogueRelic, index: number, onClick: () => void): void {
    tourPanel(this, x, 392, 384, 484);
    tourText(this, x - 157, 184, `COLLECTION  /  0${index + 1}`, 11, TOUR.subtext, true);
    const emblem = this.add.graphics();
    emblem.fillStyle(relic.accent, 0.14); emblem.fillCircle(x, 292, 82);
    emblem.lineStyle(1, TOUR.gold, 0.7); emblem.strokeCircle(x, 292, 68); emblem.strokeCircle(x, 292, 76);
    tourText(this, x, 292, '◇', 76, TOUR.red).setOrigin(0.5);
    tourText(this, x, 403, relic.name, 25, TOUR.text, true).setOrigin(0.5);
    tourText(this, x, 466, relic.description, 14, TOUR.subtext).setAlign('center').setWordWrapWidth(310, true).setOrigin(0.5);
    tourButton(this, x, 582, 320, '收入行囊    →', onClick);
  }

  private route(run: NonNullable<ReturnType<typeof loadRogueRun>>): void { this.scene.start(run.status === 'active' ? 'RogueMapScene' : 'RogueSummaryScene'); }
}


