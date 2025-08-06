import { Asset } from "../../assets.data";
import CoreScene from "../../scenes/Core.scene";
import Button from "./button";

export class LabeledButton extends Phaser.GameObjects.Container {
  static readonly TYPE: string = 'LABELED_BUTTON';

  private _button: Button;
  private _label: Phaser.GameObjects.Text;

  public get button() {
    return this._button;
  }

  constructor(scene: CoreScene, asset: Asset, x: number = 0, y: number = 0, label: string = "A") {
    super(scene, x, y);

    this._button = new Button(scene, asset, 0, 0);
    this._button.setOrigin(0.5, 0.5);
    this.setInteractive();
    this.add(this._button);

    this._label = new Phaser.GameObjects.Text(scene, 0, 0, label, { align: 'center', fontSize: '32pt', color: asset.color ?? '#000000' });
    this._label.setOrigin(0.5, 0.5);
    this._label.setInteractive()
    this.add(this._label);

    this.setSize(asset.width, asset.height);
  }

  setTint(arg0: number) {
    this._button.setTint(arg0);
  }
  
  clearTint() {
    this._button.clearTint();
  }
  
  public get set() {
    return {
      ...this._button.set,
      label: (text: string) => {
        this._label.setText(text);
        return this;
      }
    };
  }
}
