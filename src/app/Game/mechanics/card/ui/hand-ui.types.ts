// Hand UI types and configuration interfaces
import { CardProperties } from '../card.types';

export interface HandUIConfig {
  /** Width of the hand area */
  width: number;
  /** Height of the hand area */
  height: number;
  /** Scale factor for all cards */
  scale: number;
  /** Maximum number of cards to display */
  maxVisibleCards: number;
  /** Whether cards should be displayed face up */
  showCardFaces: boolean;
  /** Whether this hand can be interacted with */
  interactive: boolean;
  /** Whether cards can be selected */
  allowSelection: boolean;
  /** Whether multiple cards can be selected */
  allowMultiSelection: boolean;
  /** Card fan spread angle in radians */
  fanAngle: number;
  /** Radius of the fan curve */
  fanRadius: number;
  /** Spacing between cards when in a line */
  cardSpacing: number;
  /** Layout style for the hand */
  layout: HandLayout;
  /** Animation duration for card movements */
  animationDuration: number;
  /** Whether to show selection indicators */
  showSelectionIndicators: boolean;
  /** Color for selection indicators */
  selectionColor: number;
  /** Whether to show shadows for depth */
  showShadows: boolean;
  /** Whether to animate card reveals */
  animateReveals: boolean;
  /** Hover effect configuration */
  hoverEffect: {
    enabled: boolean;
    liftHeight: number;
    scaleIncrease: number;
  };
}

export interface HandUIState {
  /** Current cards being displayed */
  displayedCards: CardProperties[];
  /** Currently selected cards */
  selectedCards: CardProperties[];
  /** Whether the hand is currently animating */
  isAnimating: boolean;
  /** Whether cards are currently revealed */
  areCardsRevealed: boolean;
  /** Current layout positions for each card */
  cardPositions: CardPosition[];
  /** Whether the hand is currently being hovered */
  isHovered: boolean;
}

export interface CardPosition {
  /** Card this position refers to */
  card: CardProperties;
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Rotation in radians */
  rotation: number;
  /** Z-depth for layering */
  depth: number;
  /** Whether this card is currently selected */
  selected: boolean;
}

export interface CardUISprite {
  /** The card this sprite represents */
  card: CardProperties;
  /** The Phaser image sprite */
  sprite: Phaser.GameObjects.Image;
  /** Selection indicator (if any) */
  selectionIndicator?: Phaser.GameObjects.Graphics;
  /** Target position for animations */
  targetPosition: CardPosition;
  /** Whether this sprite is currently animating */
  isAnimating: boolean;
}

export interface HandAnimationEvent {
  /** Type of animation */
  type: 'cardAdded' | 'cardRemoved' | 'reveal' | 'hide' | 'select' | 'deselect' | 'reposition';
  /** The hand UI instance */
  handUI: any; // Will be HandUI when defined
  /** Cards involved in the animation */
  cards: CardProperties[];
  /** Animation duration */
  duration: number;
}

export interface HandUIClickEvent {
  /** The hand UI that was clicked */
  handId: string;
  /** The specific card that was clicked (if any) */
  card?: CardProperties;
  /** Click position relative to hand */
  position: { x: number; y: number };
  /** Type of click interaction */
  clickType: 'single' | 'double' | 'right';
  /** Whether the card was selected/deselected */
  selectionChanged?: boolean;
}

export interface CardDrawAnimationEvent {
  /** Source position for the animation */
  fromPosition: { x: number; y: number };
  /** Target hand UI */
  targetHand: any; // Will be HandUI when defined
  /** Cards being animated */
  cards: CardProperties[];
  /** Animation duration */
  duration: number;
}

export enum HandLayout {
  FAN = 'fan',           // Cards arranged in a fan
  LINE = 'line',         // Cards in a straight line
  GRID = 'grid',         // Cards in a grid pattern
  PILE = 'pile',         // Cards stacked on top of each other
  ARC = 'arc'            // Cards arranged in an arc
}

export enum CardRevealStyle {
  FLIP = 'flip',         // Card flips over horizontally
  FADE = 'fade',         // Card fades from back to front
  SLIDE = 'slide',       // Card slides to reveal face
  INSTANT = 'instant'    // No animation, instant reveal
}

// Hand UI Events
export const HAND_UI_EVENTS = {
  CARD_CLICKED: 'handUI:cardClicked',
  CARD_HOVERED: 'handUI:cardHovered',
  CARD_SELECTED: 'handUI:cardSelected',
  CARD_DESELECTED: 'handUI:cardDeselected',
  HAND_CLICKED: 'handUI:handClicked',
  ANIMATION_COMPLETE: 'handUI:animationComplete',
  LAYOUT_CHANGED: 'handUI:layoutChanged',
  CARDS_REVEALED: 'handUI:cardsRevealed',
  CARDS_HIDDEN: 'handUI:cardsHidden'
} as const;

// Default configurations for different game types
export const HAND_UI_PRESETS = {
  POKER: {
    width: 400,
    height: 120,
    scale: 0.8,
    maxVisibleCards: 5,
    showCardFaces: true,
    interactive: true,
    allowSelection: true,
    allowMultiSelection: false,
    fanAngle: Math.PI / 8,
    fanRadius: 300,
    cardSpacing: 80,
    layout: HandLayout.FAN,
    animationDuration: 300,
    showSelectionIndicators: true,
    selectionColor: 0x00ff00,
    showShadows: true,
    animateReveals: true,
    hoverEffect: {
      enabled: true,
      liftHeight: 20,
      scaleIncrease: 0.1
    }
  },
  UNO: {
    width: 600,
    height: 100,
    scale: 0.6,
    maxVisibleCards: 20,
    showCardFaces: true,
    interactive: true,
    allowSelection: true,
    allowMultiSelection: false,
    fanAngle: Math.PI / 6,
    fanRadius: 400,
    cardSpacing: 30,
    layout: HandLayout.FAN,
    animationDuration: 250,
    showSelectionIndicators: true,
    selectionColor: 0xffff00,
    showShadows: true,
    animateReveals: true,
    hoverEffect: {
      enabled: true,
      liftHeight: 15,
      scaleIncrease: 0.05
    }
  },
  BLACKJACK: {
    width: 300,
    height: 100,
    scale: 0.7,
    maxVisibleCards: 10,
    showCardFaces: true,
    interactive: false,
    allowSelection: false,
    allowMultiSelection: false,
    fanAngle: 0,
    fanRadius: 0,
    cardSpacing: 40,
    layout: HandLayout.LINE,
    animationDuration: 400,
    showSelectionIndicators: false,
    selectionColor: 0x0000ff,
    showShadows: true,
    animateReveals: true,
    hoverEffect: {
      enabled: false,
      liftHeight: 0,
      scaleIncrease: 0
    }
  },
  OPPONENT: {
    width: 400,
    height: 80,
    scale: 0.6,
    maxVisibleCards: 15,
    showCardFaces: false,
    interactive: false,
    allowSelection: false,
    allowMultiSelection: false,
    fanAngle: Math.PI / 10,
    fanRadius: 350,
    cardSpacing: 25,
    layout: HandLayout.FAN,
    animationDuration: 300,
    showSelectionIndicators: false,
    selectionColor: 0xff0000,
    showShadows: true,
    animateReveals: true,
    hoverEffect: {
      enabled: false,
      liftHeight: 0,
      scaleIncrease: 0
    }
  }
} as const;
