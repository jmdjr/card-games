import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import CoreScene from 'src/app/Game/scenes/core_scene';

import uiConfig from '../../Game/ui.config.json';
import { GameConfig } from '../../Game/mechanics/ui/ui.config';

@Component({
  selector: 'app-PhaserGameFrame',
  templateUrl: './PhaserGameFrame.component.html',
  styleUrls: ['./PhaserGameFrame.component.css']
})
export class PhaserGameFrameComponent implements OnInit {
  game: Phaser.Game | null;
  coreScene: Phaser.Scene | null;
  uiConfig: GameConfig = uiConfig;

  constructor() { }

  ngOnInit() {
    this.coreScene = new CoreScene();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL,
      parent: 'game-frame',
      backgroundColor: this.uiConfig.backgroundColor,
      banner: false,
      scale: {
        height: this.uiConfig.height,
        width: this.uiConfig.width,
        mode: Phaser.Scale.FIT,
      },
      dom: {
        createContainer: true
      },
      scene: this.coreScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: true,
        }
      }
    };

    this.game = new Phaser.Game(config);
  }
}
