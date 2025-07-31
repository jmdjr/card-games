import ASSETS from '../assets.data';
import Phaser from 'phaser';

import { GameConsole } from '../services/console-ui/console-ui';
import { Inject } from '../services/di/di.system';
import { UIBuilder } from '../mechanics/ui/uiFormatter';
import { createQuickPhaserDeckUI, PhaserDeckUIExamples } from '../ui/card/deck-ui.examples';
import { DeckClickEvent, DeckStyle } from '../ui/card/deck-ui.types';
import { PhaserDeckEvents } from '../ui/card/phaser-deck';

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
      // Demo: Create example deck UIs
      const standardDeck = createQuickPhaserDeckUI(this, 100, 100, DeckStyle.STANDARD, true);
      const unoDeck = createQuickPhaserDeckUI(this, 300, 100, DeckStyle.UNO, false);
      const diceSet = createQuickPhaserDeckUI(this, 500, 100, DeckStyle.DICE, true);
      PhaserDeckUIExamples.createAnimatedDemo(this);
      console.log('Demo deck UIs created:', { standardDeck, unoDeck, diceSet });

      standardDeck.on(PhaserDeckEvents.DECK_CLICK, async (event: DeckClickEvent) => {
        await standardDeck.shuffleDeck();
      });
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