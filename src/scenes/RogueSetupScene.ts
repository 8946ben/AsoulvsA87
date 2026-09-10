import Phaser from 'phaser';
import { createRogueRun } from '../core/RogueRun';
import { sharpenSceneText } from '../core/TextQuality';
import { PLANTS } from '../data/plants';
import { ROGUE_SQUADS } from '../data/rogue';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourPortrait, tourText } from '../ui/RogueTheme';

export class RogueSetupScene extends Phaser.Scene {
  static readonly KEY = 'RogueSetupScene';
  constructor() { super(RogueSetupScene.KEY); }

  create(): void {
    createRogueBackdrop(this, 'setup');
    createRogueHeader(this, '01 / BUILD YOUR SQUAD', '选择你的开场阵容', '所有伙伴以 Rank I 加入；再次招募可进阶，解锁更多特性。');
    ROGUE_SQUADS.forEach((squad, index) => this.createSquadCard(232 + index * 408, squad, index));
    tourButton(this, 131, 687, 182, '← 返回大厅  ESC', () => this.scene.start('RogueHubScene'), true);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('RogueHubScene'));
    sharpenSceneText(this);
  }

  private createSquadCard(x: number, squad: typeof ROGUE_SQUADS[number], index: number): void {
    const colors = [TOUR.teal, TOUR.coral, 0x927143];
    const accent = colors[index]; const tints = [0xe8efe3, 0xf6e6dc, 0xf1ecd9];
    tourPanel(this, x, 393, 384, 486);
    const g = this.add.graphics();
    g.fillStyle(tints[index]); g.fillRoundedRect(x - 178, 164, 356, 186, 10);
    g.lineStyle(1, accent, 0.2); g.strokeCircle(x, 285, 77);
    tourText(this, x - 158, 180, `组合 0${index + 1}`, 11, TOUR.subtext, true);
    tourText(this, x + 158, 180, ['均衡入门', '控制续航', '灵活变阵'][index], 11, TOUR.red, true).setOrigin(1, 0);
    squad.units.forEach((type, unitIndex) => {
      const offset = unitIndex - 1;
      tourPortrait(this, x + offset * 98, unitIndex === 1 ? 274 : 288, PLANTS[type].texture, unitIndex === 1 ? 110 : 91, unitIndex === 1 ? 129 : 106);
    });
    tourText(this, x - 157, 372, squad.name, 27, TOUR.text, true);
    tourText(this, x - 157, 414, squad.desc, 13, TOUR.subtext);
    squad.units.forEach((type, unitIndex) => {
      const config = PLANTS[type]; const y = 453 + unitIndex * 27;
      this.add.circle(x - 151, y + 6, 3, accent);
      tourText(this, x - 139, y, config.name, 12, TOUR.text, true);
      tourText(this, x + 155, y, config.role, 11, TOUR.subtext).setOrigin(1, 0);
    });
    tourButton(this, x, 588, 320, '选择这组伙伴    →', () => { createRogueRun(squad.id); this.scene.start('RogueMapScene'); });
  }
}

