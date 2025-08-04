// Card UI Types and Configuration
import { GAME_TYPE } from '../../mechanics/card';
import { CardProperties } from '../../mechanics/card/card.types';

export enum DeckStyle {
  STANDARD = 'standard',
  UNO = 'uno',
  DICE = 'dice',
  CUSTOM = 'custom'
}

export type DeckStyleType = keyof typeof DeckStyle;

export enum DeckOrientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

export interface DeckUIConfig {
  // Visual appearance
  style: DeckStyle;
  orientation: DeckOrientation;
  showTopCard: boolean;
  showCardCount: boolean;
  
  // Size and positioning
  width: number;
  height: number;
  scale: number; // Scale factor for card size

  cardOffsetX: number;  // Offset between stacked cards
  cardOffsetY: number;
  maxVisibleCards: number; // Max cards to show in stack effect
  
  // Animation settings
  animateCardDraw: boolean;
  drawAnimationDuration: number; // milliseconds
  shuffleAnimationDuration: number;
  
  // Interaction
  clickable: boolean;
  hoverEffect: boolean;
  
  // Styling
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: boolean;
  
  // Card back asset keys for different styles
  cardBackAssets: {
    [key in DeckStyle]: string;
  };
}

export interface DeckUIState {
  cardCount: number;
  topCard: CardProperties | null;
  isShuffling: boolean;
  isDrawing: boolean;
  isEmpty: boolean;
  position: { x: number; y: number };
  rotation: number;
}

export interface CardDrawEvent {
  card: CardProperties;
  remainingCards: number;
  deckId: string;
}

export interface DeckClickEvent {
  deckId: string;
  clickType: 'single' | 'double';
  position: { x: number; y: number };
}
const defaultScaleConfig = {
  width: 32,
  height: 32,
  scale: 3,
}

// Predefined deck configurations
export const DECK_UI_PRESETS: { [key in GAME_TYPE]: Partial<DeckUIConfig> } = {
  [GAME_TYPE.POKER]: {
    style: DeckStyle.STANDARD,
    orientation: DeckOrientation.VERTICAL,
    ...defaultScaleConfig,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 5,
    showTopCard: false,
    showCardCount: true,
    clickable: true,
    hoverEffect: true,
    animateCardDraw: true,
    drawAnimationDuration: 300,
    shuffleAnimationDuration: 800,
    cardBackAssets: {
      [DeckStyle.STANDARD]: 'card_back',
      [DeckStyle.UNO]: 'color_back',
      [DeckStyle.DICE]: 'dice_empty',
      [DeckStyle.CUSTOM]: 'card_back'
    }
  },

  [GAME_TYPE.BLACKJACK]: {
    style: DeckStyle.STANDARD,
    orientation: DeckOrientation.VERTICAL,
    ...defaultScaleConfig,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 5,
    showTopCard: false,
    showCardCount: true,
    clickable: true,
    hoverEffect: true,
    animateCardDraw: true,
    drawAnimationDuration: 300,
    shuffleAnimationDuration: 500,
    cardBackAssets: {
      [DeckStyle.STANDARD]: 'card_back',
      [DeckStyle.UNO]: 'color_back',
      [DeckStyle.DICE]: 'dice_empty',
      [DeckStyle.CUSTOM]: 'card_back'
    }
  },

  [GAME_TYPE.UNO]: {
    style: DeckStyle.UNO,
    orientation: DeckOrientation.VERTICAL,
    ...defaultScaleConfig,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 6,
    showTopCard: false,
    showCardCount: true,
    clickable: true,
    hoverEffect: true,
    animateCardDraw: true,
    drawAnimationDuration: 250,
    shuffleAnimationDuration: 800,
    cardBackAssets: {
      [DeckStyle.STANDARD]: 'card_back',
      [DeckStyle.UNO]: 'color_back',
      [DeckStyle.DICE]: 'dice_empty',
      [DeckStyle.CUSTOM]: 'color_back'
    }
  },

  [GAME_TYPE.DICE_GAME]: {
    style: DeckStyle.DICE,
    orientation: DeckOrientation.HORIZONTAL,
    ...defaultScaleConfig,
    cardOffsetX: 2,
    cardOffsetY: 0,
    maxVisibleCards: 4,
    showTopCard: true,
    showCardCount: false,
    clickable: true,
    hoverEffect: true,
    animateCardDraw: true,
    drawAnimationDuration: 200,
    shuffleAnimationDuration: 600,
    cardBackAssets: {
      [DeckStyle.STANDARD]: 'card_back',
      [DeckStyle.UNO]: 'color_back',
      [DeckStyle.DICE]: 'dice_empty',
      [DeckStyle.CUSTOM]: 'dice_empty'
    }
  },

  [GAME_TYPE.DISCARD_PILE]: {
    style: DeckStyle.STANDARD,
    orientation: DeckOrientation.VERTICAL,
    ...defaultScaleConfig,
    cardOffsetX: 0.5,
    cardOffsetY: 0.5,
    maxVisibleCards: 3,
    showTopCard: true,
    showCardCount: false,
    clickable: false,
    hoverEffect: false,
    animateCardDraw: false,
    drawAnimationDuration: 0,
    shuffleAnimationDuration: 1000,
    cardBackAssets: {
      [DeckStyle.STANDARD]: 'card_back',
      [DeckStyle.UNO]: 'color_back',
      [DeckStyle.DICE]: 'dice_empty',
      [DeckStyle.CUSTOM]: 'card_back'
    }
  }
};
