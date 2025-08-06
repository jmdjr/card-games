import { Asset } from "../../assets.data";
import CoreScene from "../../scenes/Core.scene";
import { ButtonSetEvents, IButtonEventSetter } from "./buttonSetEvents";

export default class Button extends Phaser.GameObjects.Sprite implements IButtonEventSetter<Button> {
  static readonly TYPE: string = 'BUTTON';
  constructor(scene: CoreScene, asset: Asset, x: number = 0, y: number = 0) {
    if (!scene) {
      throw new Error('Scene is required');
    }

    if (!asset) {
      throw new Error('Asset is required');
    }

    super(scene, x * asset.width, y * asset.height, asset.type);

    scene.add.existing(this);
    this.setInteractive();

    this.on('pointerdown', () => this._set._down.call(this, this), this);
    this.on('pointerup', () => this._set._up.call(this, this), this);
    this.on('pointerover', () => this._set._over.call(this, this), this);
    this.on('pointerout', () => this._set._out.call(this, this), this);
    this.on('click', () => this._set._click.call(this, this), this);
  }

  private _set: ButtonSetEvents<Button> = new ButtonSetEvents<Button>();

  public get set() {
    return this._set;
  }
}
