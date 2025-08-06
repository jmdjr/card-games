// Hand system types and interfaces
import { CardProperties } from '../card.types';
import { DECK_TYPE, GAME_TYPE } from '../deck/deck.manager';

export interface HandConfig {
  /** Maximum number of cards this hand can hold */
  maxCards: number;
  /** Minimum number of cards this hand can hold */
  minCards: number;
  /** Unique identifier for this hand */
  id: string;
  /** Display name for this hand */
  name: string;
  /** Whether this hand belongs to the current player */
  isPlayerHand: boolean;
  /** Whether cards in this hand should be revealed */
  showCardFaces: boolean;
  /** Whether this hand can draw cards */
  canDraw: boolean;
  /** Whether this hand can play cards */
  canPlay: boolean;
  /** Whether this hand supports multi-card selection */
  allowMultiSelect: boolean;
}

export interface HandState {
  /** Currently selected cards (for playing) */
  selectedCards: CardProperties[];
  /** Whether the hand is currently animating */
  isAnimating: boolean;
  /** Whether all cards are currently revealed */
  areCardsRevealed: boolean;
  /** Whether the hand is at maximum capacity */
  isFull: boolean;
  /** Whether the hand is empty */
  isEmpty: boolean;
}

// Event names for hand system
export const HAND_EVENTS = {
  PLAY_CARDS: 'hand:playCards',
  DRAW_CARDS: 'hand:drawCards',
  CARD_ADDED: 'hand:cardAdded',
  CARD_REMOVED: 'hand:cardRemoved',
  HAND_REVEALED: 'hand:revealed',
  HAND_CLICK: 'hand:click',
  SELECTION_CHANGED: 'hand:selectionChanged'
} as const;

// Default hand configurations for different game types
export const DEFAULT_HAND_CONFIGS = {
  [GAME_TYPE.POKER]: {
    maxCards: 5,
    minCards: 0,
    isPlayerHand: true,
    showCardFaces: true,
    canDraw: true,
    canPlay: true,
    allowMultiSelect: true
  },
  [GAME_TYPE.UNO]: {
    maxCards: 20, // UNO can have many cards
    minCards: 0,
    isPlayerHand: true,
    showCardFaces: true,
    canDraw: true,
    canPlay: true,
    allowMultiSelect: false
  }
} as const;
