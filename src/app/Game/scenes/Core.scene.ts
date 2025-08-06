import ASSETS from '../assets.data';
import Phaser, { GameObjects } from 'phaser';

import { GameConsole } from '../services/console-ui/console-ui';
import { Inject } from '../services/di/di.system';
import { UIBuilder } from '../mechanics/ui/uiFormatter';
import { UI_CONFIG_KEY } from '../mechanics/ui/ui.config';

export default class CoreScene extends Phaser.Scene {

  @Inject(UIBuilder.name)
  private _uiBuilder: UIBuilder;

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
  ];

  constructor(key: string) {
    super(key ?? "CoreScene");
  }

  protected addUI(key: UI_CONFIG_KEY, construct: () => GameObjects.GameObject & Phaser.GameObjects.Components.Transform | void): void {
    if (!construct) return;

    this.uiCreation.push(() => {
      const element = construct();
      if (element) {
        element.setName(key);
        this._uiBuilder.addElement(key, element.setPosition.bind(element));
      }
    });
  }

  init() {
    this.data.set('debug', false); // Set debug mode
  }

  preload() {
    for (let asset of ASSETS) {
      if (asset.isAtlas) {
        this.load?.atlas(asset.type, asset.url, asset.jsonUrl);
      } else {
        this.load?.image(asset.type, asset.url);
      }
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

