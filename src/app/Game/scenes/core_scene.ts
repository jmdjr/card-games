import ASSETS from '../assets.data';
import Phaser from 'phaser';

import { GameConsole } from '../services/console-ui/console-ui';
import { Inject } from '../services/di/di.system';
import { UIBuilder } from '../mechanics/ui/uiFormatter';

export enum GameEvents {
}

export default class CoreScene extends Phaser.Scene {
  private uiCreation: (() => void)[] = [
    () => { // Create the game console
      const console = new GameConsole(this, 0, 0, 800, 600);
      console.setName('gameDevConsole');
      this.add.existing(console);
      this.input.keyboard?.on('keydown', (event: Event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key === '~') {
          console.showConsole();
        }
      });
    },

    () => { 
    },
  ];

  @Inject(UIBuilder.name)
  private _uiBuilder: UIBuilder;

  constructor() {
    super("CoreScene");
  }

  init() {
    this.data.set('debug', false); // Set debug mode
  }

  preload() {
    for (let asset of ASSETS) {
      this.load?.image(asset.type, asset.url);
    }
  }

  create() {
    this.uiCreation.forEach((create) => create());
    this._uiBuilder.buildUI();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
  }
}