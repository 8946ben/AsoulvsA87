import Phaser from 'phaser';
import { abandonRogueRun, getRelics, loadRogueRun } from '../core/RogueRun';
import { sharpenSceneText } from '../core/TextQuality';
import { ROGUE_REGIONS } from '../data/rogue';
import { createRogueResourceBar } from '../ui/RogueResourceBar';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourText } from '../ui/RogueTheme';

export class RogueSummaryScene extends Phaser.Scene {
  static readonly KEY = 'RogueSummaryScene';
  constructor() { super(RogueSummaryScene.KEY); }

  create(): void {
    const run = loadRogueRun(); if (!run) { this.scene.start('RogueHubScene'); return; }
    const win = run.status === 'victory';
    createRogueBackdrop(this, 'summary');
    createRogueHeader(this, 'TOUR ARCHIVE', win ? '星光不散，巡演圆满落幕' : '暂别舞台，下次再见', win ? '你守住了三个区域的最终返场。把这段旅程，留作纪念。' : '这一程暂告结束，下一次还有全新的路线与相遇。');
    createRogueResourceBar(this, run);
    tourPanel(this, 257, 393, 434, 486, TOUR.teal, TOUR.ink);
    this.add.circle(257, 303, 91, 0x41685a).setStrokeStyle(1, 0xcbbd8b, 0.6);
    tourText(this, 257, 297, win ? '★' : '♪', 92, '#e3c584').setOrigin(0.5);
    tourText(this, 257, 185, 'A-SOUL  /  巡演纪念', 12, '#d1d9bf', true).setOrigin(0.5);
    tourText(this, 257, 423, win ? '圆满返场' : '未完待续', 36, TOUR.white, true).setOrigin(0.5);
    tourText(this, 257, 477, ROGUE_REGIONS[Math.min(2, run.region - 1)].name, 17, '#d1d9bf').setOrigin(0.5);
    tourText(this, 257, 584, `TOUR NO. ${run.seed}`, 11, '#d1d9bf').setOrigin(0.5).setLetterSpacing(2);
    tourPanel(this, 873, 393, 734, 486);
    tourText(this, 537, 180, '旅程回顾', 19, TOUR.text, true);
    const stats = [['探索区域', `${run.region} / 3`], ['完成节点', String(run.nodesCleared)], ['战斗胜利', String(run.battlesWon)], ['最终等级', `Lv.${run.level}`], ['招募角色', String(Object.values(run.unitRanks).filter((rank) => rank && rank > 0).length)], ['收藏品', String(run.relicIds.length)]];
    stats.forEach(([label, value], index) => {
      const x = 538 + index % 3 * 229; const y = 237 + Math.floor(index / 3) * 100;
      tourText(this, x, y, label, 12, TOUR.subtext);
      tourText(this, x, y + 27, value, 32, TOUR.text, true);
    });
    this.add.rectangle(873, 432, 670, 1, TOUR.line);
    tourText(this, 537, 453, '带回的纪念', 12, TOUR.red, true);
    const relics = getRelics(run).map((relic) => relic.name).join('  ·  ') || '本局没有获得收藏品';
    tourText(this, 537, 481, relics, 12, TOUR.subtext).setWordWrapWidth(670, true).setLineSpacing(6);
    tourButton(this, 873, 586, 670, '开启新的巡演    →', () => { abandonRogueRun(); this.scene.start('RogueSetupScene'); });
    tourButton(this, 143, 687, 206, '← 返回肉鸽大厅', () => this.scene.start('RogueHubScene'), true);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('RogueHubScene'));
    sharpenSceneText(this);
  }
}


