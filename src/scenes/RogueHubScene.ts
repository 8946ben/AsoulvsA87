import Phaser from 'phaser';
import { loadRogueRun } from '../core/RogueRun';
import { sharpenSceneText } from '../core/TextQuality';
import { ROGUE_REGIONS } from '../data/rogue';
import { PLANTS } from '../data/plants';
import { createRogueResourceBar } from '../ui/RogueResourceBar';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourPortrait, tourText } from '../ui/RogueTheme';

export class RogueHubScene extends Phaser.Scene {
  static readonly KEY = 'RogueHubScene';
  constructor() { super(RogueHubScene.KEY); }

  create(): void {
    createRogueBackdrop(this, 'hub');
    createRogueHeader(this, 'TOUR HANDBOOK', '集成巡演', '带上你的应援，一起去下一站。');
    const run = loadRogueRun();
    if (run) createRogueResourceBar(this, run);

    // 左侧巡演海报：复用实际游戏角色，让大厅具有明确的游戏识别度。
    tourPanel(this, 418, 386, 756, 474, TOUR.teal, TOUR.ink);
    const art = this.add.graphics();
    art.fillStyle(0x3a6258); art.fillCircle(610, 372, 161);
    art.lineStyle(1, 0xcbd6b1, 0.22); art.strokeCircle(610, 372, 183); art.strokeCircle(610, 372, 198);
    art.fillStyle(0xe8c779); art.fillCircle(716, 228, 35);
    art.fillStyle(0x193d3b, 0.5); art.fillEllipse(601, 536, 290, 45);
    tourText(this, 76, 182, 'A-SOUL  /  ROGUELIKE', 11, '#d7c491', true).setLetterSpacing(2);
    tourText(this, 76, 236, '循着星光\n即刻出发', 49, TOUR.white, true).setLineSpacing(9);
    tourText(this, 79, 380, '三段旅程，无数种可能。\n招募伙伴，收集奇遇，守住最后的返场。', 14, '#c1d2be').setLineSpacing(9);
    tourPortrait(this, 535, 423, PLANTS.bella.texture, 164, 220).setAngle(-7);
    tourPortrait(this, 715, 427, PLANTS.diana.texture, 152, 215).setAngle(7);
    // 团体海报展示偶像贝拉、嘉然、乃琳；嘉心糖是粉丝形象，不作为团体成员展示。
    tourPortrait(this, 626, 438, PLANTS.eileen.texture, 160, 210);
    const route = this.add.graphics().lineStyle(2, 0xd7c491, 0.5);
    route.lineBetween(94, 550, 395, 550);
    ROGUE_REGIONS.forEach((region, index) => {
      const x = 94 + index * 143;
      this.add.circle(x, 550, 6, index === 0 ? TOUR.coral : 0xd7c491);
      tourText(this, x - 7, 573, region.name, 11, '#d5ddc9');
    });

    tourPanel(this, 1031, 386, 418, 474);
    tourText(this, 852, 180, run ? 'YOUR JOURNEY  /  巡演档案' : 'BOARDING PASS  /  出发通行证', 11, TOUR.red, true);
    if (run) this.renderRun(run);
    else this.renderEmpty();
    tourButton(this, 143, 687, 206, '← 返回模式选择  ESC', () => this.scene.start('ModeSelectScene'), true);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('ModeSelectScene'));
    sharpenSceneText(this);
  }

  private renderEmpty(): void {
    tourText(this, 852, 223, '下一场，从你开始', 26, TOUR.text, true);
    tourText(this, 852, 266, '选择一组初始伙伴，开启随机生成的巡演。', 13, TOUR.subtext);
    const steps = [
      ['01', '组建初始阵容', '三种组合，选择你的开场节奏'],
      ['02', '决定下一站', '演出、偶遇、休整与沿途小铺'],
      ['03', '迎接最终返场', '收集纪念品，让每一局都有新打法'],
    ];
    steps.forEach(([number, title, desc], index) => {
      const y = 325 + index * 62;
      this.add.circle(870, y + 6, 18, TOUR.mint);
      tourText(this, 870, y + 6, number, 12, TOUR.text, true).setOrigin(0.5);
      tourText(this, 905, y - 8, title, 16, TOUR.text, true);
      tourText(this, 905, y + 17, desc, 11, TOUR.subtext);
    });
    tourButton(this, 1031, 542, 350, '开始新的巡演    →', () => this.scene.start('RogueSetupScene'));
    tourText(this, 1031, 591, '独立进度  ·  自动保存  ·  每局一条新路线', 11, TOUR.subtext).setOrigin(0.5);
  }

  private renderRun(run: NonNullable<ReturnType<typeof loadRogueRun>>): void {
    const finished = run.status !== 'active';
    tourText(this, 852, 221, finished ? (run.status === 'victory' ? '巡演圆满落幕' : '此刻，暂别舞台') : ROGUE_REGIONS[Math.min(2, run.region - 1)].name, 27, TOUR.text, true);
    tourText(this, 852, 266, finished ? '回顾这段旅程，准备下一次出发。' : `第 ${run.region} / 3 区域   ·   进度已自动保存`, 13, TOUR.subtext);
    const stats = [['完成节点', String(run.nodesCleared)], ['探索等级', `Lv.${run.level}`], ['持有收藏', `${run.relicIds.length} 件`], ['战斗胜利', String(run.battlesWon)]];
    stats.forEach(([label, value], index) => {
      const x = 852 + index % 2 * 182; const y = 325 + Math.floor(index / 2) * 80;
      tourText(this, x, y, label, 11, TOUR.subtext);
      tourText(this, x, y + 22, value, 27, TOUR.text, true);
    });
    const destination = run.rewardPending ? 'RogueRewardScene' : finished ? 'RogueSummaryScene' : 'RogueMapScene';
    const action = run.rewardPending ? '领取待选奖励' : finished ? '查看本局结算' : '继续当前巡演';
    tourButton(this, 1031, 542, 350, `${action}    →`, () => this.scene.start(destination));
    tourText(this, 1031, 591, finished ? '每次落幕，也是下一次开场。' : '你的伙伴与收藏品，正在下一站等你。', 11, TOUR.subtext).setOrigin(0.5);
  }
}


