import Button from './mechanics/button/button';
import { LabeledButton } from './mechanics/button/labeledButton';

export const ASSET_ATLAS = "atlas";
export interface Asset {
  type: string;
  url: string;
  isAtlas?: boolean; // Optional, used for atlas assets
  jsonUrl?: string; // Optional, used for atlas assets
  width: number;
  height: number;
  color?: string; // Optional, used for LabeledButton
}
const basicButtonArt = {
  url: 'assets/game/art/button.png',
  width: 32,
  height: 32
}

const startBurstArt = {
  url: 'assets/game/art/starBurstSolidBlack.png',
  width: 64,
  height: 64
};

const ASSETS: Asset[] = [
  {
    type: LabeledButton.TYPE,
    ...startBurstArt,
    color: '#FFFFFF'
  },
  {
    type: Button.TYPE,
    ...startBurstArt
  },
  {
    type: ASSET_ATLAS,
    isAtlas: true,
    url: 'assets/game/art/kenny_cards/kenny_cards.png',
    jsonUrl: 'assets/game/art/kenny_cards/kenny_cards.json',
    height: 329,
    width: 240
  }
];

export const getAssetByType = (type: string): Asset => {
  const asset = ASSETS.find(asset => asset.type === type);

  if (!asset)  {
    throw new Error(`Asset of type ${type} not found.`);
  }

  return asset;
};

export default ASSETS;