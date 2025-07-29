import { Asset, getAssetByType } from '../../assets.data';
import Button from './button';
import Phaser, { GameObjects } from 'phaser';
import CoreScene, { GameEvents } from '../../scenes/core_scene';
import { LabeledButton } from './labeledButton';
import { VisualPathGuess } from '../path/visualPathGuess';
import { PathSequence } from '../path/path';

export class ButtonPanel extends Phaser.GameObjects.Container {
  static readonly TYPE: string = 'BUTTON_PANEL';
  static readonly WIDTH: number = 3;
  static readonly HEIGHT: number = 3;

  private _visualPath: VisualPathGuess;

  private _ignoreActions: boolean = false;

  public get ignoreActions() {
    return this._ignoreActions;
  }

  public set ignoreActions(value: boolean) {
    this._ignoreActions = value;
    this._visualPath.ignoreActions = value; // Propagate to the visual path
  }

  private _addButton(x: number, y: number, asset: Asset) {
    const label = this._scene.data.get("debug") ? `${x + ButtonPanel.WIDTH * y}` : ''; // Generate a label based on position
    this.add(new LabeledButton(this._scene, asset, x, y, label));
  }

  constructor(private _scene: CoreScene, x, y) {
    super(_scene, x, y);
    this._scene.add.existing(this);
    this.layout();
    this._visualPath = new VisualPathGuess(this._scene, this);
  }

  get visualPath() {
    return this._visualPath.path;
  }

  override update(x: number, y: number) {
    super.update(x, y);
    if(this._ignoreActions) return; // Ignore updates if ignoreActions is set
    this._visualPath.update(x, y);
  }

  layout() {
    const asset = getAssetByType(LabeledButton.TYPE);
    if (!asset) return; // Ensure the button asset exists

    const addButton = (x, y) => {
      this._addButton(x, y, asset);
    }

    // Create a grid of buttons
    Array.from({ length: ButtonPanel.HEIGHT },
      (_, j) =>
        Array.from({ length: ButtonPanel.WIDTH },
          (_, i) => addButton(i, j)
        )
    );

    const gap = asset.width * 2; // 10% of the asset width as gap
    const cellWidth = asset.width + gap;
    const cellHeight = asset.height + gap;
    const allButtons = this.getAll();

    Phaser.Actions.GridAlign(allButtons, {
      width: ButtonPanel.WIDTH,
      height: ButtonPanel.HEIGHT,
      cellWidth: cellWidth,
      cellHeight: cellHeight,
      x: this.x,
      y: this.y
    });

    // set all buttons over to change color on hover
    allButtons.forEach((button: GameObjects.GameObject) => {
      if (!(button instanceof LabeledButton)) return; // Ensure the button is of the correct type
      const labeledButton = button;

      labeledButton.set.over(() => {
        labeledButton.setTint(0x00FF00);
      });

      labeledButton.set.out(() => {
        labeledButton.clearTint();
      });
    });

    // a getter for a set object used to set the same event handlers for all buttons.set event setter
    // this._scene.add.rectangle(this.x, this.y, width * cellWidth, height * cellHeight, 0xFF0000, 0.25).setOrigin(0, 0);
  }

  private _callOnAllButtons(method: string, callback: (button: Button, index: number) => void) {
    this.getAll().forEach((button: GameObjects.GameObject, index: number) => {
      if (!(button instanceof LabeledButton)) return; // Ensure the button is of the correct type
      if (this._ignoreActions) return; // Ignore actions if set

      const labeledButton = button;
      if (labeledButton.button.set[method]) {
        labeledButton.button.set[method](callback.bind(null, labeledButton.button, index));
      }
    });
    return this;
  }

  public get set() {
    return {
      click: (callback: (button: Button, index: number) => void) => {
        return this._callOnAllButtons('click', callback);
      },
      over: (callback: (button: Button, index: number) => void) => {
        return this._callOnAllButtons('over', callback);
      },
      out: (callback: (button: Button, index: number) => void) => {
        return this._callOnAllButtons('out', callback);
      },
      down: (callback: (button: Button, index: number) => void) => {
        return this._callOnAllButtons('down', callback);
      },
      up: (callback: (button: Button, index: number) => void) => {
        return this._callOnAllButtons('up', callback);
      }
    };
  }

  reset() {
    this._visualPath.reset();
  }

  setPath(path: PathSequence) {
    this._visualPath.setPath(path);
  }

  public getButtonPositions(): Phaser.Math.Vector2[] {
    return this.getAll().map((button) => {
      if (button instanceof LabeledButton) {
        return new Phaser.Math.Vector2(this.x + button.x , this.y + button.y);
      }
      return new Phaser.Math.Vector2(0, 0); // Default position if not found
    });
  }
}
