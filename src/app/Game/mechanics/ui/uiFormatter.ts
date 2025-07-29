import { Register } from '../../services/di/di.system';
import { UI_CONFIG_KEY, GameConfig, UI_CONFIG, UI_CONFIG_TYPE } from './ui.config';

type ConstructElement = (x: number, y: number) => void;

@Register()
export class UIBuilder {
  private _config: UI_CONFIG_TYPE[] = UI_CONFIG;
  private _elements: Map<UI_CONFIG_KEY, Set<ConstructElement>> = new Map();

  public buildUI() {
    const elementMap = this._elements;
    this._config.map((element) => {
      const constructs = elementMap.get(element.key);
      if (constructs) {
        constructs.forEach(construct => construct(element.x, element.y));
      }
    });
  }

  addElement(key: UI_CONFIG_KEY, construct: ConstructElement) {
    // Implementation for adding the element to the scene
    if(!this._elements.has(key)) {
      this._elements.set(key, new Set());
    }
    
    this._elements.get(key)!.add(construct);
  }
}
