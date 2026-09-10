import Phaser from 'phaser';
import { beginRogueNode, getOwnedBattlePlants, getRelics, loadRogueRun, recoverActiveRogueNode } from '../core/RogueRun';
import { sharpenSceneText } from '../core/TextQuality';
import { createRogueBattleLevel, NODE_LABELS, ROGUE_REGIONS, type RogueNode } from '../data/rogue';
import { PLANTS } from '../data/plants';
import { createRogueResourceBar } from '../ui/RogueResourceBar';
import { createRogueBackdrop, createRogueHeader, TOUR, tourButton, tourPanel, tourPortrait, tourText } from '../ui/RogueTheme';

export class RogueMapScene extends Phaser.Scene {
  static readonly KEY = 'RogueMapScene';
  private detailTitle!: Phaser.GameObjects.Text;
  private detailBody!: Phaser.GameObjects.Text;
  private detailStatus!: Phaser.GameObjects.Text;
  private action!: Phaser.GameObjects.Container;
  private selected?: RogueNode;
  private selection!: Phaser.GameObjects.Arc;
  constructor() { super(RogueMapScene.KEY); }

  create(): void {
    this.selected = undefined;
    const run = loadRogueRun();
    if (!run) { this.scene.start('RogueHubScene'); return; }
    if (run.status !== 'active') { this.scene.start('RogueSummaryScene'); return; }
    if (run.rewardPending) { this.scene.start('RogueRewardScene'); return; }
    if (run.activeNodeId) recoverActiveRogueNode(run);
    createRogueBackdrop(this, 'map');
    const region = ROGUE_REGIONS[run.region - 1];
    createRogueHeader(this, 'ROUTE EXPLORATION', region.name, `第 ${run.region} 区域  /  ${region.subtitle}`);
    createRogueResourceBar(this, run);
    tourPanel(this, 453, 364, 826, 428);
    tourPanel(this, 1066, 393, 348, 486);
    this.createRegionProgress(run.region);
    const nodes = run.nodes.filter((node) => node.region === run.region);
    const positions = new Map<string, { x: number; y: number }>();
    const rowCounts = [2, 3, 2, 3, 1];
    for (const node of nodes) {
      const count = rowCounts[node.column];
      positions.set(node.id, { x: 113 + node.column * 170, y: count === 1 ? 370 : count === 2 ? 286 + node.row * 169 : 248 + node.row * 115 });
    }
    const lines = this.add.graphics();
    for (const node of nodes) {
      const from = positions.get(node.id)!;
      for (const edgeId of node.edges) {
        const to = positions.get(edgeId); if (!to) continue;
        const target = nodes.find((candidate) => candidate.id === edgeId);
        const travelled = node.status === 'cleared' && (target?.status === 'cleared' || target?.status === 'available');
        const reachable = node.status === 'available';
        lines.lineStyle(travelled ? 4 : 2, travelled ? TOUR.teal : reachable ? 0x9fb4a1 : 0xd8dfd2, 1);
        const curve = new Phaser.Curves.CubicBezier(new Phaser.Math.Vector2(from.x + 28, from.y), new Phaser.Math.Vector2(from.x + 86, from.y), new Phaser.Math.Vector2(to.x - 86, to.y), new Phaser.Math.Vector2(to.x - 28, to.y));
        lines.strokePoints(curve.getPoints(24));
      }
    }
    tourText(this, 67, 562, '实色：已走过   /   描边：可选择   /   浅色：尚未到达   ·   数字键选择，Enter 出发', 11, TOUR.subtext);
    this.selection = this.add.circle(0, 0, 39).setStrokeStyle(2, TOUR.coral).setVisible(false);
    this.createDetailPanel();
    let shortcut = 0;
    for (const node of nodes) {
      const position = positions.get(node.id)!;
      this.createNode(node, position);
      if (node.status === 'available') {
        const key = String(++shortcut);
        this.input.keyboard?.on(`keydown-${key}`, () => this.selectNode(node, position));
      }
    }
    this.input.keyboard?.on('keydown-ENTER', () => { if (this.selected) this.enterNode(this.selected); });
    const owned = getOwnedBattlePlants(run);
    tourText(this, 48, 598, '随行伙伴', 12, TOUR.text, true);
    owned.forEach((type, index) => {
      const x = 165 + index * 47;
      this.add.circle(x, 616, 20, TOUR.paper).setStrokeStyle(1, TOUR.line);
      tourPortrait(this, x, 614, PLANTS[type].texture, 31, 37);
      tourText(this, x + 13, 631, run.unitRanks[type] === 2 ? 'Ⅱ' : 'Ⅰ', 9, TOUR.red, true).setOrigin(0.5);
    });
    tourText(this, 48, 621, `${owned.length} 位已招募`, 10, TOUR.subtext);
    tourText(this, 919, 472, '本局收藏', 12, TOUR.text, true);
    const relics = getRelics(run);
    tourText(this, 919, 498, relics.length ? relics.slice(0, 4).map((relic) => `◇  ${relic.name}`).join('\n') : '尚无收藏品，去演出中寻找吧。', 12, TOUR.subtext).setLineSpacing(8);
    tourText(this, 919, 606, `Lv.${run.level}  ·  收藏 ${relics.length} 件  ·  已完成 ${run.nodesCleared} 站`, 10, TOUR.subtext);
    tourButton(this, 143, 687, 206, '← 保存并返回  ESC', () => this.scene.start('RogueHubScene'), true);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('RogueHubScene'));
    const first = nodes.find((node) => node.status === 'available');
    if (first) this.selectNode(first, positions.get(first.id)!);
    sharpenSceneText(this);
  }

  private createNode(node: RogueNode, position: { x: number; y: number }): void {
    const meta = NODE_LABELS[node.type];
    const available = node.status === 'available'; const cleared = node.status === 'cleared';
    const disabled = node.status === 'locked' || node.status === 'skipped';
    const circle = this.add.circle(position.x, position.y, 30, cleared ? TOUR.teal : disabled ? 0xe9ede4 : TOUR.paper)
      .setStrokeStyle(available ? 2 : 1, available ? TOUR.teal : cleared ? TOUR.teal : TOUR.line);
    tourText(this, position.x, position.y - 2, cleared ? '✓' : meta.symbol, 23, cleared ? TOUR.white : disabled ? '#98a697' : TOUR.text, true).setOrigin(0.5);
    tourText(this, position.x, position.y + 43, meta.name, 12, disabled ? '#869582' : TOUR.text, true).setOrigin(0.5);
    if (available) tourText(this, position.x, position.y + 61, '可前往', 9, TOUR.red).setOrigin(0.5);
    circle.setInteractive({ useHandCursor: true });
    circle.on('pointerover', () => {
      circle.setStrokeStyle(2, TOUR.coral);
      this.showDetail(node);
    });
    circle.on('pointerout', () => {
      circle.setStrokeStyle(available ? 2 : 1, available || cleared ? TOUR.teal : TOUR.line);
      if (this.selected) this.showDetail(this.selected);
    });
    circle.on('pointerdown', () => this.selectNode(node, position));
  }

  private selectNode(node: RogueNode, position: { x: number; y: number }): void {
    this.selected = node;
    this.selection.setPosition(position.x, position.y).setVisible(true);
    this.showDetail(node);
  }

  private showDetail(node: RogueNode): void {
    const meta = NODE_LABELS[node.type]; const available = node.status === 'available';
    const states = { available: '可前往', cleared: '已完成', locked: '尚未解锁', skipped: '已错过', active: '进行中' };
    this.detailStatus.setText(`第 ${node.column + 1} 站  /  ${states[node.status]}`);
    this.detailTitle.setText(meta.name);
    this.detailBody.setText(`${meta.desc}。\n\n${available ? '选择这条路线后，同列其他站点将被跳过。准备好了就出发吧。' : node.status === 'cleared' ? '这一站已经完成，继续寻找下一段旅程。' : '沿着连接的路线前进，选择属于你的巡演旅程。'}`);
    // 悬浮仅预览；按钮始终绑定当前选中的节点，避免误入其他路线。
    const selectedAvailable = this.selected?.status === 'available';
    this.action.setVisible(Boolean(selectedAvailable) && node.id === this.selected?.id);
  }

  private enterNode(node: RogueNode): void {
    if (node.status !== 'available') return;
    const run = loadRogueRun(); if (!run) return;
    const active = beginRogueNode(run, node.id); if (!active) return;
    if (['battle', 'emergency', 'boss'].includes(active.type)) {
      const level = createRogueBattleLevel(active, getOwnedBattlePlants(run), run.seed);
      this.scene.start('LoadoutScene', { level, battleSession: { mode: 'rogue', rogueNodeId: active.id, unitRanks: run.unitRanks } });
    } else this.scene.start('RogueEventScene');
  }

  private createRegionProgress(currentRegion: number): void {
    ROGUE_REGIONS.forEach((region, index) => {
      const x = 68 + index * 260; const active = index + 1 === currentRegion;
      this.add.circle(x + 10, 181, 11, active ? TOUR.teal : TOUR.mint);
      tourText(this, x + 10, 181, index + 1 < currentRegion ? '✓' : String(index + 1), 10, active ? TOUR.white : TOUR.subtext, true).setOrigin(0.5);
      tourText(this, x + 32, 172, region.name, 13, active ? TOUR.text : TOUR.subtext, active);
    });
    this.add.rectangle(453, 209, 770, 1, TOUR.line);
  }

  private createDetailPanel(): void {
    tourText(this, 919, 175, 'NEXT STOP  /  下一站', 11, TOUR.red, true).setLetterSpacing(1);
    this.detailStatus = tourText(this, 919, 218, '', 12, TOUR.subtext);
    this.detailTitle = tourText(this, 919, 246, '选择下一站', 27, TOUR.text, true);
    this.detailBody = tourText(this, 919, 299, '点击路线节点，查看详情。', 13, TOUR.subtext).setWordWrapWidth(292, true).setLineSpacing(6);
    this.action = tourButton(this, 1066, 423, 292, '进入这一站    →', () => { if (this.selected) this.enterNode(this.selected); }).setVisible(false);
    this.add.rectangle(1066, 460, 292, 1, TOUR.line);
  }
}


