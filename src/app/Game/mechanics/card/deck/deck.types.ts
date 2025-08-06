// Card UI Types and Configuration
import { DECK_TYPE } from '..';
import { CardProperties } from '../card.types';

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
  
  // Top card positioning
  topCardOffsetX: number; // X offset from deck for top card
  topCardOffsetY: number; // Y offset from deck for top card
  topCardScale?: number;  // Optional scale override for top card
  
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
export const DECK_UI_PRESETS: { [key in DECK_TYPE]: Partial<DeckUIConfig> } = {
  [DECK_TYPE.POKER]: {
    style: DeckStyle.STANDARD,
    orientation: DeckOrientation.VERTICAL,
    ...defaultScaleConfig,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 5,
    topCardOffsetX: 1, // Position to the right of deck
    topCardOffsetY: 0,   // Same height as deck
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

  [DECK_TYPE.UNO]: {
    style: DeckStyle.UNO,
    orientation: DeckOrientation.VERTICAL,
    ...defaultScaleConfig,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 6,
    topCardOffsetX: 1,
    topCardOffsetY: 0,
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

  [DECK_TYPE.DICE_GAME]: {
    style: DeckStyle.DICE,
    orientation: DeckOrientation.HORIZONTAL,
    ...defaultScaleConfig,
    cardOffsetX: 2,
    cardOffsetY: 0,
    maxVisibleCards: 4,
    topCardOffsetX: 0,
    topCardOffsetY: -1, // Position above the dice
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
};
