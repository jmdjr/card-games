// Card UI Types and Configuration
import { DECK_TYPE } from '..';
import { CardProperties } from '../card.types';
import * as KennyCards from '../../../../../assets/game/art/kenny_cards/kenny_cards.data';
import { PileOrientation, PileUIConfig } from '../pile/pile.types';

export enum DeckStyle {
  STANDARD = 'standard',
  UNO = 'uno',
  DICE = 'dice',
  CUSTOM = 'custom'
}

export type DeckStyleType = keyof typeof DeckStyle;

export interface DeckUIConfig extends PileUIConfig {
  // Visual appearance
  style: DeckStyle;
  
  // Card back asset keys for different styles
  cardBackAsset: string;
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

// Predefined deck configurations
export const DECK_UI_PRESETS: { [key in DECK_TYPE]: Partial<DeckUIConfig> } = {
  [DECK_TYPE.STANDARD]: {
    style: DeckStyle.STANDARD,
    orientation: PileOrientation.VERTICAL,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 5,
    topCardOffsetX: 1, // Position to the right of deck
    topCardOffsetY: 0,   // Same height as deck
    showTopCard: false,
    showCardCount: true,
    clickable: true,
    hoverEffect: {
      enabled: true,
      liftHeight: 15,
      scaleIncrease: 0.05
    },
    animateCardDraw: true,
    drawAnimationDuration: 300,
    shuffleAnimationDuration: 800,
    cardBackAsset: KennyCards.CARD_BACK
  },

  [DECK_TYPE.UNO]: {
    style: DeckStyle.UNO,
    orientation: PileOrientation.VERTICAL,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 6,
    topCardOffsetX: 1,
    topCardOffsetY: 0,
    showTopCard: false,
    showCardCount: true,
    clickable: true,
    hoverEffect: {
      enabled: true,
      liftHeight: 15,
      scaleIncrease: 0.05
    },
    animateCardDraw: true,
    drawAnimationDuration: 250,
    shuffleAnimationDuration: 800,
    cardBackAsset: KennyCards.CARD_BACK
  },

  [DECK_TYPE.DICE]: {
    style: DeckStyle.DICE,
    orientation: PileOrientation.HORIZONTAL,
    cardOffsetX: 2,
    cardOffsetY: 0,
    maxVisibleCards: 4,
    topCardOffsetX: 0,
    topCardOffsetY: -1, // Position above the dice
    showTopCard: true,
    showCardCount: false,
    clickable: true,
    hoverEffect: {
      enabled: true,
      liftHeight: 15,
      scaleIncrease: 0.05
    },
    animateCardDraw: true,
    drawAnimationDuration: 200,
    shuffleAnimationDuration: 600,
    cardBackAsset: KennyCards.DICE_QUESTION
  },

  [DECK_TYPE.CUSTOM]: {
    style: DeckStyle.CUSTOM,
    orientation: PileOrientation.VERTICAL,
    cardOffsetX: 1,
    cardOffsetY: 1,
    maxVisibleCards: 5,
    topCardOffsetX: 1,
    topCardOffsetY: 0,
    showTopCard: false,
    showCardCount: true,
    clickable: true,
    hoverEffect: {
      enabled: true,
      liftHeight: 15,
      scaleIncrease: 0.05
    },
    animateCardDraw: true,
    drawAnimationDuration: 300,
    shuffleAnimationDuration: 800,
    cardBackAsset: KennyCards.CARD_BACK
  },
} as const;
